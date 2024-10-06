---
title: Yolo v3 Principle Introduction
# date: YYYY-MM-DD HH:MM:SS +/-TTTT
categories: [CV, OD]
tags: [OD, yolo]     # TAG names should always be lowercase
# toc: false
---

# Yolo-v3

## Model structure
![model structure](/assets/img/yolo-v3-files/yolov3_model_structure.jpeg)
- **`Yolo v3 Model Structure Code Snippet`**
<details>
<summary>模型结构summary可视化</summary>
<pre><code>
----------------------------------------------------------------
        Layer (type)               Output Shape         Param #
================================================================
            Conv2d-1         [-1, 32, 416, 416]             864
       BatchNorm2d-2         [-1, 32, 416, 416]              64
         LeakyReLU-3         [-1, 32, 416, 416]               0
          CNNBlock-4         [-1, 32, 416, 416]               0
            Conv2d-5         [-1, 64, 208, 208]          18,432
       BatchNorm2d-6         [-1, 64, 208, 208]             128
         LeakyReLU-7         [-1, 64, 208, 208]               0
          CNNBlock-8         [-1, 64, 208, 208]               0
            Conv2d-9         [-1, 32, 208, 208]           2,048
      BatchNorm2d-10         [-1, 32, 208, 208]              64
        LeakyReLU-11         [-1, 32, 208, 208]               0
         CNNBlock-12         [-1, 32, 208, 208]               0
           Conv2d-13         [-1, 64, 208, 208]          18,432
      BatchNorm2d-14         [-1, 64, 208, 208]             128
        LeakyReLU-15         [-1, 64, 208, 208]               0
         CNNBlock-16         [-1, 64, 208, 208]               0
          ResUnit-17         [-1, 64, 208, 208]               0
         ResBlock-18         [-1, 64, 208, 208]               0
           Conv2d-19        [-1, 128, 104, 104]          73,728
      BatchNorm2d-20        [-1, 128, 104, 104]             256
        LeakyReLU-21        [-1, 128, 104, 104]               0
         CNNBlock-22        [-1, 128, 104, 104]               0
           Conv2d-23         [-1, 64, 104, 104]           8,192
      BatchNorm2d-24         [-1, 64, 104, 104]             128
        LeakyReLU-25         [-1, 64, 104, 104]               0
         CNNBlock-26         [-1, 64, 104, 104]               0
           Conv2d-27        [-1, 128, 104, 104]          73,728
      BatchNorm2d-28        [-1, 128, 104, 104]             256
        LeakyReLU-29        [-1, 128, 104, 104]               0
         CNNBlock-30        [-1, 128, 104, 104]               0
          ResUnit-31        [-1, 128, 104, 104]               0
           Conv2d-32         [-1, 64, 104, 104]           8,192
      BatchNorm2d-33         [-1, 64, 104, 104]             128
        LeakyReLU-34         [-1, 64, 104, 104]               0
         CNNBlock-35         [-1, 64, 104, 104]               0
           Conv2d-36        [-1, 128, 104, 104]          73,728
      BatchNorm2d-37        [-1, 128, 104, 104]             256
        LeakyReLU-38        [-1, 128, 104, 104]               0
         CNNBlock-39        [-1, 128, 104, 104]               0
          ResUnit-40        [-1, 128, 104, 104]               0
         ResBlock-41        [-1, 128, 104, 104]               0
           Conv2d-42          [-1, 256, 52, 52]         294,912
      BatchNorm2d-43          [-1, 256, 52, 52]             512
        LeakyReLU-44          [-1, 256, 52, 52]               0
         CNNBlock-45          [-1, 256, 52, 52]               0
           Conv2d-46          [-1, 128, 52, 52]          32,768
      BatchNorm2d-47          [-1, 128, 52, 52]             256
        LeakyReLU-48          [-1, 128, 52, 52]               0
         CNNBlock-49          [-1, 128, 52, 52]               0
           Conv2d-50          [-1, 256, 52, 52]         294,912
      BatchNorm2d-51          [-1, 256, 52, 52]             512
        LeakyReLU-52          [-1, 256, 52, 52]               0
         CNNBlock-53          [-1, 256, 52, 52]               0
          ResUnit-54          [-1, 256, 52, 52]               0
           Conv2d-55          [-1, 128, 52, 52]          32,768
      BatchNorm2d-56          [-1, 128, 52, 52]             256
        LeakyReLU-57          [-1, 128, 52, 52]               0
         CNNBlock-58          [-1, 128, 52, 52]               0
           Conv2d-59          [-1, 256, 52, 52]         294,912
      BatchNorm2d-60          [-1, 256, 52, 52]             512
        LeakyReLU-61          [-1, 256, 52, 52]               0
         CNNBlock-62          [-1, 256, 52, 52]               0
          ResUnit-63          [-1, 256, 52, 52]               0
           Conv2d-64          [-1, 128, 52, 52]          32,768
      BatchNorm2d-65          [-1, 128, 52, 52]             256
        LeakyReLU-66          [-1, 128, 52, 52]               0
         CNNBlock-67          [-1, 128, 52, 52]               0
           Conv2d-68          [-1, 256, 52, 52]         294,912
      BatchNorm2d-69          [-1, 256, 52, 52]             512
        LeakyReLU-70          [-1, 256, 52, 52]               0
         CNNBlock-71          [-1, 256, 52, 52]               0
          ResUnit-72          [-1, 256, 52, 52]               0
           Conv2d-73          [-1, 128, 52, 52]          32,768
      BatchNorm2d-74          [-1, 128, 52, 52]             256
        LeakyReLU-75          [-1, 128, 52, 52]               0
         CNNBlock-76          [-1, 128, 52, 52]               0
           Conv2d-77          [-1, 256, 52, 52]         294,912
      BatchNorm2d-78          [-1, 256, 52, 52]             512
        LeakyReLU-79          [-1, 256, 52, 52]               0
         CNNBlock-80          [-1, 256, 52, 52]               0
          ResUnit-81          [-1, 256, 52, 52]               0
           Conv2d-82          [-1, 128, 52, 52]          32,768
      BatchNorm2d-83          [-1, 128, 52, 52]             256
        LeakyReLU-84          [-1, 128, 52, 52]               0
         CNNBlock-85          [-1, 128, 52, 52]               0
           Conv2d-86          [-1, 256, 52, 52]         294,912
      BatchNorm2d-87          [-1, 256, 52, 52]             512
        LeakyReLU-88          [-1, 256, 52, 52]               0
         CNNBlock-89          [-1, 256, 52, 52]               0
          ResUnit-90          [-1, 256, 52, 52]               0
           Conv2d-91          [-1, 128, 52, 52]          32,768
      BatchNorm2d-92          [-1, 128, 52, 52]             256
        LeakyReLU-93          [-1, 128, 52, 52]               0
         CNNBlock-94          [-1, 128, 52, 52]               0
           Conv2d-95          [-1, 256, 52, 52]         294,912
      BatchNorm2d-96          [-1, 256, 52, 52]             512
        LeakyReLU-97          [-1, 256, 52, 52]               0
         CNNBlock-98          [-1, 256, 52, 52]               0
          ResUnit-99          [-1, 256, 52, 52]               0
          Conv2d-100          [-1, 128, 52, 52]          32,768
     BatchNorm2d-101          [-1, 128, 52, 52]             256
       LeakyReLU-102          [-1, 128, 52, 52]               0
        CNNBlock-103          [-1, 128, 52, 52]               0
          Conv2d-104          [-1, 256, 52, 52]         294,912
     BatchNorm2d-105          [-1, 256, 52, 52]             512
       LeakyReLU-106          [-1, 256, 52, 52]               0
        CNNBlock-107          [-1, 256, 52, 52]               0
         ResUnit-108          [-1, 256, 52, 52]               0
          Conv2d-109          [-1, 128, 52, 52]          32,768
     BatchNorm2d-110          [-1, 128, 52, 52]             256
       LeakyReLU-111          [-1, 128, 52, 52]               0
        CNNBlock-112          [-1, 128, 52, 52]               0
          Conv2d-113          [-1, 256, 52, 52]         294,912
     BatchNorm2d-114          [-1, 256, 52, 52]             512
       LeakyReLU-115          [-1, 256, 52, 52]               0
        CNNBlock-116          [-1, 256, 52, 52]               0
         ResUnit-117          [-1, 256, 52, 52]               0
        ResBlock-118          [-1, 256, 52, 52]               0
          Conv2d-119          [-1, 512, 26, 26]       1,179,648
     BatchNorm2d-120          [-1, 512, 26, 26]           1,024
       LeakyReLU-121          [-1, 512, 26, 26]               0
        CNNBlock-122          [-1, 512, 26, 26]               0
          Conv2d-123          [-1, 256, 26, 26]         131,072
     BatchNorm2d-124          [-1, 256, 26, 26]             512
       LeakyReLU-125          [-1, 256, 26, 26]               0
        CNNBlock-126          [-1, 256, 26, 26]               0
          Conv2d-127          [-1, 512, 26, 26]       1,179,648
     BatchNorm2d-128          [-1, 512, 26, 26]           1,024
       LeakyReLU-129          [-1, 512, 26, 26]               0
        CNNBlock-130          [-1, 512, 26, 26]               0
         ResUnit-131          [-1, 512, 26, 26]               0
          Conv2d-132          [-1, 256, 26, 26]         131,072
     BatchNorm2d-133          [-1, 256, 26, 26]             512
       LeakyReLU-134          [-1, 256, 26, 26]               0
        CNNBlock-135          [-1, 256, 26, 26]               0
          Conv2d-136          [-1, 512, 26, 26]       1,179,648
     BatchNorm2d-137          [-1, 512, 26, 26]           1,024
       LeakyReLU-138          [-1, 512, 26, 26]               0
        CNNBlock-139          [-1, 512, 26, 26]               0
         ResUnit-140          [-1, 512, 26, 26]               0
          Conv2d-141          [-1, 256, 26, 26]         131,072
     BatchNorm2d-142          [-1, 256, 26, 26]             512
       LeakyReLU-143          [-1, 256, 26, 26]               0
        CNNBlock-144          [-1, 256, 26, 26]               0
          Conv2d-145          [-1, 512, 26, 26]       1,179,648
     BatchNorm2d-146          [-1, 512, 26, 26]           1,024
       LeakyReLU-147          [-1, 512, 26, 26]               0
        CNNBlock-148          [-1, 512, 26, 26]               0
         ResUnit-149          [-1, 512, 26, 26]               0
          Conv2d-150          [-1, 256, 26, 26]         131,072
     BatchNorm2d-151          [-1, 256, 26, 26]             512
       LeakyReLU-152          [-1, 256, 26, 26]               0
        CNNBlock-153          [-1, 256, 26, 26]               0
          Conv2d-154          [-1, 512, 26, 26]       1,179,648
     BatchNorm2d-155          [-1, 512, 26, 26]           1,024
       LeakyReLU-156          [-1, 512, 26, 26]               0
        CNNBlock-157          [-1, 512, 26, 26]               0
         ResUnit-158          [-1, 512, 26, 26]               0
          Conv2d-159          [-1, 256, 26, 26]         131,072
     BatchNorm2d-160          [-1, 256, 26, 26]             512
       LeakyReLU-161          [-1, 256, 26, 26]               0
        CNNBlock-162          [-1, 256, 26, 26]               0
          Conv2d-163          [-1, 512, 26, 26]       1,179,648
     BatchNorm2d-164          [-1, 512, 26, 26]           1,024
       LeakyReLU-165          [-1, 512, 26, 26]               0
        CNNBlock-166          [-1, 512, 26, 26]               0
         ResUnit-167          [-1, 512, 26, 26]               0
          Conv2d-168          [-1, 256, 26, 26]         131,072
     BatchNorm2d-169          [-1, 256, 26, 26]             512
       LeakyReLU-170          [-1, 256, 26, 26]               0
        CNNBlock-171          [-1, 256, 26, 26]               0
          Conv2d-172          [-1, 512, 26, 26]       1,179,648
     BatchNorm2d-173          [-1, 512, 26, 26]           1,024
       LeakyReLU-174          [-1, 512, 26, 26]               0
        CNNBlock-175          [-1, 512, 26, 26]               0
         ResUnit-176          [-1, 512, 26, 26]               0
          Conv2d-177          [-1, 256, 26, 26]         131,072
     BatchNorm2d-178          [-1, 256, 26, 26]             512
       LeakyReLU-179          [-1, 256, 26, 26]               0
        CNNBlock-180          [-1, 256, 26, 26]               0
          Conv2d-181          [-1, 512, 26, 26]       1,179,648
     BatchNorm2d-182          [-1, 512, 26, 26]           1,024
       LeakyReLU-183          [-1, 512, 26, 26]               0
        CNNBlock-184          [-1, 512, 26, 26]               0
         ResUnit-185          [-1, 512, 26, 26]               0
          Conv2d-186          [-1, 256, 26, 26]         131,072
     BatchNorm2d-187          [-1, 256, 26, 26]             512
       LeakyReLU-188          [-1, 256, 26, 26]               0
        CNNBlock-189          [-1, 256, 26, 26]               0
          Conv2d-190          [-1, 512, 26, 26]       1,179,648
     BatchNorm2d-191          [-1, 512, 26, 26]           1,024
       LeakyReLU-192          [-1, 512, 26, 26]               0
        CNNBlock-193          [-1, 512, 26, 26]               0
         ResUnit-194          [-1, 512, 26, 26]               0
        ResBlock-195          [-1, 512, 26, 26]               0
          Conv2d-196         [-1, 1024, 13, 13]       4,718,592
     BatchNorm2d-197         [-1, 1024, 13, 13]           2,048
       LeakyReLU-198         [-1, 1024, 13, 13]               0
        CNNBlock-199         [-1, 1024, 13, 13]               0
          Conv2d-200          [-1, 512, 13, 13]         524,288
     BatchNorm2d-201          [-1, 512, 13, 13]           1,024
       LeakyReLU-202          [-1, 512, 13, 13]               0
        CNNBlock-203          [-1, 512, 13, 13]               0
          Conv2d-204         [-1, 1024, 13, 13]       4,718,592
     BatchNorm2d-205         [-1, 1024, 13, 13]           2,048
       LeakyReLU-206         [-1, 1024, 13, 13]               0
        CNNBlock-207         [-1, 1024, 13, 13]               0
         ResUnit-208         [-1, 1024, 13, 13]               0
          Conv2d-209          [-1, 512, 13, 13]         524,288
     BatchNorm2d-210          [-1, 512, 13, 13]           1,024
       LeakyReLU-211          [-1, 512, 13, 13]               0
        CNNBlock-212          [-1, 512, 13, 13]               0
          Conv2d-213         [-1, 1024, 13, 13]       4,718,592
     BatchNorm2d-214         [-1, 1024, 13, 13]           2,048
       LeakyReLU-215         [-1, 1024, 13, 13]               0
        CNNBlock-216         [-1, 1024, 13, 13]               0
         ResUnit-217         [-1, 1024, 13, 13]               0
          Conv2d-218          [-1, 512, 13, 13]         524,288
     BatchNorm2d-219          [-1, 512, 13, 13]           1,024
       LeakyReLU-220          [-1, 512, 13, 13]               0
        CNNBlock-221          [-1, 512, 13, 13]               0
          Conv2d-222         [-1, 1024, 13, 13]       4,718,592
     BatchNorm2d-223         [-1, 1024, 13, 13]           2,048
       LeakyReLU-224         [-1, 1024, 13, 13]               0
        CNNBlock-225         [-1, 1024, 13, 13]               0
         ResUnit-226         [-1, 1024, 13, 13]               0
          Conv2d-227          [-1, 512, 13, 13]         524,288
     BatchNorm2d-228          [-1, 512, 13, 13]           1,024
       LeakyReLU-229          [-1, 512, 13, 13]               0
        CNNBlock-230          [-1, 512, 13, 13]               0
          Conv2d-231         [-1, 1024, 13, 13]       4,718,592
     BatchNorm2d-232         [-1, 1024, 13, 13]           2,048
       LeakyReLU-233         [-1, 1024, 13, 13]               0
        CNNBlock-234         [-1, 1024, 13, 13]               0
         ResUnit-235         [-1, 1024, 13, 13]               0
        ResBlock-236         [-1, 1024, 13, 13]               0
          Conv2d-237          [-1, 512, 13, 13]         524,288
     BatchNorm2d-238          [-1, 512, 13, 13]           1,024
       LeakyReLU-239          [-1, 512, 13, 13]               0
        CNNBlock-240          [-1, 512, 13, 13]               0
         ConvSet-241          [-1, 512, 13, 13]               0
          Conv2d-242         [-1, 1024, 13, 13]       4,718,592
     BatchNorm2d-243         [-1, 1024, 13, 13]           2,048
       LeakyReLU-244         [-1, 1024, 13, 13]               0
        CNNBlock-245         [-1, 1024, 13, 13]               0
          Conv2d-246           [-1, 75, 13, 13]          76,875
 ScalePrediction-247        [-1, 3, 13, 13, 25]               0
          Conv2d-248          [-1, 256, 13, 13]         131,072
     BatchNorm2d-249          [-1, 256, 13, 13]             512
       LeakyReLU-250          [-1, 256, 13, 13]               0
        CNNBlock-251          [-1, 256, 13, 13]               0
        Upsample-252          [-1, 256, 26, 26]               0
          Conv2d-253          [-1, 256, 26, 26]         196,608
     BatchNorm2d-254          [-1, 256, 26, 26]             512
       LeakyReLU-255          [-1, 256, 26, 26]               0
        CNNBlock-256          [-1, 256, 26, 26]               0
         ConvSet-257          [-1, 256, 26, 26]               0
NeckAndConcatNet-258          [-1, 256, 26, 26]               0
          Conv2d-259          [-1, 512, 26, 26]       1,179,648
     BatchNorm2d-260          [-1, 512, 26, 26]           1,024
       LeakyReLU-261          [-1, 512, 26, 26]               0
        CNNBlock-262          [-1, 512, 26, 26]               0
          Conv2d-263           [-1, 75, 26, 26]          38,475
 ScalePrediction-264        [-1, 3, 26, 26, 25]               0
          Conv2d-265          [-1, 128, 26, 26]          32,768
     BatchNorm2d-266          [-1, 128, 26, 26]             256
       LeakyReLU-267          [-1, 128, 26, 26]               0
        CNNBlock-268          [-1, 128, 26, 26]               0
        Upsample-269          [-1, 128, 52, 52]               0
          Conv2d-270          [-1, 128, 52, 52]          49,152
     BatchNorm2d-271          [-1, 128, 52, 52]             256
       LeakyReLU-272          [-1, 128, 52, 52]               0
        CNNBlock-273          [-1, 128, 52, 52]               0
         ConvSet-274          [-1, 128, 52, 52]               0
NeckAndConcatNet-275          [-1, 128, 52, 52]               0
          Conv2d-276          [-1, 256, 52, 52]         294,912
     BatchNorm2d-277          [-1, 256, 52, 52]             512
       LeakyReLU-278          [-1, 256, 52, 52]               0
        CNNBlock-279          [-1, 256, 52, 52]               0
          Conv2d-280           [-1, 75, 52, 52]          19,275
 ScalePrediction-281        [-1, 3, 52, 52, 25]               0
================================================================
Total params: 47,852,737
Trainable params: 47,852,737
Non-trainable params: 0
----------------------------------------------------------------
Input size (MB): 1.98
Forward/backward pass size (MB): 1226.01
Params size (MB): 182.54
Estimated Total Size (MB): 1410.53
----------------------------------------------------------------
</code></pre>
</details>


## Shape of prediction and target
- **prediction**
  - *head1*: torch.Size([bs, 3, S, S, 5+cls])
  - *head2*: torch.Size([bs, 3, S, S, 5+cls])
  - *head3*: torch.Size([bs, 3, S, S, 5+cls])
    - S为(13, 26, 52)
    - len(c, x, y, w, h) == 5
    - c为置信度, 代表有样本的可能性, BCEWithLogitsLoss(c_p, c_t)
    - 输出的cls为总类别数, CrossEntropyLoss(cls, label)
- **target**
  - *scale1*: torch.Size([bs, 3, S, S, 6])
  - *scale2*: torch.Size([bs, 3, S, S, 6])
  - *scale3*: torch.Size([bs, 3, S, S, 6])
    - len(c, x, y, w, h, label) == 6
    - c为(-1,0,1), 分别代表(忽略样本, 负样本, 正样本)


## Difference between all kinds of box
- **ground truth**
  - 一个image可能有若干bbox, each bbox shape is [label, x, y, w, h]
  - 这里的xywh不论是归一化的值还是原始值, 都是相对于image的size
- **grid cell**
  - 三种size的grid cell对应三个检测head
  - size = [32, 16, 8] -> [IMAGE_SIZE//13, IMAGE_SIZE//26, IMAGE_SIZE//52]
- **grid与image的对应**
    ![对应示例](/assets/img/yolo-v3-files/grid_vs_image.png)
- **anchor box**
  - 每个grid cell有三种不同scale的anchor, 有三种size的grid cell, 共有9种anchor
  - anchor应该为(3, 2), 3种scale, len(w,h) == 2
  - 每个anchor shape is [w, h], anchor只关心wh, 对ground truth shape的先验知识
  - anchor的wh不论归一化与否, 都是相对于image的size
- **prediction box (feature map)**
  - model产生出来的值xywh, 试作完全随机值(值域为R), 只是希望model在训练后能接近真实值(非原始数值量纲)
  - xywh在算loss时进行mapping, 映射到一个值域小的范围, 保持训练稳定
    ![mapping](/assets/img/yolo-v3-files/bias_mapping.png)
  - S(13, 26, 52)就是feature map大小
    - grid cell  size = IMAGE SIZE // feature map S


## Sample Types
- **正样本**
  - truth box与anchor计算iou后, 最大的iou对应的anchor, 与truth box关联, 记为正样本
- **负样本**
  - iou小于threshold的所有anchor
- **忽略样本**
  - iou大于threshold, 但不是正样本的其他anchor


## Range of xywh values and How they mapping
- **`Yolo v3 Dataset Code Snippet`**
- **ground truth -`preprocess`-> target**
  - 每一个ground truth bbox将与每种scale的一个anchor对应, 并用target记录
    - 如果落在大的grid中必然也在小的grid中, 一共与三个anchor关联,
    - 后续操作仅以一次关联示例
  - 计算iou(bbox, anchor), 这里iou只关心wh, 将bbox和anchor的中心点叠到一起
    - iou最大的标记为正样本
  - target的一个scale就表示对应的anchor总数, anchor num == 3xSxS
    - 3表示anchor scale, SxS表示grid的坐标i,j
    - 关联的正样本在对应target中记录处理后的xywh
  - truth bbox的w,h需归一化到SxS
  - truth bbox的x,y需归一化到0-1, 归一化后是相对于一个grid内部
    - x,y先归一化到SxS, 相当于feature map与image的映射
    - grid的坐标i,j = 下取整(x, y)
    - 归一化到相对于grid内部0-1, x, y = x-i, y-j
  - target[:, :, i, j, xywh] = xywh, target[:, :, i, j, label] = bbox label
- **prediction box (feature map)**
  - prediction[:, :, i, j, xywh]和target[:, :, i, j, xywh]是位置对应的
    - 后续操作仅以任意某位置示例
  - x_t, y_t是相对grid内部0-1的, x_p, y_p是随机值
    - 将x_p, y_p做sigmod, 相当于把值域R映射到了值域0-1
    - 优化目标就是sigmod(x_p, y_p)尽可能接近(x_t, y_t)
  - w_p, h_p是随机值, w_t, h_t是理想中与关联anchor的wh接近的值, 范围在SxS
    - w_t, h_t = (w_anchor x ratio_w, h_anchor x ratio_h)
    - 优化目标是exp(w_p, h_p)尽可能接近(ratio_w, ratio_h)
      - 等价于(w_p, h_p)尽可能接近log(ratio_w, ratio_h)
        - 但ratio_w, ratio_h是未知的
    - 优化目标最终为exp(w_p, h_p) x (anchor wh)尽可能接近(w_t, h_t)
      - (w_p, h_p)尽可能接近log((w_t, h_t) / (anchor wh))


## yolo-v3 loss function
![loss formula](/assets/img/yolo-v3-files/loss_formula.png)
- **`Yolo v3 Loss Code Snippet`**
- **noobj loss**
  - 负样本对应的grid计算noobj loss
    - 负样本c为0
  - BCEWithLogitsLoss(c_p, c_t)
- **obj loss**
  - 正样本对应的grid计算obj loss
    - 正样本c为1
  - loss计算有两种策略
    - 当做二分类问题, c_t使用原始值1
    - 当做回归问题, 使用iou作为c_t
      - 将prediction映射成与target等价的predict box
        - pred xywh = sigmod(x,y), exp(w,h) x (anchor wh) <--> target xywh
- **box loss**
  - pred box与target的xywh做回归
  - pred xywh = sigmod(x,y), wh <--> target xy, log((w,h) / (anchor wh))
- **cls loss**
  - CrossEntropyLoss(cls, label)