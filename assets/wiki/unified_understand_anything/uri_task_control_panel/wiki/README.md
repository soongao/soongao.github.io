# 项目总览
> 项目：`uri_task_control_panel`。本页由当前 Codex 会话基于 GitNexus 索引元信息和 `.ua/knowledge-graph.json` 生成。
> 索引分支：feat/sources；Commit：19b258e719e1ddc6db64f5c6bd310bf5e1645c93## 定位
uri_task_control_panel 可以视为 **URI 排序任务控制面服务**。知识图谱显示它主要由 37 个文件级节点、375 个总节点和 533 条关系组成。
- Go module：`code.byted.org/videoarch/uri_task_control_panel`
- Go 版本：`1.23.0`
- 主要语言：`go`、`json`、`markdown`、`mod`、`shell`、`sum`、`yaml`
- GitNexus 索引：34 files / 996 nodes / 3337 edges / 63 flows
## README 提要
- # uri_task_control_panel — VDA Store URI 排序任务控制面服务
- VDA Store URI 排序任务的 **Control Plane Service**：负责任务创建、Reader/Writer 状态汇聚以及 Reader-Done Barrier 的 fan-out。详细设计参见 [《VDA Store URI 排序任务控制面服务设计方案》](https://bytedance.larkoffice.com/docx/WhHwdT50HoUXL5xQMAnc6W7Knsg)。
- > 上下游：
- >
- > - 上游 Reader：[`videoarch/uri_source_reader`](https://code.byted.org/videoarch/uri_source_reader)
- > - 下游 Writer：[`videoarch/uri_writer`](https://code.byted.org/videoarch/uri_writer)（KiteX `WriteBatch / MarkBucketDone / Flush` 已实现）
- > - Overpass 客户端：[`overpass/bytedance_videoarch_uri_task_control_panel`](https://code.byted.org/overpass/bytedance_videoarch_uri_task_control_panel)
- ## 架构与目录结构
- ```
- .
- ├── api/                       OpenAPI 3.0.3 描述（HTTP/JSON 契约）
- │   └── swagger.yaml
- ├── cmd/                       进程入口（main.go）
- ├── conf/                      yaml 基线 + Hertz 本地配置
- │   ├── base.yml
- │   └── hertz.config.yaml
- ├── docs/                      接入指南与方案文档
- │   ├── integration.md

## 目录热点
| 目录 | 文件级节点数 |
| --- | --- |
| internal | 24 |
| . | 4 |
| .ua | 2 |
| conf | 2 |
| api | 1 |
| cmd | 1 |
| docs | 1 |
| examples | 1 |
| script | 1 |

## 图谱规模
| 节点类型 | 数量 |
| --- | --- |
| function | 238 |
| class | 100 |
| file | 29 |
| config | 6 |
| document | 2 |

| 关系类型 | 数量 |
| --- | --- |
| contains | 338 |
| imports | 103 |
| tested_by | 86 |
| documents | 6 |

## 建议阅读顺序
- [架构层级](architecture.md)：先看代码如何按层分布。
- [关键模块](modules.md)：再看各目录职责与代表文件。
- [关键流程](flows.md)：沿导览和依赖关系理解运行路径。
- [依赖关系](dependencies.md)：确认内部 imports 和外部 Go 依赖。
- [文件索引](files.md)：需要定位细节时按文件查找。
