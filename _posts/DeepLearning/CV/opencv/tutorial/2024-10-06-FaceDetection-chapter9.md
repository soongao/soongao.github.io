---
title: Face Detection - opencv cv2 tutorial chapter9
# date: YYYY-MM-DD HH:MM:SS +/-TTTT
categories: [CV, opencv]
tags: [cv2]     # TAG names should always be lowercase
# toc: false
---

# chapter9

```python
import cv2

# 基于Haar特征的分类器
faceCascade = cv2.CascadeClassifier('Resources/haarcascade_frontalface_default.xml')

img = cv2.imread('Resources/lena.png')
imgGray = cv2.cvtColor(img,cv2.COLOR_BGR2GRAY)

# 进行多尺度检测 作用于灰度图像
#   scaleFactor 每次缩放图像的比例因子
#   minNeighbors 每个候选矩形的邻近矩形的最小邻居数, 用于非极大值抑制
faces = faceCascade.detectMultiScale(imgGray, scaleFactor=1.1, minNeighbors=4)

for x,y,w,h in faces:
    cv2.rectangle(img, (x,y), (x+w,y+h), (255,0,0), 2)

cv2.imshow('img', img)
cv2.waitKey(0)
```
