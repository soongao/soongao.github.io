---
title: Torch Custom learning rate scheduler
# date: YYYY-MM-DD HH:MM:SS +/-TTTT
categories: [dl, torch]
tags: [torch]     # TAG names should always be lowercase
# toc: false
---

## Learning rate scheduler

##### 带warmup的learning rate随余弦函数变化的scheduler
- Warmup Phase lr从0线性增加init_lr
- Decay Phase lr随cos逐步降低到0
  - 通过调整num_cycles决定经过cos的多少个周期

```python
import math

import torch
from torch.optim import Optimizer
from torch.optim.lr_scheduler import LambdaLR

def get_cosine_schedule_with_warmup(
	optimizer: Optimizer,
	num_warmup_steps: int,
	num_training_steps: int,
	num_cycles: float = 0.5, # cos的半个周期 lr降到0后不再上升
	last_epoch: int = -1, # 表示从第0个epoch开始
):
	def lr_lambda(current_step):
		# Warmup
		if current_step < num_warmup_steps:
			return float(current_step) / float(max(1, num_warmup_steps))
		# decadence
		progress = float(current_step - num_warmup_steps) / float(
			max(1, num_training_steps - num_warmup_steps)
		)
		return max(
			0.0, 0.5 * (1.0 + math.cos(math.pi * float(num_cycles) * 2.0 * progress))
		)

	return LambdaLR(optimizer, lr_lambda, last_epoch)
```
