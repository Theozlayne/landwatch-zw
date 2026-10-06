import os
import cv2
import numpy as np

OUT_DIR = "promo_output"
WIDTH, HEIGHT, FPS = 960, 540, 15
os.makedirs(OUT_DIR, exist_ok=True)

ADMIN = r"C:\Users\HP GB\Videos\Screen Recordings\admin.mp4"
INVESTIGATOR = r"C:\Users\HP GB\Videos\Screen Recordings\investigator.mp4"
CITIZEN = r"C:\Users\HP GB\Downloads\citizen.mp4"
LOGO = "coat-of-arms-transparent.png"

GREEN = (6, 41, 26)
MUTED_GREEN = (14, 82, 50)
CREAM = (238, 244, 240)
GOLD = (180, 145, 73)
WHITE = (250, 252, 250)


def fit_cover(frame, size):
    width, height = size
    scale = max(width / frame.shape[1], height / frame.shape[0])
    resized = cv2.resize(frame, (int(frame.shape[1] * scale), int(frame.shape[0] * scale)), interpolation=cv2.INTER_AREA)
    x = max(0, (resized.shape[1] - width) // 2)
    y = max(0, (resized.shape[0] - height) // 2)
    return resized[y:y + height, x:x + width]


def fit_contain(frame, size, background):
    width, height = size
    canvas = np.full((height, width, 3), background, dtype=np.uint8)
    scale = min(width / frame.shape[1], height / frame.shape[0])
    resized = cv2.resize(frame, (int(frame.shape[1] * scale), int(frame.shape[0] * scale)), interpolation=cv2.INTER_AREA)
    x = (width - resized.shape[1]) // 2
    y = (height - resized.shape[0]) // 2
    canvas[y:y + resized.shape[0], x:x + resized.shape[1]] = resized
    return canvas


def grade(frame):
    frame = frame.astype(np.float32) * 1.04 - 3
    frame[:, :, 1] *= 1.015
    return np.clip(frame, 0, 255).astype(np.uint8)


def screen_frame(frame, portrait=False):
    if portrait:
        background = np.full((HEIGHT, WIDTH, 3), (12, 42, 29), dtype=np.uint8)
        foreground = fit_contain(frame, (310, 460), (245, 248, 247))
        x = (WIDTH - foreground.shape[1]) // 2
        y = (HEIGHT - foreground.shape[0]) // 2 + 18
        background[y:y + foreground.shape[0], x:x + foreground.shape[1]] = foreground
        cv2.rectangle(background, (x - 4, y - 4), (x + foreground.shape[1] + 4, y + foreground.shape[0] + 4), (220, 229, 224), 4)
        return background
    canvas = fit_cover(frame, (WIDTH - 80, HEIGHT - 100))
    background = np.full((HEIGHT, WIDTH, 3), (18, 34, 26), dtype=np.uint8)
    x, y = 40, 50
    background[y:y + canvas.shape[0], x:x + canvas.shape[1]] = canvas
    cv2.rectangle(background, (x - 2, y - 2), (x + canvas.shape[1] + 2, y + canvas.shape[0] + 2), (182, 198, 190), 2)
    return background


def text(frame, message, origin, scale=1.0, color=WHITE, weight=2):
    cv2.putText(frame, message, origin, cv2.FONT_HERSHEY_SIMPLEX, scale, color, weight, cv2.LINE_AA)


def title_card(kind, title, subtitle, duration):
    logo = cv2.imread(LOGO, cv2.IMREAD_UNCHANGED) if os.path.exists(LOGO) else None
    for index in range(duration):
        frame = np.full((HEIGHT, WIDTH, 3), GREEN, dtype=np.uint8)
        glow = np.zeros_like(frame)
        cv2.circle(glow, (WIDTH // 2, 115), 180, (12, 88, 54), -1)
        frame = cv2.addWeighted(frame, 1.0, cv2.GaussianBlur(glow, (0, 0), 80), 0.55, 0)
        if logo is not None:
            logo_rgb = logo[:, :, :3]
            logo_rgb = cv2.resize(logo_rgb, (58, 58), interpolation=cv2.INTER_AREA)
            frame[70:128, WIDTH // 2 - 29:WIDTH // 2 + 29] = logo_rgb
        text(frame, "LANDWATCH ZW", (WIDTH // 2 - 135, 205), 0.88, WHITE, 2)
        text(frame, title.upper(), (WIDTH // 2 - min(300, len(title) * 10), 290), 0.64, CREAM, 1)
        text(frame, subtitle, (WIDTH // 2 - min(230, len(subtitle) * 7), 325), 0.42, (190, 215, 202), 1)
        cv2.line(frame, (WIDTH // 2 - 65, 365), (WIDTH // 2 + 65, 365), GOLD, 2)
        yield frame


def clip_frames(path, start, end, portrait=False):
    capture = cv2.VideoCapture(path)
    source_fps = capture.get(cv2.CAP_PROP_FPS) or FPS
    first = int(start * source_fps)
    last = int(end * source_fps)
    capture.set(cv2.CAP_PROP_POS_FRAMES, first)
    index = first
    total = max(1, last - first + 1)
    while index <= last:
        ok, frame = capture.read()
        if not ok:
            break
        frame = grade(frame)
        output = screen_frame(frame, portrait)
        local = index - first
        fade = min(1.0, local / 12, (total - local) / 12)
        if fade < 1:
            output = cv2.addWeighted(np.full_like(output, GREEN), 1 - fade, output, fade, 0)
        yield output
        index += 1
    capture.release()


segments = [
    ("card", "A connected public service", "From citizen report to field action", 3.2),
    ("video", ADMIN, 0, 12, False, "A report becomes a coordinated case"),
    ("video", CITIZEN, 0, 15, True, "Citizens can report responsibly"),
    ("video", ADMIN, 43, 55, False, "Ministry teams review and assign action"),
    ("video", INVESTIGATOR, 0, 14, False, "Field officers verify what matters"),
    ("video", INVESTIGATOR, 66, 80, False, "Findings stay traceable"),
    ("video", CITIZEN, 118, 132, True, "Citizens stay informed as cases progress"),
    ("card", "Report responsibly. Review carefully.", "Protect our future.", 4.0),
]

output_path = os.path.join(OUT_DIR, "landwatchzw_promo_silent_preview.mp4")
writer = cv2.VideoWriter(output_path, cv2.VideoWriter_fourcc(*"mp4v"), FPS, (WIDTH, HEIGHT))
if not writer.isOpened():
    raise RuntimeError("Could not open the MP4 writer")

for segment in segments:
    if segment[0] == "card":
        frames = title_card(segment[1], segment[1], segment[2], int(segment[3] * FPS))
        caption = None
    else:
        _, path, start, end, portrait, caption = segment
        frames = clip_frames(path, start, end, portrait)

    for index, frame in enumerate(frames):
        if caption and index < 45:
            overlay = frame.copy()
            cv2.rectangle(overlay, (42, HEIGHT - 92), (620, HEIGHT - 28), (6, 41, 26), -1)
            frame = cv2.addWeighted(overlay, 0.84, frame, 0.16, 0)
            text(frame, caption, (62, HEIGHT - 50), 0.42, WHITE, 1)
        writer.write(frame)

writer.release()
print(output_path)
