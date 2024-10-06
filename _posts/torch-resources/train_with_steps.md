## 使用steps


### forward
```python
def forward_batch(batch, model, loss_fn, device):
	"""
    forward一个batch
    return: metric
    """
	X, y = batch
	X, y = X.to(device), y.to(device)
	y_hat = model(X)
	l = loss_fn(y_hat, y)
	
	preds = y_hat.argmax(1)
	accuracy = torch.mean((preds == y).float())
	
	return l, acc
```

### total
```python
def train_and_eval(total_steps, valid_steps, 
					model, optimizer, loss_fn, scheduler, 
					train_dataloader, val_dataloader, device):
    """
	total_steps 约等于 len(dataloader) * epochs
	"""
	train_iter = iter(train_dataloader)
    for step in range(total_steps):
		# 读一个batch的数据
		try:
			batch = next(train_iter)
		except StopIteration:
			train_iter = iter(train_dataloader)
			batch = next(train_iter)

		l, acc = forward_batch(batch, model, loss_fn, device)
		batch_loss = l.item()
		batch_accuracy = acc.item()

		l.backward()
		optimizer.step()
		# scheduler.step() # optional
		optimizer.zero_grad()

        if (step + 1) % valid_steps == 0:
			valid_accuracy = val_epoch(val_dataloader, model, loss_fn, device)
			# 可添加画图和输出可视化metric

```



### val_epoch使用forward_batch简洁代码
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