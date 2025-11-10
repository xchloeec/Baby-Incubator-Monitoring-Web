import asyncio
import base64
import cv2
import numpy as np
import pygame
import time
import os
import subprocess
import threading
from concurrent.futures import ThreadPoolExecutor

import board, busio, adafruit_adxl34x, adafruit_dht, lgpio as GPIO
import max30102, hrcalc
from heartrate_monitor import HeartRateMonitor
from ultralytics import YOLO

import socketio
from fastapi import FastAPI, UploadFile, File, HTTPException
import uvicorn
import simpleaudio as sa
import sounddevice as sd
import librosa, tensorflow_hub as hub
from tensorflow.keras.models import load_model
import warnings, logging

from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware

import bed_control

# --- I2C setup & ADXL345 init (drop this before using the accelerometer) ---
import time, board, busio
import adafruit_adxl34x

# Slower clock is safest for mixed devices
i2c = busio.I2C(board.SCL, board.SDA, frequency=100_000)

# Optional: prove bus is free and the device is visible
print("🔎 Locking I2C and scanning...")
while not i2c.try_lock():
    time.sleep(0.01)
try:
    addrs = i2c.scan()
    print("🚌 I2C scan:", [hex(a) for a in addrs])  # should include 0x53
finally:
    i2c.unlock()

# A short settle delay helps on some breakouts after power-up
time.sleep(0.05)

# Force the correct address you saw in i2cdetect
# (SDO tied to VCC -> 0x53; if SDO to GND it would be 0x1D)
ACCEL_ADDR = 0x53

# Robust init with one retry in case of a first-write hiccup
for attempt in range(2):
    try:
        accelerometer = adafruit_adxl34x.ADXL345(i2c, address=ACCEL_ADDR)
        print("✅ ADXL345 ready @ 0x%02X" % ACCEL_ADDR)
        break
    except Exception as e:
        print(f"⚠️ ADXL345 init failed (attempt {attempt+1}): {e}")
        time.sleep(0.1)
else:
    accelerometer = None
    print("❌ ADXL345 not available; continuing without it.")

# Later, when reading:
if accelerometer:
    x, y, z = accelerometer.acceleration  # m/s^2
else:
    x, y, z = (0.0, 0.0, 0.0)             # fallback so the app doesn't crash

# ======================================================
# ----------------- INITIAL SETUP ----------------------
# ======================================================
warnings.filterwarnings("ignore")
logging.getLogger("cv2").setLevel(logging.ERROR)

sio = socketio.AsyncServer(async_mode="asgi", cors_allowed_origins="*")

# --- UI alert helpers (minimal; added) ---
async def ui_alert_warning(message: str):
    try:
        await sio.emit("emergency_alert", {"message": message, "severity": "warning"})
    except Exception as e:
        print("emit emergency_alert warning failed:", e)

async def ui_alert_info(message: str):
    try:
        await sio.emit("emergency_alert", {"message": message, "severity": "info"})
    except Exception as e:
        print("emit emergency_alert info failed:", e)

async def ui_set_intensity(val: int):
    try:
        await sio.emit("crying_intensity", int(val))
    except Exception as e:
        print("emit crying_intensity failed:", e)

app = FastAPI()
sio_app = socketio.ASGIApp(sio, app)
executor = ThreadPoolExecutor(max_workers=4)

CAPTURE_DIR = "/home/baby5/yolo/baby_images"
os.makedirs(CAPTURE_DIR, exist_ok=True)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)
app.mount("/baby_images", StaticFiles(directory=CAPTURE_DIR), name="baby_images")

# ======================================================
# ----------------- SOUND SETUP ------------------------
# ======================================================
HEARTBEAT_SOUND = "/home/baby5/yolo/heartbeat.mp3"
pygame.mixer.init()
pygame.mixer.music.load(HEARTBEAT_SOUND)

is_playing = False
last_cry_time = 0
CRY_DELAY = 5.0

# ======================================================
# ----------------- CAMERA SETUP -----------------------
# ======================================================
print("🎥 Initializing camera at /dev/video0 ...")
camera = cv2.VideoCapture("/dev/video0", cv2.CAP_V4L2)
camera.set(cv2.CAP_PROP_FOURCC, cv2.VideoWriter_fourcc(*"MJPG"))
camera.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
camera.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
time.sleep(1)
ret, frame = camera.read()
if ret:
    print("✅ Camera test frame captured successfully — LED ON.")
else:
    print("⚠️ Failed to capture frame from /dev/video0.")
if not camera.isOpened():
    raise RuntimeError("❌ Camera failed to initialize — check connection or permissions.")

# ======================================================
# ----------------- AUDIO MODEL SETUP ------------------
# ======================================================

@sio.on("cry_file")
async def handle_cry_file(sid, data):
    import base64, aiofiles, numpy as np, soundfile as sf, os, librosa
    from tensorflow.keras.models import load_model
    from PIL import Image

    try:
        print("📩 Received audio file for cry classification...")

        # Decode base64 to bytes
        audio_bytes = base64.b64decode(data["base64"])

        # --- Step 1: Save permanently as cry_upload.wav ---
        SAVE_DIR = "/home/baby5/yolo/cry_uploads"
        os.makedirs(SAVE_DIR, exist_ok=True)
        filename = "cry_upload.wav"
        saved_path = os.path.join(SAVE_DIR, filename)

        async with aiofiles.open(saved_path, "wb") as f:
            await f.write(audio_bytes)

        print(f"✅ Saved uploaded cry audio to {saved_path}")

        # --- Step 2: Load trained CNN model ---
        model_path = os.path.join(SAVE_DIR, "..", "custom_cnn.h5")
        model = load_model(model_path)

        # Define your class names (must match your training)
        class_names = ['belly_pain', 'burping', 'discomfort', 'hungry', 'tired']

        # --- Step 3: Config for mel-spectrogram preprocessing ---
        class conf:
            sampling_rate = 16000
            duration = 7
            hop_length = 100 * duration
            fmin = 20
            fmax = sampling_rate // 2
            n_mels = 128
            n_fft = n_mels * 20
            samples = sampling_rate * duration

        def read_audio(path, conf):
            y, sr = librosa.load(path, sr=conf.sampling_rate)
            if len(y) > conf.samples:
                y = y[:conf.samples]
            else:
                y = np.pad(y, (0, conf.samples - len(y)), mode='constant')
            return y

        def audio_to_melspectrogram(conf, audio):
            mels = librosa.feature.melspectrogram(
                y=audio,
                sr=conf.sampling_rate,
                n_mels=conf.n_mels,
                hop_length=conf.hop_length,
                n_fft=conf.n_fft,
                fmin=conf.fmin,
                fmax=conf.fmax,
            )
            mels = librosa.power_to_db(mels)
            return mels.astype(np.float32)

        def mono_to_color(X, eps=1e-6):
            X = np.stack([X, X, X], axis=-1)
            mean = X.mean()
            std = X.std()
            Xstd = (X - mean) / (std + eps)
            _min, _max = Xstd.min(), Xstd.max()
            V = 255 * (Xstd - _min) / (_max - _min)
            return V.astype(np.uint8)

        # --- Step 4: Preprocess the uploaded file ---
        img_size = (128, 128)
        y = read_audio(saved_path, conf)
        mels = audio_to_melspectrogram(conf, y)
        img = mono_to_color(mels)
        img = np.array(Image.fromarray(img).resize(img_size))
        img = img / 255.0
        img = np.expand_dims(img, axis=0)

        # --- Step 5: Predict reason for cry ---
        pred = model.predict(img)
        pred_class = np.argmax(pred, axis=1)[0]
        #confidence = float(np.max(pred))
        predicted_label = class_names[pred_class]

        print(f"🧠 Predicted reason: {predicted_label}")

        # --- Step 6: Send result to web UI ---
        await sio.emit(
            "cry_result",
            {
                "label": predicted_label,
                # "confidence": confidence,
                # "scores": {cls: float(pred[0][i]) for i, cls in enumerate(class_names)},
                # "message": f"File saved: {os.path.basename(saved_path)}",
            },
            to=sid,
        )

    except Exception as e:
        print("❌ Error in cry classification:", e)
        await sio.emit("cry_result", {"error": str(e)}, to=sid)


# ======================================================
# ----------------- YOLO MODEL SETUP -------------------
# ======================================================
print("🧠 Loading YOLO model...")
yolo_model = YOLO("/home/baby5/yolo/best2.pt")
yolo_labels = yolo_model.names
print(f"✅ YOLO model ready with classes: {yolo_labels}")

# ======================================================
# ----------------- AUTO CAMERA + AUDIO INFERENCE -------
# ======================================================
import sounddevice as sd
import librosa, tensorflow_hub as hub
from tensorflow.keras.models import load_model

# --- Audio Model Setup ---
SAMPLE_RATE = 16000
DURATION = 5.0
THRESHOLD = 0.6
PRINT_INTERVAL = 3
CRY_DELAY = 5.0

mic_detected = False
camera_detected = False
last_cry_time = 0
is_playing = False

print("🎧 Loading YAMNet feature extractor + baby cry classifier...")
yamnet_model = hub.load("https://tfhub.dev/google/yamnet/1")
cry_classifier = load_model("/home/baby5/yolo/baby_cry_detector.h5")
print("✅ Audio models loaded successfully.")

def predict_audio(audio_data):
    """Return crying probability from audio clip"""
    if len(audio_data.shape) > 1:
        audio_data = np.mean(audio_data, axis=1)  # convert to mono
    if audio_data.shape[0] != int(SAMPLE_RATE * DURATION):
        audio_data = librosa.resample(
            audio_data, orig_sr=int(len(audio_data)/DURATION), target_sr=SAMPLE_RATE
        )
    _, embeddings, _ = yamnet_model(audio_data)
    emb_mean = np.mean(embeddings.numpy(), axis=0).reshape(1, -1)
    prob = cry_classifier.predict(emb_mean, verbose=0)[0][0]
    return prob

def run_audio_detector():
    """Continuously analyze microphone input and update mic_detected"""
    global mic_detected, last_cry_time
    print("🎙️ Audio detection thread started.")
    while True:
        try:
            audio = sd.rec(int(SAMPLE_RATE * DURATION),
                           samplerate=SAMPLE_RATE, channels=1, dtype='float32')
            sd.wait()
            prob = predict_audio(audio)
            mic_detected = prob > THRESHOLD
            if mic_detected:
                last_cry_time = time.time()
                print(f"🍼 Mic: Cry Detected (conf={prob:.2f})")
            else:
                print(f"😴 Mic: Not Crying (conf={prob:.2f})")
        except Exception as e:
            print("⚠️ Mic error:", e)
        time.sleep(PRINT_INTERVAL)

# Start mic detector in background
threading.Thread(target=run_audio_detector, daemon=True).start()

# --- Combined camera + mic inference ---
def camera_yolo_loop():
    """Continuously run YOLO detection; play sound only if both camera+mic detect crying."""
    global camera_detected, mic_detected, is_playing, last_cry_time

    print("🎬 Starting combined camera+mic monitoring loop...")
    last_yolo_time = 0

    while True:
        ret, frame = camera.read()
        if not ret or frame is None:
            print("⚠️ Failed to grab frame.")
            time.sleep(1)
            continue

        now = time.time()
        if now - last_yolo_time > 5:  # YOLO every 5 s
            last_yolo_time = now
            try:
                print("🔍 [YOLO] Running inference...")
                start = time.time()
                results = yolo_model.predict(frame, device="cpu", verbose=False)
                duration = time.time() - start
                print(f"✅ [YOLO] Inference done in {duration:.2f}s")

                camera_detected = any(
                    "cry" in yolo_labels[int(box.cls[0])].lower()
                    and float(box.conf[0]) > 0.5
                    for box in results[0].boxes
                )
                print(f"🧠 Camera detected cry: {camera_detected}")

                # --- Combined logic ---
                both_detect = camera_detected and mic_detected
                now = time.time()

                if both_detect:
                    if not is_playing:
                        print("🍼 BOTH camera+mic crying → Playing heartbeat sound...")
                        pygame.mixer.music.play(loops=-1)
                        is_playing = True
                        last_cry_time = now

                        # NEW emits
                        try:
                            camc = camera_confidence if 'camera_confidence' in locals() else 0.8
                            micc = mic_confidence   if 'mic_confidence'   in locals() else 0.8
                        except Exception:
                            camc, micc = 0.8, 0.8

                        intensity_val = int(min(99, max(0, round(camc * 50 + micc * 50))))
                        # NEW (thread-safe)
                        emit_from_thread(ui_set_intensity(intensity_val))
                        emit_from_thread(ui_alert_warning("Crying detected — soothing heartbeat started (camera+mic)."))


                else:
                    # Only stop after a calm window
                    if is_playing and (now - last_cry_time) > CRY_DELAY:
                        print("🙂 Baby calm — stopping heartbeat.")
                        pygame.mixer.music.stop()
                        is_playing = False
                        # NEW emits
                        emit_from_thread(ui_set_intensity(0))
                        emit_from_thread(ui_alert_info("Baby calm — heartbeat stopped."))

            except Exception as e:
                print("⚠️ YOLO error:", e)

        time.sleep(0.5)

# ======================================================
# ---------------- TALK TO BABY (from UI) --------------
# ======================================================
import tempfile, subprocess, time, os, base64

current_audio = bytearray()
is_listening = False
@sio.on("talk_start")
async def handle_talk_start(sid):
    global current_audio, is_listening
    current_audio = bytearray()
    is_listening = True
    print("🎙️ Parent started talking...")

@sio.on("talk_chunk")
async def handle_talk_chunk(sid, data):
    global current_audio
    if not is_listening:
        return
    try:
        chunk = base64.b64decode(data.get("audio", ""))
        current_audio.extend(chunk)
    except Exception as e:
        print("⚠️ talk_chunk decode error:", e)

@sio.on("talk_stop")
async def handle_talk_stop(sid):
    global current_audio, is_listening
    is_listening = False
    print("🔇 talk_stop received — converting and playing audio...")

    try:
        import tempfile, subprocess, time
        with tempfile.NamedTemporaryFile(suffix=".m4a", delete=False) as f:
            f.write(current_audio)
            temp_path = f.name
        print(f"💾 Saved {len(current_audio)} bytes to {temp_path}")

        wav_path = f"/tmp/parent_talk_{int(time.time())}.wav"
        conv = subprocess.run(
            ["ffmpeg", "-y", "-i", temp_path, "-ar", "44100", "-ac", "2", wav_path],
            capture_output=True, text=True
        )
        if conv.returncode == 0:
            print("✅ Converted successfully:", wav_path)
            subprocess.run(["aplay", "-q", wav_path])
        else:
            print("❌ FFmpeg error:", conv.stderr)
    except Exception as e:
        print("❌ Error during talk_stop:", e)

import os
from datetime import datetime

# New event to handle frame capture
@sio.on('capture_frame')
async def handle_capture_frame(sid, data):
    import base64
    from datetime import datetime

    os.makedirs(CAPTURE_DIR, exist_ok=True)

    photo_id = data.get("photoId", "capture")
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    live_image = data.get("liveImage", "")

    try:
        img_data = live_image.replace("data:image/jpeg;base64,", "")
        img_bytes = base64.b64decode(img_data)
        filename = f"{photo_id}_{timestamp}.jpg"
        filepath = os.path.join(CAPTURE_DIR, filename)
        with open(filepath, "wb") as f:
            f.write(img_bytes)

        public_url = f"/baby_images/{filename}"
        print(f"✅ Saved image: {filepath}")

        await sio.emit("capture_saved", {
            "status": "success",
            "url": public_url,
            "timestamp": time.time(),
            "id": filename,
        }, to=sid)

    except Exception as e:
        print("❌ Error saving capture:", e)
        await sio.emit("capture_saved", {"status": "error", "message": str(e)}, to=sid)

import os
from datetime import datetime

# Capture and Save Images 
@app.get("/api/photos")
async def list_photos():
    try:
        files = [
            f for f in os.listdir(CAPTURE_DIR)
            if f.lower().endswith((".jpg", ".jpeg", ".png"))
        ]
        files.sort(key=lambda fn: os.path.getmtime(os.path.join(CAPTURE_DIR, fn)), reverse=True)

        photo_list = []
        for fn in files:
            full_path = os.path.join(CAPTURE_DIR, fn)
            timestamp = os.path.getmtime(full_path)
            photo_list.append({
                "id": fn,
                "url": f"/baby_images/{fn}",
                "timestamp": timestamp,
                "description": "Live baby capture",
                "tags": ["baby", "monitoring", "capture"]
            })
        return photo_list
    except Exception as e:
        print("❌ Error listing photos:", e)
        raise HTTPException(status_code=500, detail=str(e))


# Start camera loop thread
# threading.Thread(target=camera_yolo_loop, daemon=True).start()
# main_loop = asyncio.get_event_loop()

main_loop: asyncio.AbstractEventLoop | None = None

def camera_frame_stream_loop():
    """Continuously capture frames and emit them to UI."""
    print("📡 Starting live camera stream loop...")

    while True:
        ret, frame = camera.read()
        if not ret or frame is None:
            print("⚠️ Failed to grab frame for UI.")
            time.sleep(0.2)
            continue

        # Encode to base64 JPEG
        try:
            _, buffer = cv2.imencode(".jpg", frame)
            frame_b64 = base64.b64encode(buffer).decode("utf-8")

            if main_loop.is_running():
                asyncio.run_coroutine_threadsafe(
                    sio.emit("camera_frame", {"image": frame_b64}),
                    main_loop
                )
        except Exception as e:
            print("⚠️ Frame encode/emit error:", e)

        time.sleep(0.1)  # ~10 FPS

# Start both YOLO loop and live stream loop
@app.on_event("startup")
async def startup_event():
    global main_loop
    main_loop = asyncio.get_running_loop()
    print("✅ Main event loop captured for camera streaming.")

    # Start camera + YOLO background threads
    threading.Thread(target=camera_yolo_loop, daemon=True).start()
    threading.Thread(target=camera_frame_stream_loop, daemon=True).start()

def emit_from_thread(coro: "coroutine"):
    """Schedule an async emit from a non-async background thread."""
    if main_loop is None:
        print("⚠️ main_loop not ready; dropping emit")
        return
    try:
        asyncio.run_coroutine_threadsafe(coro, main_loop)
    except Exception as e:
        print("⚠️ emit_from_thread error:", e)



# ======================================================
# ----------------- BED CONTROL SOCKETS ----------------
# ======================================================

async def emit_bed_state(label="Status", description=""):
    try:
        current = bed_control.get_bed_state(label=label, description=description)
        await sio.emit("bed_position", current)
    except Exception as e:
        print("⚠️ emit_bed_state error:", e)

@sio.on("set_bed_position")
async def handle_set_bed_position(sid, data):
    """
    data sample: { "mode": "head_elevated" | "flat" | "left_side" | "right_side" | "feeding" | "sleep" }
    """
    mode = (data or {}).get("mode")
    print("[socket] set_bed_position from", sid, "data=", data)

    def _do():
        mapping = {
            "flat": bed_control.go_neutral,
            "head_elevated": bed_control.go_head_up,
            "left_side": bed_control.go_left_side,
            "right_side": bed_control.go_right_side,
            "feeding": bed_control.go_feeding,
            "sleep": bed_control.go_sleep,
        }
        fn = mapping.get(mode)
        if fn:
            fn()
        else:
            print("[socket] unknown mode:", mode)

    # offload blocking servo moves
    await asyncio.get_running_loop().run_in_executor(executor, _do)
    await emit_bed_state(label="FromPreset", description=f"Mode: {mode}")

@sio.on("set_manual_offset")
async def handle_set_manual_offset(sid, data):
    """
    data sample: { "axis": "x" | "y" | "z", "delta": number }
    """
    axis = (data or {}).get("axis")
    delta = (data or {}).get("delta")
    print("[socket] nudge request from", sid, "=>", axis, delta)

    def _do():
        try:
            bed_control.nudge(axis, float(delta))
        except Exception as e:
            print("[socket] nudge error:", e)

    await asyncio.get_running_loop().run_in_executor(executor, _do)
    await emit_bed_state(label="Manual", description=f"Nudged {axis} by {delta}")

@sio.on("start_motion")
async def handle_start_motion(sid, data):
    """
    data sample: { "type": "rock" | "breathe", "minutes": number }
    """
    motion_type = (data or {}).get("type")
    minutes = float((data or {}).get("minutes", 30))
    duration_seconds = minutes * 60.0
    print("[socket] start_motion from", sid, "=>", motion_type, duration_seconds, "sec")

    def _do():
        if motion_type == "rock":
            bed_control.start_gentle_rock(duration_seconds=duration_seconds)
        elif motion_type == "breathe":
            bed_control.start_womb_breathing(duration_seconds=duration_seconds)
        else:
            print("[socket] unknown motion type:", motion_type)

    await asyncio.get_running_loop().run_in_executor(executor, _do)
    await emit_bed_state(label="Motion", description=f"{motion_type} for {minutes} min")

@sio.on("stop_motion")
async def handle_stop_motion(sid):
    print("[socket] stop_motion from", sid)

    def _do():
        try:
            bed_control.stop_motion()
        except Exception as e:
            print("[socket] stop_motion error:", e)

    await asyncio.get_running_loop().run_in_executor(executor, _do)
    await emit_bed_state(label="Stopped", description="Motion stopped by user")

# ======================================================
# ----------------- SENSORS SETUP ----------------------
# ======================================================
print("🩺 Initializing sensors...")
i2c = busio.I2C(board.SCL, board.SDA)
accelerometer = adafruit_adxl34x.ADXL345(i2c)
dhtDevice = adafruit_dht.DHT11(board.D4)
hrm = HeartRateMonitor(print_raw=False, print_result=False)
hrm.start_sensor()
m = max30102.MAX30102()
print("✅ All sensors initialized.\n")

# ======================================================
# ----------------- SENSOR STREAM ----------------------
# ======================================================
active_sensor_clients = set()
running_tasks = {}

@sio.event
async def connect(sid, environ):
    print(f"✅ Client connected: {sid}")

@sio.event
async def disconnect(sid):
    print(f"❌ Client disconnected: {sid}")
    active_sensor_clients.discard(sid)
    task = running_tasks.pop(sid, None)
    if task:
        task.cancel()

@sio.on("start_reading")
async def handle_start_reading(sid):
    active_sensor_clients.add(sid)
    task = asyncio.create_task(stream_sensor_data(sid))
    running_tasks[sid] = task

@sio.on("stop_reading")
async def handle_stop_reading(sid):
    active_sensor_clients.discard(sid)
    task = running_tasks.pop(sid, None)
    if task:
        task.cancel()

async def stream_sensor_data(sid):
    last_valid = {"bpm":0,"spo2":0,"temperature":0,"humidity":0,"x":0,"y":0,"z":0}
    try:
        while sid in active_sensor_clients:
            start = time.perf_counter()
            try:
                x, y, z = accelerometer.acceleration
            except Exception:
                x, y, z = last_valid["x"], last_valid["y"], last_valid["z"]

            temperature, humidity = None, None
            for _ in range(3):
                try:
                    temperature = dhtDevice.temperature
                    humidity = dhtDevice.humidity
                    if temperature and humidity:
                        break
                except Exception:
                    await asyncio.sleep(0.2)
            if temperature is None or humidity is None:
                temperature, humidity = last_valid["temperature"], last_valid["humidity"]

            bpm = hrm.bpm or last_valid["bpm"]
            spo2 = last_valid["spo2"]

            try:
                red, ir = await asyncio.get_event_loop().run_in_executor(executor, m.read_sequential)
                if len(red)>30 and len(ir)>30:
                    hr,hr_valid,spo2_val,spo2_valid=hrcalc.calc_hr_and_spo2(ir,red)
                    if spo2_valid and spo2_val>0: spo2=spo2_val
            except Exception: pass

            data={"bpm":round(bpm,1),"spo2":round(spo2,1),
                  "temperature":round(temperature,1),"humidity":round(humidity,1),
                  "x":round(x,2),"y":round(y,2),"z":round(z,2)}
            last_valid=data
            await sio.emit("sensor_data",data,to=sid)
            elapsed=time.perf_counter()-start
            await asyncio.sleep(max(1.0-elapsed,0.1))
    except asyncio.CancelledError:
        print(f"🛑 Sensor stream stopped for {sid}")

# ======================================================
# ----------------- ROOT ENDPOINT ----------------------
# ======================================================
@app.get("/")
async def home():
    return {"message":"Unified baby monitoring (camera+mic integrated) ✅"}

# ======================================================
# ----------------- MAIN RUNNER ------------------------
# ======================================================
if __name__ == "__main__":
    try:
        uvicorn.run(sio_app, host="0.0.0.0", port=5000)
    finally:
        hrm.stop_sensor()
        if camera and camera.isOpened(): camera.release()
        executor.shutdown(wait=False)
        pygame.mixer.quit()
        print("🛑 Resources released. Server stopped.")
