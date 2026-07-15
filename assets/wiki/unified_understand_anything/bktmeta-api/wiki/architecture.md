# 架构层级
> 项目：`bktmeta-api`。本页由当前 Codex 会话基于 GitNexus 索引元信息和 `.ua/knowledge-graph.json` 生成。
> GitNexus flows：155## 层级划分

| 层 | 职责 | 节点数 | 代表文件 |
| --- | --- | --- | --- |
| 核心层 | 项目核心代码和未归入特定目录模式的文件。 | 112 | `.ua/.understandignore`<br>`build.sh`<br>`constant/constant.go`<br>`dto/page.go`<br>`dto/tempBucket.go`<br>`errno/error.go`<br>`errno/response_test.go`<br>`errno/response.go` |
| 配置层 | 应用配置、环境变量和构建配置。 | 5 | `config/base_test.go`<br>`config/config.go`<br>`config/mysql_test.go`<br>`config/mysql.go`<br>`config/tcc_merge_test.go` |
| 数据层 | 数据模型、数据库访问和持久化逻辑。 | 21 | `db/base_test.go`<br>`db/bucket_doc_test.go`<br>`db/bucket_doc.go`<br>`db/bucket_idc_config_test.go`<br>`db/bucket_idc_config.go`<br>`db/bucket_test.go`<br>`db/bucket.go`<br>`db/db_test.go` |
| 中间件层 | 请求、响应和横切处理逻辑。 | 5 | `middleware/agw_test.go`<br>`middleware/agw.go`<br>`middleware/base_test.go`<br>`middleware/base.go`<br>`middleware/zti_middleware.go` |
| 服务层 | 业务逻辑和应用服务。 | 30 | `service/async_task_test.go`<br>`service/async_task.go`<br>`service/base_test.go`<br>`service/bpm_handler_test.go`<br>`service/bpm_handler.go`<br>`service/bucket_doc_api_test.go`<br>`service/bucket_doc_api.go`<br>`service/bucket_encryption_handler_test.go` |
| 工具层 | 共享工具函数、辅助库和通用能力。 | 19 | `util/aes_test.go`<br>`util/aes.go`<br>`util/base_test.go`<br>`util/cache_test.go`<br>`util/cache.go`<br>`util/context.go`<br>`util/distributed_limiter_test.go`<br>`util/distributed_limiter.go` |

## 跨层依赖

| 依赖方向 | imports 数 |
| --- | --- |
| 服务层 -> 数据层 | 399 |
| 服务层 -> 核心层 | 227 |
| 核心层 -> 工具层 | 152 |
| 数据层 -> 工具层 | 133 |
| 核心层 -> 配置层 | 85 |
| 服务层 -> 工具层 | 76 |
| 服务层 -> 中间件层 | 65 |
| 服务层 -> 配置层 | 60 |
| 数据层 -> 核心层 | 59 |
| 中间件层 -> 工具层 | 38 |
| 中间件层 -> 核心层 | 36 |
| 核心层 -> 服务层 | 30 |
| 工具层 -> 配置层 | 30 |
| 数据层 -> 配置层 | 25 |
| 核心层 -> 数据层 | 21 |
| 核心层 -> 中间件层 | 15 |
| 中间件层 -> 配置层 | 15 |

## 架构阅读建议

- 先从入口文件和配置层看启动参数、环境配置与服务装配。
- 再进入业务服务层或核心层，沿 `imports` 关系向数据访问、RPC 客户端、缓存和工具层展开。
- 对于包含大量 `kitex_gen` 或生成代码的项目，优先阅读业务目录，生成代码只作为协议边界参考。
