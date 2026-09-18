"""Continuous camera analysis service used by the live dashboard."""

from threading import Event, Lock, Thread
from typing import Any

import cv2

from pipeline.evacuation_pipeline import EvacuationPipeline, build_evacuation_plan


class CameraAnalysisWorker:
    """Read and process one camera continuously in a background thread."""

    def __init__(self, device_id: str, process_interval: float = 15.0) -> None:
        self.device_id = device_id
        self.process_interval = process_interval
        self._stop_event = Event()
        self._state_lock = Lock()
        self._latest_metrics: dict[str, Any] | None = None
        self._connected = False
        self._processing = False
        self._error: str | None = "Starting camera worker"
        self._thread = Thread(target=self._run, daemon=True)
        self._thread.start()

    def _source(self) -> int | str:
        try:
            return int(self.device_id)
        except ValueError:
            return self.device_id

    def _set_state(
        self,
        connected: bool,
        processing: bool,
        error: str | None,
        metrics: dict[str, Any] | None = None,
    ) -> None:
        with self._state_lock:
            self._connected = connected
            self._processing = processing
            self._error = error
            if metrics is not None:
                self._latest_metrics = metrics

    def _run(self) -> None:
        capture: cv2.VideoCapture | None = None
        pipeline: EvacuationPipeline | None = None
        try:
            print(f"[CAMERA WORKER] Starting device={self.device_id}", flush=True)
            while not self._stop_event.is_set():
                if capture is None or not capture.isOpened():
                    if capture is not None:
                        capture.release()
                    capture = cv2.VideoCapture(self._source())
                    if not capture.isOpened():
                        print(f"[CAMERA WORKER] Connection failed device={self.device_id}", flush=True)
                        self._set_state(False, False, "Unable to connect to camera")
                        self._stop_event.wait(2.0)
                        continue

                ok, frame = capture.read()
                if not ok or frame is None:
                    print(f"[CAMERA WORKER] Frame read failed device={self.device_id}", flush=True)
                    self._set_state(False, False, "Unable to read a frame")
                    capture.release()
                    capture = None
                    self._stop_event.wait(1.0)
                    continue

                # The stream is reachable even while the AI models are loading
                # or if one model fails on a frame.
                print(f"[CAMERA WORKER] Frame received device={self.device_id}", flush=True)
                self._set_state(True, False, "Loading analysis models" if pipeline is None else None)
                try:
                    if pipeline is None:
                        pipeline = EvacuationPipeline()
                    metrics = pipeline.process_frame(frame)
                    self._set_state(True, True, None, metrics)
                except Exception as error:
                    print(f"[CAMERA WORKER] Pipeline error device={self.device_id}: {error}", flush=True)
                    self._set_state(True, False, f"Pipeline error: {error}")
                    self._stop_event.wait(1.0)
                self._stop_event.wait(self.process_interval)
        except Exception as error:
            self._set_state(False, False, f"Worker startup error: {error}")
        finally:
            if capture is not None:
                capture.release()

    def snapshot(self) -> dict[str, Any]:
        with self._state_lock:
            return {
                "connected": self._connected,
                "processing": self._processing,
                "error": self._error,
                "metrics": self._latest_metrics,
            }

    def stop(self) -> None:
        self._stop_event.set()
        if self._thread.is_alive():
            self._thread.join(timeout=3.0)


class EvacuationAnalysisService:
    def __init__(self) -> None:
        self._lock = Lock()
        self._workers: dict[str, CameraAnalysisWorker] = {}

    def analyze_layout(
        self,
        nodes: list[dict[str, Any]],
        edges: list[dict[str, Any]],
    ) -> dict[str, Any]:
        print(
            f"[ANALYSIS] Request received nodes={len(nodes)} edges={len(edges)}",
            flush=True,
        )
        metrics_by_node: dict[str, dict[str, Any]] = {}
        cameras = []
        active_camera_ids: set[str] = set()

        with self._lock:
            for node in nodes:
                node_id = str(node.get("id"))
                data = node.get("data") or {}
                device_id = str(data.get("device_id") or "").strip()
                if not device_id:
                    continue

                print(
                    f"[ANALYSIS] Camera configured node={node_id} device={device_id}",
                    flush=True,
                )

                active_camera_ids.add(node_id)
                worker = self._workers.get(node_id)
                if worker is None or worker.device_id != device_id:
                    if worker is not None:
                        worker.stop()
                    worker = CameraAnalysisWorker(device_id)
                    self._workers[node_id] = worker
                    print(
                        f"[ANALYSIS] Worker registered node={node_id} device={device_id}",
                        flush=True,
                    )

                snapshot = worker.snapshot()
                metrics = snapshot["metrics"]
                if metrics is not None:
                    capacity = data.get("capacity")
                    try:
                        capacity = max(float(capacity), 0)
                    except (TypeError, ValueError):
                        capacity = 0
                    people = metrics.get("people", 0)
                    occupancy_percent = round(people / capacity * 100, 1) if capacity else None
                    over_capacity = bool(capacity and people > capacity)
                    metrics = {
                        **metrics,
                        "capacity": int(capacity) if capacity.is_integer() else capacity,
                        "occupancy_percent": occupancy_percent,
                        "over_capacity": over_capacity,
                        "risk_level": "CONGESTION" if over_capacity else metrics.get("risk_level", metrics.get("status", "CLEAR")),
                    }
                    metrics_by_node[node_id] = metrics
                cameras.append({
                    "node_id": node_id,
                    "label": data.get("label", node_id),
                    "device_id": device_id,
                    "capacity": data.get("capacity"),
                    **snapshot,
                    "metrics": metrics,
                })

            removed_ids = set(self._workers) - active_camera_ids
            for node_id in removed_ids:
                self._workers.pop(node_id).stop()

        return {
            "processing": "continuous",
            "cameras": cameras,
            "evacuation_plan": build_evacuation_plan(nodes, edges, metrics_by_node),
        }

    def close(self) -> None:
        with self._lock:
            workers = list(self._workers.values())
            self._workers.clear()
        for worker in workers:
            worker.stop()


analysis_service = EvacuationAnalysisService()
