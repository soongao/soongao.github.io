# 架构层级
> 项目：`uri_task_control_panel`。本页由当前 Codex 会话基于 GitNexus 索引元信息和 `.ua/knowledge-graph.json` 生成。
> GitNexus flows：63## 层级划分

| 层 | 职责 | 节点数 | 代表文件 |
| --- | --- | --- | --- |
| 核心层 | 项目核心代码和未归入特定目录模式的文件。 | 26 | `.ua/.understandignore`<br>`build.sh`<br>`cmd/main.go`<br>`examples/hertz_client/main.go`<br>`internal/barrier/barrier_test.go`<br>`internal/barrier/barrier.go`<br>`internal/collector/collector_test.go`<br>`internal/collector/collector.go` |
| 接口层 | HTTP 接口、路由处理器和 API 控制器。 | 3 | `internal/api/handlers_test.go`<br>`internal/api/handlers.go`<br>`internal/api/response.go` |
| 配置层 | 应用配置、环境变量和构建配置。 | 1 | `internal/config/config.go` |
| 后台任务层 | 后台任务、队列消费和定时调度。 | 7 | `internal/job/file_scanner_test.go`<br>`internal/job/file_scanner.go`<br>`internal/job/manager_test.go`<br>`internal/job/manager.go`<br>`internal/scheduler/lambda_launcher_test.go`<br>`internal/scheduler/lambda_launcher.go`<br>`internal/scheduler/scheduler.go` |

## 跨层依赖

| 依赖方向 | imports 数 |
| --- | --- |
| 接口层 -> 核心层 | 12 |
| 后台任务层 -> 核心层 | 10 |
| 核心层 -> 配置层 | 8 |
| 核心层 -> 后台任务层 | 7 |
| 后台任务层 -> 配置层 | 6 |
| 接口层 -> 后台任务层 | 4 |
| 核心层 -> 接口层 | 3 |
| 接口层 -> 配置层 | 2 |

## 架构阅读建议

- 先从入口文件和配置层看启动参数、环境配置与服务装配。
- 再进入业务服务层或核心层，沿 `imports` 关系向数据访问、RPC 客户端、缓存和工具层展开。
- 对于包含大量 `kitex_gen` 或生成代码的项目，优先阅读业务目录，生成代码只作为协议边界参考。
