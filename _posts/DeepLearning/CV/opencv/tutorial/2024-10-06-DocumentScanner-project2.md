---
title: Document Scanner - opencv cv2 tutorial project2
# date: YYYY-MM-DD HH:MM:SS +/-TTTT
categories: [dl, opencv]
tags: [opencv]     # TAG names should always be lowercase
# toc: false
---

# project2

```python
import cv2
import numpy as np
from cv2tools import stackImages

Width = 832
Height = 640


def preprocessing(img):
    gray_img = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    blur_img = cv2.GaussianBlur(gray_img, (5, 5), 0)
    kernel = np.ones((5, 5), np.uint8)
    canny_img = cv2.Canny(blur_img, 200, 200)
    dilation_img = cv2.dilate(canny_img, kernel, iterations=2)
    erode_img = cv2.erode(dilation_img, kernel, iterations=1)
    return erode_img


def getContours(img):
    contours, hierarchy = cv2.findContours(img, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    maxArea = 0
    biggest = None
    for cnt in contours:
        area = cv2.contourArea(cnt)
        if area > 500:
            # cv2.drawContours(imgCopy, cnt, -1, (255, 0, 0), 3)
            arclen = cv2.arcLength(cnt, True)
            approx = cv2.approxPolyDP(cnt, 0.02 * arclen, True)
            if area > maxArea and len(approx) == 4:
                maxArea = area
                biggest = approx
    cv2.drawContours(imgCopy, biggest, -1, (255,0,0), 30)
    return biggest


def wrap(img, contours):

    def reorder(contours):
        contours = contours.reshape(4, 2)
        generate = np.zeros((4,2), np.float32)
        sumArr = np.sum(contours, axis=1)
        generate[0] = contours[np.argmin(sumArr)]
        generate[3] = contours[np.argmax(sumArr)]
        diffArr = np.diff(contours, axis=1)
        generate[1] = contours[np.argmin(diffArr)]
        generate[2] = contours[np.argmax(diffArr)]
        return generate

    contours = reorder(contours)
    pst1 = np.float32(contours)
    pst2 = np.float32([[0, 0], [Width, 0], [0, Height], [Width, Height]])
    matrix = cv2.getPerspectiveTransform(pst1, pst2)
    imgWarp = cv2.warpPerspective(img, matrix, (Width, Height))
    return imgWarp


img = cv2.imread('Resources/paper.jpg')
img = cv2.resize(img, (Width, Height))
imgCopy = img.copy()
imgPreprocess = preprocessing(img)
biggest = getContours(imgPreprocess)
imgWrap = wrap(img, biggest)

imgRst = stackImages(0.5, ([img, imgPreprocess], [imgCopy, imgWrap]))

cv2.imshow('paper', imgRst)
cv2.waitKey(0)

```
