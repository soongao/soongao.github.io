---
title: Read Media - opencv cv2 tutorial chapter1
# date: YYYY-MM-DD HH:MM:SS +/-TTTT
categories: [dl, opencv]
tags: [opencv]     # TAG names should always be lowercase
# toc: false
---

# chapter1

```python
import cv2

# img = cv2.imread('Resources/lena.png')
#
#
# cv2.imshow('img', img)
# cv2.waitKey(0)

crap = cv2.VideoCapture('Resources/test_video.mp4')

while True:
    flag, img = crap.read()
    cv2.imshow('video', img)
    if (cv2.waitKey(1)&0xFF) == ord('q'):
        break
```
