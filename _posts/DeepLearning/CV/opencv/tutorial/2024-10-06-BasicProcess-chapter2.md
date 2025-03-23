---
title: Basic Process - opencv cv2 tutorial chapter2 
# date: YYYY-MM-DD HH:MM:SS +/-TTTT
categories: [dl, opencv]
tags: [opencv]     # TAG names should always be lowercase
# toc: false
---

# chapter2

```python
import cv2
import numpy as np


img = cv2.imread('Resources/lena.png')

gray_img = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
# cv2.GaussianBlur 第三个参数表示高斯的标准差 为0代表根据kernel size自动计算
blur_img = cv2.GaussianBlur(gray_img, (5,5), 0)

kernel = np.ones((5,5), np.uint8)

# cv2.Canny img必须gray 第二第三个参数代表threshold1和threshold2
# 高于threshold2为强边缘 threshold2到threshold1之间, 且与强边缘相连的像素为边缘 低于threshold1的不为边缘
canny_img = cv2.Canny(blur_img, 150, 200)

# cv2.dilate 图像边界扩展
# cv2.erode 图像边界收缩
dilation_img = cv2.dilate(canny_img, kernel, iterations=1)
erode_img = cv2.erode(dilation_img, kernel, iterations=1)


cv2.imshow('gray', gray_img)
cv2.imshow('blur', blur_img)
cv2.imshow('canny', canny_img)
cv2.imshow('dilation', dilation_img)
cv2.imshow('erode', erode_img)

cv2.waitKey(0)
```
