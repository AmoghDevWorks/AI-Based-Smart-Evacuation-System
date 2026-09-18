import argparse
import time
from pathlib import Path

import cv2
from flask import Flask, Response


app = Flask(__name__)
VIDEO_PATH = Path(__file__).resolve().with_name("test.mp4")


def generate_stream(video_path: Path):
	capture = cv2.VideoCapture(str(video_path))
	if not capture.isOpened():
		raise RuntimeError(f"Unable to open video file: {video_path}")

	fps = capture.get(cv2.CAP_PROP_FPS)
	frame_delay = 1.0 / fps if fps and fps > 0 else 1.0 / 25.0

	try:
		while True:
			started_at = time.perf_counter()
			success, frame = capture.read()

			if not success:
				capture.set(cv2.CAP_PROP_POS_FRAMES, 0)
				continue

			encoded, buffer = cv2.imencode(
				".jpg",
				frame,
				[int(cv2.IMWRITE_JPEG_QUALITY), 85],
			)
			if not encoded:
				continue

			yield (
				b"--frame\r\n"
				b"Content-Type: image/jpeg\r\n\r\n"
				+ buffer.tobytes()
				+ b"\r\n"
			)

			remaining_delay = frame_delay - (time.perf_counter() - started_at)
			if remaining_delay > 0:
				time.sleep(remaining_delay)
	finally:
		capture.release()


@app.route("/video_feed")
def video_feed():
	return Response(
		generate_stream(VIDEO_PATH),
		mimetype="multipart/x-mixed-replace; boundary=frame",
	)


@app.route("/")
def index():
	return "Video Stream Node Active. Stream: /video_feed"


if __name__ == "__main__":
	parser = argparse.ArgumentParser(description="Loop a local video as an MJPEG stream")
	parser.add_argument("--video", type=Path, default=VIDEO_PATH)
	parser.add_argument("--port", type=int, default=5000)
	parser.add_argument("--host", default="0.0.0.0")
	args = parser.parse_args()

	VIDEO_PATH = args.video.expanduser().resolve()
	if not VIDEO_PATH.is_file():
		raise SystemExit(f"Video file not found: {VIDEO_PATH}")

	print(f"Video file : {VIDEO_PATH}")
	print(f"Stream URL : http://<THIS_LAPTOP_IP>:{args.port}/video_feed")
	app.run(host=args.host, port=args.port, threaded=True)
