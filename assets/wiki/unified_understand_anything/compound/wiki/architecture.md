# 架构层级
> 项目：`compound`。本页由当前 Codex 会话基于 GitNexus 索引元信息和 `.ua/knowledge-graph.json` 生成。
> GitNexus flows：300## 层级划分

| 层 | 职责 | 节点数 | 代表文件 |
| --- | --- | --- | --- |
| 核心层 | 项目核心代码和未归入特定目录模式的文件。 | 390 | `.githooks/pre-commit`<br>`.ua/.understandignore`<br>`build.sh`<br>`errno/code_test.go`<br>`errno/code.go`<br>`fuxi/comm/midware/downstream_ratelimit_test.go`<br>`fuxi/comm/midware/downstream_ratelimit.go`<br>`fuxi/comm/midware/midware.go` |
| 外部集成层 | 外部服务集成、SDK 和适配器。 | 24 | `fuxi/client/abase/abase_test.go`<br>`fuxi/client/abase/abase.go`<br>`fuxi/client/account/account_test.go`<br>`fuxi/client/account/account.go`<br>`fuxi/client/admin/admin_test.go`<br>`fuxi/client/admin/admin.go`<br>`fuxi/client/admin/reg_attr_index_test.go`<br>`fuxi/client/admin/reg_attr_index.go` |
| 工具层 | 共享工具函数、辅助库和通用能力。 | 104 | `fuxi/comm/utils/ast/assert.go`<br>`fuxi/comm/utils/ast/chain.go`<br>`fuxi/comm/utils/ast/diff.go`<br>`fuxi/comm/utils/ast/equal_test.go`<br>`fuxi/comm/utils/cache/cache.go`<br>`fuxi/comm/utils/cache/local.go`<br>`fuxi/comm/utils/cache/test_cache/local_test.go`<br>`fuxi/comm/utils/clock/clock_test.go` |
| 配置层 | 应用配置、环境变量和构建配置。 | 8 | `fuxi/core/config/constant.go`<br>`fuxi/core/config/keys.go`<br>`fuxi/core/config/structs.go`<br>`fuxi/fuxi_admin/config/validator_test.go`<br>`fuxi/fuxi_admin/config/validator.go`<br>`fuxi/fuxi_admin/configs/config_test.go`<br>`fuxi/fuxi_admin/configs/config.go`<br>`fuxi/fuxi_admin/configs/tcc.go` |
| 数据层 | 数据模型、数据库访问和持久化逻辑。 | 21 | `fuxi/core/consts/entity/attr_value_test.go`<br>`fuxi/core/consts/entity/attr_value.go`<br>`fuxi/core/consts/entity/bucket_test.go`<br>`fuxi/core/consts/entity/bucket.go`<br>`fuxi/core/consts/entity/event.go`<br>`fuxi/core/consts/entity/idx_test.go`<br>`fuxi/core/consts/entity/idx.go`<br>`fuxi/core/consts/entity/idxcolval_test.go` |
| 服务层 | 业务逻辑和应用服务。 | 78 | `fuxi/core/service/checker_test.go`<br>`fuxi/core/service/checker.go`<br>`fuxi/core/service/idx/archive/docs/tla/IdxFlawA.tla`<br>`fuxi/core/service/idx/archive/docs/tla/IdxFlawB.tla`<br>`fuxi/core/service/idx/archive/docs/tla/IdxFlawC.tla`<br>`fuxi/core/service/idx/archive/docs/tla/IdxFlawD.tla`<br>`fuxi/core/service/idx/archive/docs/tla/IdxLiveness.tla`<br>`fuxi/core/service/idx/bucketed_operator_test.go` |
| 测试层 | 测试文件和测试辅助代码。 | 2 | `fuxi/core/test/storage.go`<br>`fuxi/core/test/test_common.go` |
| 界面层 | 用户界面组件和页面视图。 | 2 | `fuxi/core/utils/view/sql_test.go`<br>`fuxi/core/utils/view/sql.go` |
| 接口层 | HTTP 接口、路由处理器和 API 控制器。 | 26 | `fuxi/fuxi_admin/biz/handler/collection_uniqueness_simple_bucket_test.go`<br>`fuxi/fuxi_admin/biz/handler/collection_uniqueness_test.go`<br>`fuxi/fuxi_admin/biz/handler/collection_uniqueness.go`<br>`fuxi/fuxi_admin/biz/handler/configurationsHandler_test.go`<br>`fuxi/fuxi_admin/biz/handler/configurationsHandler.go`<br>`fuxi/fuxi_admin/biz/handler/ping.go`<br>`fuxi/fuxi_admin/biz/handler/schemaBindingsHandler_test.go`<br>`fuxi/fuxi_admin/biz/handler/schemaBindingsHandler.go` |
| 中间件层 | 请求、响应和横切处理逻辑。 | 2 | `fuxi/fuxi_admin/middleware/federation_proxy.go`<br>`fuxi/fuxi_admin/middleware/log.go` |

## 跨层依赖

| 依赖方向 | imports 数 |
| --- | --- |
| 服务层 -> 数据层 | 444 |
| 服务层 -> 工具层 | 382 |
| 服务层 -> 核心层 | 246 |
| 核心层 -> 工具层 | 222 |
| 接口层 -> 服务层 | 215 |
| 接口层 -> 核心层 | 201 |
| 服务层 -> 外部集成层 | 184 |
| 接口层 -> 数据层 | 144 |
| 工具层 -> 数据层 | 132 |
| 核心层 -> 数据层 | 105 |
| 接口层 -> 工具层 | 87 |
| 外部集成层 -> 数据层 | 84 |
| 外部集成层 -> 工具层 | 79 |
| 外部集成层 -> 核心层 | 56 |
| 接口层 -> 外部集成层 | 50 |
| 工具层 -> 核心层 | 40 |
| 数据层 -> 核心层 | 31 |
| 核心层 -> 配置层 | 24 |
| 核心层 -> 外部集成层 | 22 |
| 服务层 -> 配置层 | 21 |
| 核心层 -> 接口层 | 20 |
| 工具层 -> 外部集成层 | 16 |
| 测试层 -> 核心层 | 13 |
| 配置层 -> 数据层 | 12 |
| 接口层 -> 测试层 | 10 |
| 测试层 -> 接口层 | 8 |
| 外部集成层 -> 服务层 | 6 |
| 工具层 -> 配置层 | 6 |
| 工具层 -> 服务层 | 6 |
| 配置层 -> 核心层 | 6 |

## 架构阅读建议

- 先从入口文件和配置层看启动参数、环境配置与服务装配。
- 再进入业务服务层或核心层，沿 `imports` 关系向数据访问、RPC 客户端、缓存和工具层展开。
- 对于包含大量 `kitex_gen` 或生成代码的项目，优先阅读业务目录，生成代码只作为协议边界参考。
