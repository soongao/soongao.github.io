---
title: Faster rcnn Principle Introduction
# date: YYYY-MM-DD HH:MM:SS +/-TTTT
categories: [dl, object detection]
tags: [object detection, faster rcnn]     # TAG names should always be lowercase
# toc: false
---

# Faster RCNN

### two-stage
- 先通过RPN初步筛选质量还不错的proposal
- 再通过predict head微调


### Model Struct
- **Backbone + RPN + ROIPooling + PredictHead**
![faster rcnn struct](/assets/img/faster-rcnn-files/faster_rcnn_struct.png)

### RPN
- **RPNHead**
  - cls_logits -> (-1, num_anchors, 1)
    -  objectness的概率
  - box_pred -> (-1, num_anchors, 4)
    - xywh, 是预测出的是anchor与predict box之间的bias
- **AnchorGenerate**
  - 先验知识生成不同size和scale的anchors, (-1, num_anchors, 4)
    - xyxy格式, 是anchors在原图上的坐标
- **target**
  - 所有anchors与Ground Truth进行关联, 划分出正负样本
  - 记录anchors与Ground Truth的xywh格式下差的bias
  - ![bias mapping](/assets/img/faster-rcnn-files/faster_rcnn_bias_map.png)
- **RPN Loss**
  - cls loss
    - 二分类问题
  - box loss
    - 预测出的box_pred的bias与真实的bias做L1 Loss
    - pred bias与truth bias越接近越好
- **Proposal**
  - (-1, num_proposal, 4)
    - xyxy格式
    - 通过pred box的bias与Ground Truth进行计算得出
  - 与loss计算独立, 是在生成的所有anchors中, 通过IoU和NMS筛选后的anchors

### ROI Pooling
- **input**
  - 将proposal放到feature map上, 将proposal标识的这些位置的feature pieces提取出来
- **output**
  - 将不同大小的feature pieces变成相同的大小, 组成batch传入后面的网络中

### Predict Head
- **output**
  - cls_logits -> (-1, num_proposals, num_classes)
  - box_pred -> (-1, num_proposals, num_classes*4)
    - 给所有类别都预测了xywh的bias
- **loss**
  - 与RPN Loss基本相同, proposal与Ground Truth关联, 区分正负样本
  - 在计算box loss时, 取Ground Truth真实类别对应的pred box中的那4个值(t_xywh)计算loss