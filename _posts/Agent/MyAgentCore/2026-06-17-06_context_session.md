---
title: My Agent Core Design - Context & Session
# date: YYYY-MM-DD HH:MM:SS +/-TTTT
categories: [Agent, Agent Core]
tags: [Agent, Agent Core]     # TAG names should always be lowercase
# toc: false
---

# Context & Session

- Context 采用 Node 模型, 每个 conversation item 是一个树节点.
- 使用 SQLite 持久化 conversation/session 数据, session 数据集中存放在用户级 `${SOONG_AGENT_HOME}/sessions.sqlite`.
- Session 是完整 agent tree 的持久化容器; run 是某个 agent 在该 session 内的一次 loop 执行.
- 同一个 session 内, main/Orchestrator run 串行; child/sub/fork agent run 可以并发.
- 同一个 session_id 覆盖主 agent 和 sub agent 的过程; 通过 agent_id / run_id 区分不同 agent 和 run.

## SQLite Schema
- SQLite 只保存 conversation/session/runtime 元数据:
	- 全局元数据表: `sessions`, `agents`, `runs`, `artifacts`.
	- 每个 session 独立表: `nodes_<session_id>`, `events_<session_id>`.
- 第一版不建 `plans` 当前状态表.
- 第一版不建 `tasks` / `task_attempts` / `task_dependencies` 当前状态表.
- Plan 是普通项目 Markdown 文件, 由普通 file tool 读写.
- Task DAG 当前状态来自运行时内存, 通过项目级 Task WAL JSONL 恢复.
- SQLite events 可记录 Task tool lifecycle / runtime event, 但不作为 Task DAG source of truth.
- 动态表名使用原始 session_id, 但 session_id 必须由 core 生成并严格 sanitize, 只允许 `[a-zA-Z0-9_]+`.
- session_id 示例: `sess_20260612_153022_a1b2`.

## SQLite Writes
- 所有 SQLite 写操作进入全局 async writer queue, 顺序执行.
- SQLite 开启 WAL, 允许读并发.
- 第一版优先稳定, 不追求多 writer 并发.
- 写 node 和对应 event 必须在同一事务中完成.
- 如果事务失败, node 和 event 都不落库.
- 纯 lifecycle event 没有关联 node 时可单独写 event.

## Task WAL
- Task DAG 变更不写 SQLite 当前状态表.
- Task DAG 变更写入 `<project>/.soong-agent/tasks/<session_id>/<model-chosen-task-name>.wal.jsonl`.
- Task WAL 由 Task manager 单 writer 队列追加.
- Task WAL append 成功后才更新内存 DAG.
- runtime 恢复 session 时 replay 对应 WAL 文件重建 Task DAG.
- Task WAL replay 失败会使该 session 的 Task DAG 不可用, 但不破坏 SQLite conversation replay.

## Node And Event
- Node 是主数据, Event 是 timeline/debug 日志:
	- 构造模型上下文只看 nodes 和显式注入的 synthetic context.
	- events 用于 timeline, debug, inspect, replay 辅助.
- Node 不和 Event 共用同一个全局 seq.
- `nodes_<session_id>.node_seq` 在 session 内单调递增, 只表示 node 创建顺序.
- `node_seq` 由 storage manager 在写入 node 时分配.
- child/sub/fork 并发写 node 时也必须经过 storage manager, 避免 seq 冲突.
- 上下文顺序主要由 parent/child tree 和 active path 决定.
- `events_<session_id>.seq` 由 storage writer 分配, 表示 timeline 顺序.
- `events_<session_id>.run_seq` 在 run 内单调递增, 用于 run replay.
- timeline 按 event seq 排序, 不依赖 created_at 排序.

## Node Types
- Node 使用 `role + node_type`:
	- role 表示 provider/message 层角色, 例如 user / assistant / tool.
	- node_type 表示 core 内部语义, 例如 message / skill_context / memory_context / compaction / child_result / plan_instruction / task_instruction / task_board / system_note.
- Plan tool 返回的模板内容写为 `node_type=plan_instruction`.
- Task template tool 返回的模板内容写为 `node_type=task_instruction`.
- Task DAG summary 可写为 `node_type=task_board`.

## `nodes_<session_id>` Fields
- node_id TEXT PRIMARY KEY
- node_seq INTEGER NOT NULL
- parent_id TEXT NULL
- agent_id TEXT NOT NULL
- run_id TEXT NULL
- role TEXT NOT NULL
- node_type TEXT NOT NULL
- content_json TEXT NOT NULL
- metadata_json TEXT
- token_count INTEGER
- created_at TEXT NOT NULL

## `events_<session_id>` Fields
- event_id TEXT PRIMARY KEY
- seq INTEGER NOT NULL
- run_seq INTEGER
- agent_id TEXT
- run_id TEXT
- level TEXT NOT NULL
- event_type TEXT NOT NULL
- node_id TEXT
- tool_call_id TEXT
- payload_json TEXT
- created_at TEXT NOT NULL

## Global Tables
- `sessions` 字段:
	- session_id TEXT PRIMARY KEY
	- cwd TEXT NOT NULL
	- root_agent_id TEXT NOT NULL
	- active_node_id TEXT
	- parent_session_id TEXT
	- status TEXT NOT NULL
	- metadata_json TEXT
	- created_at TEXT NOT NULL
	- updated_at TEXT NOT NULL
- `agents` 字段:
	- agent_id TEXT PRIMARY KEY
	- session_id TEXT NOT NULL
	- parent_agent_id TEXT
	- agent_type TEXT NOT NULL
	- created_by_run_id TEXT
	- fork_from_node_id TEXT
	- status TEXT NOT NULL
	- result_json TEXT
	- metadata_json TEXT
	- created_at TEXT NOT NULL
	- updated_at TEXT NOT NULL
- `runs` 字段:
	- run_id TEXT PRIMARY KEY
	- session_id TEXT NOT NULL
	- agent_id TEXT NOT NULL
	- status TEXT NOT NULL
	- start_node_id TEXT
	- end_node_id TEXT
	- end_reason TEXT
	- turn_count INTEGER
	- usage_json TEXT
	- error_json TEXT
	- metadata_json TEXT
	- created_at TEXT NOT NULL
	- updated_at TEXT NOT NULL
- `artifacts` 字段:
	- artifact_id TEXT PRIMARY KEY
	- session_id TEXT NOT NULL
	- agent_id TEXT
	- run_id TEXT
	- node_id TEXT
	- tool_call_id TEXT
	- path TEXT NOT NULL
	- filename TEXT
	- mime_type TEXT
	- size_bytes INTEGER
	- summary TEXT
	- metadata_json TEXT
	- created_at TEXT NOT NULL

## Status Enums
- session.status: active / archived.
- agent.status: idle / running / completed / failed / cancelled.
- run.status: queued / pending / running / completed / failed / aborted / cancelled.
- run.end_reason: completed / max_turns / aborted_streaming / aborted_tools / prompt_too_long / max_output_tokens_recovery / failed.
- run.end_reason 只保留高层稳定枚举; provider/tool/storage 细节进入 `runs.error_json` 和 events.
- stop_hook_prevented 是 hook/event/recovery 语义, 不作为普通 run.end_reason; Stop hook deny 后 loop 继续, 最终仍无法继续时用 max_turns / aborted_* / failed 等高层 end_reason.
- agent.agent_type: main / orchestrator / sub / fork.
- orchestrator 表示 orchestrator mode 下的 Orchestrator agent, 不是两层 agent 结构.
- 具体用途放 `agents.metadata_json.purpose`, 例如 compact / worker / review / debug.
- Memory Extraction Job 不是 agent, 不写入 `agents` 表, 不使用 `agent_type`, 不创建 agent_id / run_id.

## Content Blocks
- `content_json` 存 provider-neutral content blocks, 不是 provider 原始格式, 也不是单独 JSON 文件.
- Content block 第一版支持:
	- text
	- json
	- tool_call
	- tool_result
	- artifact_ref
- Content block 在 core 内部使用严格 Pydantic discriminated union, 按 `type` 分派.
- `json` content block 写入时按阈值处理:
	- 小 JSON 直接存在 block 中.
	- 大 JSON 按 byte/token 阈值 artifact 化.
	- artifact 化后 block 只保留 summary + artifact_ref.
	- prompt composer 不再重新承载完整大 JSON.
- `artifact_ref` content block:
	- 只引用 artifact_id.
	- 可带 summary, mime_type 等轻量展示信息.
	- 真实 path/size/run/node/tool_call 关系只放 `artifacts` 表.
- Tool call 和 tool result 都是 content blocks:
	- assistant node 可包含 text + tool_call blocks.
	- tool node 包含 tool_result blocks.
	- user node 可包含 text / attachment / artifact_ref blocks.
- Tool 失败时仍写入 tool_result block, 带 `is_error: true`, 同时写 `tool_failed` event.

## Active Path
- 构造模型上下文时只取 active node 沿 parent_id 回 root 的 active path.
- sibling branch 默认不进入上下文.
- `/switch_node` 改变 active node 后, 下一轮上下文使用新的 active path.
- 只支持从 user message 开新 branch.
- worker sub agent 每次 dispatch_worker 可以在该 worker 的 context tree 上开启新 branch.
- worker run 默认只读取本次 dispatch branch 的 active path.
- `/tree` 和 `/branch` 合并成 `/switch_node` 能力.
- 第一版不做 branch merge, 也不需要 branch summary.
- Context 原始历史不物理删除, compact 后仍可回溯.
