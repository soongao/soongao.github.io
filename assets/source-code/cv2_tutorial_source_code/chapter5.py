import cv2
import numpy as np

img = cv2.imread('Resources/cards.jpg')

width, height = 250, 350
plt1 = np.float32([[111, 219], [287, 188], [154, 482], [352, 440]])
plt2 = np.float32([[0, 0], [width, 0], [0, height], [width, height]])

matrix = cv2.getPerspectiveTransform(plt1,plt2)

img_output = cv2.warpPerspective(img, matrix, (width, height))

cv2.imshow('cards', img)
cv2.imshow('output', img_output)

cv2.waitKey(0)
