---
title: Yolo Series Basic Model Struct
# date: YYYY-MM-DD HH:MM:SS +/-TTTT
categories: [dl, object detection]
tags: [object detection, yolo]     # TAG names should always be lowercase
# toc: false
---

## general yolo model structure

```python
class BackBone(nn.Module):
    def __init__(self,
                 model: nn.Module,
                 extract_ids: list):
        super().__init__()
        self.model = model
        self.extract_ids = extract_ids
        self.net = nn.Sequential(*[layer for layer in self.model.children()])

    def forward(self, x):
        outputs = []
        for i in range(len(self.net)):
            x = self.net[i](x)
            if i in self.extract_ids:
                outputs.append(x)
        return outputs[::-1]


class Neck(nn.Module):
    def __init__(self, input_channels: list, output_channels: list):
        super().__init__()
        assert len(input_channels) == len(output_channels)
        self.input_channels = input_channels
        self.output_channels = output_channels
        self.net = self._create_layers()

    def forward(self, Xs: list):
        outputs = []
        for i in range(len(Xs)):
            if i == 0:
                Xs[i] = self.net[i][0](Xs[i])
            else:
                concatX = self.net[i][0](Xs[i - 1])
                concatX = F.interpolate(concatX, (Xs[i].size(-2), Xs[i].size(-1)), mode='bilinear')
                concatX = torch.cat((concatX, Xs[i]), dim=1)
                Xs[i] = self.net[i][1](concatX)

            outputs.append(Xs[i])
        return outputs

    def _create_layers(self):
        layers = []
        for i in range(len(self.input_channels)):
            if i == 0:
                layer = [ConvSet(self.input_channels[i], self.output_channels[i], 1)]
                layers.append(layer)
            else:
                layer = [
                    CNNBlock(self.output_channels[i - 1], self.input_channels[i] // 2, (1, 1)),
                    ConvSet(self.input_channels[i] + self.input_channels[i] // 2, self.output_channels[i], 1)
                ]
                layers.append(layer)
        return layers


class Head(nn.Module):
    def __init__(self, input_channels: list, num_class=20):
        super().__init__()
        self.input_channels = input_channels
        self.num_class = num_class
        self.net = self._create_layers()

    def forward(self, Xs: list):
        outputs = [layer(x) for x,layer in zip(Xs,self.net)]
        return outputs

    def _create_layers(self):
        layers = [ScalePrediction(channel, self.num_class) for channel in self.input_channels]
        return layers


if __name__ == '__main__':
    ids = [3, 4, 5]
    b = BackBone(bone().net, ids)
    x = torch.randn((1, 3, 416, 416))
    outs = b(x)
    for o in outs:
        print(o.shape)
    print('------------')

    inc = [o.size(1) for o in outs]
    oc = [512,256,128]
    neck = Neck(inc, )
    ne_outs = neck(outs)
    for no in ne_outs:
        print(no.shape)

    print('--------------')
    heads = Head(oc)
    he_outs = heads(ne_outs)
    for ho in he_outs:
        print(ho.shape)

    """
    torch.Size([1, 1024, 13, 13])
    torch.Size([1, 512, 26, 26])
    torch.Size([1, 256, 52, 52])
    ------------
    torch.Size([1, 512, 13, 13])
    torch.Size([1, 256, 26, 26])
    torch.Size([1, 128, 52, 52])
    --------------
    torch.Size([1, 3, 13, 13, 25])
    torch.Size([1, 3, 26, 26, 25])
    torch.Size([1, 3, 52, 52, 25])
    """

```