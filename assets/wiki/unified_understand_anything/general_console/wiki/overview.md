# 项目总览
> 项目：`general_console`。本页由当前 Codex 会话基于 GitNexus 索引元信息和 `.ua/knowledge-graph.json` 生成。
> 索引分支：master；Commit：46d21eb86147f7dd993e1c9dc42157dd73570c8d## 定位
general_console 可以视为 **视频架构通用控制台服务**。知识图谱显示它主要由 131 个文件级节点、2823 个总节点和 3435 条关系组成。
- Go module：`code.byted.org/videoarch/general_console`
- Go 版本：`1.18`
- 主要语言：`go`、`json`、`mod`、`shell`、`sql`、`sum`、`thrift`、`yaml`
- GitNexus 索引：120 files / 4370 nodes / 12171 edges / 269 flows
## README 提要
_仓库未提供可用 README 摘要，以下 wiki 主要依据代码图谱生成。_

## 目录热点
| 目录 | 文件级节点数 |
| --- | --- |
| biz | 87 |
| conf | 29 |
| . | 8 |
| .codebase | 3 |
| .ua | 2 |
| docs | 1 |
| script | 1 |

## 图谱规模
| 节点类型 | 数量 |
| --- | --- |
| function | 2503 |
| class | 189 |
| file | 92 |
| config | 36 |
| table | 3 |

| 关系类型 | 数量 |
| --- | --- |
| contains | 2694 |
| imports | 571 |
| tested_by | 170 |

## 建议阅读顺序
- [架构层级](architecture.md)：先看代码如何按层分布。
- [关键模块](modules.md)：再看各目录职责与代表文件。
- [关键流程](flows.md)：沿导览和依赖关系理解运行路径。
- [依赖关系](dependencies.md)：确认内部 imports 和外部 Go 依赖。
- [文件索引](files.md)：需要定位细节时按文件查找。
