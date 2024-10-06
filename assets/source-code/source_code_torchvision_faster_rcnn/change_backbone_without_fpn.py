import os
import datetime

import torch

import transforms
from network_files import FasterRCNN, AnchorsGenerator
from my_dataset import VOCDataSet
from train_utils import GroupedBatchSampler, create_aspect_ratio_groups
from train_utils import train_eval_utils as utils


def create_model(num_classes):
    import torchvision
    from torchvision.models.feature_extraction import create_feature_extractor

    # vgg16
    backbone = torchvision.models.vgg16_bn(pretrained=False)
    # print(backbone)
    backbone = create_feature_extractor(backbone, return_nodes={"features.42": "0"})
    # out = backbone(torch.rand(1, 3, 224, 224))
    # print(out["0"].shape)
    backbone.out_channels = 512

    # resnet50 backbone
    # backbone = torchvision.models.resnet50(pretrained=True)
    # # print(backbone)
    # backbone = create_feature_extractor(backbone, return_nodes={"layer3": "0"})
    # # out = backbone(torch.rand(1, 3, 224, 224))
    # # print(out["0"].shape)
    # backbone.out_channels = 1024

    # EfficientNetB0
    # backbone = torchvision.models.efficientnet_b0(pretrained=True)
    # # print(backbone)
    # backbone = create_feature_extractor(backbone, return_nodes={"features.5": "0"})
    # # out = backbone(torch.rand(1, 3, 224, 224))
    # # print(out["0"].shape)
    # backbone.out_channels = 112

    anchor_generator = AnchorsGenerator(sizes=((32, 64, 128, 256, 512),),
                                        aspect_ratios=((0.5, 1.0, 2.0),))

    roi_pooler = torchvision.ops.MultiScaleRoIAlign(featmap_names=['0'],  # 在哪些特征层上进行RoIAlign pooling
                                                    output_size=[7, 7],  # RoIAlign pooling输出特征矩阵尺寸
                                                    sampling_ratio=2)  # 采样率

    model = FasterRCNN(backbone=backbone,
                       num_classes=num_classes,
                       rpn_anchor_generator=anchor_generator,
                       box_roi_pool=roi_pooler)

    return model


create_model(21)