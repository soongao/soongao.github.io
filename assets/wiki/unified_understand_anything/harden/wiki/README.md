# 项目总览
> 项目：`harden`。本页由当前 Codex 会话基于 GitNexus 索引元信息和 `.ua/knowledge-graph.json` 生成。
> 索引分支：master；Commit：9dffe61d8580f90534c0bd886e2dbdd04d2abf36## 定位
harden 可以视为 **限流、同步与地址治理基础库/服务**。知识图谱显示它主要由 102 个文件级节点、422 个总节点和 562 条关系组成。
- Go module：`code.byted.org/videoarch/harden`
- Go 版本：`1.18`
- 主要语言：`go`、`json`、`markdown`、`mod`、`protobuf`、`python`、`shell`、`sum`、`yaml`
- GitNexus 索引：92 files / 736 nodes / 2211 edges / 50 flows
## README 提要
- udp版本使用说明：
- 修改udpserver包的payload.proto文件，并执行gen_proto.sh生成payload.pb.go文件，不能直接修改payload.pb.go！

## 目录热点
| 目录 | 文件级节点数 |
| --- | --- |
| conf | 39 |
| syncer | 10 |
| udpserver | 9 |
| remote | 7 |
| conRemote | 6 |
| . | 5 |
| consistent | 4 |
| .codebase | 3 |
| addr | 3 |
| .ua | 2 |

## 图谱规模
| 节点类型 | 数量 |
| --- | --- |
| function | 284 |
| file | 50 |
| config | 45 |
| class | 36 |
| schema | 5 |
| document | 2 |

| 关系类型 | 数量 |
| --- | --- |
| contains | 324 |
| imports | 140 |
| tested_by | 90 |
| documents | 8 |

## 建议阅读顺序
- [架构层级](architecture.md)：先看代码如何按层分布。
- [关键模块](modules.md)：再看各目录职责与代表文件。
- [关键流程](flows.md)：沿导览和依赖关系理解运行路径。
- [依赖关系](dependencies.md)：确认内部 imports 和外部 Go 依赖。
- [文件索引](files.md)：需要定位细节时按文件查找。
