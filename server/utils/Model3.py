"""Risk-level prediction from Model2 crowd-flow metrics."""

from functools import lru_cache
from pathlib import Path
from typing import Any, Mapping
import pickle

import h5py
import numpy as np
import pandas as pd


FEATURE_COLUMNS = (
	"people",
	"avg_speed",
	"density",
	"clustered",
	"counter_flow",
	"counter_pct",
	"dominant_angle",
)
DEFAULT_MODEL_PATH = Path(__file__).resolve().parent / "AiModels" / "XGBoost"


@lru_cache(maxsize=2)
def _load_risk_model(model_path: str) -> tuple[Any, Any]:
	"""Load the XGBoost model and LabelEncoder from the training H5 file."""
	path = Path(model_path)
	if not path.is_file():
		raise FileNotFoundError(f"Risk model not found: {path}")

	with h5py.File(path, "r") as model_file:
		try:
			model_bytes = np.asarray(model_file["xgboost_model"], dtype=np.uint8).tobytes()
			encoder_bytes = np.asarray(model_file["label_encoder"], dtype=np.uint8).tobytes()
		except KeyError as error:
			raise ValueError(
				f"Risk model must contain xgboost_model and label_encoder datasets: {path}"
			) from error

	return pickle.loads(model_bytes), pickle.loads(encoder_bytes)


def predict_risk(
	metrics: Mapping[str, Any],
	model_path: str | Path = DEFAULT_MODEL_PATH,
) -> str:
	"""Predict a risk label from one Model2 ``process_frame`` result."""
	missing = [column for column in FEATURE_COLUMNS if column not in metrics]
	if missing:
		raise ValueError(f"Missing Model2 metrics: {', '.join(missing)}")

	features = {
		column: (np.nan if metrics[column] is None else metrics[column])
		for column in FEATURE_COLUMNS
	}
	input_frame = pd.DataFrame([features], columns=FEATURE_COLUMNS)
	model, encoder = _load_risk_model(str(Path(model_path).resolve()))
	predicted_class = model.predict(input_frame)
	return str(encoder.inverse_transform(np.asarray(predicted_class, dtype=int))[0])


def predict_risk_from_frame(
	frame_metrics: Mapping[str, Any],
	model_path: str | Path = DEFAULT_MODEL_PATH,
) -> dict[str, Any]:
	"""Return Model2 metrics together with the predicted risk label."""
	result = dict(frame_metrics)
	result["risk_level"] = predict_risk(frame_metrics, model_path)
	return result
