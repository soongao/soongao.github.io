---
title: Cowboy Detection Jupyter Faster rcnn
# date: YYYY-MM-DD HH:MM:SS +/-TTTT
categories: [dl, object detection]
tags: [object detection, faster rcnn]     # TAG names should always be lowercase
# toc: false
---

# import packages


```python
!pip install pycocotools
!wget https://raw.githubusercontent.com/pytorch/vision/main/references/detection/engine.py
!wget https://raw.githubusercontent.com/pytorch/vision/main/references/detection/utils.py
!wget https://raw.githubusercontent.com/pytorch/vision/main/references/detection/coco_utils.py
!wget https://raw.githubusercontent.com/pytorch/vision/main/references/detection/coco_eval.py
!wget https://raw.githubusercontent.com/pytorch/vision/main/references/detection/transforms.py
```
    


```python
import torch
from torchvision.models.detection.faster_rcnn import fasterrcnn_resnet50_fpn, FasterRCNN, FastRCNNPredictor
from engine import train_one_epoch, evaluate
from torch.utils.data import Dataset, DataLoader, Subset
import os
from PIL import Image
from torchvision.transforms import v2 as T


from pycocotools.coco import COCO
```

# Dataset


```python
class CowBoyDataSet(Dataset):
    def __init__(self, coco, img_dir, transforms):
        self.coco = coco
        self.img_dir = img_dir
        self.transforms = transforms
        self.img_ids = list(sorted(coco.imgs.keys()))
        
    def __getitem__(self, idx):
        # 返回 img tensor, bbox, cat_id
        img_id = self.img_ids[idx]
        img_name = self.coco.loadImgs(img_id)[0]['file_name']
        img_path = os.path.join(self.img_dir, img_name)
        img = Image.open(img_path).convert("RGB")
        
        anno_ids = self.coco.getAnnIds(img_id)
        annos = self.coco.loadAnns(anno_ids)
        
        boxes = []
        labels = []
        areas = []
        iscrowds = []
        
        for anno in annos:
            # anno 中 box 为 x,y,w,h
            # vison 中 faster-rcnn box 为 x_min, y_min, x_max, y_max
            x_min, y_min, w, h = anno['bbox']
            x_max, y_max = x_min + w, y_min + h
            boxes.append([x_min, y_min, x_max, y_max])
            
            cat_id = anno['category_id']
            label = catid_2_label[cat_id]
            labels.append(label)
            areas.append(anno['area'])
            
            # 表示是否多个小物体聚在一起, false 为干净的单个物体
            iscrowds.append(anno['iscrowd'])
            
        img_id = torch.as_tensor([idx], dtype=torch.int64)
        boxes = torch.as_tensor(boxes, dtype=torch.float32)
        labels = torch.as_tensor(labels, dtype=torch.int64)
        areas = torch.tensor(areas)
        iscrowds = torch.tensor(iscrowds)
            
        # 训练中 model 只用到 boxes 和 labels，其他参数是给 coco 工具 evalueate 时用的
        targets = {
            'boxes': boxes,
            'labels': labels,
            'image_id': int(img_id),
            'area': areas,
            'iscrowd': iscrowds
        }
            
        if self.transforms is not None:
            img, targets = self.transforms(img, targets)
            
        return img, targets
            
        
        
    def __len__(self):
        return len(self.img_ids)

# 由于目标检测每张图片尺寸不一样，这个函数使得 dataloader 能过正确处理这种情况，否则会报错
def collate_fn(batch):
    return tuple(zip(*batch))

def get_transform(train):
    transforms = []
    transforms.append(T.ToTensor())
    if train:
        transforms.append(T.RandomHorizontalFlip(0.5))
    return T.Compose(transforms)
```

# config


```python
class config:
    coco =  COCO('/kaggle/input/cowboyoutfits/train.json')
    IMG_PATH = '/kaggle/input/cowboyoutfits/images'
    VAL_SIZE = 613
    NUM_WORKS = 2
    
    LR = 0.005
    MOMEMTUM = 0.9
    weight_decay = 0.0005
    EPOCH = 15
    STEP_SIZE = 3
    GAMMA = 0.1
    
    
cat_map = {v['id']: v['name'] for k,v in config.coco.cats.items()}
# 真实物体类别从1开始
catid_2_label = {cat_id: index + 1  for index, cat_id in enumerate(list(sorted(cat_map.keys())))}
label_2_catid = {v: k for k, v in catid_2_label.items()}
```

    loading annotations into memory...
    Done (t=0.04s)
    creating index...
    index created!
    

# Split Dataset

```python
# 这里训练集、验证集，每次运行都是随机划分的，如果需要固定划分便于继续训练，需要保存 indices
dataset_train = CowBoyDataSet(config.coco, config.IMG_PATH, get_transform(train=True))
dataset_eval = CowBoyDataSet(config.coco, config.IMG_PATH, get_transform(train=False))

indices = torch.randperm(len(dataset_train)).tolist()
dataset_train = Subset(dataset_train, indices[: -config.VAL_SIZE])
dataset_eval = Subset(dataset_eval, indices[-config.VAL_SIZE:])
```
    

# Dataloader

```python
train_loader = DataLoader(
    dataset_train, 2, shuffle=True, num_workers=config.NUM_WORKS, collate_fn=collate_fn)

val_loader = DataLoader(
    dataset_eval, 2, shuffle=False, num_workers=config.NUM_WORKS, collate_fn=collate_fn)
```


```python
for images, targets in train_loader:
    print(images[0].shape, targets[0])
    break
```

    torch.Size([3, 565, 1024]) {'boxes': tensor([[588.8000, 103.7800, 680.3200, 179.3700],
            [866.5600, 406.1300, 901.7600, 429.8300]]), 'labels': tensor([3, 3]), 'image_id': 2041, 'area': tensor([6917.9702,  834.3000]), 'iscrowd': tensor([False, False])}
    

# Model


```python
def get_model(num_class):
    fasterrcnn = fasterrcnn_resnet50_fpn(weights="DEFAULT")
    
    in_features = fasterrcnn.roi_heads.box_predictor.cls_score.in_features
    fasterrcnn.roi_heads.box_predictor = FastRCNNPredictor(in_features, num_class+1)
    return fasterrcnn
```


```python
device = torch.device('cuda:0') if torch.cuda.is_available() else torch.device('cpu')
```


```python
fasterrcnn = get_model(5).to(device)
```


```python
param = [p for p in fasterrcnn.parameters() if p.requires_grad]
optimizer = torch.optim.SGD(param, lr=config.LR, momentum=config.MOMEMTUM, weight_decay=config.weight_decay)
lr_scheduler = torch.optim.lr_scheduler.StepLR(optimizer, step_size=config.STEP_SIZE, gamma=config.GAMMA)
```

# Train and Eval


```python
for epoch in range(config.EPOCH):
    # train for one epoch, printing every 10 iterations
    train_one_epoch(fasterrcnn, optimizer, train_loader, device, epoch, print_freq=225)
    # update the learning rate
    lr_scheduler.step()
    # evaluate on the test dataset
    evaluate(fasterrcnn, val_loader, device=device)
```
    

    Epoch: [0]  [   0/1225]  eta: 0:54:38  lr: 0.000010  loss: 2.3367 (2.3367)  loss_classifier: 2.0731 (2.0731)  loss_box_reg: 0.0797 (0.0797)  loss_objectness: 0.1657 (0.1657)  loss_rpn_box_reg: 0.0182 (0.0182)  time: 2.6761  data: 0.1969  max mem: 2364
    Epoch: [0]  [ 225/1225]  eta: 0:09:59  lr: 0.001134  loss: 0.2126 (0.5220)  loss_classifier: 0.0864 (0.2973)  loss_box_reg: 0.0909 (0.1148)  loss_objectness: 0.0334 (0.0927)  loss_rpn_box_reg: 0.0056 (0.0171)  time: 0.6091  data: 0.0084  max mem: 4128
    Epoch: [0]  [ 450/1225]  eta: 0:07:58  lr: 0.002258  loss: 0.2499 (0.4043)  loss_classifier: 0.1113 (0.2027)  loss_box_reg: 0.0978 (0.1098)  loss_objectness: 0.0274 (0.0754)  loss_rpn_box_reg: 0.0078 (0.0164)  time: 0.6615  data: 0.0079  max mem: 4314
    Epoch: [0]  [ 675/1225]  eta: 0:05:40  lr: 0.003382  loss: 0.2278 (0.3743)  loss_classifier: 0.0910 (0.1747)  loss_box_reg: 0.0867 (0.1117)  loss_objectness: 0.0289 (0.0721)  loss_rpn_box_reg: 0.0049 (0.0158)  time: 0.6045  data: 0.0080  max mem: 4314
    Epoch: [0]  [ 900/1225]  eta: 0:03:22  lr: 0.004505  loss: 0.1977 (0.3444)  loss_classifier: 0.0619 (0.1548)  loss_box_reg: 0.0788 (0.1075)  loss_objectness: 0.0310 (0.0665)  loss_rpn_box_reg: 0.0065 (0.0156)  time: 0.6353  data: 0.0081  max mem: 4314
    Epoch: [0]  [1125/1225]  eta: 0:01:02  lr: 0.005000  loss: 0.2195 (0.3330)  loss_classifier: 0.1018 (0.1461)  loss_box_reg: 0.0816 (0.1073)  loss_objectness: 0.0228 (0.0641)  loss_rpn_box_reg: 0.0030 (0.0155)  time: 0.6108  data: 0.0086  max mem: 4314
    Epoch: [0]  [1224/1225]  eta: 0:00:00  lr: 0.005000  loss: 0.2440 (0.3281)  loss_classifier: 0.0905 (0.1421)  loss_box_reg: 0.1042 (0.1067)  loss_objectness: 0.0156 (0.0638)  loss_rpn_box_reg: 0.0080 (0.0155)  time: 0.6164  data: 0.0076  max mem: 4314
    Epoch: [0] Total time: 0:12:44 (0.6240 s / it)
    creating index...
    index created!
    Test:  [  0/307]  eta: 0:02:16  model_time: 0.2611 (0.2611)  evaluator_time: 0.0126 (0.0126)  time: 0.4431  data: 0.1613  max mem: 4314
    Test:  [100/307]  eta: 0:01:00  model_time: 0.2534 (0.2699)  evaluator_time: 0.0052 (0.0063)  time: 0.2939  data: 0.0090  max mem: 4314
    Test:  [200/307]  eta: 0:00:41  model_time: 0.2459 (0.2685)  evaluator_time: 0.0052 (0.1076)  time: 0.2846  data: 0.0086  max mem: 4314
    Test:  [300/307]  eta: 0:00:02  model_time: 0.2415 (0.2684)  evaluator_time: 0.0049 (0.0740)  time: 0.2700  data: 0.0085  max mem: 4314
    Test:  [306/307]  eta: 0:00:00  model_time: 0.2403 (0.2678)  evaluator_time: 0.0051 (0.0727)  time: 0.2607  data: 0.0081  max mem: 4314
    Test: Total time: 0:01:49 (0.3557 s / it)
    Averaged stats: model_time: 0.2403 (0.2678)  evaluator_time: 0.0051 (0.0727)
    Accumulating evaluation results...
    DONE (t=0.41s).
    IoU metric: bbox
     Average Precision  (AP) @[ IoU=0.50:0.95 | area=   all | maxDets=100 ] = 0.223
     Average Precision  (AP) @[ IoU=0.50      | area=   all | maxDets=100 ] = 0.476
     Average Precision  (AP) @[ IoU=0.75      | area=   all | maxDets=100 ] = 0.173
     Average Precision  (AP) @[ IoU=0.50:0.95 | area= small | maxDets=100 ] = 0.029
     Average Precision  (AP) @[ IoU=0.50:0.95 | area=medium | maxDets=100 ] = 0.101
     Average Precision  (AP) @[ IoU=0.50:0.95 | area= large | maxDets=100 ] = 0.269
     Average Recall     (AR) @[ IoU=0.50:0.95 | area=   all | maxDets=  1 ] = 0.213
     Average Recall     (AR) @[ IoU=0.50:0.95 | area=   all | maxDets= 10 ] = 0.367
     Average Recall     (AR) @[ IoU=0.50:0.95 | area=   all | maxDets=100 ] = 0.374
     Average Recall     (AR) @[ IoU=0.50:0.95 | area= small | maxDets=100 ] = 0.091
     Average Recall     (AR) @[ IoU=0.50:0.95 | area=medium | maxDets=100 ] = 0.246
     Average Recall     (AR) @[ IoU=0.50:0.95 | area= large | maxDets=100 ] = 0.418
    
