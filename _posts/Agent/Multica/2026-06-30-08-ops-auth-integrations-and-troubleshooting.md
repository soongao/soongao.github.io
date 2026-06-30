---
title: "08-ops-auth-integrations-and-troubleshooting"
categories: [Agent, Multica]
tags: [Agent, Multica]
---

# 部署、认证、集成与排障

本文提炼文档站里的 Cloud/Self-host/Auth/CLI/GitHub/Lark/Troubleshooting 内容。它服务于代码学习：当你看到某个环境变量、token、webhook、daemon 状态时，能立刻知道它在系统里的位置。

## Cloud 与 Self-host 的边界

Cloud 和 Self-host 换的是 server 层，不换执行层。

| 模式 | Server 在哪里 | Daemon 在哪里 | AI API key/代码目录在哪里 |
| --- | --- | --- | --- |
| Multica Cloud | Multica 托管 | 用户本机 | 用户本机 |
| Self-host | 用户自己的 Docker/Kubernetes/服务器 | 用户本机 | 用户本机 |
| Desktop + Cloud | Cloud | Desktop 自动拉起的本机 daemon | 用户本机 |
| Desktop + Self-host | 自部署 server | Desktop 自动拉起的本机 daemon | 用户本机 |

也就是说，自部署不是把 agent 执行搬到服务器上。它只让数据库、API、Web、存储在自己的基础设施内运行。

## Self-host 启动链路

Docker Compose 快速启动的目标形态：

```text
frontend: 127.0.0.1:3000
backend:  127.0.0.1:8080
postgres: compose 内部网络
```

`make selfhost` 做的事：

1. 从 `.env.example` 生成 `.env`。
2. 生成随机 `JWT_SECRET` 和 Postgres 密码。
3. 拉取 PostgreSQL、backend、frontend 镜像。
4. 启动 compose。
5. backend 容器入口先跑 migration，再启动 server。
6. 等 `/health` 或 `/readyz` 可用。

默认端口只监听 `127.0.0.1`，不是 `0.0.0.0`。跨机器访问要用反向代理终结 TLS，再转发：

```text
https://multica.example.com/api/* -> 127.0.0.1:8080
https://multica.example.com/ws    -> 127.0.0.1:8080
https://multica.example.com/*     -> 127.0.0.1:3000
```

关键环境变量：

| 变量 | 必要性 | 错了会怎样 |
| --- | --- | --- |
| `DATABASE_URL` | 生产必须 | backend 连不上数据库 |
| `JWT_SECRET` | 生产必须 | 默认值不安全，cookie 可被伪造风险 |
| `APP_ENV=production` | 生产必须 | 固定验证码等开发行为可能误开 |
| `FRONTEND_ORIGIN` | self-host 必须 | 邀请链接指向 Cloud，WebSocket origin 校验失败 |
| `MULTICA_PUBLIC_URL` | webhook 推荐 | Autopilot webhook URL 不能生成正确公开地址 |
| `MULTICA_APP_URL` | CLI/self-host 推荐 | setup 命令和登录跳转域名不对 |

## 认证模型

### 浏览器登录

Email 验证码：

```text
输入邮箱
  -> /auth/send-code
  -> server 发 6 位验证码或打印到 stdout
  -> /auth/verify-code
  -> server 签发 30 天 JWT cookie
```

Google OAuth：

```text
点击 Google 登录
  -> Google OAuth
  -> /auth/callback
  -> server 签发 JWT cookie
```

自部署如果不配邮件 provider，验证码不会真正发送，只会出现在 backend stdout。这对本地开发方便，对生产是静默黑洞。

### CLI 登录

CLI 用 PAT：

```text
multica login
  -> 浏览器授权
  -> server 创建 PAT
  -> CLI 保存到 ~/.multica/config.json
```

无浏览器环境可以：

```bash
multica login --token mul_xxx
```

### Daemon 通信

daemon 内部用 daemon token (`mdt_...`)。它的权限比 PAT 小，绑定具体 workspace/runtime，主要用于：

- 注册 runtime
- 心跳
- claim task
- 上报 start/progress/messages/usage/complete/fail

不要为了省事用 PAT 跑长期 daemon。PAT 代表完整用户身份，权限放大。

## 三类 token 对比

| Token | 格式 | 持有者 | 典型 API | 生命周期 |
| --- | --- | --- | --- | --- |
| JWT Cookie | `multica_auth` | 浏览器 | Web UI API, `/ws` cookie auth | 30 天 |
| PAT | `mul_...` | CLI/脚本 | 几乎所有用户 API，daemon bootstrap | 默认不过期 |
| Daemon Token | `mdt_...` | daemon | `/api/daemon/*` | daemon 管理 |

安全重点：

- `multica auth logout` 只是删除本地 PAT，不撤销服务端 PAT。
- PAT 创建时只显示一次，server 只保存哈希。
- 怀疑泄露必须在 Settings -> Personal Access Tokens revoke。

## 注册白名单和工作区创建

注册控制有三层：

```text
ALLOWED_EMAILS
ALLOWED_EMAIL_DOMAINS
ALLOW_SIGNUP
```

容易误解的点：白名单是限制，不是额外放行。只要 `ALLOWED_EMAIL_DOMAINS=company.io` 非空，不属于该域的邮箱就被拒，即使 `ALLOW_SIGNUP=true`。

`DISABLE_WORKSPACE_CREATION=true` 只禁止已登录用户自助创建新 workspace，不等于关闭注册。常见自部署流程：

1. 暂时允许创建 workspace。
2. 管理员创建共享 workspace。
3. 打开 `DISABLE_WORKSPACE_CREATION=true`。
4. 后续成员通过邀请加入。

## 邮件发送路径

两种 provider：

| Provider | 适合场景 | 关键变量 |
| --- | --- | --- |
| Resend | 公网部署 | `RESEND_API_KEY`, `RESEND_FROM_EMAIL` |
| SMTP relay | 内网/企业邮件 | `SMTP_HOST`, `SMTP_PORT`, `SMTP_USERNAME`, `SMTP_PASSWORD`, `SMTP_TLS` |

优先级：只要 `SMTP_HOST` 非空，就走 SMTP，即使也配置了 Resend。

SMTP 典型端口：

- `25`：匿名内部 relay。
- `587`：认证提交，STARTTLS。
- `465`：隐式 TLS/SMTPS。

常见问题：

- `SMTP_EHLO_NAME` 不合法，严格 relay 返回模糊 `EOF`。
- 私有 CA 导致 TLS 证书校验失败。
- `RESEND_FROM_EMAIL` 或 SMTP From 不被 relay 允许。

## 文件存储和附件

附件优先 S3，不配则本地磁盘。

| 路径 | 行为 |
| --- | --- |
| `S3_BUCKET` 已配置 | 使用 S3 或 S3 兼容存储 |
| `AWS_ENDPOINT_URL` 已配置 | path-style，适合 MinIO/RustFS |
| `CLOUDFRONT_DOMAIN` 已配置 | 优先 CloudFront URL |
| S3 未配置 | 写 `LOCAL_UPLOAD_DIR` |

`ATTACHMENT_DOWNLOAD_MODE` 决定下载方式：

- `cloudfront`
- `presign`
- `proxy`
- `auto`

内网对象存储常用 `proxy`，否则前端拿到的 URL 可能是容器内地址。

## WebSocket 与实时同步排障

实时链路：

```text
Handler/Service publish event
  -> events.Bus
  -> registerListeners
  -> realtime.Hub / Redis relay
  -> WebSocket /ws
  -> packages/core WSClient
  -> useRealtimeSync
  -> React Query cache
```

WebSocket 连不上常见原因：

| 症状 | 常见原因 | 修复 |
| --- | --- | --- |
| 浏览器 console 报 WS closed | `FRONTEND_ORIGIN` 未设置或不匹配 | 设置为真实前端域名并重启 backend |
| https 页面连 ws | 协议不匹配 | https 用 wss |
| 反向代理后 WS 失败 | 没转发 Upgrade header | 配置 `proxy_set_header Upgrade` 等 |
| 登录一段时间后断 | cookie 过期 | 重新登录 |

Self-host 生产最关键的是 `FRONTEND_ORIGIN`。它同时影响 CORS、邀请链接、WebSocket origin。

## Daemon 排障

### 守护进程连不上 server

排查顺序：

```bash
multica daemon logs --lines 100
echo $MULTICA_SERVER_URL
curl -i https://api.example.com/health
cat ~/.multica/config.json
multica workspace list
```

常见原因：

- `MULTICA_SERVER_URL` 指向默认 `localhost`，但 server 在远端。
- 反向代理没有转发 `/api/daemon/*` 或 `/ws`。
- PAT 被撤销或没登录。
- 用户不是目标 workspace 成员。
- DNS/防火墙问题。

### Task 一直 queued

常见原因：

- agent 并发上限满，默认 6。
- daemon 并发上限满，默认 20。
- 同一 issue 上同一 agent 已有 queued/dispatched task。
- agent 被归档。
- runtime 未注册或刚失联。
- local_directory 正在被占用，进入 `waiting_local_directory`。

关键源码：

- claim：`server/internal/handler/daemon.go`
- 队列/并发：`server/internal/service/task.go`
- 本地循环：`server/internal/daemon/daemon.go`

## Usage 看板

Usage/Runtime 看板不是直接读原始 task usage，而是读小时级派生表：

```text
task_usage -> rollup_task_usage_hourly() -> task_usage_hourly
```

从当前文档站描述看，后端通过 DB-backed scheduler 每 30 秒 tick，认领 5 分钟一档 UTC plan，并写 `sys_cron_executions`。多副本通过唯一键抢占，避免重复执行。

排查 SQL：

```sql
SELECT count(*) AS raw_rows FROM task_usage;
SELECT count(*) AS hourly_rows FROM task_usage_hourly;

SELECT plan_time, status, error_code, error_msg
  FROM sys_cron_executions
 WHERE job_name = 'rollup_task_usage_hourly'
 ORDER BY plan_time DESC
 LIMIT 20;
```

## GitHub 集成

### 配置边界

Self-host 要配置：

```dotenv
GITHUB_APP_SLUG=multica-acme
GITHUB_WEBHOOK_SECRET=<webhook secret>
GITHUB_APP_ID=<optional numeric app id>
GITHUB_APP_PRIVATE_KEY=<optional pem>
```

`GITHUB_WEBHOOK_SECRET` 是 webhook secret，不是 GitHub App client secret。

缺必填变量时：

- Settings -> GitHub 的 Connect 按钮 disabled。
- `/api/webhooks/github` 返回 `503 github webhooks not configured`。

### 运行逻辑

```text
GitHub pull_request webhook
  -> 校验 X-Hub-Signature-256
  -> upsert github_pull_request
  -> 扫 branch/title/body 中的 issue key
  -> 建 issue_pull_request
  -> PR merged/closed 时重新评估关联 issue 是否可自动 done
```

匹配只限当前 workspace 的 issue prefix。例如 `ACME-42` 只会匹配 `issue_prefix=ACME` 的工作区。

自动转 `done` 不是“任意关联 PR merged 就关闭 issue”。条件是：

- issue 不能已经是 `done` 或 `cancelled`。
- 这个 issue 没有仍然 `open` / `draft` 的关联 PR。
- 至少一个已 merged 的关联 PR 带 close intent，也就是标题或正文里用了 `Closes/Fixes/Resolves ACME-42` 这类关闭关键字。仅在分支名或标题里裸提 `ACME-42` 只会建立关联，不代表关闭意图。

代码入口：`server/internal/handler/github.go`。

## Autopilot webhook

Webhook URL：

```text
/api/webhooks/autopilots/awt_xxx
```

这里的 `awt_xxx` 就是 bearer secret。处理链路：

1. IP 限流。
2. token lookup。
3. token 限流。
4. body 大小限制。
5. JSON normalize。
6. event/action 推断。
7. event filter。
8. 写 webhook_delivery。
9. dispatch autopilot。
10. 返回 accepted/skipped/ignored/rejected/duplicate。

关键源码：`server/internal/handler/autopilot_webhook.go`。

## 飞书/Lark Bot 集成

Cloud 已配置；Self-host 需要：

```dotenv
MULTICA_LARK_SECRET_KEY=<base64 32-byte key>
```

这个 key 用于加密每个 Bot 的 app secret。没配时绑定入口隐藏。

产品规则：

- 一个 Bot 绑定一个 agent。
- 用户第一次使用 Bot 要绑定飞书身份到 Multica 账号。
- 非工作区成员的消息会被丢弃，不保存消息内容。
- 私聊和群 @ 走 chat task。
- `/issue` 创建 Multica issue。

代码入口：

- `server/internal/integrations/lark/*`
- `server/internal/integrations/channel/engine/*`

## Desktop 自部署配置

Desktop 默认连 Multica Cloud。要连自部署，写：

```json
{
  "schemaVersion": 1,
  "apiUrl": "https://api.your-domain"
}
```

路径：

```text
~/.multica/desktop.json
```

Desktop 会从 `apiUrl` 推导：

- `wsUrl`: 同源 `/ws`，https 对应 wss。
- `appUrl`: API 同源地址。

如果配置文件存在但无效，Desktop fail closed，不静默回退 Cloud。

## 常用定位命令

项目有 `.codegraph/`，优先：

```bash
codegraph explore "TaskService EnqueueTaskForIssue ClaimTaskByRuntime CompleteTask"
codegraph explore "HandleAutopilotWebhook DispatchAutopilot dispatchCreateIssue"
codegraph explore "CreateProjectResource local_directory execenv"
```

补充搜索：

```bash
rg -n "EventTaskQueued|EventIssueCreated|EventChatDone" server packages
rg -n "FRONTEND_ORIGIN|MULTICA_PUBLIC_URL|GITHUB_WEBHOOK_SECRET" server apps docs
rg -n "waiting_local_directory|local_directory" server/internal
```
