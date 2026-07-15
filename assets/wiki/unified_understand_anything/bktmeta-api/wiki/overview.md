# 项目总览
> 项目：`bktmeta-api`。本页由当前 Codex 会话基于 GitNexus 索引元信息和 `.ua/knowledge-graph.json` 生成。
> 索引分支：feat/locallimiter；Commit：9e4d7b2ed24cb97e784b82ca5474d09f60219aa5## 定位
bktmeta-api 可以视为 **Bucket 元数据 API 服务**。知识图谱显示它主要由 192 个文件级节点、932 个总节点和 2537 条关系组成。
- Go module：`code.byted.org/videoarch/bktmeta-api`
- Go 版本：`1.21`
- 主要语言：`go`、`json`、`markdown`、`mod`、`python`、`shell`、`sql`、`sum`、`yaml`
- 检测框架：`Gin`
- GitNexus 索引：180 files / 1955 nodes / 6163 edges / 155 flows
## README 提要
- # bucket meta api
- POST /v1/buckets  //创建bucket
- GET  /v1/buckets  //获取所有bucket信息
- GET  /v1/buckets/{name}  //获取某个bucket信息
- DELETE  /v1/buckets/{name}  //删除某个bucket
- PATCH  /v1/buckets/{name}  //update bucket
- GET /v1/signatures/{bucketname}? 获取签名

## 目录热点
| 目录 | 文件级节点数 |
| --- | --- |
| conf | 55 |
| service | 30 |
| db | 28 |
| util | 19 |
| rpc | 8 |
| . | 7 |
| tcc | 6 |
| config | 5 |
| middleware | 5 |
| .codebase | 3 |

## 图谱规模
| 节点类型 | 数量 |
| --- | --- |
| function | 633 |
| file | 123 |
| class | 107 |
| config | 61 |
| table | 7 |
| document | 1 |

| 关系类型 | 数量 |
| --- | --- |
| imports | 1531 |
| contains | 746 |
| tested_by | 255 |
| documents | 5 |

## 建议阅读顺序
- [架构层级](architecture.md)：先看代码如何按层分布。
- [关键模块](modules.md)：再看各目录职责与代表文件。
- [关键流程](flows.md)：沿导览和依赖关系理解运行路径。
- [依赖关系](dependencies.md)：确认内部 imports 和外部 Go 依赖。
- [文件索引](files.md)：需要定位细节时按文件查找。
