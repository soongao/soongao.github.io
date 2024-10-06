---
title: Torch Train with Mulit GPU
# date: YYYY-MM-DD HH:MM:SS +/-TTTT
categories: [CV, torch]
tags: [torch]     # TAG names should always be lowercase
# toc: false
---

### 多GPU训练
#### 1. nn.DataParallel
```python
devices = [torch.device(f'cuda:{i}') for i in range(torch.cuda.device_count())]
net = nn.DataParallel(net, device_ids=devices)
for epoch in range(num_epochs):
    for X, y in train_iter:
        trainer.zero_grad()
        X, y = X.to(devices[0]), y.to(devices[0])
        l = loss(net(X), y)
        l.backward()
        trainer.step()
```
#### 2. nn.parallel.DistributedDataParallel
```python
from torch.nn.parallel import DistributedDataParallel as DDP
def init_distributed(rank, world_size):
    torch.distributed.init_process_group(
        backend='nccl', 
        init_method='env://', # 适合单机多GPU
        world_size=world_size,
        rank=rank
    )
    torch.cuda.set_device(rank)
# usually rank = 0, world_size = torch.cuda.device_count()
init_distributed(rank, world_size)
model = nnModel().cuda(rank)
model = DDP(model, device_ids=[rank])
for epoch in range(num_epochs):
    for data, target in dataloader:
        data, target = data.cuda(rank), target.cuda(rank)
        output = model(data)
        loss = criterion(output, target)
        loss.backward()
        optimizer.step()
```
