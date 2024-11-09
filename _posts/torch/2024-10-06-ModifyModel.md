---
title: Torch Modify Model
# date: YYYY-MM-DD HH:MM:SS +/-TTTT
categories: [deeplearning, torch]
tags: [torch]     # TAG names should always be lowercase
# toc: false
---


# Modify Model

### **torch model is a callable object, u can visit it as a list or tuple**

#### change model to a nn.Sequential
- model_seq = nn.Sequential(model.children()[:])

#### get any layer`s output
##### create_feature_extractor
```python
from torchvision.models.feature_extraction import create_feature_extractor

model_ex = create_feature_extractor(model, return_nodes=
    dict{"layer name": "key"}
)
```

##### hook
```python
def forward_hook(model, X_in, X_out):
    pass

handle = layer.register_forward_hook(forward_hook)
# do something
handle.remove()
```

#### hook introduce
##### register_forward_hook
```python
def forward_hook(module, X_input, X_output):
    pass

handle = layer.register_forward_hook(forward_hook)
```

##### register_backward_hook
```python
def backward_hook(module, grad_input, grad_output):
    pass

handle = layer.register_backward_hook(backward_hook)
```

##### register_param_hook
```python
def param_hook(param):
    pass
# `param` 是模型中的一个参数
handle = param.register_hook(param_hook) 
```
