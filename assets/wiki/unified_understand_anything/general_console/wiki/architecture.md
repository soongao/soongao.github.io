# 架构层级
> 项目：`general_console`。本页由当前 Codex 会话基于 GitNexus 索引元信息和 `.ua/knowledge-graph.json` 生成。
> GitNexus flows：269## 层级划分

| 层 | 职责 | 节点数 | 代表文件 |
| --- | --- | --- | --- |
| 核心层 | 项目核心代码和未归入特定目录模式的文件。 | 76 | `.hertztool`<br>`.ua/.understandignore`<br>`biz/base.thrift`<br>`biz/dal/.gitkeep`<br>`biz/dal/dao/authority_test.go`<br>`biz/dal/dao/authority.go`<br>`biz/dal/dao/base_test.go`<br>`biz/dal/dao/db_test.go` |
| 配置层 | 应用配置、环境变量和构建配置。 | 6 | `biz/config/base_test.go`<br>`biz/config/config.go`<br>`biz/config/mysql_test.go`<br>`biz/config/mysql.go`<br>`biz/config/tcc_test.go`<br>`biz/config/tcc.go` |
| 接口层 | HTTP 接口、路由处理器和 API 控制器。 | 33 | `biz/handler/account_test.go`<br>`biz/handler/account.go`<br>`biz/handler/authorize_test.go`<br>`biz/handler/authorize.go`<br>`biz/handler/base_test.go`<br>`biz/handler/bpm_test.go`<br>`biz/handler/bpm.go`<br>`biz/handler/config_test.go` |
| 中间件层 | 请求、响应和横切处理逻辑。 | 5 | `biz/middleware/base_test.go`<br>`biz/middleware/base.go`<br>`biz/middleware/mdap_response_test.go`<br>`biz/middleware/parse_mdap_auth_test.go`<br>`biz/middleware/parse_mdap_auth.go` |
| 数据层 | 数据模型、数据库访问和持久化逻辑。 | 3 | `biz/model/bktmeta.go`<br>`biz/model/bpm_workflow.go`<br>`biz/model/tos.go` |
| 服务层 | 业务逻辑和应用服务。 | 1 | `biz/service/.gitkeep` |
| 工具层 | 共享工具函数、辅助库和通用能力。 | 7 | `biz/util/base_test.go`<br>`biz/util/ctx_test.go`<br>`biz/util/ctx.go`<br>`biz/util/iam_test.go`<br>`biz/util/iam.go`<br>`biz/util/metrics_test.go`<br>`biz/util/metrics.go` |

## 跨层依赖

| 依赖方向 | imports 数 |
| --- | --- |
| 核心层 -> 接口层 | 132 |
| 接口层 -> 核心层 | 114 |
| 接口层 -> 中间件层 | 75 |
| 接口层 -> 配置层 | 54 |
| 接口层 -> 工具层 | 49 |
| 核心层 -> 配置层 | 36 |
| 核心层 -> 工具层 | 28 |
| 中间件层 -> 核心层 | 16 |
| 核心层 -> 中间件层 | 10 |
| 核心层 -> 数据层 | 9 |
| 接口层 -> 数据层 | 6 |

## 架构阅读建议

- 先从入口文件和配置层看启动参数、环境配置与服务装配。
- 再进入业务服务层或核心层，沿 `imports` 关系向数据访问、RPC 客户端、缓存和工具层展开。
- 对于包含大量 `kitex_gen` 或生成代码的项目，优先阅读业务目录，生成代码只作为协议边界参考。
