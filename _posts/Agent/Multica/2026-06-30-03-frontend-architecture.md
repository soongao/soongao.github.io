---
title: "03-frontend-architecture"
categories: [Agent, Multica]
tags: [Agent, Multica]
---

# 前端架构

## 前端分层

Multica 前端是 pnpm workspace：

| 层 | 目录 | 责任 |
| --- | --- | --- |
| Web app | `apps/web/` | Next.js App Router、SSR/layout、Web 平台适配、landing/docs 入口 |
| Desktop app | `apps/desktop/` | Electron main/preload/renderer、桌面 tab 路由、daemon IPC、自动更新 |
| Mobile app | `apps/mobile/` | Expo/React Native iOS app，拥有独立 UI/state/realtime 策略 |
| Core | `packages/core/` | API client、zod schema、React Query hooks、Zustand stores、types、platform adapters |
| Views | `packages/views/` | Web/Desktop 共享业务页面和组件 |
| UI | `packages/ui/` | 原子组件、样式 token、通用 hooks、markdown 基础件 |

依赖方向：

```text
apps/web, apps/desktop
  -> packages/views
  -> packages/core + packages/ui

packages/core 和 packages/ui 互不依赖
packages/views 不能依赖 next/* 或 react-router-dom
```

## `packages/core`

`core` 是 headless 业务层。常见子目录：

| 目录 | 内容 |
| --- | --- |
| `api/` | `ApiClient`、WS client、zod schema、singleton `api` |
| `auth/` | auth store、login/logout/token 同步 |
| `workspace/` | workspace queries/mutations/hooks |
| `issues/` | issue queries/mutations/cache helpers/ws updaters/Zustand view store |
| `agents/`, `runtimes/`, `skills/`, `projects/`, `labels/`, `squads/` | 各业务域 queries/mutations/types/store |
| `chat/`, `inbox/`, `autopilots/`, `billing/` | 对应业务域的 server-state 和少量 client-state |
| `realtime/` | `WSProvider` 和 WS event -> Query cache 同步 |
| `platform/` | `CoreProvider`、storage adapter、workspace singleton、notification、keyboard |
| `paths/` | URL/path 生成与保留 slug |
| `i18n/` | i18n 初始化、locale adapter、同步用户语言 |

### API client

入口：

- `packages/core/api/client.ts`
- `packages/core/api/index.ts`

`ApiClient` 负责：

- 拼接 `baseUrl`。
- 注入 `Authorization`、`X-Workspace-Slug`、`X-CSRF-Token`、`X-Client-*`、`X-Request-ID`。
- 401 时清 token 并触发 `onUnauthorized`。
- 把非 2xx 转成 `ApiError`。
- 重要 endpoint 用 `parseWithFallback(raw, Schema, fallback)` 做 response 兼容解析。

`api` 是 module-level singleton proxy，由 `setApiInstance()` 在 app boot 时设置。

### CoreProvider

入口：`packages/core/platform/core-provider.tsx`。

它在 Web/Desktop 共享：

- 创建 `ApiClient` 并注册 singleton。
- 创建/注册 auth store、chat store。
- 挂 `QueryProvider`。
- 挂 `AuthInitializer`。
- 挂 `WSProvider`。
- 挂 i18n provider 和 locale sync。
- 安装 freeze watchdog。

Web/Desktop 只需要传入不同的：

- `apiBaseUrl`
- `wsUrl`
- `storage`
- `cookieAuth`
- `identity`
- `localeAdapter`
- login/logout callback

## Web app

关键入口：

| 文件 | 作用 |
| --- | --- |
| `apps/web/app/layout.tsx` | 根布局，font/theme/i18n/resources/WebProviders/Toaster |
| `apps/web/components/web-providers.tsx` | Web 平台 provider 组合 |
| `apps/web/app/[workspaceSlug]/layout.tsx` | Workspace 解析、auth/onboarding gate、写当前 workspace singleton |
| `apps/web/app/[workspaceSlug]/(dashboard)/layout.tsx` | DashboardLayout、SearchCommand、ChatWindow、notification bridge |
| `apps/web/platform/navigation.tsx` | Next.js navigation adapter |

Web 路由：

- Auth：`apps/web/app/(auth)/login`, `onboarding`, `invitations`
- Landing：`apps/web/app/(landing)/**`
- Workspace dashboard：`apps/web/app/[workspaceSlug]/(dashboard)/**`
- Lark binding：`apps/web/app/lark/bind`
- Auth callback：`apps/web/app/auth/callback`

Workspace 布局主逻辑：

1. URL 参数拿 `workspaceSlug`。
2. 如果未登录，跳 `/login`。
3. 如果未完成 onboarding，跳 `/onboarding`。
4. 用 React Query 的 workspace list cache 解析 slug -> workspace。
5. render phase 调 `setCurrentWorkspace(workspaceSlug, workspace.id)`，确保子组件第一批 query 已带正确 `X-Workspace-Slug`。
6. 写 `last_workspace_slug` cookie。
7. 未解析到 workspace 时显示 `NoAccessPage`。

Dashboard 页面几乎都是薄 wrapper，真正页面组件来自 `packages/views`。

## Desktop app

关键入口：

| 文件 | 作用 |
| --- | --- |
| `apps/desktop/src/main/index.ts` | Electron main process |
| `apps/desktop/src/preload/index.ts` | preload 暴露 `desktopAPI` / `daemonAPI` |
| `apps/desktop/src/renderer/src/main.tsx` | renderer mount |
| `apps/desktop/src/renderer/src/App.tsx` | renderer 根组件、CoreProvider、login/onboarding/workspace bootstrap、daemon sync |
| `apps/desktop/src/renderer/src/routes.tsx` | React Router route tree |
| `apps/desktop/src/renderer/src/stores/tab-store.ts` | workspace-scoped tabs |
| `apps/desktop/src/renderer/src/stores/window-overlay-store.ts` | pre-workspace transition overlay |
| `apps/desktop/src/renderer/src/platform/navigation.tsx` | desktop navigation adapter |
| `apps/desktop/src/main/daemon-manager.ts` | 桌面管理 daemon 生命周期 |

Desktop 与 Web 的主要差异：

- Desktop 使用 Electron + React Router memory router。
- 每个 tab 有独立 memory router。
- 所有真实页面都是 workspace-scoped：`/:workspaceSlug/issues`、`/:workspaceSlug/projects` 等。
- 创建 workspace、接受 invite、onboarding 是 `WindowOverlay`，不是 route。
- 登录后会把 token 同步给 daemon，并自动启动 daemon。
- Desktop 通过 IPC 观察 daemon status，桥接到 runtimes cache，让本机 runtime 状态快速更新。
- `Cmd/Ctrl+W` 在 renderer 根部处理：多 tab 关 active tab，最后一个 tab 关窗口。

Desktop route tree 的页面多数也来自 `packages/views`，少数 detail 或 desktop-only 页面在 `apps/desktop/src/renderer/src/pages` / `components`。

## `packages/views`

`views` 是 Web/Desktop 共享业务 UI。常见目录：

- `issues/`
- `projects/`
- `agents/`
- `runtimes/`
- `skills/`
- `autopilots/`
- `squads/`
- `inbox/`
- `chat/`
- `dashboard/`
- `settings/`
- `layout/`
- `navigation/`
- `onboarding/`
- `workspace/`
- `locales/`

规则：

- 不直接用 Next.js 或 React Router。
- 需要跳转时用 `useNavigation()` 或 `<AppLink>`。
- 需要 workspace context 的 hook 应尽量接受 `wsId`。
- 需要 server data 时用 `packages/core` 的 query/mutation hook。
- 共享页面的测试放在 `packages/views`，不放 app 层。

## `packages/ui`

`ui` 是业务无关的原子组件和样式基础：

- `components/ui/*`：shadcn/Base UI 风格基础组件。
- `components/common/*`：跨域通用小组件。
- `styles/tokens.css`、`styles/base.css`：设计 token 和基础样式。
- `markdown/*`：markdown/linkify/mention 渲染基础件。
- `hooks/*`、`lib/*`：无业务依赖工具。

规则：

- 不 import `@multica/core`。
- 不写业务逻辑。
- 优先用语义 token，不硬编码颜色。

## 状态管理

Server state：

- React Query owns：issues、members、agents、inbox、workspace list、runtime list、skills、chat messages、autopilot 等。
- Query key 必须带 workspace id，避免跨 workspace cache 污染。
- Mutation 默认做 optimistic update，settle 后 invalidate。

Client state：

- Zustand owns：当前 workspace、tab、filters、drafts、modals、overlay、layout、onboarding transient signals。
- Durable preference/draft/layout 可以 persist。
- Server data 不应 persist 到 Zustand。

Realtime：

- 后端 WS 事件进入 `WSClient`。
- `WSProvider` 调 `useRealtimeSync`。
- `useRealtimeSync` 对 Query cache 做 patch 或 invalidate。
- 不直接把 server-state 写进 Zustand。

## i18n

Web 根布局从 request 中确定 locale，给 `CoreProvider` 注入 resources。

Desktop 根据系统 locale 和用户选择生成 locale adapter，切换语言走 reload。

翻译和命名规则以：

- `apps/docs/content/docs/developers/conventions.mdx`
- `apps/docs/content/docs/developers/conventions.zh.mdx`

为准。

## 增加一个前端功能的定位路线

1. 后端 API 是否已有：看 `packages/core/api/client.ts`。
2. response 是否有 schema：看 `packages/core/api/schemas.ts`。
3. query/mutation hook：看 `packages/core/<domain>/queries.ts` 和 `mutations.ts`。
4. 页面组件：放 `packages/views/<domain>/`。
5. Web route：放 `apps/web/app/[workspaceSlug]/(dashboard)/.../page.tsx`。
6. Desktop route：改 `apps/desktop/src/renderer/src/routes.tsx`。
7. 平台能力：Web 放 `apps/web/platform`，Desktop 放 `apps/desktop/src/renderer/src/platform` 或 Electron main/preload。

