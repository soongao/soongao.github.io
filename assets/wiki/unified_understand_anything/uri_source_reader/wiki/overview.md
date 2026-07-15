# 项目总览
> 项目：`uri_source_reader`。本页由当前 Codex 会话基于 GitNexus 索引元信息和 `.ua/knowledge-graph.json` 生成。
> 索引分支：feat/hdfsreader；Commit：cc5e3a2068495561d69cf5e99ac70fcfacd4cae8## 定位
uri_source_reader 可以视为 **URI 源数据读取与分发组件**。知识图谱显示它主要由 54 个文件级节点、530 个总节点和 748 条关系组成。
- Go module：`code.byted.org/videoarch/uri_source_reader`
- Go 版本：`1.25`
- 主要语言：`config`、`go`、`html`、`json`、`m3u8`、`makefile`、`mod`、`shell`、`sum`
- GitNexus 索引：44 files / 1218 nodes / 3674 edges / 107 flows
## README 提要
_仓库未提供可用 README 摘要，以下 wiki 主要依据代码图谱生成。_

## 目录热点
| 目录 | 文件级节点数 |
| --- | --- |
| internal | 27 |
| . | 13 |
| sink | 6 |
| controlplane | 5 |
| .ua | 2 |
| diagnostics | 1 |

## 图谱规模
| 节点类型 | 数量 |
| --- | --- |
| function | 378 |
| class | 98 |
| file | 43 |
| config | 6 |
| pipeline | 4 |
| service | 1 |

| 关系类型 | 数量 |
| --- | --- |
| contains | 482 |
| tested_by | 164 |
| imports | 102 |

## 建议阅读顺序
- [架构层级](architecture.md)：先看代码如何按层分布。
- [关键模块](modules.md)：再看各目录职责与代表文件。
- [关键流程](flows.md)：沿导览和依赖关系理解运行路径。
- [依赖关系](dependencies.md)：确认内部 imports 和外部 Go 依赖。
- [文件索引](files.md)：需要定位细节时按文件查找。
