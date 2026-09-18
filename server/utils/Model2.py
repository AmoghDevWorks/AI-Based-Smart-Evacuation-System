"""Frame-by-frame crowd flow and congestion analysis."""

import math
from collections import Counter, defaultdict, deque
from typing import Any

import cv2
import numpy as np
from deep_sort_realtime.deepsort_tracker import DeepSort
from scipy.spatial.distance import cdist
from ultralytics import YOLO


DEFAULT_CONFIG: dict[str, Any] = {
	"YOLO_CONF": 0.2,
	"MIN_PEOPLE_WARNING": 20,
	"MIN_PEOPLE_CONGESTION": 40,
	"DENSITY_WARNING": 0.000015,
	"DENSITY_CONGESTION": 0.000030,
	"SPEED_WARNING": 3.0,
	"SPEED_CONGESTION": 1.5,
	"CLUSTER_DIST": 45,
	"CLUSTER_MIN_NEIGHBOURS": 3,
	"CLUSTER_WARNING": 15,
	"CLUSTER_CONGESTION": 30,
	"COUNTER_ANGLE_THRESH": 120,
	"COUNTER_WARNING_PCT": 0.15,
	"COUNTER_CONGESTION_PCT": 0.25,
}


class SmartEvacuationAnalyzer:
	"""Analyze sequential BGR frames and detect uneven crowd flow."""

	def __init__(self, model_path: str = "yolov8m.pt") -> None:
		self.model = YOLO(model_path)
		self.tracker = DeepSort(
			max_age=30,
			n_init=3,
			max_cosine_distance=0.3,
		)
		self.history_length = 20
		self.track_history: defaultdict[int, deque[tuple[float, float]]] = defaultdict(
			lambda: deque(maxlen=self.history_length)
		)
		self.status_buffer_length = 8
		self.status_buffer: deque[str] = deque(maxlen=self.status_buffer_length)
		self.current_status = "CLEAR"

	def reset(self) -> None:
		"""Reset tracking state when switching to a different camera stream."""
		self.track_history.clear()
		self.status_buffer.clear()
		self.current_status = "CLEAR"

	@staticmethod
	def get_direction_angle(
		positions: deque[tuple[float, float]],
	) -> tuple[float | None, float]:
		if len(positions) < 5:
			return None, 0.0
		x1, y1 = positions[0]
		x2, y2 = positions[-1]
		dx, dy = x2 - x1, y2 - y1
		speed = math.sqrt(dx**2 + dy**2) / len(positions)
		angle = math.degrees(math.atan2(-dy, dx)) % 360
		return angle, speed

	@staticmethod
	def get_dominant_direction(all_angles: list[float]) -> float | None:
		if not all_angles:
			return None
		sin_mean = np.mean([math.sin(math.radians(angle)) for angle in all_angles])
		cos_mean = np.mean([math.cos(math.radians(angle)) for angle in all_angles])
		return math.degrees(math.atan2(sin_mean, cos_mean)) % 360

	@staticmethod
	def is_counter_flow(
		angle: float | None,
		dominant_angle: float | None,
		threshold: float = 120,
	) -> bool:
		if angle is None or dominant_angle is None:
			return False
		difference = abs(angle - dominant_angle) % 360
		if difference > 180:
			difference = 360 - difference
		return difference > threshold

	@staticmethod
	def count_proximity_clusters(
		centers: list[tuple[float, float]],
		cluster_dist: float = 45,
		min_neighbours: int = 3,
	) -> int:
		if len(centers) < min_neighbours:
			return 0
		points = np.array(centers)
		distances = cdist(points, points)
		np.fill_diagonal(distances, np.inf)
		neighbour_counts = (distances < cluster_dist).sum(axis=1)
		return int((neighbour_counts >= min_neighbours - 1).sum())

	@staticmethod
	def check_congestion(
		n_people: int,
		zone_density: float,
		average_speed: float,
		clustered_count: int,
		counter_flow: int,
		config: dict[str, Any],
	) -> str:
		if n_people == 0:
			return "CLEAR"
		counter_percentage = counter_flow / n_people

		if (
			n_people >= config["MIN_PEOPLE_CONGESTION"]
			and zone_density >= config["DENSITY_CONGESTION"]
			and average_speed <= config["SPEED_CONGESTION"]
			and clustered_count >= config["CLUSTER_CONGESTION"]
			and counter_percentage >= config["COUNTER_CONGESTION_PCT"]
		):
			return "CONGESTION"

		if (
			n_people >= config["MIN_PEOPLE_WARNING"]
			and zone_density >= config["DENSITY_WARNING"]
			and average_speed <= config["SPEED_WARNING"]
			and clustered_count >= config["CLUSTER_WARNING"]
		):
			return "WARNING"

		if (
			n_people >= config["MIN_PEOPLE_WARNING"]
			and counter_percentage >= config["COUNTER_WARNING_PCT"]
		):
			return "WARNING"

		return "CLEAR"

	def get_sustained_status(self, raw_status: str) -> str:
		self.status_buffer.append(raw_status)
		if len(self.status_buffer) < self.status_buffer_length:
			return self.current_status
		self.current_status = Counter(self.status_buffer).most_common(1)[0][0]
		return self.current_status

	def process_frame(
		self,
		frame_bgr: np.ndarray,
		config: dict[str, Any] | None = None,
	) -> dict[str, Any]:
		"""Process one OpenCV BGR frame and return flow metrics.

		Use the same analyzer instance for consecutive frames from one camera.
		"""
		if not isinstance(frame_bgr, np.ndarray) or frame_bgr.ndim < 2:
			raise ValueError("frame_bgr must be a valid OpenCV image array")

		active_config = {**DEFAULT_CONFIG, **(config or {})}
		height, width = frame_bgr.shape[:2]
		frame_rgb = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2RGB)
		results = self.model(
			frame_rgb,
			verbose=False,
			conf=active_config["YOLO_CONF"],
			iou=0.3,
			imgsz=1280,
		)

		detections = []
		for result in results:
			for box in result.boxes:
				if int(box.cls[0]) == 0:
					x1, y1, x2, y2 = box.xyxy[0].tolist()
					detections.append(
						([x1, y1, x2 - x1, y2 - y1], float(box.conf[0]), "person")
					)

		tracks = self.tracker.update_tracks(detections, frame=frame_rgb)
		confirmed_tracks = [track for track in tracks if track.is_confirmed()]
		all_angles: list[float] = []
		all_speeds: list[float] = []
		centers: list[tuple[float, float]] = []
		person_data: list[tuple[int, float | None, float]] = []

		for track in confirmed_tracks:
			track_id = track.track_id
			left, top, right, bottom = track.to_ltrb()
			center = ((left + right) / 2, (top + bottom) / 2)
			centers.append(center)
			self.track_history[track_id].append(center)
			angle, speed = self.get_direction_angle(self.track_history[track_id])
			if angle is not None:
				all_angles.append(angle)
				all_speeds.append(speed)
			person_data.append((track_id, angle, speed))

		n_people = len(confirmed_tracks)
		zone_density = n_people / (width * height)
		average_speed = float(np.mean(all_speeds)) if all_speeds else 0.0
		dominant_angle = self.get_dominant_direction(all_angles)
		clustered_count = self.count_proximity_clusters(
			centers,
			active_config["CLUSTER_DIST"],
			active_config["CLUSTER_MIN_NEIGHBOURS"],
		)
		counter_count = sum(
			1
			for _, angle, speed in person_data
			if speed > 1.5
			and self.is_counter_flow(
				angle,
				dominant_angle,
				active_config["COUNTER_ANGLE_THRESH"],
			)
		)

		raw_status = self.check_congestion(
			n_people,
			zone_density,
			average_speed,
			clustered_count,
			counter_count,
			active_config,
		)
		return {
			"people": n_people,
			"avg_speed": round(average_speed, 3),
			"density": round(zone_density, 8),
			"clustered": clustered_count,
			"counter_flow": counter_count,
			"counter_pct": round(counter_count / n_people * 100, 1) if n_people else 0.0,
			"dominant_angle": round(dominant_angle, 1) if dominant_angle is not None else None,
			"raw_status": raw_status,
			"status": self.get_sustained_status(raw_status),
		}
