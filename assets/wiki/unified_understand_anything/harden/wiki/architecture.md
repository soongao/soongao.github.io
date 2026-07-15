# 架构层级
> 项目：`harden`。本页由当前 Codex 会话基于 GitNexus 索引元信息和 `.ua/knowledge-graph.json` 生成。
> GitNexus flows：50## 层级划分

| 层 | 职责 | 节点数 | 代表文件 |
| --- | --- | --- | --- |
| 核心层 | 项目核心代码和未归入特定目录模式的文件。 | 100 | `.ua/.understandignore`<br>`addr/addr_test.go`<br>`addr/addr.go`<br>`addr/get_addr.go`<br>`build.sh`<br>`conRemote/baseInfo.go`<br>`conRemote/concurrentBase.go`<br>`conRemote/config.go` |
| 配置层 | 应用配置、环境变量和构建配置。 | 1 | `config/config.go` |
| 中间件层 | 请求、响应和横切处理逻辑。 | 1 | `middleware/group_middleware.go` |

## 跨层依赖

| 依赖方向 | imports 数 |
| --- | --- |
| 核心层 -> 配置层 | 5 |
| 核心层 -> 中间件层 | 1 |

## 架构阅读建议

- 先从入口文件和配置层看启动参数、环境配置与服务装配。
- 再进入业务服务层或核心层，沿 `imports` 关系向数据访问、RPC 客户端、缓存和工具层展开。
- 对于包含大量 `kitex_gen` 或生成代码的项目，优先阅读业务目录，生成代码只作为协议边界参考。
