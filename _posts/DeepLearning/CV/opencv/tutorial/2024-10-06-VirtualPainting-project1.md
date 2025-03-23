---
title: Virtual Painting - opencv cv2 tutorial project1
# date: YYYY-MM-DD HH:MM:SS +/-TTTT
categories: [dl, opencv]
tags: [opencv]     # TAG names should always be lowercase
# toc: false
---

# project1

```python
import cv2
import numpy as np

frameWidth = 480
frameHeight = 560
cap = cv2.VideoCapture(0)
cap.set(3, frameWidth)
cap.set(4, frameHeight)
cap.set(10, 130)

config = {
    'colorMask': [[113, 103, 135, 179, 255, 255],
                  [30, 84, 79, 146, 255, 255],
                  [30, 84, 79, 146, 255, 255]],
    'colorVal': [[0, 0, 255],  # BGR
                 [255, 0, 0],
                 [255, 0, 0]],
    'points': []  # [x, y, colorIdx]
}


def findColor(img, masks, colors):
    imgHSV = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    points = []
    for idx, mask in enumerate(masks):
        lower = np.array(mask[0:3])
        upper = np.array(mask[3:6])
        maskImg = cv2.inRange(imgHSV, lower, upper)
        bboxs = findBbox(maskImg)
        for bbox in bboxs:
            cv2.circle(imgRst, (bbox[0], bbox[1]), 5, colors[idx], cv2.FILLED)
            points.append([bbox[0], bbox[1], idx])
    return points


def findBbox(img):
    contours, hierarchy = cv2.findContours(img, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    bboxs = []
    for cnt in contours:
        area = cv2.contourArea(cnt)
        if area > 250:
            arclen = cv2.arcLength(cnt, True)
            approx = cv2.approxPolyDP(cnt, 0.02 * arclen, True)
            x, y, w, h = cv2.boundingRect(approx)
            cv2.rectangle(imgRst, (x, y), (x + w, y + h), (255, 0, 0), 2)
            bboxs.append([(x+w)//2, y])
    return bboxs


def drawPoint(points, colors):
    for point in points:
        cv2.circle(imgRst, (point[0], point[1]), 5, colors[point[2]], cv2.FILLED)


while True:
    success, img = cap.read()
    imgRst = img.copy()
    points = findColor(img, config['colorMask'], config['colorVal'])
    # for point in points:
    #     config['points'].append(point)
    # drawPoint(config['points'], config['colorVal'])
    cv2.imshow("video", imgRst)
    if (cv2.waitKey(1) & 0xFF) == ord('q'):
        break

```
