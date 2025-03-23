---
title: Colour Detection And Trackbars - opencv cv2 tutorial chapter7 
# date: YYYY-MM-DD HH:MM:SS +/-TTTT
categories: [dl, opencv]
tags: [opencv]     # TAG names should always be lowercase
# toc: false
---

# chapter7

```python
import cv2
import numpy as np
from cv2tools import stackImages


def fun(x):
    pass


cv2.namedWindow("bars")
cv2.resizeWindow("bars", 500, 300)

cv2.createTrackbar("hue min", "bars", 0, 179, fun)
cv2.createTrackbar("hue max", "bars", 179, 179, fun)
cv2.createTrackbar("sat min", "bars", 125, 255, fun)
cv2.createTrackbar("sat max", "bars", 255, 255, fun)
cv2.createTrackbar("val min", "bars", 76, 255, fun)
cv2.createTrackbar("val max", "bars", 255, 255, fun)

while True:
    img = cv2.imread('Resources/lambo.PNG')
    img_hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    h_min = cv2.getTrackbarPos("hue min", "bars")
    h_max = cv2.getTrackbarPos("hue max", "bars")
    s_min = cv2.getTrackbarPos("sat min", "bars")
    s_max = cv2.getTrackbarPos("sat max", "bars")
    v_min = cv2.getTrackbarPos("val min", "bars")
    v_max = cv2.getTrackbarPos("val max", "bars")
    print(h_min, h_max, s_min, s_max, v_min, v_max)

    lower = np.array([h_min, s_min, v_min])
    upper = np.array([h_max, s_max, v_max])

    # cv2.inRange创建只包含lowerb到upperb的二值图像
    mask = cv2.inRange(img_hsv, lower, upper)
    img_result = cv2.bitwise_and(img, img, mask=mask)

    img_stack = stackImages(0.6, ([img, img_hsv], [mask, img_result]))
    cv2.imshow('stack', img_stack)
    cv2.waitKey(1)

```
