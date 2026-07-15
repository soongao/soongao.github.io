# 项目总览
> 项目：`compound`。本页由当前 Codex 会话基于 GitNexus 索引元信息和 `.ua/knowledge-graph.json` 生成。
> 索引分支：master；Commit：5c272a52aa5cf7207358164f9e5d97af66ffe9ba## 定位
compound 可以视为 **视频架构元数据管理与复合服务**。知识图谱显示它主要由 657 个文件级节点、22623 个总节点和 27654 条关系组成。
- Go module：`code.byted.org/videoarch/compound`
- Go 版本：`1.23.2`
- 主要语言：`config`、`go`、`json`、`markdown`、`mod`、`python`、`shell`、`sql`、`sum`、`thrift`、`tla`、`txt`、`yaml`
- GitNexus 索引：607 files / 18845 nodes / 51733 edges / 300 flows
## README 提要
- # Compound
- 视频架构元数据管理服务。
- - 语言：Go 1.23
- - RPC：Kitex；HTTP：Hertz
- - 模块路径：`code.byted.org/videoarch/compound`
- - 主文档入口：[`docs/README.md`](./docs/README.md)
- - AI 协议入口：[`CLAUDE.md`](./CLAUDE.md)
- - 项目级文档规约：[`docs/AGENTS.md`](./docs/AGENTS.md)

## 目录热点
| 目录 | 文件级节点数 |
| --- | --- |
| fuxi | 372 |
| docs | 172 |
| kitex_gen | 32 |
| mdap | 19 |
| handler | 14 |
| . | 10 |
| idl | 8 |
| script | 7 |
| rocketmq | 4 |
| util | 4 |

## 图谱规模
| 节点类型 | 数量 |
| --- | --- |
| function | 21069 |
| class | 897 |
| file | 408 |
| document | 190 |
| config | 35 |
| table | 24 |

| 关系类型 | 数量 |
| --- | --- |
| contains | 21980 |
| imports | 3980 |
| documents | 950 |
| tested_by | 744 |

## 建议阅读顺序
- [架构层级](architecture.md)：先看代码如何按层分布。
- [关键模块](modules.md)：再看各目录职责与代表文件。
- [关键流程](flows.md)：沿导览和依赖关系理解运行路径。
- [依赖关系](dependencies.md)：确认内部 imports 和外部 Go 依赖。
- [文件索引](files.md)：需要定位细节时按文件查找。
