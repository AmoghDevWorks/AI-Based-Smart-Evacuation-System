"""Crowd-counting model utilities."""

# This model's task is to estimate the number of people in an area.

from functools import lru_cache
from pathlib import Path
from typing import Union

import numpy as np
import torch
import torch.nn as nn
import torch.nn.functional as F
from PIL import Image
from torchvision import models, transforms


PathLike = Union[str, Path]
DEFAULT_CHECKPOINT_PATH = Path(__file__).resolve().parent / "AiModels" / "dmcount.pth"


class DMCountNet(nn.Module):
	def __init__(self) -> None:
		super().__init__()
		vgg = models.vgg16(weights=None)
		self.frontend = nn.Sequential(*list(vgg.features.children())[:23])
		self.backend = nn.Sequential(
			nn.Conv2d(512, 512, 3, padding=2, dilation=2),
			nn.ReLU(inplace=True),
			nn.Conv2d(512, 512, 3, padding=2, dilation=2),
			nn.ReLU(inplace=True),
			nn.Conv2d(512, 512, 3, padding=2, dilation=2),
			nn.ReLU(inplace=True),
			nn.Conv2d(512, 256, 3, padding=2, dilation=2),
			nn.ReLU(inplace=True),
			nn.Conv2d(256, 128, 3, padding=2, dilation=2),
			nn.ReLU(inplace=True),
			nn.Conv2d(128, 64, 3, padding=2, dilation=2),
			nn.ReLU(inplace=True),
		)
		self.output_layer = nn.Conv2d(64, 1, 1)

	def forward(self, inputs: torch.Tensor) -> torch.Tensor:
		return F.relu(self.output_layer(self.backend(self.frontend(inputs))))


@lru_cache(maxsize=2)
def _load_model(checkpoint_path: str, device_name: str) -> tuple[DMCountNet, torch.device]:
	device = torch.device(device_name)
	model = DMCountNet().to(device)
	model.load_state_dict(torch.load(checkpoint_path, map_location=device))
	model.eval()
	return model, device


def count_people(
	image_path: PathLike,
	checkpoint_path: PathLike = DEFAULT_CHECKPOINT_PATH,
	device: str | None = None,
	max_dimension: int = 1024,
) -> float:
	"""Estimate the number of people in an image.

	Args:
		image_path: Path to an image captured from a camera or video frame.
		checkpoint_path: Path to the trained ``dmcount_best.pth`` checkpoint.
		device: PyTorch device name. Defaults to CUDA when available.
		max_dimension: Maximum length of the image's longest side.

	Returns:
		The predicted crowd count as a float.
	"""
	image_path = Path(image_path)
	checkpoint_path = Path(checkpoint_path)

	if not image_path.is_file():
		raise FileNotFoundError(f"Image not found: {image_path}")
	if not checkpoint_path.is_file():
		raise FileNotFoundError(f"Checkpoint not found: {checkpoint_path}")
	if max_dimension <= 0:
		raise ValueError("max_dimension must be greater than zero")

	device_name = device or ("cuda" if torch.cuda.is_available() else "cpu")
	model, selected_device = _load_model(str(checkpoint_path.resolve()), device_name)

	image = Image.open(image_path).convert("RGB")
	return _count_people_in_image(image, model, selected_device, max_dimension)


def count_people_from_frame(
	frame_bgr: np.ndarray,
	checkpoint_path: PathLike = DEFAULT_CHECKPOINT_PATH,
	device: str | None = None,
	max_dimension: int = 1024,
) -> float:
	"""Estimate people directly from one OpenCV BGR video frame."""
	if not isinstance(frame_bgr, np.ndarray) or frame_bgr.ndim < 2:
		raise ValueError("frame_bgr must be a valid OpenCV image array")
	checkpoint_path = Path(checkpoint_path)
	if not checkpoint_path.is_file():
		raise FileNotFoundError(f"Checkpoint not found: {checkpoint_path}")
	if max_dimension <= 0:
		raise ValueError("max_dimension must be greater than zero")

	device_name = device or ("cuda" if torch.cuda.is_available() else "cpu")
	model, selected_device = _load_model(str(checkpoint_path.resolve()), device_name)
	image = Image.fromarray(np.ascontiguousarray(frame_bgr[:, :, ::-1])).convert("RGB")
	return _count_people_in_image(image, model, selected_device, max_dimension)


def _count_people_in_image(
	image: Image.Image,
	model: DMCountNet,
	selected_device: torch.device,
	max_dimension: int,
) -> float:
	width, height = image.size

	if max(width, height) > max_dimension:
		scale = max_dimension / max(width, height)
		width, height = int(width * scale), int(height * scale)
		image = image.resize((width, height), Image.Resampling.BILINEAR)

	width = (width // 8) * 8
	height = (height // 8) * 8
	if width == 0 or height == 0:
		raise ValueError("The image is too small to process")
	image = image.resize((width, height), Image.Resampling.BILINEAR)

	transform = transforms.Compose([
		transforms.ToTensor(),
		transforms.Normalize(
			[0.485, 0.456, 0.406],
			[0.229, 0.224, 0.225],
		),
	])
	inputs = transform(image).unsqueeze(0).to(selected_device)

	with torch.no_grad():
		density_map = model(inputs)

	return float(density_map.sum().item())
