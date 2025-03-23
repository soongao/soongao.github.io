---
title: Torch Tricks
# date: YYYY-MM-DD HH:MM:SS +/-TTTT
categories: [dl, torch]
tags: [torch]     # TAG names should always be lowercase
# toc: false
---

# torch tricks

### Set Seed
```python
import numpy as np
import torch
import random
def set_seed(seed):
    np.random.seed(seed)
    random.seed(seed)
    torch.manual_seed(seed)
    if torch.cuda.is_available():
        torch.cuda.manual_seed(seed)
        torch.cuda.manual_seed_all(seed)
    torch.backends.cudnn.benchmark = False
    torch.backends.cudnn.deterministic = True
set_seed(seed)
```

### Gradient Penalty (gp)
#### 通常与生成对抗网络(GANs)相关联，特别是在WGAN-GP
```python
def gp(model, real_data, fake_data, device, lambda_gp):
    alpha = torch.rand(real_data.size(0), 1, 1, 1).to(device)
    interpolates = (alpha * real_data + ((1 - alpha) * fake_data)).requires_grad_(True)

    disc_interpolates = model(interpolates)
    gradients = torch.autograd.grad(outputs=disc_interpolates, inputs=interpolates,
                                    grad_outputs=torch.ones(disc_interpolates.size()).to(device),
                                    create_graph=True, retain_graph=True)[0]

    gradients = gradients.view(gradients.size(0), -1)
    gradient_penalty = lambda_gp * ((gradients.norm(2, dim=1) - 1) ** 2).mean()

    return gradient_penalty
gp_loss = gradient_penalty(discriminator, real_data, fake_data, device, lambda_gp)
total_loss = real_loss + fake_loss + gp_loss
total_loss.backward()
```


### Automatic Mixed Precision (自动混合精度 AMP)
```python
with autocast():
    y_hat = model(X)
    loss = loss_fn(y_hat, y)
    scaler.scale(loss).backward()
scaler.unscale_(optimizer)
scaler.step(optimizer)
scaler.update()
optimizer.zero_grad()
```


### Gradient Clip 梯度剪裁
#### 一般在loss.backward() 和 optimizer.step() 之间使用
1. 绝对值裁剪
```python
torch.nn.utils.clip_grad_value_(model.parameters(), clip_value=clip_value)
```
2. 梯度范数裁剪
```python
 # norm_type 决定使用L1还是L2范数
torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=max_norm, norm_type=2)
```
3. 自定义梯度裁剪
```python
for param in model.parameters():
    if param.grad is not None:
        param.grad.data.clamp_(min=-clip_value, max=clip_value)
```

### Gradient Accumulation (梯度累加)
```python
accumulation_steps = 4  # 定义梯度累加的步数
# 记录批次索引的变量
step_index = 0
for epoch in range(num_epochs):
    for data, target in dataloader:
        optimizer.zero_grad()
        output = model(data)
        loss = criterion(output, target)
        # 梯度累加
        loss /= accumulation_steps
        loss.backward()
        # 更新批次索引
        step_index += 1
        # 累积一定次数后更新模型参数
        if step_index % accumulation_steps == 0:
            optimizer.step()
            optimizer.zero_grad()
```


### scheduler learning rate plot
```python
lr_history = []
for _ in range(steps):
    scheduler.step()
    current_lr = scheduler.get_last_lr()[0]
    lr_history.append(current_lr)
plt.plot(lr_history, label='Learning Rate', marker='o')
plt.xlabel('Steps')
plt.ylabel('Learning Rate')
plt.legend()
plt.grid(True)
plt.show()
```


### save best model and early stop
```python
# update log
if valid_acc > best_acc:
    print(f"[ Valid | {epoch + 1:03d}/{n_epochs:03d} ] loss = {valid_loss:.5f}, acc = {valid_acc:.5f} -> best")
else:
    print(f"[ Valid | {epoch + 1:03d}/{n_epochs:03d} ] loss = {valid_loss:.5f}, acc = {valid_acc:.5f}")


# save models
if valid_acc > best_acc:
    log(f"Best model found at epoch {epoch}, saving model")
    torch.save(student_model.state_dict(), f"{save_path}/student_best.ckpt") # only save best to prevent output memory exceed error
    best_acc = valid_acc
    stale = 0
else:
    stale += 1
    if stale > patience:
        print(f"No improvment {patience} consecutive epochs, early stopping")
        break
```
