import cv2
from flask import Flask, Response, jsonify
import argparse
import time
import threading

app = Flask(__name__)

# ── Background Camera Thread ───────────────────────────────────────────────
# A dedicated thread continuously reads frames from the camera and stores
# the latest encoded JPEG in `_latest_frame`. Flask threads ONLY read this
# buffer — they never touch cv2 directly. This prevents byte interleaving.

_latest_frame = None         # bytes: latest encoded JPEG
_frame_lock = threading.Lock()
_capture_thread = None
_camera_ready = False


def capture_loop(camera_index: int):
    """Runs in a background thread. Continuously captures and encodes frames."""
    global _latest_frame, _camera_ready

    # Try backends in order until one works with stable frames
    backends = [
        ("auto",  lambda i: cv2.VideoCapture(i)),
        ("DSHOW", lambda i: cv2.VideoCapture(i, cv2.CAP_DSHOW)),
        ("MSMF",  lambda i: cv2.VideoCapture(i, cv2.CAP_MSMF)),
    ]

    cap = None
    for name, factory in backends:
        print(f"[...] Trying backend: {name}")
        c = factory(camera_index)
        if not c.isOpened():
            print(f"[SKIP] {name}: could not open.")
            c.release()
            continue

        c.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
        c.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
        c.set(cv2.CAP_PROP_BUFFERSIZE, 1)

        # Warm-up: discard early frames (Windows cameras return blank frames initially)
        print(f"[...] Warming up ({name})...")
        ok_count = 0
        for _ in range(30):
            ret, _ = c.read()
            if ret:
                ok_count += 1
            time.sleep(0.04)

        if ok_count > 5:
            print(f"[OK] Camera {camera_index} ready on: {name}")
            cap = c
            break
        else:
            print(f"[SKIP] {name}: warm-up produced only {ok_count}/30 good frames.")
            c.release()

    if cap is None:
        print("[FATAL] No backend could open the camera.")
        return

    _camera_ready = True
    print("[STREAMING] Background capture thread running...")

    while True:
        ret, frame = cap.read()
        if not ret:
            time.sleep(0.03)
            continue

        # Encode JPEG once here, atomically swap into buffer
        ok, buffer = cv2.imencode('.jpg', frame, [int(cv2.IMWRITE_JPEG_QUALITY), 85])
        if ok:
            with _frame_lock:
                _latest_frame = buffer.tobytes()

        time.sleep(0.033)  # ~30 fps cap


def generate_stream():
    """Generator for Flask: reads the shared frame buffer and yields MJPEG parts."""
    while True:
        with _frame_lock:
            frame = _latest_frame

        if frame is None:
            time.sleep(0.05)  # Camera still warming up
            continue

        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')
        time.sleep(0.033)


@app.route('/video_feed')
def video_feed():
    return Response(generate_stream(),
                    mimetype='multipart/x-mixed-replace; boundary=frame')


@app.route('/debug')
def debug():
    with _frame_lock:
        has_frame = _latest_frame is not None
    return jsonify({
        "camera_index": app.config['CAMERA_INDEX'],
        "camera_ready": _camera_ready,
        "has_frame": has_frame,
        "status": "OK" if has_frame else ("warming up" if _camera_ready else "initializing")
    })


@app.route('/')
def index():
    return "Camera Stream Node Active. Stream: /video_feed | Debug: /debug"


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Edge Device Camera Streamer")
    parser.add_argument('--camera', type=int, default=0, help='Camera index (default 0)')
    parser.add_argument('--port',   type=int, default=5000, help='Port (default 5000)')
    parser.add_argument('--host',   type=str, default='0.0.0.0', help='Host IP')
    args = parser.parse_args()

    app.config['CAMERA_INDEX'] = args.camera

    print(f"\n--- SMART EVACUATION SYSTEM: EDGE CAMERA NODE ---")
    print(f"Camera index : {args.camera}")
    print(f"Stream URL   : http://<THIS_LAPTOP_IP>:{args.port}/video_feed")
    print(f"Debug URL    : http://localhost:{args.port}/debug")
    print(f"-------------------------------------------------\n")

    # Start the background capture thread (daemon so it dies when Flask exits)
    _capture_thread = threading.Thread(target=capture_loop, args=(args.camera,), daemon=True)
    _capture_thread.start()

    # Give the camera time to warm up before accepting requests
    print("[...] Waiting for camera to initialize (3s)...")
    time.sleep(3)

    app.run(host=args.host, port=args.port, threaded=True)


