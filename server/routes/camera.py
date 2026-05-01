from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
import time
from services.camera import get_camera_provider

router = APIRouter()

def generate_frames(layout_id: int, device_id: str):
    camera = get_camera_provider(layout_id, device_id)
    try:
        while True:
            frame_bytes = camera.get_frame()
            if frame_bytes is None:
                # If frame reading fails, yield an empty frame or sleep to prevent tight loop
                time.sleep(0.1)
                continue
                
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')
            
            # Control frame rate (~30 fps)
            time.sleep(0.03)
    except Exception as e:
        print(f"Streaming error: {e}")
    # Note: We don't automatically release here because multiple clients might be watching the same stream.
    # Resource cleanup should ideally be handled by a timeout or explicit disconnect.

@router.get("/stream/{layout_id}/{device_id:path}")
def stream_video(layout_id: int, device_id: str):
    """
    Streams MJPEG video from the requested device associated with the layout.
    """
    return StreamingResponse(
        generate_frames(layout_id, device_id),
        media_type="multipart/x-mixed-replace; boundary=frame"
    )
