# 架构层级
> 项目：`uri_writer`。本页由当前 Codex 会话基于 GitNexus 索引元信息和 `.ua/knowledge-graph.json` 生成。
> GitNexus flows：147## 层级划分

| 层 | 职责 | 节点数 | 代表文件 |
| --- | --- | --- | --- |
| 核心层 | 项目核心代码和未归入特定目录模式的文件。 | 48 | `.ua/.understandignore`<br>`build.sh`<br>`cmd/writer_server/main.go`<br>`controlplane/client.go`<br>`idl/base.thrift`<br>`idl/uri_writer.thrift`<br>`kitex_gen/base/base.go`<br>`kitex_gen/base/k-base.go` |
| 配置层 | 应用配置、环境变量和构建配置。 | 2 | `config/config_test.go`<br>`config/config.go` |
| 服务层 | 业务逻辑和应用服务。 | 3 | `service/doc.go`<br>`service/impl.go`<br>`service/server.go` |

## 跨层依赖

| 依赖方向 | imports 数 |
| --- | --- |
| 服务层 -> 核心层 | 36 |
| 核心层 -> 配置层 | 28 |
| 核心层 -> 服务层 | 12 |
| 服务层 -> 配置层 | 2 |

## 架构阅读建议

- 先从入口文件和配置层看启动参数、环境配置与服务装配。
- 再进入业务服务层或核心层，沿 `imports` 关系向数据访问、RPC 客户端、缓存和工具层展开。
- 对于包含大量 `kitex_gen` 或生成代码的项目，优先阅读业务目录，生成代码只作为协议边界参考。
