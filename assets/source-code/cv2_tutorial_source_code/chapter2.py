import cv2
import numpy as np
from cv2tools import stackImages

img = cv2.imread('Resources/lena.png')

gray_img = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
blur_img = cv2.GaussianBlur(gray_img, (5,5), 0)

kernel = np.ones((5,5), np.uint8)

canny_img = cv2.Canny(blur_img, 150, 200)
dilation_img = cv2.dilate(canny_img, kernel, iterations=1)
erode_img = cv2.erode(dilation_img, kernel, iterations=1)


result_img = stackImages(0.5, ([img, gray_img, blur_img],[canny_img, dilation_img, erode_img]))

cv2.imshow('rst', result_img)
cv2.waitKey(0)