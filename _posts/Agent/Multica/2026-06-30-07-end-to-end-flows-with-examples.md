---
title: "07-end-to-end-flows-with-examples"
categories: [Agent, Multica]
tags: [Agent, Multica]
---

# 端到端流程与锚点例子

本文用一组固定的锚点数据串起 Multica 的核心流转。阅读时不用纠结 UUID、`pgtype.UUID`、TS branded type 这些包装形式；这里关注对象关系和状态变化。

## 本文锚点数据

后续例子统一使用这组数据：

| 名称 | 值 | 含义 |
| --- | --- | --- |
| 用户 | `chen@example.com` | 人类成员陈同学 |
| 用户 ID | `usr_chen` | 用户字符串 ID |
| 工作区 | `acme-ai` | workspace slug |
| 工作区 ID | `ws_7f3a` | workspace UUID 的简化写法 |
| Issue 前缀 | `ACME` | issue key 前缀 |
| Runtime | `rt_mac_01` | 陈同学 MacBook 上 Codex runtime |
| Daemon | `macbook-pro-chen` | 本机守护进程 |
| Agent | `CodeSmith` | 工作区里的智能体 |
| Agent ID | `agt_codesmith` | agent 字符串 ID |
| Provider | `codex` | 本机 AI 编程工具 |
| Project | `Web App` | 项目容器 |
| Project ID | `proj_web` | project 字符串 ID |
| GitHub repo | `https://github.com/acme/web-app` | 项目资源 |
| Issue | `ACME-42` | 人类可读 issue key |
| Issue ID | `iss_42` | issue 字符串 ID |
| Task | `task_9001` | 一次 agent 执行 |
| Comment | `cmt_501` | 触发评论 |

示例任务标题：

```text
修复登录验证码过期提示
```

示例评论：

```markdown
[@CodeSmith](mention://agent/agt_codesmith) 请定位验证码过期时 toast 不显示的问题。
```

## 0. 从注册到 runtime 在线

### 用户看到的流程

陈同学第一次使用 Multica Cloud：

1. 用 `chen@example.com` 注册并登录。
2. 获得默认工作区，后来改名为 `Acme AI`，slug 是 `acme-ai`。
3. 安装 CLI。
4. 执行 `multica setup`，浏览器授权后本地保存 PAT。
5. daemon 启动，扫描本机 PATH，发现 `codex`。
6. Web Settings -> Runtimes 里出现 `macbook-pro-chen / codex` 在线。

### 代码和数据流

1. 登录成功后，server 给浏览器发 JWT cookie；CLI 流程会拿 PAT，保存到 `~/.multica/config.json`。
2. daemon 读取本地 token 和 server URL。
3. daemon 启动时扫描本机 provider：例如 `which codex` 能找到可执行文件。
4. daemon 调 `/api/daemon/register`，把 daemon、workspace、provider 能力发给 server。
5. server 创建或更新 `agent_runtime` 行，得到 `rt_mac_01`。
6. daemon 每 15 秒调 `/api/daemon/heartbeat`，server 更新 `last_seen_at`。
7. 前端 runtimes 页面通过 API/WS 看到 runtime online。

关键源码：

- CLI/daemon：`server/cmd/multica/main.go`, `server/internal/daemon/daemon.go`
- 注册/心跳：`server/internal/handler/daemon.go`
- heartbeat batch：`server/internal/handler/heartbeat_scheduler.go`
- runtime 页面：`packages/core/runtimes`, `packages/views/runtimes`

### 关键理解

runtime 在线不等于 agent 已存在。runtime 只是告诉工作区："这台机器可以跑 codex"。agent 是后面用户创建的工作区成员配置，它会绑定某个 runtime。

## 1. 创建 CodeSmith 智能体

### 用户看到的流程

陈同学在 Settings -> Agents 新建：

```text
Name: CodeSmith
Provider/runtime: Codex on macbook-pro-chen
Model: 默认
Instructions: 你是负责 Web App 的工程智能体，默认用中文回复。
Visibility: workspace
Max concurrent tasks: 6
```

### 代码和数据流

1. 前端 `packages/views/agents/components/create-agent-dialog.tsx` 收集表单。
2. `packages/core/api/client.ts` 的 `createAgent` 发 `POST /api/agents`。
3. 后端 `Handler.CreateAgent` 校验当前 workspace、runtime、visibility、env 等。
4. server 写入 `agent` 表：

```text
agent.id = agt_codesmith
agent.workspace_id = ws_7f3a
agent.name = CodeSmith
agent.provider = codex
agent.runtime_id = rt_mac_01
agent.instructions = ...
agent.visibility = workspace
```

5. agent 成为工作区可分配对象，出现在 assignee picker、mention picker、agent 列表中。

关键源码：

- `server/internal/handler/agent.go`
- `packages/core/api/client.ts`
- `packages/views/agents`

### 关键理解

agent 不持有代码仓库，不直接执行任务。它只是"谁来做、用什么 provider、带什么指令/skill/env"的配置。执行仍然落到它绑定的 runtime。

## 2. 创建项目并挂 GitHub 仓库

### 用户看到的流程

陈同学创建项目：

```text
Project: Web App
Lead: CodeSmith
Resource: https://github.com/acme/web-app
```

### 代码和数据流

1. 前端创建 project，随后创建 project resource。
2. `CreateProjectResource` 接收：

```json
{
  "resource_type": "github_repo",
  "resource_ref": {
    "url": "https://github.com/acme/web-app",
    "default_branch_hint": "main"
  },
  "label": "web-app"
}
```

3. server 在 `validateAndNormalizeResourceRef` 中校验 URL 形态并标准化 JSON。
4. server 写 `project_resource` 表。
5. 后续任何属于 `proj_web` 的 issue 派给 agent 时，daemon claim payload 会带上项目资源。
6. daemon 准备环境时会把资源列表写到 `.multica/project/resources.json`，并在 `AGENTS.md`/`CLAUDE.md` 的 Project Context 里提示 agent。

关键源码：

- `server/internal/handler/project_resource.go`
- `packages/core/types/project.ts`
- `server/internal/daemon/execenv/runtime_config.go`

### 关键理解

项目资源是"指针"，不是 server 直接帮 agent clone 代码。agent 执行时会知道这个项目应该使用哪个 repo，再由 daemon/CLI 工具在本地处理 checkout。

## 3. 创建并分配 issue 给 agent

### 用户看到的流程

陈同学创建 issue：

```text
Title: 修复登录验证码过期提示
Project: Web App
Status: todo
Priority: high
Assignee: CodeSmith
```

UI 上很快出现 agent 正在运行。

### 服务端数据变化

创建后核心行可以这样理解：

```text
issue.id = iss_42
issue.key = ACME-42
issue.workspace_id = ws_7f3a
issue.project_id = proj_web
issue.status = todo
issue.priority = high
issue.assignee_type = agent
issue.assignee_id = agt_codesmith
```

因为状态不是 `backlog`，且 assignee 是有 runtime 的 agent，所以立即创建 task：

```text
task.id = task_9001
task.issue_id = iss_42
task.agent_id = agt_codesmith
task.runtime_id = rt_mac_01
task.status = queued
task.priority = high
task.trigger_comment_id = null
```

### 代码流

1. 前端 `useCreateIssue` 调 `api.createIssue`。
2. `Handler.CreateIssue` 做 HTTP 边界校验。
3. `IssueService.Create` 在事务里：
   - 校验 project/parent 属于当前 workspace。
   - 检查重复 issue。
   - 增加 workspace issue counter，得到 `ACME-42` 的数字部分。
   - 写 `issue` 表。
   - commit。
4. commit 后：
   - publish `issue:created`。
   - 记录 analytics。
   - `maybeEnqueueOnAssign` 判断是否入队。
5. `TaskService.EnqueueTaskForIssue`：
   - 读取 `agt_codesmith`。
   - 确认未归档、有 `runtime_id`。
   - 写 `agent_task_queue`。
   - 先广播 `task:queued`，再唤醒 daemon。

关键源码：

- `server/internal/handler/issue.go`
- `server/internal/service/issue.go`
- `server/internal/service/task.go`

### 事件流

```text
issue:created
  -> subscriber listener 自动订阅 creator/assignee 等
  -> activity listener 写 activity_log
  -> notification listener 写 inbox_item
  -> realtime listener 发 WebSocket

task:queued
  -> realtime listener 发 WebSocket
  -> daemon wakeup 通知 rt_mac_01
```

前端收到 WS 后：

- issue 列表增加或刷新 `ACME-42`。
- task live card 显示 `queued`。
- 相关 inbox/activity 变化。

### 关键理解

创建 issue 和创建 task 不是同一个概念。issue 是业务工作项，task 是 agent 对这项工作的一次执行。`ACME-42` 后续可以产生 `task_9001`、`task_9002` 等多次执行记录。

## 4. Daemon 领取并执行 task

### 本地发生什么

`macbook-pro-chen` 上的 daemon 收到 wakeup 或下一次轮询：

1. 调 claim API。
2. server 把 `task_9001` 从 `queued` 改成 `dispatched`。
3. daemon 准备执行环境。
4. daemon 调 start API，server 把 task 改成 `running`。
5. daemon 启动 Codex。
6. Codex 读取 prompt、project resource、skill、MCP 配置，开始处理问题。
7. 执行期间 daemon 批量上报 messages/progress/usage。
8. 结束后 daemon 调 complete 或 fail。

### 执行环境中 agent 看到什么

对 `ACME-42`，agent 的上下文大致是：

```text
You are running as CodeSmith in workspace acme-ai.

Issue: ACME-42
Title: 修复登录验证码过期提示
Status: todo
Priority: high

Project Context:
This issue belongs to Web App.
Project resources:
- GitHub repo: https://github.com/acme/web-app (default branch: main)

Instructions:
你是负责 Web App 的工程智能体，默认用中文回复。

Use multica CLI to inspect issue and comments when needed.
```

这不是逐字源码生成结果，只保留结构。真实 prompt 会由 daemon 根据 provider、task 类型、project resource、skill 等拼装。

### 代码流

1. daemon 主循环：`runRuntimePoller -> Client.ClaimTask -> handleTask`。
2. server claim：`Handler.ClaimTaskByRuntime`。
3. start：`Handler.StartTask -> TaskService.StartTask`。
4. provider 执行：`agent.Backend.Execute`。
5. 上报：
   - `ReportTaskMessages`
   - `ReportTaskProgress`
   - `ReportTaskUsage`
   - `CompleteTask` / `FailTask`
6. 终态副作用：
   - task event 广播。
   - chat/issue/autopilot 相关状态同步。
   - usage 写入和后续 rollup。

关键源码：

- `server/internal/daemon/daemon.go`
- `server/internal/daemon/client.go`
- `server/internal/handler/daemon.go`
- `server/pkg/agent/agent.go`
- `server/internal/service/task.go`

## 5. Agent 完成 issue

假设 Codex 修好问题，并用 Multica CLI 发评论：

```markdown
已定位并修复：验证码过期时错误分支只更新了表单状态，没有触发 toast。

改动：
- 在验证码校验失败分支补充 toast.error
- 增加过期场景单测
```

最终状态变化：

```text
task_9001: running -> completed
ACME-42: in_progress -> done
comment: agent 以 CodeSmith 身份新增总结评论
```

关键点：

- agent 的评论也是普通 comment，只是 `author_type=agent`。
- agent 修改 issue 状态也是走同一套 API，只是请求带 agent/task 身份头。
- 所有这些变化都会走事件总线和 WebSocket，UI 不需要刷新。

## 6. 评论 @agent 的轻触发

### 用户看到的流程

在 `ACME-42` 下面，陈同学发评论：

```markdown
[@CodeSmith](mention://agent/agt_codesmith) 这块能不能再确认一下移动端登录页是否也受影响？
```

### 服务端数据变化

新增 comment：

```text
comment.id = cmt_501
comment.issue_id = iss_42
comment.author_type = member
comment.author_id = usr_chen
comment.content = markdown mention
```

因为评论里明确 mention 了 `agt_codesmith`，新增 task：

```text
task.id = task_9002
task.issue_id = iss_42
task.agent_id = agt_codesmith
task.trigger_comment_id = cmt_501
task.status = queued
```

### 代码流

1. 前端编辑器插入标准 markdown mention，不是纯文本 `@CodeSmith`。
2. `Handler.CreateComment` 保存 Markdown 原文。
3. publish `comment:created`。
4. `triggerTasksForComment` 调 `computeCommentAgentTriggers`。
5. `util.ParseMentions` 解析 `mention://agent/agt_codesmith`。
6. `computeMentionedAgentCommentTriggers` 找到 agent，检查 runtime/private/archived/pending/self-loop 等条件。
7. `TaskService.EnqueueTaskForMention` 写 task，携带 `trigger_comment_id=cmt_501`。

关键源码：

- `packages/views/editor/extensions/mention-extension.ts`
- `server/internal/util/mention.go`
- `server/internal/handler/comment.go`
- `server/internal/service/task.go`

### 关键理解

纯文本 `@CodeSmith` 不触发。触发依赖 Markdown 链接：

```markdown
[@CodeSmith](mention://agent/agt_codesmith)
```

编辑旧评论新增 @ 也不触发。触发发生在评论创建时；要重新触发，发新评论。

## 7. Chat 私人对话

### 用户看到的流程

陈同学打开 Chat，选择 CodeSmith，发送：

```text
帮我把刚才验证码过期问题整理成一个更适合给 QA 的复现步骤。
```

这不是 issue 评论，别人看不到。

### 数据变化

```text
chat_session.id = chat_100
chat_session.agent_id = agt_codesmith
chat_session.creator_id = usr_chen

chat_message.id = msg_1
chat_message.session_id = chat_100
chat_message.role = user
chat_message.content = ...

task.id = task_9100
task.chat_session_id = chat_100
task.issue_id = null
task.agent_id = agt_codesmith
task.runtime_id = rt_mac_01
task.status = queued
```

### 代码流

1. `ChatWindow` 调 `api.sendChatMessage`。
2. `Handler.SendChatMessage`：
   - 校验 session 归当前用户。
   - 保存 user message。
   - `TaskService.EnqueueChatTask` 创建 chat task。
   - 把 message 和 task 关联。
   - publish `chat:message`。
3. daemon claim 后构造 chat prompt。
4. provider 回复后，server 写 assistant message，并发布 `chat:message` / `chat:done`。

关键源码：

- `server/internal/handler/chat.go`
- `server/internal/service/task.go`
- `server/internal/daemon/prompt.go`
- `packages/views/chat`

### 关键理解

Chat 沙盒意味着：

- prompt 没有 issue ID。
- agent 不能靠当前上下文修改 `ACME-42`。
- 多轮上下文靠 provider session resume，不是每次把完整历史都塞进 prompt。

## 8. Autopilot 定时触发

### 用户看到的配置

陈同学创建 Autopilot：

```text
Name: 每周依赖风险巡检
Assignee: CodeSmith
Mode: create_issue
Issue title template: 依赖风险巡检 {{date}}
Prompt: 检查 Web App 依赖更新，列出高风险项并给出建议。
Schedule: 0 9 * * 1, Asia/Shanghai
Project: Web App
```

### 到点后的数据流

周一 09:00 后，server 调度器触发：

```text
autopilot_run.id = run_7001
autopilot_id = ap_weekly_deps
source = schedule
status = issue_created

issue.id = iss_88
issue.key = ACME-88
title = 依赖风险巡检 2026-06-30
origin_type = autopilot
origin_id = ap_weekly_deps
assignee_id = agt_codesmith

task.id = task_9300
issue_id = iss_88
agent_id = agt_codesmith
```

### 代码流

1. DB-backed scheduler 找到到期 trigger。
2. `AutopilotService.DispatchAutopilotForPlan` 保障同一 plan 幂等。
3. `DispatchAutopilot` 创建 run。
4. `dispatchCreateIssue` 创建 issue，并把 run 链到 issue。
5. publish `issue:created`，复用现有 issue 事件链。
6. `TaskService.EnqueueTaskForIssue` 创建 task。
7. 后续执行和普通 issue 分配完全一样。

关键源码：

- `server/internal/service/autopilot.go`
- `server/cmd/server/autopilot_schedule_job.go`
- `server/internal/scheduler`

### 关键理解

create_issue 模式推荐，因为每次运行都会落成一个普通 issue。团队能在看板、评论、状态、历史里追踪它。

Autopilot 失败不自动重试，因为下一个 cron 周期会产生新 run。否则系统级重试可能和下一次计划重叠。

## 9. Autopilot Webhook 触发

### 外部请求

某个 GitHub workflow 结束后 POST：

```bash
curl -X POST "https://multica.example.com/api/webhooks/autopilots/awt_xxx" \
  -H "Content-Type: application/json" \
  -H "X-GitHub-Event: workflow_run" \
  -d '{"action":"completed","workflow":"CI","conclusion":"failure"}'
```

### 服务端流转

1. URL token 是凭证，server 用它找到 trigger。
2. IP 限流、token 限流。
3. 读取 body，限制大小。
4. 标准化 payload，推断 event/action。
5. 校验 event filter。
6. 写 webhook_delivery。
7. 同步调 `DispatchAutopilot`。
8. 返回：

```json
{
  "status": "accepted",
  "run_id": "run_7002",
  "autopilot_id": "ap_weekly_deps",
  "trigger_id": "trg_webhook"
}
```

关键源码：

- `server/internal/handler/autopilot_webhook.go`
- `server/internal/service/autopilot.go`

### 关键理解

webhook URL 本身就是 bearer secret，泄漏就等于任何人能触发。泄漏后要 rotate URL。

## 10. local_directory 项目资源

### 用户配置

陈同学把 `Web App` 项目额外挂一个本地目录：

```json
{
  "resource_type": "local_directory",
  "resource_ref": {
    "local_path": "/Users/chen/code/web-app",
    "daemon_id": "macbook-pro-chen",
    "label": "主开发目录"
  }
}
```

### 执行差异

当 `ACME-42` 落到 `rt_mac_01` 上执行时：

1. daemon 发现这个 project 有匹配自己 daemon ID 的 `local_directory`。
2. daemon 校验路径存在、是目录、可读写、不在黑名单。
3. daemon 以真实路径为 key 拿目录锁。
4. 如果没人占用，agent 直接在 `/Users/chen/code/web-app` 里运行。
5. 如果已有任务在这个目录运行，新 task 进入 `waiting_local_directory`，等锁释放。
6. daemon 会把 `AGENTS.md`/`.multica/project/resources.json` 写入该目录，但运行产物日志放在 envRoot，不会删除用户目录。

关键源码：

- `server/internal/handler/project_resource.go`
- `server/internal/daemon/execenv/execenv.go`
- `server/internal/service/task.go` 中 `task:waiting_local_directory`

### 关键理解

`local_directory` 是对 worktree 模式的本机覆盖。它让 agent 像你自己在本地目录启动工具一样工作，所以风险也一样：不会自动 stash，不会保护脏工作区，不会自动开 PR。

## 11. Squad 路由

### 用户配置

创建小队：

```text
Squad: Frontend Team
Leader: FrontendLead
Members:
- CodeSmith: 负责登录和认证
- Alice: 人类 reviewer
Instructions: 登录、表单、toast 问题优先派给 CodeSmith。
```

把 `ACME-42` 分配给 `Frontend Team`。

### 流转

1. issue.assignee_type = `squad`，assignee_id = `squad_frontend`。
2. server 不给所有成员入队，只给 leader agent 入队。
3. leader task 的 prompt 里有 Squad Operating Protocol、Roster、Instructions。
4. leader 评论：

```markdown
[@CodeSmith](mention://agent/agt_codesmith) 请处理这条登录 toast 问题。
```

5. 这条评论再触发 CodeSmith 的 mention task。

关键源码：

- `server/internal/handler/squad.go`
- `server/internal/handler/comment.go`
- `TaskService.EnqueueTaskForSquadLeader`

### 关键理解

squad 是路由层。执行者仍然是某个 agent 或 member。

## 12. Skill 注入

### 用户配置

创建 skill：

```text
Name: frontend-bug-triage
Files:
- SKILL.md
- scripts/check-toast-tests.sh
```

挂到 CodeSmith。

### 执行时发生什么

1. server 保存 skill 和 skill files。
2. agent_skill 记录 CodeSmith 挂载该 skill。
3. daemon claim `task_9001` 时拿到 CodeSmith 的 skill 列表。
4. daemon 下载/缓存 skill bundle。
5. 根据 provider 写入对应目录：
   - Codex：`$CODEX_HOME/skills/`
   - Claude Code：`.claude/skills/`
   - Cursor：`.cursor/skills/`
6. provider 自己发现并使用 skill。

关键源码：

- `server/internal/handler/skill.go`
- `server/internal/service/skill_bundle.go`
- `server/internal/daemon/skill_cache.go`
- `server/internal/daemon/execenv`

### 关键理解

Skill 是静态知识包，不是 server 端插件。执行它或读取它的是本地 provider CLI。

## 13. GitHub PR 自动关联

### 真实例子

CodeSmith 修完后开 PR：

```text
branch: fix/ACME-42-login-expired-toast
title: ACME-42 fix login expired toast
```

GitHub webhook 到达后：

1. Multica 校验 GitHub webhook 签名。
2. 扫分支、标题、正文中的 `ACME-42`。
3. 确认前缀 `ACME` 属于 `ws_7f3a`。
4. upsert PR 行。
5. 建立 issue <-> PR 关联。
6. UI issue 侧栏显示 PR。
7. PR 进入 `merged` / `closed` 终态后，server 重新评估这个 issue 的全部关联 PR。
8. 只有没有仍然 open/draft 的关联 PR，且至少一个 merged PR 通过 `Closes/Fixes/Resolves ACME-42` 声明了 close intent，issue 才会自动转 `done`。`cancelled` 不覆盖。

关键源码：`server/internal/handler/github.go`。

### 关键理解

集成是编号驱动，不读 commit message，也不读 PR 评论。要自动关联，issue key 必须出现在 PR 分支、标题或正文。

## 14. 飞书 Bot 到 Chat/Issue

### 私聊 Bot

陈同学在飞书私聊绑定到 CodeSmith 的 Bot：

```text
帮我检查登录页 toast 的文案是否符合中文风格。
```

流转：

1. Lark inbound 收到消息。
2. channel engine 确认飞书用户已绑定到 `usr_chen`，且是 `ws_7f3a` 成员。
3. 创建或复用 chat_session。
4. 写 chat_message。
5. `EnqueueChatTask` 创建 task。
6. agent 回复后，Lark outbound 监听 `chat:done`，把回复发回飞书。

### `/issue` 命令

飞书里发送：

```text
/issue 修复登录页验证码过期 toast
复现：等待验证码过期后继续提交登录表单。
```

流转：

1. channel engine 解析 `/issue`。
2. 调 issue 创建服务。
3. issue 归属工作区，creator 是对应 Multica 用户。
4. 如果附带 assignee/agent 触发条件，后续仍走普通 issue -> task 链路。

关键源码：

- `server/internal/integrations/lark/*`
- `server/internal/integrations/channel/engine/*`

## 15. 一条主链路压缩记忆

把 `ACME-42` 分配给 CodeSmith 后，最重要的链路是：

```text
UI create/update issue
  -> Handler / IssueService 写 issue
  -> TaskService 写 agent_task_queue(status=queued)
  -> Bus 发布 issue/task 事件
  -> WebSocket 更新 UI
  -> daemon claim task(status=dispatched)
  -> daemon start task(status=running)
  -> provider CLI 本地执行
  -> daemon 上报 messages/progress/usage
  -> daemon complete/fail
  -> TaskService 终态副作用
  -> WebSocket 更新 UI/inbox/activity/chat
```

后续无论追分配、@、chat、autopilot 还是 squad，都可以先问两个问题：

1. 这次触发如何创建或定位一个 `agent_task_queue` 行？
2. daemon claim 后如何把这行 task 转成 provider CLI 的一次本地执行？
