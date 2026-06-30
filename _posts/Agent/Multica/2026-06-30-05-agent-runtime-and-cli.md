---
title: "05-agent-runtime-and-cli"
categories: [Agent, Multica]
tags: [Agent, Multica]
---

# Agent Runtime 与 CLI

## 三个相关可执行入口

| 入口 | 目录 | 作用 |
| --- | --- | --- |
| API server | `server/cmd/server/main.go` | 后端 HTTP/WS/API 服务 |
| CLI | `server/cmd/multica/main.go` | 用户本地命令 `multica` |
| Migration/backfill | `server/cmd/migrate`, `server/cmd/backfill_*` | DB migration 和数据修复任务 |

`multica` CLI 使用 Cobra。`server/cmd/multica/main.go` 初始化 root command，并挂载：

- Core：issue、project、label、agent、autopilot、workspace、repo、skill、squad
- Runtime：daemon、runtime
- Additional：auth、user、login、setup、attachment、config、update、version

CLI HTTP 通信主要经 `server/internal/cli`，daemon 运行时通信经 `server/internal/daemon/client.go`。

## Daemon 的职责

本地 daemon 是 agent 执行器，负责：

- 读取本地配置和 token。
- 向 server 注册 runtime。
- 同步 workspace/runtime profile/agent 可用性。
- 检测本机可用的 agent CLI。
- 轮询或被 daemon WS 唤醒后 claim task。
- 准备执行环境：repo/workdir、AGENTS/skill/context、runtime config、MCP config、resume session 等。
- 调用 `server/pkg/agent` 的 backend 执行 agent CLI。
- 上报 task start/progress/messages/usage/complete/fail。
- 处理 task cancellation/orphan recovery/update/model list/local skills 等控制面请求。

关键文件：

- `server/internal/daemon/daemon.go`
- `server/internal/daemon/client.go`
- `server/internal/daemon/config.go`
- `server/internal/daemon/prompt.go`
- `server/internal/daemon/execenv/*`
- `server/internal/daemon/repocache/*`
- `server/internal/daemon/skill_cache.go`
- `server/internal/daemon/local_skills.go`
- `server/internal/daemon/model_list_report_test.go`
- `server/internal/daemon/wakeup.go`

## Agent backend 统一接口

入口：`server/pkg/agent/agent.go`。

核心接口：

```go
type Backend interface {
    Execute(ctx context.Context, prompt string, opts ExecOptions) (*Session, error)
}
```

`ExecOptions` 包含：

- `Cwd`
- `Model`
- `SystemPrompt`
- `ThreadName`
- `MaxTurns`
- `Timeout`
- `SemanticInactivityTimeout`
- `ResumeSessionID`
- `ExtraArgs`
- `CustomArgs`
- `McpConfig`
- `ThinkingLevel`
- `OpenclawMode`

`Session`：

- `Messages <-chan Message`：执行中流式消息。
- `Result <-chan Result`：最终结果。

支持 provider 的构造在 `agent.New(agentType, cfg)` 中按字符串分派。

## Task 生命周期

核心表：`agent_task_queue`。

主要状态：

- `queued`
- `dispatched`
- `waiting_local_directory`
- `running`
- `completed`
- `failed`
- `cancelled`

核心 API 路由在 `server/cmd/server/router.go` 的 `/api/daemon` 分组：

| 路由 | Handler | 作用 |
| --- | --- | --- |
| `POST /api/daemon/register` | `DaemonRegister` | 注册 runtime |
| `POST /api/daemon/heartbeat` | `DaemonHeartbeat` | runtime 心跳 |
| `GET /api/daemon/ws` | `DaemonWebSocket` | daemon 控制面 WS |
| `POST /api/daemon/runtimes/{runtimeId}/tasks/claim` | `ClaimTaskByRuntime` | runtime claim 下一个 task |
| `POST /api/daemon/tasks/{taskId}/start` | `StartTask` | task 进入 running |
| `POST /api/daemon/tasks/{taskId}/progress` | `ReportTaskProgress` | 上报摘要进度 |
| `POST /api/daemon/tasks/{taskId}/messages` | `ReportTaskMessages` | 批量上报 agent 消息 |
| `POST /api/daemon/tasks/{taskId}/usage` | `ReportTaskUsage` | 上报 token/usage |
| `POST /api/daemon/tasks/{taskId}/complete` | `CompleteTask` | task completed |
| `POST /api/daemon/tasks/{taskId}/fail` | `FailTask` | task failed |
| `GET /api/daemon/tasks/{taskId}/status` | `GetTaskStatus` | 执行中检查取消/终态 |
| `POST /api/daemon/runtimes/{runtimeId}/recover-orphans` | `RecoverOrphanedTasks` | daemon 重启后恢复 orphan task |
| `POST /api/daemon/tasks/{taskId}/session` | `PinTaskSession` | 中途持久化 session/workdir resume 指针 |

## Task 生成入口

常见 enqueue 来源：

- 创建 issue 时直接分配给 agent。
- 更新 issue assignee/status 触发 agent。
- 评论中 `@agent` 或 `@squad`。
- Chat session 发送消息。
- Autopilot schedule/webhook/manual trigger。
- Squad leader delegation / handoff。
- 手动 rerun issue。

关键服务：

- `server/internal/service/task.go`
- `server/internal/service/issue.go`
- `server/internal/service/issue_trigger.go`
- `server/internal/service/autopilot.go`
- `server/internal/integrations/channel/engine/*`

`TaskService` 创建 task 后会：

1. 写 `agent_task_queue`。
2. 发布 `task:queued`。
3. 调 `NotifyTaskEnqueued`，通过 daemon wakeup 通知 runtime。

## Daemon 执行主链路

从 CodeGraph 可见主链路：

```text
runRuntimePoller
  -> waitForTaskSlot / capacityBackoff
  -> Client.ClaimTask
  -> handleTask
  -> Client.StartTask
  -> agent.Backend.Execute
  -> stream messages/progress/usage
  -> reportTaskResult
  -> Client.CompleteTask 或 Client.FailTask
```

执行期间 daemon 还会：

- 通过 `GetTaskStatus` 检查 server-side cancellation。
- 通过 `PinTaskSession` 保存 session_id/work_dir。
- 对 large skill bundle download 使用无固定超时 client，deadline 由 context 控制。
- terminal 上报使用 retry；server 侧 complete/fail 对已终态任务按幂等成功处理，降低响应丢失导致的重复终态风险。

## Daemon WS 与 wakeup

`server/internal/daemonws` 是 daemon 控制面 Hub。API server 在 `main.go` 创建 `daemonHub`，注入：

- `TaskService.Wakeup`
- runtime profile refresh notifier
- daemon heartbeat handler

如果 Redis relay 是 sharded/dual，`daemonWakeup` 会用 `daemonws.NewRelayNotifier`，跨 API node 通知 daemon。

无 Redis 或 legacy relay 时，daemon wakeup 降级到本地 `daemonHub`。

## 执行环境 `execenv`

`server/internal/daemon/execenv` 负责生成 agent 运行上下文，包括：

- runtime brief / slim brief feature flag。
- Codex home、memory、sandbox、user skills、多 agent 配置。
- Cursor MCP。
- OpenClaw gateway config。
- runtime config sections/kind。
- sidecar manifest。
- git/workdir 信息。
- reply instructions / handoff context。

这层决定 agent CLI 最终看到哪些文件、技能、prompt 和配置。

## Desktop 与 daemon

Desktop app 会在登录后：

1. 从 localStorage 取 `multica_token`。
2. 调 `window.daemonAPI.syncToken(token, userId)`。
3. 调 `window.daemonAPI.autoStart()`。
4. 在 logout 时清 tab/overlay/welcome 状态，清 daemon token，并 stop daemon。
5. 通过 daemon IPC bridge 把本机 daemon 在线/离线状态快速写入前端 runtime cache。

相关文件：

- `apps/desktop/src/renderer/src/App.tsx`
- `apps/desktop/src/main/daemon-manager.ts`
- `apps/desktop/src/renderer/src/platform/daemon-ipc-bridge.ts`

## 排查任务执行问题的路线

1. 看 task row：`agent_task_queue` 状态、runtime_id、agent_id、issue_id、session_id、work_dir、attempt、failure_reason。
2. 看 handler：`server/internal/handler/daemon.go` 对应 endpoint。
3. 看 service：`server/internal/service/task.go` 的 enqueue/start/complete/fail/retry。
4. 看 daemon client：`server/internal/daemon/client.go` 上报请求形态。
5. 看 daemon 主循环：`server/internal/daemon/daemon.go` 的 `runRuntimePoller` / `handleTask`。
6. 看 agent backend：`server/pkg/agent/<provider>.go`。
7. 看 realtime：`task:*` event 是否 publish，前端是否 invalidate/patch。

