---
title: "04-data-events-and-realtime"
categories: [Agent, Multica]
tags: [Agent, Multica]
---

# 数据、事件与实时同步

## 数据库与 sqlc

Multica 的后端数据访问链路是：

```text
migrations/*.sql -> pkg/db/queries/*.sql -> sqlc -> pkg/db/generated/*.go -> handler/service
```

关键文件：

- `server/sqlc.yaml`
- `server/migrations/*.up.sql` / `*.down.sql`
- `server/pkg/db/queries/*.sql`
- `server/pkg/db/generated/models.go`
- `server/pkg/db/generated/*.sql.go`

常见主表：

| 表 | 说明 |
| --- | --- |
| `user` | 用户账户 |
| `workspace` | 团队/租户 |
| `member` | 用户在 workspace 中的成员和角色 |
| `agent` | AI teammate 配置 |
| `agent_runtime` | 可执行 agent 的 runtime |
| `agent_task_queue` | agent 任务队列和执行状态 |
| `issue` | 任务/工单主体 |
| `comment` | issue 评论 |
| `issue_label`, `issue_to_label` | 标签 |
| `issue_subscriber` | issue 订阅者 |
| `activity_log` | 活动审计 |
| `inbox_item` | 用户通知 |
| `attachment` | 附件 |
| `skill`, `skill_file`, `agent_skill` | skill 体系 |
| `chat_session`, `chat_message` | chat 任务入口 |
| `autopilot`, `autopilot_trigger`, `autopilot_run` | 自动任务 |
| `squad`, `squad_member` | squad 路由层 |
| `task_message`, `task_usage` | agent 执行消息与 token/usage |
| `runtime_profile` | 自定义 runtime profile |
| `channel_*`, `lark_*` | channel/Lark/Slack 集成 |
| `task_usage_*` | usage rollup |
| `sys_cron_executions` | DB-backed scheduler 状态 |

## Workspace 隔离

绝大多数业务表带 `workspace_id`。核心规则：

- API 请求用 `X-Workspace-ID` 或 `X-Workspace-Slug` 选择 workspace。
- Web/Desktop 前端通常通过当前 URL slug 设置 `X-Workspace-Slug`。
- 后端 middleware 解析 workspace 并检查 membership。
- handler 写查询前要确认实体属于当前 workspace。
- `CLAUDE.md` 特别强调：所有查询过滤 `workspace_id`，membership gate 访问。

## 事件总线

`server/internal/events/bus.go` 是同步 in-process pub/sub：

```go
type Event struct {
    Type        string
    WorkspaceID string
    ActorType   string
    ActorID     string
    Payload     any
    TaskID      string
    ChatSessionID string
}
```

特点：

- `Publish` 同步执行 listener。
- 同事件 type listener 先执行，再执行 global listener。
- 单个 listener panic 被 recover，不阻断后续 listener。
- listener 注册顺序有业务意义。`main.go` 中 subscriber listener 要先于 notification listener。

常见事件常量在 `server/pkg/protocol/events.go`。

## 后端事件 listener

| 注册函数 | 文件 | 作用 |
| --- | --- | --- |
| `registerListeners` | `server/cmd/server/listeners.go` | 事件转 WebSocket 广播 |
| `registerSubscriberListeners` | `server/cmd/server/subscriber_listeners.go` | 自动添加 issue subscriber |
| `registerActivityListeners` | `server/cmd/server/activity_listeners.go` | 写 `activity_log` 并发布 activity event |
| `registerNotificationListeners` | `server/cmd/server/notification_listeners.go` | 写 `inbox_item` 并发布 inbox event |
| `registerAutopilotListeners` | `server/cmd/server/autopilot_listeners.go` | issue/task 终态同步 autopilot run |

## Realtime Hub

主要文件：

- `server/internal/realtime/hub.go`
- `server/internal/realtime/broadcaster.go`
- `server/internal/realtime/redis_relay.go`
- `server/internal/realtime/sharded_stream_relay.go`

`Hub` 维护在线 WS client、workspace room、用户定向发送、订阅 scope。

WebSocket 入口：

- HTTP route：`GET /ws`
- 处理函数：`realtime.HandleWebSocket`
- 认证方式：
  - Cookie auth：从 `multica_auth` cookie 解析。
  - Token mode：连接后首帧 `{ type: "auth", payload: { token } }`。
- Workspace 选择：query 参数 `workspace_id` 或 `workspace_slug`。
- 连接身份信息：query 参数 `client_platform`、`client_version`、`client_os`。

## Redis relay

`main.go` 中如果 `REDIS_URL` 存在，会启用 Redis fanout：

- request-path Redis client：store/liveness/rate limiter/cache。
- realtime write client：写 relay。
- realtime read client：读 relay stream。

`REALTIME_RELAY_MODE`：

- `sharded`：默认，`NewShardedStreamRelay`。
- `legacy`：旧 Redis relay。
- `dual`：同时写 sharded 和 legacy，用于迁移验证。

无 Redis 时：

- 使用 in-memory hub。
- 单 API node 场景足够。
- rate limiting 和部分 request store 降级为内存/禁用。

## 前端 WS 同步

关键文件：

- `packages/core/api/ws-client.ts`
- `packages/core/realtime/provider.tsx`
- `packages/core/realtime/use-realtime-sync.ts`
- `packages/core/issues/ws-updaters.ts`
- `packages/core/inbox/ws-updaters.ts`

链路：

1. `CoreProvider` 挂 `WSProvider`。
2. `WSProvider` 从 auth store 和 workspace singleton 拿 user/slug。
3. 创建 `WSClient`，连接 `wsUrl`，把 workspace slug 和 client identity 放到 query param。
4. token mode 下，WS open 后发送 auth 首帧；cookie mode 下直接等服务端 cookie auth。
5. 收到 frame 后按 `type` 调 handler。
6. `useRealtimeSync` 订阅事件，patch/invalidate React Query cache。
7. reconnect 或 workspace switch 时，统一 invalidate workspace-scoped queries 以补漏。

## 事件到 UI 的典型路径

以 issue 更新为例：

```text
HTTP PUT /api/issues/{id}
  -> Handler.UpdateIssue
  -> IssueService / Queries 更新 DB
  -> Bus.Publish(issue:updated)
  -> registerSubscriberListeners 可能新增 subscriber
  -> registerActivityListeners 写 activity_log，Publish(activity:created)
  -> registerNotificationListeners 写 inbox_item，Publish(inbox:new)
  -> registerListeners 把 issue:updated/activity:created/inbox:new 发 WS
  -> WSClient 收 frame
  -> useRealtimeSync patch/invalidate issue/activity/inbox query cache
  -> UI 重新渲染
```

## 事件设计上的注意点

- Personal events 不广播给整个 workspace，例如 inbox、invite，`registerListeners` 会定向 `SendToUser`。
- 非 personal workspace event 走 `BroadcastToWorkspace`。
- 目前 task/chat 的细粒度 scope routing 已有后端 hint，但默认仍走 workspace fanout，避免客户端未订阅 scope 时丢消息。
- Inbox notification 要按 source workspace 刷新和弹通知，不能按当前 active workspace 猜。
- Event payload 有时是 handler DTO，有时是 map，listener 里常有 normalizer 兼容两种路径。

## 数据变更学习路线

想理解某个字段或表：

1. `rg -n "CREATE TABLE <table>|ALTER TABLE <table>" server/migrations`
2. `rg -n "<table>|<column>" server/pkg/db/queries`
3. 看 `server/pkg/db/generated/<domain>.sql.go` 的 params 和返回 model。
4. 看 handler/service 调用。
5. 看 `packages/core/api/schemas.ts`、types 和 UI query。

