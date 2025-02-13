---
title: Number plate Detection - opencv cv2 tutorial project3
# date: YYYY-MM-DD HH:MM:SS +/-TTTT
categories: [CV, opencv]
tags: [cv2]     # TAG names should always be lowercase
# toc: false
---


# project3

```python
import cv2
import numpy as np
from cv2tools import stackImages

paths = ['Resources/p1.jpg', 'Resources/p2.jpg', 'Resources/p3.jpg']
idx = 0
nPlateCascade = cv2.CascadeClassifier('Resources/haarcascade_russian_plate_number.xml')
color = (255, 0, 0)
savedPath = 'Resources/Scanned'
width, height = 680, 540

while True:
    img = cv2.imread(paths[idx])
    img = cv2.resize(img, (width, height))
    imgGray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    nPlates = nPlateCascade.detectMultiScale(imgGray, scaleFactor=1.1, minNeighbors=4)
    subImg = img.copy()
    for x, y, w, h in nPlates:
        cv2.rectangle(img, (x, y), (x + w, y + h), color, 2)
        subImg = img[y:y + h, x:x + w]

    cv2.imshow(f'{idx}', img)
    cv2.imshow(f'{idx} sub', subImg)

    key = cv2.waitKey(1) & 0xFF
    if key == ord('n'):
        cv2.destroyAllWindows()
        idx = (idx + 1) % len(paths)
    elif key == ord('q'):
        break
    elif key == ord('s'):
        cv2.imwrite(f'{savedPath}/nPlate{idx}.jpg', subImg)
        cv2.rectangle(img, (0,200), (680, 300), color, cv2.FILLED)
        cv2.putText(img, 'save', (300, 250), cv2.FONT_HERSHEY_SIMPLEX, 2, (255, 255, 255), 6)

        cv2.destroyAllWindows()
        cv2.imshow(f'{idx}', img)
        # cv2.imshow(f'{idx} sub', subImg)
        cv2.waitKey(500)


```
