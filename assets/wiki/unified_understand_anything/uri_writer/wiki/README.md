# 项目总览
> 项目：`uri_writer`。本页由当前 Codex 会话基于 GitNexus 索引元信息和 `.ua/knowledge-graph.json` 生成。
> 索引分支：localwriter；Commit：03f4aced503d1602814c085c82b5c958f62f68e2## 定位
uri_writer 可以视为 **URI 写入与排序 Writer 组件**。知识图谱显示它主要由 53 个文件级节点、829 个总节点和 1027 条关系组成。
- Go module：`code.byted.org/videoarch/uri_writer`
- Go 版本：`1.25`
- 主要语言：`config`、`go`、`json`、`makefile`、`markdown`、`mod`、`shell`、`sum`、`thrift`
- GitNexus 索引：43 files / 1655 nodes / 4592 edges / 147 flows
## README 提要
- # uri_writer
- `uri_writer` 是 VDA/TOS `store_uri` 大规模分桶排序流水线中 **Writer FaaS** 的代码骨架。
- 它对应整体架构 `Reader → Router → Writer` 中的 Writer 角色，部署在 v_lambda
- （FaaS）上。每个 Writer 实例从控制面接收一组负责的 `bucketId`，从 Reader 接收
- 按 `bucketId` 路由过来的 `store_uri` 数据，在内部完成**外排序**，并最终为每个
- `bucket` 生成一个有序的 Parquet 文件写入 HDFS。
- > 架构与协议详见：
- > - [HDFS 大规模数据分桶排序架构设计：VDA Store URI 处理方案](https://bytedance.larkoffice.com/docx/CdRoddHpWo8SQ7xq2shchWvPnmg)
- > - [Writer FaaS 详细设计方案](https://bytedance.larkoffice.com/docx/UIxldhft4oBH71xmcUvcbOaSnUd)
- ## 仓库结构（骨架）
- ```
- uri_writer/
- ├── main.go              # FaaS 入口：定义 Input/Output、调用 lifecycle.Run
- ├── go.mod
- ├── Makefile / build.sh  # 与 uri_source_reader 对齐的构建脚本
- ├── .env                 # HDFS 客户端 SCM 版本变量
- │
- ├── idl/

## 目录热点
| 目录 | 文件级节点数 |
| --- | --- |
| . | 15 |
| writer | 15 |
| kitex_gen | 9 |
| service | 3 |
| .ua | 2 |
| config | 2 |
| idl | 2 |
| router | 2 |
| cmd | 1 |
| controlplane | 1 |

## 图谱规模
| 节点类型 | 数量 |
| --- | --- |
| function | 693 |
| class | 83 |
| file | 40 |
| config | 6 |
| pipeline | 4 |
| document | 2 |
| service | 1 |

| 关系类型 | 数量 |
| --- | --- |
| contains | 782 |
| imports | 204 |
| tested_by | 31 |
| documents | 10 |

## 建议阅读顺序
- [架构层级](architecture.md)：先看代码如何按层分布。
- [关键模块](modules.md)：再看各目录职责与代表文件。
- [关键流程](flows.md)：沿导览和依赖关系理解运行路径。
- [依赖关系](dependencies.md)：确认内部 imports 和外部 Go 依赖。
- [文件索引](files.md)：需要定位细节时按文件查找。
