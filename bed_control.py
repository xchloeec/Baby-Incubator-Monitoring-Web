from adafruit_servokit import ServoKit
import time
import threading

# channels physically wired
ACTIVE_CHANNELS = [0, 1, 2]

# Servo driver
kit = ServoKit(channels=16)

# match your working calibration
for ch in ACTIVE_CHANNELS:
    kit.servo[ch].set_pulse_width_range(1000, 2000)

# store last known angles
last_angles = {
    0: 60.0,
    1: 60.0,
    2: 60.0,
}

# --- motion runtime state ---
_motion_running = False
_motion_stop_flag = False

# helper: clamp angle to a safe range
def clamp_angle(deg: float) -> float:
    # you can tighten this if needed for safety or mechanics
    if deg < 0:
        return 0
    if deg > 120:
        return 120
    return deg

def get_bed_state(label="Neutral", description="Flat, centered position"):
    return {
        "label": label,
        "description": description,
        "x": last_angles[ACTIVE_CHANNELS[0]],
        "y": last_angles[ACTIVE_CHANNELS[1]],
        "z": last_angles[ACTIVE_CHANNELS[2]],
        "stable": True,
    }

def smooth_move(target_angles, duration=1.0, steps=40):
    """
    Interpolate from last_angles -> target_angles with clamping so we never
    send illegal values to the servo driver.
    """
    start = {ch: last_angles[ch] for ch in ACTIVE_CHANNELS}

    print("[bed_control] smooth_move start ->", target_angles)

    for i in range(steps + 1):
        t = i / steps
        for ch in ACTIVE_CHANNELS:
            a_start = start[ch]
            a_end   = clamp_angle(target_angles[ch])
            a_now   = a_start + (a_end - a_start) * t
            a_now   = clamp_angle(a_now)

            kit.servo[ch].angle = a_now

            # debug at beginning / mid / end
            if i in (0, steps // 2, steps):
                print(f"[bed_control] ch {ch} -> {a_now:.1f} deg (step {i}/{steps})")

        time.sleep(duration / steps)

    # commit final
    for ch in ACTIVE_CHANNELS:
        last_angles[ch] = clamp_angle(target_angles[ch])

    print("[bed_control] smooth_move done. last_angles:", last_angles)

# Preset poses (ensure within 0-120 range)
POSE_NEUTRAL = {0: 60, 1: 60, 2: 60}
POSE_HEAD_UP = {0: 75, 1: 55, 2: 60}
POSE_LEFT_SIDE = {0: 50, 1: 80, 2: 60}
POSE_RIGHT_SIDE = {0: 70, 1: 40, 2: 60}
POSE_FEEDING = {0: 85, 1: 75, 2: 60}
POSE_SLEEP = {0: 55, 1: 50, 2: 60}

def go_neutral():
    print("[POSE] Neutral / Flat")
    smooth_move(POSE_NEUTRAL, duration=1.0)

def go_head_up():
    print("[POSE] Head Elevated / Reflux")
    smooth_move(POSE_HEAD_UP, duration=1.0)

def go_feeding():
    print("[POSE] Feeding / Upright")
    smooth_move(POSE_FEEDING, duration=1.0)

def go_left_side():
    print("[POSE] Left Side Tilt")
    smooth_move(POSE_LEFT_SIDE, duration=1.0)

def go_right_side():
    print("[POSE] Right Side Tilt")
    smooth_move(POSE_RIGHT_SIDE, duration=1.0)

def go_sleep():
    print("[POSE] Sleep / Cozy")
    smooth_move(POSE_SLEEP, duration=1.0)

def manual_set(x, y, z):
    """
    x,y,z are coming from the UI's manual offset buttons.
    We interpret them as desired absolute angles (not deltas).
    So we clamp them and then move there.
    """
    print("[MANUAL] set:", x, y, z)

    x_clamped = clamp_angle(float(x))
    y_clamped = clamp_angle(float(y))
    z_clamped = clamp_angle(float(z))

    target = {
        ACTIVE_CHANNELS[0]: x_clamped,
        ACTIVE_CHANNELS[1]: y_clamped,
        ACTIVE_CHANNELS[2]: z_clamped,
    }

    smooth_move(target, duration=1.0)

# --- NEW: NUDGE CONTROL (preferred for your manual arrows) ---

def nudge(axis: str, delta: float):
    """
    axis: 'x' | 'y' | 'z'
    delta: how much to change (e.g. +5, -5)
    This uses the Pi's current last_angles so it's always in sync
    with presets and previous moves.
    """
    print(f"[MANUAL] nudge axis={axis}, delta={delta}")

    # map logical axis -> actual servo channel index
    # x = ACTIVE_CHANNELS[0], y = ACTIVE_CHANNELS[1], z = ACTIVE_CHANNELS[2]
    axis_to_ch = {
        "x": ACTIVE_CHANNELS[0],
        "y": ACTIVE_CHANNELS[1],
        "z": ACTIVE_CHANNELS[2],
    }

    if axis not in axis_to_ch:
        print("[MANUAL] nudge error: bad axis", axis)
        return

    # start from the real last_angles
    new_targets = {
        ACTIVE_CHANNELS[0]: last_angles[ACTIVE_CHANNELS[0]],
        ACTIVE_CHANNELS[1]: last_angles[ACTIVE_CHANNELS[1]],
        ACTIVE_CHANNELS[2]: last_angles[ACTIVE_CHANNELS[2]],
    }

    ch = axis_to_ch[axis]
    new_targets[ch] = clamp_angle(new_targets[ch] + float(delta))

    print("[MANUAL] nudge target:", new_targets)
    smooth_move(new_targets, duration=0.7)


# ==============================
# MOTION PATTERNS (LOOPS)
# ==============================

def _run_motion_for_duration(worker_fn, duration_seconds):
    """
    Internal helper:
    - worker_fn(): one 'cycle' of the motion (rock once, or breathe once)
    - run repeatedly until duration is up OR stop flag set
    """
    global _motion_running, _motion_stop_flag
    _motion_running = True
    _motion_stop_flag = False

    start_t = time.time()
    while True:
        if _motion_stop_flag:
            break
        if (time.time() - start_t) >= duration_seconds:
            break
        worker_fn()

    # after done, return to safe pose (sleep pose feels comforting)
    go_sleep()

    _motion_running = False
    _motion_stop_flag = False
    print("[MOTION] finished, returned to sleep")

def stop_motion():
    """
    Can be called to force-stop any running motion.
    """
    global _motion_stop_flag
    _motion_stop_flag = True
    print("[MOTION] stop requested")


def start_gentle_rock(duration_seconds=1800, amplitude_deg=5.0, period=4.0):
    """
    Public API:
    - duration_seconds: how long to keep rocking (e.g. 1800s = 30min)
    Spawns a background thread so server.py doesn't block.
    """
    if _motion_running:
        print("[MOTION] already running, ignoring new request")
        return

    def one_cycle():
        # base pose is neutral. you can change to POSE_SLEEP if you prefer
        base = POSE_NEUTRAL

        left_tilt = {
            0: clamp_angle(base[0] - amplitude_deg),
            1: clamp_angle(base[1] + amplitude_deg),
            2: base[2],
        }
        right_tilt = {
            0: clamp_angle(base[0] + amplitude_deg),
            1: clamp_angle(base[1] - amplitude_deg),
            2: base[2],
        }

        # tilt left slowly half period
        smooth_move(left_tilt, duration=period/2.0)
        # tilt right slowly half period
        smooth_move(right_tilt, duration=period/2.0)

    print(f"[MOTION] Gentle Rock start for {duration_seconds}s")
    th = threading.Thread(
        target=_run_motion_for_duration,
        args=(one_cycle, duration_seconds),
        daemon=True
    )
    th.start()


def start_womb_breathing(duration_seconds=1800, lift_deg=3.0, period=8.0):
    """
    Public API:
    - duration_seconds: e.g. 1200s = 20min
    Breathing = lift whole bed slightly up/down smoothly.
    """
    if _motion_running:
        print("[MOTION] already running, ignoring new request")
        return

    def one_cycle():
        base = POSE_SLEEP

        def elevated_pose(sign):
            # sign=+1 inhale (up), sign=-1 exhale (back down / below)
            return {
                0: clamp_angle(base[0] + sign * lift_deg),
                1: clamp_angle(base[1] + sign * lift_deg),
                2: clamp_angle(base[2] + sign * lift_deg),
            }

        # inhale up: ~45% period
        smooth_move(elevated_pose(+1), duration=period * 0.45, steps=50)
        # small hold ~10%
        time.sleep(period * 0.10)
        # exhale back to base ~45%
        smooth_move(base, duration=period * 0.45, steps=50)
        # optional tiny rest could be added

    print(f"[MOTION] Womb Breathing start for {duration_seconds}s")
    th = threading.Thread(
        target=_run_motion_for_duration,
        args=(one_cycle, duration_seconds),
        daemon=True
    )
    th.start()

# def gentle_rock(cycles=5, amplitude_deg=5.0, period=4.0):
#     """
#     Slow rocking: tilts left/right around neutral.
#     cycles: how many times to rock
#     amplitude_deg: how strong the tilt is (adjust SMALL first)
#     period: seconds for full left->right->left
#     """
#     print("[MOTION] Gentle Rock start")
#     base = POSE_NEUTRAL

#     for n in range(cycles):
#         # compute left tilt
#         # We'll add (+/- amplitude_deg) to certain servos.
#         # You MUST tune which servo goes which direction.
#         left_tilt = {
#             0: base[0] - amplitude_deg,
#             1: base[1] + amplitude_deg,
#             2: base[2],
#         }
#         right_tilt = {
#             0: base[0] + amplitude_deg,
#             1: base[1] - amplitude_deg,
#             2: base[2],
#         }

#         # go left
#         smooth_move(left_tilt, duration=period/2.0)
#         # go right
#         smooth_move(right_tilt, duration=period/2.0)

#     # return to neutral at end
#     smooth_move(base, duration=1.5)
#     print("[MOTION] Gentle Rock done")


# def womb_breathing(cycles=10, lift_deg=3.0, period=8.0):
#     """
#     Simulate parent breathing / womb-like comfort.
#     Motion idea:
#       - bed rises slowly together (like inhale / chest expands)
#       - slight pause
#       - bed lowers slowly (like exhale)
#     Notes:
#       lift_deg is small. Start with 2-3 degrees max.
#       period is total seconds for one inhale+exhale.
#     """

#     print("[MOTION] Womb Breathing start")

#     # Base is neutral sleep pose (almost flat)
#     base = POSE_SLEEP

#     # We'll raise ALL THREE servos together by +lift_deg to get a gentle 'up'
#     # You may need to invert +/- depending on which direction is 'up'.
#     def elevated_pose(sign):
#         # sign = +1 for up (inhale), -1 for down (exhale past neutral if desired)
#         return {
#             0: base[0] + sign * lift_deg,
#             1: base[1] + sign * lift_deg,
#             2: base[2] + sign * lift_deg,
#         }

#     for n in range(cycles):
#         # inhale: go slightly up over half the period
#         smooth_move(elevated_pose(+1), duration=period * 0.45, steps=50)

#         # tiny hold at top
#         time.sleep(period * 0.10)

#         # exhale: go back to base over the remaining time
#         smooth_move(base, duration=period * 0.45, steps=50)

#         # you can optionally add a tiny hold at bottom
#         # time.sleep(period * 0.05)

#     # return gently to sleep pose at the end
#     smooth_move(base, duration=1.5)
#     print("[MOTION] Womb Breathing done")

# ==============================
# MANUAL ADJUSTMENT
# ==============================

# def manual_set(a_deg, b_deg, c_deg, duration=1.0):
#     """
#     Direct control (for calibration / testing):
#     You give 3 raw servo angles.
#     """
#     print(f"[MANUAL] A={a_deg}  B={b_deg}  C={c_deg}")
#     target = {0: float(a_deg), 1: float(b_deg), 2: float(c_deg)}
#     smooth_move(target, duration=duration)


# # ==============================
# # DEMO SEQUENCE
# # ==============================

# if __name__ == "__main__":
#     print("Incubator Bed Control Demo. Ctrl+C to stop anytime.\n")

#     # Start neutral so we know the starting state
#     go_neutral()
#     time.sleep(2)

#     go_head_up()
#     time.sleep(2)

#     go_feeding()
#     time.sleep(2)

#     go_left_side()
#     time.sleep(2)

#     go_right_side()
#     time.sleep(2)

#     print("Gentle rocking for 3 cycles...")
#     gentle_rock(cycles=3, amplitude_deg=4.0, period=4.0)

#     print("Now womb-like breathing motion...")
#     womb_breathing(cycles=6, lift_deg=3.0, period=8.0)

#     print("Back to sleep pose...")
#     go_sleep()

#     print("Done.")

