---
title: Yolo v3 Model Structure Code Snippet
# date: YYYY-MM-DD HH:MM:SS +/-TTTT
categories: [CV, OD]
tags: [OD, yolo]     # TAG names should always be lowercase
# toc: false
---

## model structure

```python
class CNNBlock(nn.Module):
    def __init__(self, in_channels, out_channels, kernel_size, padding=0, stride=1):
        super().__init__()
        self.conv = nn.Conv2d(in_channels=in_channels, out_channels=out_channels, bias=False,
                              kernel_size=kernel_size, padding=padding, stride=stride)
        self.bn = nn.BatchNorm2d(out_channels)
        self.leaky = nn.LeakyReLU(0.1)

    def forward(self, x):
        return self.leaky(self.bn(self.conv(x)))


class ResUnit(nn.Module):
    def __init__(self, channels):
        super().__init__()
        self.res = nn.Sequential(
            CNNBlock(channels, channels // 2, (1, 1)),
            CNNBlock(channels // 2, channels, (3, 3), 1, 1),
        )

    def forward(self, x):
        return x + self.res(x)


class ResBlock(nn.Module):
    def __init__(self, in_channels, out_channels, num_repeats=1):
        super().__init__()
        assert out_channels == in_channels * 2
        self.downSampling = CNNBlock(in_channels, in_channels * 2, (3, 3), 1, 2)
        self.layers = nn.Sequential(*[ResUnit(in_channels * 2) for _ in range(num_repeats)])

    def forward(self, x):
        return self.layers(self.downSampling(x))


class ScalePrediction(nn.Module):
    def __init__(self, channels, num_classes=80):
        super().__init__()
        self.pred = nn.Sequential(
            CNNBlock(channels, channels * 2, (3, 3), 1),
            nn.Conv2d(channels * 2, (num_classes + 5) * 3, kernel_size=(1, 1))
        )
        self.num_classes = num_classes

    def forward(self, x):
        return (
            self.pred(x)
                .reshape(x.shape[0], 3, self.num_classes + 5, x.shape[2], x.shape[3])
                .permute(0, 1, 3, 4, 2)
        )


class ConvSet(nn.Module):
    def __init__(self, in_channels, out_channels, num_repeats=5):
        super().__init__()
        self.conv1 = CNNBlock(in_channels, out_channels, (1, 1))

        self.conv = nn.Sequential(
            *[CNNBlock(out_channels, out_channels, (3, 3), 1) if i % 2 == 0
              else CNNBlock(out_channels, out_channels, (1, 1)) for i in range(num_repeats-1)]
        )

    def forward(self, x):
        return self.conv(self.conv1(x))


class NeckAndConcatNet(nn.Module):
    def __init__(self, in_channels, out_channels, num_repeats=5):
        super().__init__()
        self.cnn = CNNBlock(in_channels, out_channels, (1, 1))
        self.up = nn.Upsample(scale_factor=2)
        self.convset = ConvSet(out_channels * 3, out_channels, num_repeats)

    def forward(self, upX, rawX):
        upX = self.up(self.cnn(upX))
        X = torch.cat((upX, rawX), dim=1)
        return self.convset(X)


class YoloV3(nn.Module):
    def __init__(self, in_channels=3, num_classes=80):
        super().__init__()
        self.num_classes = num_classes
        self.in_channels = in_channels
        self._create_layers()

    def forward(self, x):
        scale1_backbone_out = self.scale1_backbone(x)
        scale2_backbone_out = self.scale2_backbone(scale1_backbone_out)
        scale3_backbone_out = self.scale3_backbone(scale2_backbone_out)
        scale3_neck_out = self.scale3_neck(scale3_backbone_out)
        scale3_out = self.scale3_head(scale3_neck_out)
        scale2_neck_out = self.scale2_neck(scale3_neck_out, scale2_backbone_out)
        scale2_out = self.scale2_head(scale2_neck_out)
        scale1_neck_out = self.scale1_neck(scale2_neck_out, scale1_backbone_out)
        scale1_out = self.scale1_head(scale1_neck_out)
        return scale3_out, scale2_out, scale1_out

    def _create_layers(self):
        self.scale1_backbone = nn.Sequential(
            CNNBlock(3, 32, 3, 1),
            ResBlock(32, 64, 1),
            ResBlock(64, 128, 2),
            ResBlock(128, 256, 8),
        )
        self.scale2_backbone = ResBlock(256, 512, 8)
        self.scale3_backbone = ResBlock(512, 1024, 4)
        self.scale3_neck = ConvSet(1024, 512, 1)
        self.scale3_head = ScalePrediction(512, self.num_classes)
        self.scale2_neck = NeckAndConcatNet(512, 256, 1)
        self.scale2_head = ScalePrediction(256, self.num_classes)
        self.scale1_neck = NeckAndConcatNet(256, 128, 1)
        self.scale1_head = ScalePrediction(128, self.num_classes)

```