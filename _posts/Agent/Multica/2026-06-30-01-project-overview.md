---
title: "01-project-overview"
categories: [Agent, Multica]
tags: [Agent, Multica]
---

# 项目总览

## 产品定位

Multica 是一个 AI-native 任务管理平台。它把 coding agent 当作一等队友：agent 可以被分配 issue、执行任务、评论、更新状态、复用 skill，并和人类成员一起出现在 workspace、board、inbox、chat、runtime 等协作界面里。

核心业务对象：

- `workspace`：租户/团队隔离边界，几乎所有业务查询都按 `workspace_id` 过滤。
- `member`：workspace 内的人类成员和角色。
- `agent`：可被分配任务的 AI teammate，绑定 runtime/provider/model/instructions/skills。
- `issue`：核心任务实体，支持 assignee、project、label、comment、attachment、subscriber、metadata、child issue。
- `agent_task_queue`：agent 执行队列，daemon 从这里 claim task，并回写状态/消息/usage。
- `agent_runtime`：本地或云端 runtime，代表能执行 agent CLI 的计算环境。
- `skill` / `skill_file`：可复用能力，由 agent 执行时注入上下文。
- `autopilot`：定时、webhook 或手动触发的自动任务。
- `chat_session` / `chat_message`：用户与 agent 的聊天式任务入口。
- `inbox_item` / `activity_log`：通知和审计时间线。
- `squad` / `squad_member`：由 leader agent 牵头的多人/多 agent 任务路由层。

## 仓库形态

这是一个 Go 后端 + pnpm workspaces/Turborepo 前端的 monorepo。

| 目录 | 作用 |
| --- | --- |
| `server/` | Go 后端、CLI、daemon、DB migrations、sqlc 查询和生成代码 |
| `apps/web/` | Next.js App Router Web 应用 |
| `apps/desktop/` | Electron Desktop 应用 |
| `apps/mobile/` | Expo / React Native iOS 应用，规则独立 |
| `apps/docs/` | 文档站 |
| `packages/core/` | Headless 业务逻辑：API client、React Query hooks、Zustand stores、types、schema |
| `packages/views/` | Web/Desktop 共享业务页面和组件 |
| `packages/ui/` | 原子 UI 组件、样式 token、markdown 渲染基础件 |
| `packages/tsconfig/` | 共享 TS 配置 |
| `packages/eslint-config/` | 共享 lint 配置 |
| `docs/` | 工程/产品设计文档 |
| `e2e/` | Playwright E2E 测试 |
| `deploy/`, `docker*`, `Dockerfile*` | 部署、自托管和镜像构建 |
| `scripts/` | 本地开发、安装、检查、环境初始化脚本 |

当前粗略文件分布：`server` 约 1097 个文件，`packages` 约 1036 个文件，`apps` 约 689 个文件。后端 migrations 有 167 个 `.up.sql`，sqlc 查询文件有 36 个。

## 技术栈

后端：

- Go 1.26.1
- Chi router
- pgx / pgxpool
- sqlc
- PostgreSQL 17 + pgvector
- gorilla/websocket
- Redis 可选，用于多节点 realtime relay、部分请求路径 cache/store
- Prometheus metrics
- Cobra CLI

前端：

- pnpm 10.28.2 workspaces + Turborepo
- React 19
- TypeScript strict mode
- Next.js 16 App Router
- Electron + electron-vite
- Expo / React Native mobile
- TanStack Query 管 server state
- Zustand 管 client state
- zod 做 API response 兼容解析
- Tailwind 4 + shadcn/Base UI 风格组件
- i18next 多语言

Agent runtime：

- 本地 daemon 由 `multica` CLI 启动/管理。
- `server/pkg/agent` 提供统一 `Backend.Execute` 接口。
- 支持 Claude Code、CodeBuddy、Codex、GitHub Copilot CLI、OpenCode、OpenClaw、Hermes、Pi、Cursor、Kimi、Kiro、Antigravity、Qoder 等 provider。

## 工程规则

根目录 `AGENTS.md` 指向 `CLAUDE.md` 作为权威规则。重要约束：

- `packages/core/` 不能依赖 `react-dom`、`localStorage`、`process.env` 或 UI 库。
- `packages/ui/` 不能 import `@multica/core`，不能承载业务逻辑。
- `packages/views/` 不能使用 `next/*` 或 `react-router-dom`，导航统一经 `NavigationAdapter`。
- `apps/web/platform/` 是 Web 里使用 Next.js 平台 API 的位置。
- `apps/desktop/src/renderer/src/platform/` 是 Desktop 里接 React Router 的位置。
- React Query 拥有 server state；Zustand 拥有 client state；WS 事件 patch/invalidate Query cache，不直接写 Zustand server data。
- Workspace-scoped query key 必须包含 `wsId`。
- API response 进入 UI 前应经 `parseWithFallback` + zod schema 解析，避免已安装桌面端遇到后端字段漂移崩掉。
- Go handler 写入前必须明确 UUID 来源；用户输入用 `parseUUIDOrBadRequest`，DB round-trip 才用 panicking `parseUUID`。

## 常用命令

| 命令 | 作用 |
| --- | --- |
| `make dev` | 自动 setup 并启动整套开发环境 |
| `make start` | 启动 backend + frontend，并先跑 migrations |
| `make server` | 只跑 Go server |
| `make daemon` | 跑本地 daemon |
| `make test` | Go tests |
| `make sqlc` | SQL 变更后重新生成 sqlc |
| `make check` | 本地完整检查 |
| `pnpm dev:web` | Web dev server |
| `pnpm dev:desktop` | Desktop dev |
| `pnpm typecheck` | TS typecheck |
| `pnpm test` | TS/Vitest tests |
| `pnpm exec playwright test` | E2E |

## 代码定位建议

仓库有 `.codegraph/`，学习和排查时先用：

```bash
codegraph explore "NewRouterWithOptions routes middleware auth websocket"
codegraph node server/cmd/server/main.go
codegraph explore "TaskService daemon task lifecycle claim start complete fail"
```

如果 CodeGraph 没覆盖到，再用 `rg` 定位：

```bash
rg -n "func \\(h \\*Handler\\) CreateIssue|EventIssueCreated|EnqueueTask" server
rg -n "useQuery|queryKey|api\\.listIssues" packages apps
```
