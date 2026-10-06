import os
import cv2

SOURCES = [
    ("investigator", r"C:\Users\HP GB\Videos\Screen Recordings\investigator.mp4"),
    ("admin", r"C:\Users\HP GB\Videos\Screen Recordings\admin.mp4"),
    ("citizen", r"C:\Users\HP GB\Downloads\citizen.mp4"),
]

os.makedirs("video_review", exist_ok=True)

for name, path in SOURCES:
    capture = cv2.VideoCapture(path)
    fps = capture.get(cv2.CAP_PROP_FPS) or 30
    frame_count = int(capture.get(cv2.CAP_PROP_FRAME_COUNT))
    width = int(capture.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(capture.get(cv2.CAP_PROP_FRAME_HEIGHT))
    print(f"{name}: {width}x{height}, {frame_count / fps:.2f}s")

    cells = []
    for index in range(6):
        frame_number = int(frame_count * index / 5)
        capture.set(cv2.CAP_PROP_POS_FRAMES, frame_number)
        ok, frame = capture.read()
        if not ok:
            continue
        scale = min(560 / frame.shape[1], 420 / frame.shape[0])
        image = cv2.resize(frame, (int(frame.shape[1] * scale), int(frame.shape[0] * scale)))
        cell = 255 * __import__('numpy').ones((470, 580, 3), dtype='uint8')
        top = 28 + (420 - image.shape[0]) // 2
        left = (580 - image.shape[1]) // 2
        cell[top:top + image.shape[0], left:left + image.shape[1]] = image
        cv2.putText(cell, f"{name} - {frame_number / fps:.1f}s", (12, 18), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (0, 0, 0), 1, cv2.LINE_AA)
        cells.append(cell)
    capture.release()

    sheet = 233 * __import__('numpy').ones((1410, 1160, 3), dtype='uint8')
    for index, cell in enumerate(cells):
        sheet[(index // 2) * 470:(index // 2 + 1) * 470, (index % 2) * 580:(index % 2 + 1) * 580] = cell
    cv2.imwrite(f"video_review/{name}.jpg", sheet, [int(cv2.IMWRITE_JPEG_QUALITY), 88])
