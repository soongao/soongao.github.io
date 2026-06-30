---
title: "06-product-model-from-docs-site"
categories: [Agent, Multica]
tags: [Agent, Multica]
---

# 文档站产品模型提炼

本文基于 `apps/docs/content/docs/*.zh.mdx`，对应线上文档站 `https://multica.ai/docs/zh`。目标不是复述文档，而是把文档里的产品语义压缩成后续读代码时最需要的心智模型，并标出源码入口。

## 一句话模型

Multica 是一个任务协作平台。人类和智能体都在同一个工作区里协作，但执行边界非常明确：

- Multica server 负责数据和协调：工作区、issue、评论、成员、智能体配置、task 队列、实时事件、通知、集成。
- 本地 daemon 负责执行：注册本机可用的 AI 编程工具，领取 task，在用户机器上准备工作目录并调用 CLI。
- AI 编程工具负责真正干活：Claude Code、Codex、Cursor、OpenCode、Kimi、Kiro CLI 等。

最关键的安全边界是：智能体不在 Multica server 上运行。API key、代码目录、本地工具登录态都留在运行 daemon 的机器上。

## 三个运行组件

| 组件 | 本质 | 主要职责 | 源码入口 |
| --- | --- | --- | --- |
| Server | 协作系统的控制面和数据面 | HTTP API、WebSocket、PostgreSQL、task 队列、通知、集成、调度器 | `server/cmd/server/main.go`, `server/cmd/server/router.go` |
| Daemon | 用户机器上的本地执行器 | 探测 provider、注册 runtime、心跳、claim task、启动 agent CLI、上报结果 | `server/internal/daemon/daemon.go`, `server/internal/daemon/client.go` |
| Provider CLI | 具体 AI 编程工具 | 根据 prompt、skill、MCP、仓库上下文执行工作 | `server/pkg/agent/agent.go`, `server/pkg/agent/*` |

文档站里说的 "runtime" 不是一台机器本身，而是：

```text
runtime = 一个 daemon × 一个 provider × 一个 workspace
```

例如陈同学的 MacBook 上跑一个 daemon，本机有 Codex 和 Claude Code，同时加入 `acme-ai` 和 `sandbox` 两个工作区，那么 server 会看到 4 个 runtime。

## 业务对象词典

这些对象是后续拆代码最常见的主线。

| 对象 | 人话解释 | 关键字段/状态 | 代码入口 |
| --- | --- | --- | --- |
| Workspace | 团队/租户边界，所有业务数据都归属于它 | `slug`, `issue_prefix`, role | `server/internal/handler/workspace.go`, `packages/core/workspace` |
| Member | 人类成员及其角色 | `owner`, `admin`, `member` | `server/internal/handler/member.go` |
| Agent | 工作区里的 AI 队友，可被分配 issue 或被 @ | provider/runtime/model/instructions/env/skills/visibility | `server/internal/handler/agent.go`, `packages/core/agents` |
| Runtime | 某个工作区里可执行某类 provider 的执行点 | online/offline, last_seen, provider | `server/internal/handler/runtime.go`, `server/internal/handler/daemon.go` |
| Issue | 核心工作项 | status、priority、assignee、project、comments | `server/internal/handler/issue.go`, `server/internal/service/issue.go` |
| Comment | issue 下的沟通和触发入口 | Markdown、mention、parent thread | `server/internal/handler/comment.go`, `server/internal/util/mention.go` |
| Task | 智能体每次工作的执行单元 | queued -> dispatched -> running -> completed/failed/cancelled | `server/internal/service/task.go` |
| Chat | 用户和智能体的一对一私聊 | chat_session、chat_message、chat task | `server/internal/handler/chat.go` |
| Project | issue 的容器，也能挂资源 | lead、status、priority、resources | `server/internal/handler/project.go`, `project_resource.go` |
| Skill | 给 agent 的专业知识包 | `SKILL.md` + files，挂到 agent 后执行时注入 | `server/internal/handler/skill.go` |
| Squad | 一组 agent/member，由 leader agent 路由 | leader、members、instructions | `server/internal/handler/squad.go` |
| Autopilot | 定时/手动/webhook 自动触发器 | create_issue/run_only、triggers、runs | `server/internal/handler/autopilot.go`, `service/autopilot.go` |
| Inbox | 人类通知中心 | issue/comment/reaction/task failure | `server/internal/handler/inbox.go`, `notification_listeners.go` |

注意：`task` 是一次执行，不是 issue 本身。一个 issue 可以因为分配、评论 @、手动 rerun、自动重试而产生多个 task。

## 四种让智能体开工的方式

| 触发方式 | 适合场景 | 是否改 issue | 上下文 | 自动重试 | 主要代码入口 |
| --- | --- | --- | --- | --- | --- |
| 分配 issue | 让智能体正式负责这项工作 | 改 assignee，智能体可推进状态 | issue + 全部评论 | 是 | `IssueService.Create`, `Handler.UpdateIssue`, `TaskService.EnqueueTaskForIssue` |
| 评论 @agent | 让它看一眼或参与讨论 | 不改 assignee/status | issue + 触发评论 | 是 | `Handler.CreateComment`, `computeMentionedAgentCommentTriggers`, `EnqueueTaskForMention` |
| Chat | 私人一对一对话，不绑 issue | 不涉及 issue | 当前 chat session | 是 | `Handler.SendChatMessage`, `EnqueueChatTask` |
| Autopilot | 定时/手动/webhook standing order | 取决于模式 | autopilot prompt + trigger payload | 否 | `TriggerAutopilot`, `HandleAutopilotWebhook`, `DispatchAutopilot` |

关键区别：

- 分配是最重的触发：智能体成为负责人。
- @ 是轻触发：不接管，只基于当前 issue 讨论。
- Chat 是私密沙盒：智能体看不到 issue，也不能改 issue。
- Autopilot 是时间或外部事件驱动：它自己决定何时触发，不依赖用户当场点击。

## Issue 状态和触发规则

Issue 状态是开放流转的，系统不强制流程：

```text
backlog, todo, in_progress, in_review, done, blocked, cancelled
```

但智能体触发有一条很重要的产品规则：

- 把 backlog issue 分配给 agent 或 squad，不会立刻开工。
- 从 backlog 推到活跃状态时，才会触发已分配的 agent/squad。
- 评论 @agent 不受 backlog 停泊规则影响，评论触发本身是即时的。

源码上这条规则分两处表达：

- 创建/分配路径：`IssueService.shouldEnqueueAgentTask` 和 `shouldEnqueueSquadLeaderOnAssign` 会跳过 `backlog`。
- 更新/预览路径：`IssueService.WillEnqueueRun` 区分 `assign` 和 `status` 两种来源。

## Task 状态机

文档站里的 task 状态机与服务代码基本一致：

```text
queued -> dispatched -> running -> completed
                         -> failed
queued/dispatched/running -> cancelled
dispatched -> waiting_local_directory -> running
```

实际含义：

- `queued`：server 已写入 `agent_task_queue`，等待 daemon claim。
- `dispatched`：daemon 已领取，正在准备本地执行环境。
- `waiting_local_directory`：任务绑定的本地目录被另一条任务占用，等待目录锁。
- `running`：provider CLI 已启动并执行。
- `completed`：成功结束，评论、状态、usage 等已回写。
- `failed`：失败。可重试原因可能重新排队。
- `cancelled`：用户或系统取消，不再执行。

失败自动重试只覆盖基础设施类失败：

- `runtime_offline`
- `runtime_recovery`
- `timeout`
- `codex_semantic_inactivity`

`agent_error` 不自动重试，避免模型/API 错误形成无限循环。Autopilot task 不自动重试，失败只记录在 run history 中。

## Provider 能力差异

以当前文档站 provider 矩阵和 `server/pkg/agent/agent.go` 为准，Multica 当前支持 13 款 provider：Claude Code、CodeBuddy、Codex、GitHub Copilot CLI、OpenCode、OpenClaw、Hermes、Pi、Cursor、Kimi、Kiro、Antigravity、Qoder。后续读代码时不需要先记每个细节，只要记住四个维度：

- 会话恢复：自动重试和 chat 多轮依赖它。是否支持要按 provider 分别看，当前矩阵里 Codex、Claude Code、Cursor、Kimi、Kiro 等支持。
- MCP：不是所有 provider 都消费 `mcp_config`。当前矩阵里 Claude Code、Codex、Cursor、Kimi、Kiro、OpenCode、Qoder 等有实际接入。
- Skill 注入路径：不同 CLI 发现 skill 的目录不同，例如 Claude Code 是 `.claude/skills/`，Codex 是 `$CODEX_HOME/skills/`，Antigravity 是 `.agents/skills/`。
- 模型选择：有的静态，有的动态发现，有的绑定在 provider 自身配置上。

源码入口：

- provider 统一接口：`server/pkg/agent/agent.go`
- daemon 执行配置：`server/internal/daemon/execenv/*`
- agent 创建/配置：`server/internal/handler/agent.go`

## Project Resource 的核心抽象

Project 不只是 issue 分组，还可以挂资源。资源是有类型的指针：

```json
{
  "resource_type": "github_repo",
  "resource_ref": {
    "url": "https://github.com/acme/web-app",
    "default_branch_hint": "main"
  }
}
```

或者：

```json
{
  "resource_type": "local_directory",
  "resource_ref": {
    "local_path": "/Users/chen/code/web-app",
    "daemon_id": "rt_mac_01",
    "label": "主开发目录"
  }
}
```

本质：

- `github_repo`：每次任务在隔离 worktree 或缓存 checkout 里工作，适合并行和干净环境。
- `local_directory`：在某台 daemon 的本地目录原地工作，适合大仓或需要即时本地 review 的场景，但同一目录串行。

代码入口：

- API 校验和 CRUD：`server/internal/handler/project_resource.go`
- TS 类型：`packages/core/types/project.ts`
- daemon 执行环境：`server/internal/daemon/execenv/execenv.go`
- prompt/resource 注入：`server/internal/daemon/execenv/runtime_config.go`

重要边界：server 只校验 payload 形状和路径是否像绝对路径，真正的目录存在、读写权限、黑名单路径校验在 daemon 执行前完成。

## Skill 的本质

Skill 是给智能体的静态知识包：

```text
skill = SKILL.md + 可选脚本/模板/参考文件
```

Multica 支持：

- 工作区 skill：存在 server，团队共享，挂到 agent 后执行时同步到本地。
- 本机 skill：daemon 扫本机 skill 目录，用户选择导入工作区。
- 仓库级 skill：已经提交在 repo 里的 provider 原生 skill 目录，Multica 不会导入，只让底层工具自然发现。

工作区 skill 在 DB 里存的是内容：

```text
skill.content = 主 SKILL.md 内容
skill_file = 支持文件的相对路径 + 内容
```

执行时 daemon 把这些内容写成 provider 能发现的文件。它不是只记录文件路径，也不是靠 symlink 直接挂 skill；如果和用户已有同名 skill 冲突，会换成 `-multica` 这类 sibling 目录，避免覆盖。

和 MCP 的区别：

- Skill 是知识和流程说明。
- MCP 是工具调用通道。

安全边界：Multica 不审计第三方 skill，不签名、不沙箱；导入 GitHub/ClawHub skill 前要人工审查。

## Squad 的本质

Squad 增加的是路由能力，不增加执行能力。

```text
squad = leader agent + 多个 agent/member + squad instructions
```

把 issue 分配给 squad 时，真正入队的是 leader agent 的 task。leader 看到小队花名册和操作协议，然后在评论里用标准 mention markdown 把工作派给某个成员：

```markdown
[@FrontendBot](mention://agent/agt_frontend)
```

关键点：

- leader 必须是 agent。
- 成员可以是 agent 或人。
- squad 可以出现在 assignee picker 和 @ picker 中。
- 归档 squad 会把当前分配给它的 issue 转给 leader agent。

源码入口：`server/internal/handler/squad.go`, `TaskService.EnqueueTaskForSquadLeader`, `server/internal/daemon/execenv` 的 squad briefing 相关逻辑。

## Auth 与 token

文档站区分三类令牌：

| 令牌 | 用途 | 权限直觉 |
| --- | --- | --- |
| JWT Cookie | Web 浏览器 | 当前用户 Web 会话 |
| PAT (`mul_...`) | CLI、脚本、直接 API | 几乎等同完整用户身份 |
| Daemon Token (`mdt_...`) | daemon 内部通信 | 只够 daemon 拉任务和汇报结果 |

运维上最容易踩的点：

- 退出登录只删除本地 token/cookie，不撤销 server 里的 PAT。
- PAT 泄露必须去 Settings 撤销。
- 生产自部署必须设置 `JWT_SECRET`、`APP_ENV=production`、`FRONTEND_ORIGIN`。
- `MULTICA_DEV_VERIFICATION_CODE` 只能用于本地/私有测试，production 下会被忽略。

## 客户端差异

| 客户端 | 特点 | 与 server/daemon 的关系 |
| --- | --- | --- |
| Web | 浏览器访问，最薄的平台层 | 调 API/WS；需要用户自己跑 daemon |
| Desktop | Electron，多 workspace tab，自动启动 daemon | 内置 CLI 二进制，启动独立 profile 的 daemon |
| Mobile iOS | Expo/RN，自助 build，连 Cloud 后端 | 偏消费/移动协作，执行仍依赖 runtime |
| CLI | 命令行操作 issue/agent/daemon/runtime | PAT 登录，既能管理数据，也能启动 daemon |

Desktop 的重点是它不只是 WebView。它会：

- 维护每个 workspace 独立 tab 集合。
- 用独立 profile 自动启动 daemon。
- 登录后把 token 同步给 daemon。
- 用 IPC 把 daemon 状态快速反映到 runtime cache。

## 外部集成

### GitHub

GitHub 集成是 PR 到 issue 的自动关联：

- 只读 PR 和 Metadata 权限。
- 扫 PR 分支、标题、正文里的 issue key，例如 `MUL-123`。
- webhook upsert PR，再建立 `issue_pull_request` 链接。
- PR 进入终态后会重新评估关联 issue：只有没有仍然 open/draft 的关联 PR，且至少一个 merged PR 通过 `Closes/Fixes/Resolves MUL-123` 声明了 close intent，issue 才会自动转 `done`；`cancelled` 不覆盖。

源码入口：`server/internal/handler/github.go`。

### 飞书/Lark Bot

飞书 Bot 是 agent 的外部入口：

- 一个 Bot 绑定一个 Multica agent。
- 私聊或群里 @ Bot，进入 chat 任务。
- `/issue 标题` 可以创建 Multica issue。
- 回复通过实时卡片或文本回到飞书。

源码入口：`server/internal/integrations/lark/*`, `server/internal/integrations/channel/engine/*`。

## 概念到代码的最短路径

| 你想理解 | 先看 |
| --- | --- |
| "分配 issue 为什么会跑 agent" | `server/internal/service/issue.go`, `issue_trigger.go`, `task.go` |
| "评论 @agent 为什么会入队" | `server/internal/handler/comment.go`, `server/internal/util/mention.go` |
| "chat 为什么是私人沙盒" | `server/internal/handler/chat.go`, `server/internal/daemon/prompt.go` |
| "Autopilot 怎么触发" | `server/internal/handler/autopilot.go`, `autopilot_webhook.go`, `service/autopilot.go` |
| "daemon 怎么拿任务" | `server/internal/handler/daemon.go`, `server/internal/daemon/daemon.go` |
| "任务怎么广播到 UI" | `server/internal/service/task.go`, `server/cmd/server/listeners.go`, `packages/core/realtime/use-realtime-sync.ts` |
| "项目资源怎么进 agent 上下文" | `server/internal/handler/project_resource.go`, `server/internal/daemon/execenv/runtime_config.go` |
| "provider 差异在哪里实现" | `server/pkg/agent/*`, `server/internal/daemon/execenv/*` |
