from abc import ABC, abstractmethod
import cv2
import threading
import time

class CameraProvider(ABC):
    @abstractmethod
    def get_frame(self):
        """Returns the current frame as a JPEG byte array."""
        pass

    @abstractmethod
    def release(self):
        """Releases the camera resource."""
        pass

class LocalWebcamProvider(CameraProvider):
    def __init__(self, device_id=0):
        # Allow device_id to be cast to int if it's a numeric string
        try:
            device_id = int(device_id)
        except ValueError:
            pass
        self.device_id = device_id
        self.cap = cv2.VideoCapture(self.device_id)
        
        # Optionally reduce resolution to improve streaming performance
        self.cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
        self.cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)

    def get_frame(self):
        success, frame = self.cap.read()
        if not success:
            return None
        
        # Encode the frame as JPEG
        ret, buffer = cv2.imencode('.jpg', frame)
        if not ret:
            return None
            
        return buffer.tobytes()

    def release(self):
        self.cap.release()

# Global registry to hold active camera streams to avoid opening the same camera multiple times
# Key: f"{layout_id}_{device_id}" -> Value: LocalWebcamProvider instance
_active_cameras = {}
_camera_lock = threading.Lock()

def get_camera_provider(layout_id: int, device_id: str) -> CameraProvider:
    key = f"{layout_id}_{device_id}"
    with _camera_lock:
        if key not in _active_cameras:
            # Currently defaults to LocalWebcamProvider. 
            # Modular design allows swapping to IPCameraProvider here in the future based on layout/device configs.
            _active_cameras[key] = LocalWebcamProvider(device_id=device_id)
        return _active_cameras[key]

def release_camera_provider(layout_id: int, device_id: str):
    key = f"{layout_id}_{device_id}"
    with _camera_lock:
        if key in _active_cameras:
            _active_cameras[key].release()
            del _active_cameras[key]
