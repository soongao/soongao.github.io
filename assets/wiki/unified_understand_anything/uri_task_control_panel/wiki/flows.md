# 关键流程
> 项目：`uri_task_control_panel`。本页由当前 Codex 会话基于 GitNexus 索引元信息和 `.ua/knowledge-graph.json` 生成。
> GitNexus processes：63## 导览路径

## 1. 核心层

阅读这些节点以理解 核心层 中的职责、依赖关系和主要文件。

- `.ua/.understandignore` (file)
- `cmd/main.go` (file)
- `examples/hertz_client/main.go` (file)
- `script/bootstrap.sh` (file)
- `internal/barrier/barrier.go` (file)
- `internal/finalizer/finalizer.go` (file)
- `internal/writerrpc/client.go` (file)
- `build.sh` (file)
- `internal/collector/collector.go` (file)
- `internal/barrier/barrier_test.go` (file)
- `internal/finalizer/finalizer_test.go` (file)
- `internal/writerrpc/client_test.go` (file)
- `internal/collector/collector_test.go` (file)
- `internal/store/keys.go` (file)
- `internal/store/store.go` (file)
- `internal/store/store_test.go` (file)
- `internal/types/dto.go` (file)
- `internal/types/states.go` (file)

## 2. 接口层

阅读这些节点以理解 接口层 中的职责、依赖关系和主要文件。

- `internal/api/handlers.go` (file)
- `internal/api/response.go` (file)
- `internal/api/handlers_test.go` (file)

## 3. 后台任务层

阅读这些节点以理解 后台任务层 中的职责、依赖关系和主要文件。

- `internal/job/file_scanner.go` (file)
- `internal/job/manager.go` (file)
- `internal/job/file_scanner_test.go` (file)
- `internal/job/manager_test.go` (file)
- `internal/scheduler/lambda_launcher.go` (file)
- `internal/scheduler/scheduler.go` (file)
- `internal/scheduler/lambda_launcher_test.go` (file)

## 4. 配置层

阅读这些节点以理解 配置层 中的职责、依赖关系和主要文件。

- `internal/config/config.go` (file)

## 5. 支撑组件

阅读这些节点以理解 Supporting Components 中的职责、依赖关系和主要文件。

- `.ua/config.json` (config)
- `api/swagger.yaml` (config)
- `conf/base.yml` (config)
- `conf/hertz.config.yaml` (config)
- `docs/integration.md` (document)
- `README.md` (document)
- `cmd/main.go` (function)
- `examples/hertz_client/main.go` (function)
- `examples/hertz_client/main.go` (function)
- `examples/hertz_client/main.go` (function)
- `examples/hertz_client/main.go` (function)
- `examples/hertz_client/main.go` (function)
- `examples/hertz_client/main.go` (function)
- `examples/hertz_client/main.go` (function)
- `examples/hertz_client/main.go` (function)
- `examples/hertz_client/main.go` (function)
- `examples/hertz_client/main.go` (class)
- `go.mod` (config)

## 代表性关系

| 关系 | 源 | 目标 |
| --- | --- | --- |
| imports | cmd/main.go | internal/api/handlers_test.go |
| imports | cmd/main.go | internal/api/handlers.go |
| imports | cmd/main.go | internal/api/response.go |
| imports | cmd/main.go | internal/barrier/barrier_test.go |
| imports | cmd/main.go | internal/barrier/barrier.go |
| imports | cmd/main.go | internal/collector/collector_test.go |
| imports | cmd/main.go | internal/collector/collector.go |
| imports | cmd/main.go | internal/config/config.go |
| imports | cmd/main.go | internal/finalizer/finalizer_test.go |
| imports | cmd/main.go | internal/finalizer/finalizer.go |
| imports | cmd/main.go | internal/job/file_scanner_test.go |
| imports | cmd/main.go | internal/job/file_scanner.go |
| imports | cmd/main.go | internal/job/manager_test.go |
| imports | cmd/main.go | internal/job/manager.go |
| imports | cmd/main.go | internal/scheduler/lambda_launcher_test.go |
| imports | cmd/main.go | internal/scheduler/lambda_launcher.go |
| imports | cmd/main.go | internal/scheduler/scheduler.go |
| imports | cmd/main.go | internal/store/keys.go |
| imports | cmd/main.go | internal/store/store_test.go |
| imports | cmd/main.go | internal/store/store.go |
| imports | cmd/main.go | internal/writerrpc/client_test.go |
| imports | cmd/main.go | internal/writerrpc/client.go |
| imports | examples/hertz_client/main.go | internal/types/dto.go |
| imports | examples/hertz_client/main.go | internal/types/states.go |
| imports | internal/api/handlers_test.go | internal/config/config.go |
| imports | internal/api/handlers_test.go | internal/store/keys.go |
| imports | internal/api/handlers_test.go | internal/store/store_test.go |
| imports | internal/api/handlers_test.go | internal/store/store.go |
| imports | internal/api/handlers_test.go | internal/types/dto.go |
| imports | internal/api/handlers_test.go | internal/types/states.go |
| imports | internal/api/handlers.go | internal/collector/collector_test.go |
| imports | internal/api/handlers.go | internal/collector/collector.go |
| imports | internal/api/handlers.go | internal/config/config.go |
| imports | internal/api/handlers.go | internal/job/file_scanner_test.go |
| imports | internal/api/handlers.go | internal/job/file_scanner.go |
| imports | internal/api/handlers.go | internal/job/manager_test.go |
| imports | internal/api/handlers.go | internal/job/manager.go |
| imports | internal/api/handlers.go | internal/store/keys.go |
| imports | internal/api/handlers.go | internal/store/store_test.go |
| imports | internal/api/handlers.go | internal/store/store.go |
| imports | internal/api/handlers.go | internal/types/dto.go |
| imports | internal/api/handlers.go | internal/types/states.go |
| imports | internal/barrier/barrier_test.go | internal/config/config.go |
| imports | internal/barrier/barrier_test.go | internal/store/keys.go |
| imports | internal/barrier/barrier_test.go | internal/store/store_test.go |
| imports | internal/barrier/barrier_test.go | internal/store/store.go |
| imports | internal/barrier/barrier_test.go | internal/types/dto.go |
| imports | internal/barrier/barrier_test.go | internal/types/states.go |
| imports | internal/barrier/barrier.go | internal/config/config.go |
| imports | internal/barrier/barrier.go | internal/store/keys.go |
| imports | internal/barrier/barrier.go | internal/store/store_test.go |
| imports | internal/barrier/barrier.go | internal/store/store.go |
| imports | internal/barrier/barrier.go | internal/types/dto.go |
| imports | internal/barrier/barrier.go | internal/types/states.go |
| imports | internal/collector/collector_test.go | internal/config/config.go |
| imports | internal/collector/collector_test.go | internal/store/keys.go |
| imports | internal/collector/collector_test.go | internal/store/store_test.go |
| imports | internal/collector/collector_test.go | internal/store/store.go |
| imports | internal/collector/collector_test.go | internal/types/dto.go |
| imports | internal/collector/collector_test.go | internal/types/states.go |
| imports | internal/collector/collector.go | internal/store/keys.go |
| imports | internal/collector/collector.go | internal/store/store_test.go |
| imports | internal/collector/collector.go | internal/store/store.go |
| imports | internal/collector/collector.go | internal/types/dto.go |
| imports | internal/collector/collector.go | internal/types/states.go |
| imports | internal/finalizer/finalizer_test.go | internal/config/config.go |
| imports | internal/finalizer/finalizer_test.go | internal/store/keys.go |
| imports | internal/finalizer/finalizer_test.go | internal/store/store_test.go |
| imports | internal/finalizer/finalizer_test.go | internal/store/store.go |
| imports | internal/finalizer/finalizer_test.go | internal/types/dto.go |
| imports | internal/finalizer/finalizer_test.go | internal/types/states.go |
| imports | internal/finalizer/finalizer.go | internal/config/config.go |
| imports | internal/finalizer/finalizer.go | internal/store/keys.go |
| imports | internal/finalizer/finalizer.go | internal/store/store_test.go |
| imports | internal/finalizer/finalizer.go | internal/store/store.go |
| imports | internal/job/file_scanner_test.go | internal/config/config.go |
| imports | internal/job/file_scanner.go | internal/config/config.go |
| imports | internal/job/manager_test.go | internal/config/config.go |
| imports | internal/job/manager_test.go | internal/scheduler/lambda_launcher_test.go |
| imports | internal/job/manager_test.go | internal/scheduler/lambda_launcher.go |
