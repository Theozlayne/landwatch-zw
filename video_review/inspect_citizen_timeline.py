import cv2
import numpy as np

path = r"C:\Users\HP GB\Downloads\citizen.mp4"
capture = cv2.VideoCapture(path)
fps = capture.get(cv2.CAP_PROP_FPS) or 30
frame_count = int(capture.get(cv2.CAP_PROP_FRAME_COUNT))
cells = []

for seconds in range(0, 161, 10):
    capture.set(cv2.CAP_PROP_POS_FRAMES, min(frame_count - 1, int(seconds * fps)))
    ok, frame = capture.read()
    if not ok:
        continue
    scale = min(280 / frame.shape[1], 520 / frame.shape[0])
    image = cv2.resize(frame, (int(frame.shape[1] * scale), int(frame.shape[0] * scale)))
    cell = 240 * np.ones((560, 300, 3), dtype="uint8")
    top = 35 + (500 - image.shape[0]) // 2
    left = (300 - image.shape[1]) // 2
    cell[top:top + image.shape[0], left:left + image.shape[1]] = image
    cv2.putText(cell, f"{seconds}s", (12, 23), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 0), 1, cv2.LINE_AA)
    cells.append(cell)
capture.release()

sheet = 225 * np.ones((560 * 4, 300 * 5, 3), dtype="uint8")
for index, cell in enumerate(cells):
    row, column = divmod(index, 5)
    sheet[row * 560:(row + 1) * 560, column * 300:(column + 1) * 300] = cell
cv2.imwrite("video_review/citizen_timeline.jpg", sheet)
