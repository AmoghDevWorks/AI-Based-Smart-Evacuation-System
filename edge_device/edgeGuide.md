# Smart Evacuation System: Edge Device Setup Guide

This guide explains how to set up secondary laptops or computers as "Edge Camera Nodes." In this architecture, a central main server processes the data and hosts the dashboard, while peripheral laptops sit in different rooms and broadcast their webcam feeds over the local Wi-Fi network to the main server.

## Architecture Overview
- **Main Server:** Runs the FastAPI backend, the React frontend, and the AI models.
- **Edge Devices:** Lightweight laptops placed in various physical rooms. They run `camera_streamer.py`, which securely broadcasts their webcam feed locally.

---

## Setting up an Edge Device

Follow these steps on **every laptop** you want to use as a camera node.

### 1. Transfer the Files
Copy this entire `edge_device/` folder to the target laptop. You do not need the full `client` or `server` folders on these peripheral laptops—only this directory.

### 2. Install Requirements
Open a terminal inside the `edge_device` folder and install the necessary lightweight packages (Flask and OpenCV):
```bash
pip install -r requirements.txt
```

### 3. Run the Streamer
Launch the camera broadcast script:
```bash
python camera_streamer.py --port 5000
```
*(Note: If you have multiple webcams connected to the laptop, you can specify which one to use with `--camera 1`)*

### 4. Note the Device URL
Once the script starts, it will print out a URL. It should look something like this:
`http://192.168.1.101:5000/video_feed`

This URL is the **Device ID** for this specific laptop. Leave this script running.

---

## Linking Edge Devices to the Main Server

Now return to your **Main Server** computer.

1. Open your web browser and log into the Smart Evacuation System dashboard.
2. Navigate to the **Building Layout** editor.
3. Select the room that corresponds to the physical location of the Edge Device you just set up.
4. In the **Device / Camera ID** field in the right sidebar, type in the exact URL printed by the edge device:
   ```
   http://192.168.1.101:5000/video_feed
   ```
5. Click **Save Layout**.

### Result
The main server is now configured! Whenever the system requests video for that specific room, the backend FastAPI server will automatically reach out over the network, connect to the Edge Device, and stream its live frames into your system for AI processing and dashboard viewing.
