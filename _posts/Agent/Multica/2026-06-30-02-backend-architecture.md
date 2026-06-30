---
title: "02-backend-architecture"
categories: [Agent, Multica]
tags: [Agent, Multica]
---

# 后端架构

## 后端目录

| 目录 | 作用 |
| --- | --- |
| `server/cmd/server/` | API server 入口、router、事件 listener、后台 worker glue code |
| `server/cmd/multica/` | `multica` CLI 命令入口，包括 auth、workspace、issue、agent、daemon、runtime 等命令 |
| `server/cmd/migrate/` | 数据库 migration 命令 |
| `server/cmd/backfill_*` | 运维/数据回填命令 |
| `server/internal/handler/` | HTTP handler 层，负责 auth/workspace 边界、request/response、调用 service/sqlc |
| `server/internal/service/` | 业务服务层：task、issue、autopilot、email、builtin skills 等 |
| `server/internal/daemon/` | 本地 daemon 主循环、server client、执行环境、runtime sync、skill cache |
| `server/internal/realtime/` | WebSocket Hub、Redis relay、sharded streams、metrics |
| `server/internal/events/` | 同步 in-process pub/sub 事件总线 |
| `server/internal/middleware/` | Auth、workspace、client metadata、rate limit、CSP 等 middleware |
| `server/internal/integrations/` | Channel engine、Lark/Feishu、Slack 等外部平台集成 |
| `server/internal/storage/` | S3/local attachment storage |
| `server/internal/scheduler/` | DB-backed periodic job manager |
| `server/internal/metrics/` | Prometheus/业务指标 |
| `server/pkg/db/queries/` | sqlc SQL 源文件 |
| `server/pkg/db/generated/` | sqlc 生成 Go 代码 |
| `server/pkg/agent/` | 各 agent CLI backend 的统一执行接口 |
| `server/pkg/protocol/` | WS/event/message 协议常量和结构 |
| `server/pkg/featureflag/` | feature flag provider/service |

## Server 启动链路

入口是 `server/cmd/server/main.go`。

启动顺序大致是：

1. 初始化 logger，读取 env，告警缺失配置。
2. 初始化 feature flag，并注入 daemon `execenv`。
3. 建立 PostgreSQL `pgxpool`，ping 数据库。
4. 创建 `events.Bus`、`realtime.Hub`、`daemonws.Hub`。
5. 如果有 `REDIS_URL`，创建 request-path Redis client 和 realtime relay client，按 `REALTIME_RELAY_MODE` 选择 legacy/sharded/dual relay。
6. `registerListeners(bus, broadcaster)` 先注册实时广播 listener。
7. 初始化 analytics、sqlc `queries`。
8. 设置 realtime hub authorizer。
9. 注册 subscriber、activity、notification listener。这里顺序重要：subscriber listener 在 notification listener 前注册，保证同一事件里先写订阅者再算通知收件人。
10. 可选启动 metrics server，并创建业务 metrics。
11. 构造 `HeartbeatScheduler`。
12. 调用 `NewRouterWithOptions(...)` 构造 Chi router 和 `*handler.Handler`。
13. 创建 `TaskService`、`AutopilotService`，注册 autopilot listeners。
14. 启动后台 goroutine：runtime sweeper、heartbeat batcher、autopilot failure monitor、DB stats logger、channel supervisor、DB-backed scheduler、metrics server、HTTP server。
15. 捕获 SIGINT/SIGTERM，先 drain HTTP，再停 sweeper/heartbeat/channel supervisor/metrics，最后退出。

## Router 分组

路由总表在 `server/cmd/server/router.go`。主要分组：

| 分组 | 示例 | 认证/作用 |
| --- | --- | --- |
| Health | `/health`, `/readyz`, `/healthz`, `/health/realtime` | 健康检查和 realtime 指标 |
| Realtime WS | `/ws` | Cookie 或首帧 token auth，按 workspace 订阅 |
| Public auth | `/auth/send-code`, `/auth/verify-code`, `/auth/google`, `/auth/logout` | 登录验证码/Google auth |
| Public API | `/api/config`, `/api/contact-sales` | 无需登录或只做限流 |
| Public webhooks | `/api/webhooks/autopilots/{token}`, `/api/webhooks/github`, `/api/webhooks/stripe` | 自带签名/token 认证 |
| Daemon API | `/api/daemon/**` | `DaemonAuth`，daemon token 或用户 token |
| Auth user API | `/api/me`, `/api/workspaces`, `/api/tokens`, `/api/invitations`, `/api/upload-file` | 普通登录用户 |
| Workspace API | `/api/issues`, `/api/projects`, `/api/agents`, `/api/runtimes`, `/api/chat`, `/api/inbox` 等 | `RequireWorkspaceMember` |
| Admin/owner 子路由 | workspace update、member mutation、runtime profile mutation、integration management | `RequireWorkspaceRoleFromURL` |

Workspace-scoped API 的身份来自 `X-Workspace-ID` 或 `X-Workspace-Slug`。前端通常只发 slug，后端 middleware 解析成 UUID。

## Handler 结构

`server/internal/handler/handler.go` 的 `Handler` 是 HTTP 层聚合对象，持有：

- `Queries` / `DB` / `TxStarter`：sqlc 查询和事务入口。
- `Hub` / `DaemonHub` / `Bus`：实时广播、daemon WS、领域事件。
- `TaskService` / `IssueService` / `AutopilotService` / `EmailService`。
- Runtime request stores：update、model list、local skills、liveness、rate limiter，可用 Redis 替换内存实现。
- `Storage` 和 CloudFront signer：attachment 相关。
- Analytics、metrics、PAT/daemon token/membership cache。
- Cloud runtime proxy。
- Lark/Slack/channel supervisor/router。
- 全局 config，如 signup、public URL、trusted proxies、cloud runtime URL、attachment download mode。

典型 handler 责任：

- 解析 URL/body/query/header。
- 认证用户、daemon、workspace、role。
- 对用户输入 UUID 做边界校验。
- 调用 service 或 `Queries`。
- 组装 response DTO。
- publish domain event。

## Service 层

`server/internal/service` 承担跨 handler 的业务语义。

主要服务：

- `TaskService`：创建/claim/start/complete/fail/cancel/retry task，广播 task event，通知 daemon wakeup，记录 analytics/metrics，解析 task 所属 workspace。
- `IssueService`：issue 创建/更新相关业务规则，触发 assignment/comment/child done 等任务。
- `AutopilotService`：autopilot trigger/run 创建和同步，支持 scheduled/webhook/manual。
- `EmailService`：验证码/邮件发送。
- `BuiltinSkills`：内置 skills 管理。
- `EmptyClaimCache`：daemon 空 claim 缓存，Redis 可选。

经验规则：

- 只属于 HTTP 边界的逻辑放 handler。
- 多入口共享、需要事务/事件/副作用一致性的逻辑放 service。
- SQL 读写优先走 `Queries`，复杂事务用 `q.WithTx(tx)`。

## 数据访问

后端用 sqlc：

- SQL 源：`server/pkg/db/queries/*.sql`
- Schema/migrations：`server/migrations/*.sql`
- 生成代码：`server/pkg/db/generated/*.go`
- 配置：`server/sqlc.yaml`

SQL 改动后运行：

```bash
make sqlc
```

API handler/service 中常见调用形态：

```go
queries := db.New(pool)
issue, err := queries.GetIssueInWorkspace(ctx, db.GetIssueInWorkspaceParams{...})
```

事务形态：

```go
tx, err := pool.Begin(ctx)
qtx := queries.WithTx(tx)
// qtx.SomeMutation(...)
// tx.Commit(ctx)
```

## 事件副作用

后端事件总线在 `server/internal/events/bus.go`：

- `Subscribe(eventType, handler)` 注册类型 listener。
- `SubscribeAll(handler)` 注册全局 listener。
- `Publish(e)` 同步调用 listener，单个 listener panic 会被 recover。

主要 listener：

- `registerListeners`：把 event 转成 WS 消息，personal event 发给用户，其他 workspace event 发到 workspace room。
- `registerSubscriberListeners`：issue 创建/更新/comment 创建时自动维护 issue subscriber。
- `registerActivityListeners`：写 `activity_log`，再发布 `activity:created`。
- `registerNotificationListeners`：写 `inbox_item`，再发布 `inbox:new` 等。
- `registerAutopilotListeners`：issue/task 终态同步 autopilot run。

事件生产者通常是 handler/service，比如 issue 创建后 publish `issue:created`，task 状态变化后 publish `task:queued/running/completed/failed`。

## 后台任务

`main.go` 启动的主要后台任务：

- `runRuntimeSweeper`：标记 stale runtime offline，处理 stale task。
- `heartbeatScheduler.Run`：批处理 daemon heartbeat。
- `runAutopilotFailureMonitor`：检查 autopilot failure。
- `runDBStatsLogger`：记录连接池状态。
- `ChannelSupervisor.Run`：持有 channel installation lease，运行 Lark/Slack inbound channel。
- `scheduler.Manager.Run`：DB-backed periodic jobs，如 task usage hourly rollup、autopilot schedule dispatch。
- `metricsServer.ListenAndServe`：独立 metrics listener。

## 扩展一个 API 的定位路线

1. 找路由：`server/cmd/server/router.go`。
2. 找 handler：`server/internal/handler/<domain>.go`。
3. 找 service：`server/internal/service/<domain>.go`。
4. 找 SQL：`server/pkg/db/queries/<domain>.sql`。
5. 看 generated model/params：`server/pkg/db/generated/<domain>.sql.go` 和 `models.go`。
6. 看前端调用：`packages/core/api/client.ts`、`packages/core/<domain>/queries.ts`、`mutations.ts`。
7. 看共享页面：`packages/views/<domain>/`。

