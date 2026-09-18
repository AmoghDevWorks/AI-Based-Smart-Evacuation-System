"""Model pipeline and graph-based evacuation recommendations."""

from heapq import heappop, heappush
from typing import Any

import cv2
import numpy as np

from utils.Model1 import count_people_from_frame
from utils.Model2 import SmartEvacuationAnalyzer
from utils.Model3 import predict_risk


RISK_PENALTY = {"CLEAR": 1.0, "WARNING": 4.0, "CONGESTION": 12.0}
DESTINATION_TYPES = {"exit", "entry"}


class EvacuationPipeline:
    """Run the three models sequentially for one camera frame."""

    def __init__(self, detector_path: str = "yolov8m.pt") -> None:
        self.flow_analyzer = SmartEvacuationAnalyzer(model_path=detector_path)

    def process_frame(self, frame_bgr: np.ndarray) -> dict[str, Any]:
        """Run Model1, Model2, and Model3 on one BGR frame."""
        density_count = count_people_from_frame(frame_bgr)

        flow_metrics = self.flow_analyzer.process_frame(frame_bgr)

        try:
            risk_level = predict_risk(flow_metrics)
            risk_error = None
        except Exception as error:
            risk_level = flow_metrics.get("status", "CLEAR")
            risk_error = str(error)
        return {
            **flow_metrics,
            "density_count": round(density_count, 2),
            "risk_level": risk_level,
            "risk_error": risk_error,
        }

    def reset(self) -> None:
        """Reset Model2 tracking state when a camera source changes."""
        self.flow_analyzer.reset()


def _node_label(node: dict[str, Any]) -> str:
    data = node.get("data") or {}
    return str(data.get("label") or node.get("id"))


def _node_type(node: dict[str, Any]) -> str:
    return str((node.get("data") or {}).get("type") or "room").lower()


def build_evacuation_plan(
    nodes: list[dict[str, Any]],
    edges: list[dict[str, Any]],
    metrics_by_node: dict[str, dict[str, Any]],
) -> list[dict[str, Any]]:
    """Find the safest weighted route from each monitored room to an exit/entry.

    Layout edges are treated as bidirectional movement paths because evacuation
    movement can use either direction during a panic event.
    """
    node_by_id = {str(node.get("id")): node for node in nodes}
    destinations = {
        node_id
        for node_id, node in node_by_id.items()
        if _node_type(node) in DESTINATION_TYPES
    }
    sources = [node_id for node_id in node_by_id if node_id not in destinations]
    if not destinations:
        return [{
            "from": source,
            "from_label": _node_label(node_by_id[source]),
            "status": "NO_DESTINATION",
            "route": [],
            "reason": "Add an exit or entry node to the building layout.",
        } for source in sources]

    graph: dict[str, list[tuple[str, float]]] = {node_id: [] for node_id in node_by_id}
    for edge in edges:
        source = str(edge.get("source"))
        target = str(edge.get("target"))
        if source not in graph or target not in graph:
            continue
        weight = float((edge.get("data") or {}).get("weight", 1) or 1)
        graph[source].append((target, weight))
        graph[target].append((source, weight))

    plans = []
    for source in sources:
        distances = {source: 0.0}
        previous: dict[str, str | None] = {source: None}
        queue = [(0.0, source)]
        while queue:
            distance, current = heappop(queue)
            if distance != distances.get(current):
                continue
            for neighbour, base_weight in graph[current]:
                risk = metrics_by_node.get(neighbour, {}).get("risk_level", "CLEAR")
                next_distance = distance + base_weight * RISK_PENALTY.get(risk, 1.0)
                if next_distance < distances.get(neighbour, float("inf")):
                    distances[neighbour] = next_distance
                    previous[neighbour] = current
                    heappush(queue, (next_distance, neighbour))

        reachable = [destination for destination in destinations if destination in distances]
        if not reachable:
            plans.append({
                "from": source,
                "from_label": _node_label(node_by_id[source]),
                "status": "NO_ROUTE",
                "route": [],
                "reason": "No connected exit or entry is reachable from this room.",
            })
            continue

        destination = min(reachable, key=lambda node_id: distances[node_id])
        route = []
        current: str | None = destination
        while current is not None:
            route.append(current)
            current = previous.get(current)
        route.reverse()
        route_labels = [_node_label(node_by_id[node_id]) for node_id in route]
        source_metrics = metrics_by_node.get(source, {})
        source_risk = source_metrics.get("risk_level", "CLEAR")
        plans.append({
            "from": source,
            "from_label": _node_label(node_by_id[source]),
            "destination": destination,
            "destination_label": _node_label(node_by_id[destination]),
            "status": "ROUTE_AVAILABLE",
            "cost": round(distances[destination], 2),
            "route": route,
            "route_labels": route_labels,
            "source_risk": source_risk,
            "reason": "Avoids higher-risk paths when a safer route is available.",
        })
    return plans
