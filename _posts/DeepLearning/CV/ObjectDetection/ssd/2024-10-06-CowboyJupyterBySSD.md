---
title: Cowboy Detection Jupyter SSD
# date: YYYY-MM-DD HH:MM:SS +/-TTTT
categories: [dl, object detection]
tags: [object detection, ssd]     # TAG names should always be lowercase
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
from torch.utils.data import Dataset, DataLoader, Subset
import os
from PIL import Image
from torchvision.transforms import v2 as T
```


```python
from engine import train_one_epoch, evaluate
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
    EPOCH = 3
    STEP_SIZE = 3
    GAMMA = 0.1
    
    
cat_map = {v['id']: v['name'] for k,v in config.coco.cats.items()}
# 真实物体类别从1开始
catid_2_label = {cat_id: index + 1  for index, cat_id in enumerate(list(sorted(cat_map.keys())))}
label_2_catid = {v: k for k, v in catid_2_label.items()}
```

    

# Split Dataset
# Dataloader


```python
# 这里训练集、验证集，每次运行都是随机划分的，如果需要固定划分便于继续训练，需要保存 indices
dataset_train = CowBoyDataSet(config.coco, config.IMG_PATH, get_transform(train=True))
dataset_eval = CowBoyDataSet(config.coco, config.IMG_PATH, get_transform(train=False))

indices = torch.randperm(len(dataset_train)).tolist()
dataset_train = Subset(dataset_train, indices[: -config.VAL_SIZE])
dataset_eval = Subset(dataset_eval, indices[-config.VAL_SIZE:])
```

    


```python
train_loader = DataLoader(
    dataset_train, 4, shuffle=True, num_workers=config.NUM_WORKS, collate_fn=collate_fn, drop_last=True)

val_loader = DataLoader(
    dataset_eval, 4, shuffle=False, num_workers=config.NUM_WORKS, collate_fn=collate_fn, drop_last=True)
```

    

# Model


```python
from torchvision.models.detection import ssdlite320_mobilenet_v3_large, ssd300_vgg16
```


```python
!wget https://download.pytorch.org/models/ssdlite320_mobilenet_v3_large_coco-a79551df.pth
```



```python
def get_model(num_class):
    model = ssdlite320_mobilenet_v3_large(weights=None, num_classes=num_class)
    # Step 2, load the model state_dict and the default model's state_dict
    mstate_dict = model.state_dict()
    cstate_dict = torch.load('/kaggle/working/ssdlite320_mobilenet_v3_large_coco-a79551df.pth', map_location='cpu')
    # Step 3.
    for k in mstate_dict.keys():
        if mstate_dict[k].shape != cstate_dict[k].shape:
            print('key {} will be removed, orishape: {}, training shape: {}'.format(k, cstate_dict[k].shape, mstate_dict[k].shape))
            cstate_dict.pop(k)
    # Step 4.
    model.load_state_dict(cstate_dict, strict=False)
    return model
```


```python
model = get_model(6)
```


```python
device = torch.device('cuda:0') if torch.cuda.is_available() else torch.device('cpu')
```


```python
model.to(device)
```



```python
param = [p for p in model.parameters() if p.requires_grad]
optimizer = torch.optim.SGD(param, lr=config.LR, momentum=config.MOMEMTUM, weight_decay=config.weight_decay)
lr_scheduler = torch.optim.lr_scheduler.StepLR(optimizer, step_size=config.STEP_SIZE, gamma=config.GAMMA)
```

# Train and Eval


```python
for epoch in range(config.EPOCH):
    # train for one epoch, printing every 10 iterations
    train_one_epoch(model, optimizer, train_loader, device, epoch, print_freq=225)
    # update the learning rate
    lr_scheduler.step()
    # evaluate on the test dataset
    evaluate(model, val_loader, device=device)
```

    Epoch: [0]  [  0/612]  eta: 0:04:41  lr: 0.000013  loss: 15.8132 (15.8132)  bbox_regression: 3.8578 (3.8578)  classification: 11.9554 (11.9554)  time: 0.4603  data: 0.2584  max mem: 703
    Epoch: [0]  [225/612]  eta: 0:00:37  lr: 0.001853  loss: 6.2370 (8.6265)  bbox_regression: 2.5555 (3.0052)  classification: 3.5278 (5.6213)  time: 0.0948  data: 0.0181  max mem: 708
    Epoch: [0]  [450/612]  eta: 0:00:15  lr: 0.003692  loss: 5.8581 (7.2568)  bbox_regression: 2.6145 (2.7386)  classification: 3.3042 (4.5182)  time: 0.0943  data: 0.0177  max mem: 710
    Epoch: [0]  [611/612]  eta: 0:00:00  lr: 0.005000  loss: 6.2539 (6.9103)  bbox_regression: 2.6714 (2.6927)  classification: 3.2703 (4.2176)  time: 0.0932  data: 0.0188  max mem: 710
    Epoch: [0] Total time: 0:00:59 (0.0966 s / it)
    creating index...
    index created!
    Test:  [  0/153]  eta: 0:01:08  model_time: 0.1527 (0.1527)  evaluator_time: 0.0523 (0.0523)  time: 0.4477  data: 0.2242  max mem: 710
    Test:  [100/153]  eta: 0:00:06  model_time: 0.0275 (0.0315)  evaluator_time: 0.0499 (0.0586)  time: 0.1313  data: 0.0190  max mem: 710
    Test:  [152/153]  eta: 0:00:00  model_time: 0.0277 (0.0313)  evaluator_time: 0.0462 (0.0575)  time: 0.1330  data: 0.0382  max mem: 768
    Test: Total time: 0:00:18 (0.1224 s / it)
    Averaged stats: model_time: 0.0277 (0.0313)  evaluator_time: 0.0462 (0.0575)
    Accumulating evaluation results...
    DONE (t=2.02s).
    IoU metric: bbox
     Average Precision  (AP) @[ IoU=0.50:0.95 | area=   all | maxDets=100 ] = 0.033
     Average Precision  (AP) @[ IoU=0.50      | area=   all | maxDets=100 ] = 0.105
     Average Precision  (AP) @[ IoU=0.75      | area=   all | maxDets=100 ] = 0.011
     Average Precision  (AP) @[ IoU=0.50:0.95 | area= small | maxDets=100 ] = 0.000
     Average Precision  (AP) @[ IoU=0.50:0.95 | area=medium | maxDets=100 ] = 0.003
     Average Precision  (AP) @[ IoU=0.50:0.95 | area= large | maxDets=100 ] = 0.049
     Average Recall     (AR) @[ IoU=0.50:0.95 | area=   all | maxDets=  1 ] = 0.073
     Average Recall     (AR) @[ IoU=0.50:0.95 | area=   all | maxDets= 10 ] = 0.135
     Average Recall     (AR) @[ IoU=0.50:0.95 | area=   all | maxDets=100 ] = 0.188
     Average Recall     (AR) @[ IoU=0.50:0.95 | area= small | maxDets=100 ] = 0.000
     Average Recall     (AR) @[ IoU=0.50:0.95 | area=medium | maxDets=100 ] = 0.025
     Average Recall     (AR) @[ IoU=0.50:0.95 | area= large | maxDets=100 ] = 0.257
