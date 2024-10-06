import cv2
import numpy as np
from cv2tools import stackImages


def getContours(img):
    contours, hierarchy = cv2.findContours(img,cv2.RETR_EXTERNAL,cv2.CHAIN_APPROX_NONE)
    for cnt in  contours:
        area = cv2.contourArea(cnt)
        if area > 500:
            cv2.drawContours(img_copy, cnt, -1, (255, 0, 0), 3)
            arclen = cv2.arcLength(cnt, True)
            approx = cv2.approxPolyDP(cnt, 0.02 * arclen, True)
            print(len(approx))
            objCor = len(approx)
            x, y, w, h = cv2.boundingRect(approx)
            if objCor == 3:
                objectType = "Tri"
            elif objCor == 4:
                aspRatio = w / float(h)
                if aspRatio > 0.98 and aspRatio < 1.03:
                    objectType = "Square"
                else:
                    objectType = "Rectangle"
            elif objCor > 4:
                objectType = "Circles"
            else:
                objectType = "None"

            cv2.rectangle(img_copy, (x, y), (x + w, y + h), (0, 255, 0), 2)
            cv2.putText(img_copy, objectType,
                        (x + (w // 2) - 15, y + (h // 2) - 15), cv2.FONT_HERSHEY_COMPLEX, 0.6,
                        (0, 0, 0), 1)

img = cv2.imread('Resources/shapes.png')
img_copy = img.copy()
img_gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
img_blur = cv2.GaussianBlur(img_gray, (7,7), 1)
img_canny = cv2.Canny(img_blur, 30, 30)
img_blank = np.zeros((img.shape[0],img.shape[1]), np.uint8)

getContours(img_canny)

stack_img = stackImages(0.6, ([img, img_gray, img_blur], [img_canny, img_copy, img_blank]))

cv2.imshow('stack', stack_img)

cv2.waitKey(0)