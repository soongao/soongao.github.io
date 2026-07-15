# 架构层级
> 项目：`uri_source_reader`。本页由当前 Codex 会话基于 GitNexus 索引元信息和 `.ua/knowledge-graph.json` 生成。
> GitNexus flows：107## 层级划分

| 层 | 职责 | 节点数 | 代表文件 |
| --- | --- | --- | --- |
| 核心层 | 项目核心代码和未归入特定目录模式的文件。 | 54 | `.ua/.understandignore`<br>`build.sh`<br>`controlplane/client.go`<br>`controlplane/reporter_test.go`<br>`controlplane/reporter.go`<br>`controlplane/tracker.go`<br>`controlplane/types.go`<br>`diagnostics/writer_rpc_diagnosis.html` |

## 跨层依赖

_未检测到明确跨层 imports，可能是层划分较粗或依赖集中在同一层。_

## 架构阅读建议

- 先从入口文件和配置层看启动参数、环境配置与服务装配。
- 再进入业务服务层或核心层，沿 `imports` 关系向数据访问、RPC 客户端、缓存和工具层展开。
- 对于包含大量 `kitex_gen` 或生成代码的项目，优先阅读业务目录，生成代码只作为协议边界参考。
