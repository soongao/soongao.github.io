---
title: Add Shapes - opencv cv2 tutorial chapter4 
# date: YYYY-MM-DD HH:MM:SS +/-TTTT
categories: [CV, opencv]
tags: [cv2]     # TAG names should always be lowercase
# toc: false
---

# chapter4

```python
import cv2
import numpy as np

img = np.zeros((512,512,3), np.uint8)
# img[:] = 255,0,0

cv2.line(img, (0,0), (img.shape[1],img.shape[0]), (0,255,0), 3)
cv2.rectangle(img, (0,0), (200,300), (0,0,255), cv2.FILLED)
cv2.circle(img, (300,100), 50, (255,0,0), 2)
cv2.putText(img, 'some words', (300,250), cv2.FONT_HERSHEY_SIMPLEX, 2, (255,255,255), 6)

cv2.imshow('img', img)

cv2.waitKey(0)
```
