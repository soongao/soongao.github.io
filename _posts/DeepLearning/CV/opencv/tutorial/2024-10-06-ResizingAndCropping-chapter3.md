---
title: Resizing And Cropping - opencv cv2 tutorial chapter3
# date: YYYY-MM-DD HH:MM:SS +/-TTTT
categories: [dl, opencv]
tags: [opencv]     # TAG names should always be lowercase
# toc: false
---

# chapter3

```python
import cv2


img = cv2.imread('Resources/lambo.PNG')
print(img.shape)

img_resize = cv2.resize(img, (200, 300))
print(img_resize.shape)

img_crop = img[0:200, 200:500]

cv2.imshow('img', img)
cv2.imshow('resize', img_resize)
cv2.imshow('crop', img_crop)

cv2.waitKey(0)
```
