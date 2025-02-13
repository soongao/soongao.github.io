---
title: Torch Train with Epoch
# date: YYYY-MM-DD HH:MM:SS +/-TTTT
categories: [deeplearning, torch]
tags: [torch]     # TAG names should always be lowercase
# toc: false
---

## 使用epoch

### train
```python
def train_epoch(model, trainer, loss_fn, dataloader, device):
    """
    train一个epoch
    return: 平均loss
    """
    model.train()
    loss_sum = 0.0
    for X, y in dataloader:
        X, y = X.to(device), y.to(device)
        trainer.zero_grad()
        y_hat = model(X)
        l = loss_fn(y_hat, y)
        loss_sum += l.item()
        l.backward()
        trainer.step()
    return loss_sum / len(dataloader)
```

### val
```python
def val_epoch(model, loss_fn, dataloader, device):
    """
    eval一个epoch
    return: 评估指标
    """
    model.eval()
    correct = 0.0
    # loss_sum = 0.0
    with torch.no_grad():
        for X, y in dataloader:
            X, y = X.to(device), y.to(device)
            y_hat = model(X)
            # acc
            preds = y_hat.argmax(1)
	        accuracy = torch.mean((preds == y).float()).item()
            """
            # loss
            l = loss_fn(y_hat, y)
            loss_sum += l.item()
            """
    return correct / len(dataloader.dataset)
    # return loss_sum / len(dataloader)
```

### val_epoch使用forward_batch(见train with steps)简洁代码
```python
def val_epoch(model, trainer, loss_fn, dataloader, device):
    model.eval()
	running_loss, running_accuracy = 0.0, 0.0
    for batch in dataloader:
		with torch.no_grad():
			l, accuracy = forward_batch(batch, model, loss_fn, device)
			running_loss += l.item()
			running_accuracy += accuracy.item()
    return running_accuracy / len(dataloader)
```

### total
```python
def train_and_eval(epoches, model, trainer, loss_fn, 
                    train_dataloader, val_dataloader, device):
    """
    训练并评估, 每个epoch记录一次metric
    """
    loss_list, acc_list = [], []
    for epoch in tqdm(range(epoches)):
        loss_list.append(
            train_epoch(model, trainer, loss_fn, train_dataloader, device))
        acc_list.append(
            val_epoch(model, loss_fn, val_dataloader, device))
    print(f'loss:{loss_list[-1]:.4f} acc:{acc_list[-1]:.4f}')
    plt.plot(list(range(epoches)), loss_list, label='loss')
    plt.plot(list(range(epoches)), acc_list, label='acc')
    plt.legend(fontsize='small', loc='best')
    plt.grid(True)
    plt.show()
```
