---
title: My Agent Core Design - Codegen Plan
# date: YYYY-MM-DD HH:MM:SS +/-TTTT
categories: [Agent, Agent Core]
tags: [Agent, Agent Core]     # TAG names should always be lowercase
# toc: false
---

# Codegen Plan

本文档定义 `soong-agent` 的代码生成执行计划。Codex 或其他代码生成器按阶段实现项目, 并用测试用例逐步验收。

## 目标

- Python distribution name: `soong-agent`.
- Python import package: `agent_core`.
- CLI 命令: `agentcli`.
- 第一版必须覆盖文档中定义的 SDK、runtime、provider、context、tools、permissions、hooks、MCP、plan、task、multi-agent、compact、memory、CLI 和测试约束。
- 可以分阶段生成代码, 但最终验收要覆盖全部文档能力, 不划分只实现部分能力的 v1。
- 测试使用真实但隔离的目录, 并支持本地 Ollama `gemma4` 集成测试。

## 代码生成输入

生成代码时必须以以下文档为 source of truth:

- `0-index.md`: 文档总索引。
- `01-goal.md` 到 `20-error-handling.md`: 行为语义。
- `21-codegen-contract.md`: 对外接口、schema、tool name、错误码、默认模板的稳定契约。
- 本文档: 生成顺序、工程结构和测试验收计划。

当章节之间出现冲突时, 优先级为:

1. `21-codegen-contract.md`
2. 本文档
3. 其他章节

## 项目代码结构

建议使用以下目录结构。实现时可以增加内部 helper, 但不要改变公开 import path、CLI entry point、内置 tool canonical name 和持久化 schema 的语义。

```text
soong-agent/
├── pyproject.toml
├── README.md
├── src/
│   └── agent_core/
│       ├── __init__.py
│       ├── cli.py
│       ├── py.typed
│       ├── api/
│       │   ├── __init__.py
│       │   ├── runtime.py
│       │   ├── handles.py
│       │   └── replay.py
│       ├── assets/
│       │   └── templates/
│       │       ├── config_default.toml
│       │       ├── plan_template.md
│       │       └── task_template.md
│       ├── agents/
│       │   ├── __init__.py
│       │   ├── definitions.py
│       │   ├── builtin.py
│       │   ├── registry.py
│       │   ├── child.py
│       │   └── workers.py
│       ├── artifacts/
│       │   ├── __init__.py
│       │   ├── manager.py
│       │   ├── redaction.py
│       │   └── cleanup.py
│       ├── compact/
│       │   ├── __init__.py
│       │   ├── policy.py
│       │   ├── agent.py
│       │   └── recovery.py
│       ├── config/
│       │   ├── __init__.py
│       │   ├── loader.py
│       │   ├── models.py
│       │   ├── paths.py
│       │   └── validation.py
│       ├── context/
│       │   ├── __init__.py
│       │   ├── builder.py
│       │   ├── composer.py
│       │   ├── instructions.py
│       │   ├── skills.py
│       │   ├── memory_context.py
│       │   ├── task_board.py
│       │   └── tokens.py
│       ├── errors/
│       │   ├── __init__.py
│       │   ├── codes.py
│       │   └── exceptions.py
│       ├── events/
│       │   ├── __init__.py
│       │   ├── bus.py
│       │   ├── models.py
│       │   └── stream.py
│       ├── hooks/
│       │   ├── __init__.py
│       │   ├── loader.py
│       │   ├── matcher.py
│       │   └── runner.py
│       ├── loop/
│       │   ├── __init__.py
│       │   ├── runner.py
│       │   ├── scheduler.py
│       │   ├── queue.py
│       │   ├── tool_execution.py
│       │   └── cancellation.py
│       ├── mcp/
│       │   ├── __init__.py
│       │   ├── config.py
│       │   ├── client.py
│       │   ├── discovery.py
│       │   └── tools.py
│       ├── memory/
│       │   ├── __init__.py
│       │   ├── catalog.py
│       │   ├── recall.py
│       │   ├── extraction.py
│       │   ├── writer.py
│       │   └── cursor.py
│       ├── permissions/
│       │   ├── __init__.py
│       │   ├── models.py
│       │   ├── policy.py
│       │   ├── session_cache.py
│       │   └── stdin.py
│       ├── providers/
│       │   ├── __init__.py
│       │   ├── base.py
│       │   ├── registry.py
│       │   ├── openai_compatible.py
│       │   ├── anthropic.py
│       │   ├── ollama.py
│       │   ├── streaming.py
│       │   └── tool_mapping.py
│       ├── runtime/
│       │   ├── __init__.py
│       │   ├── lifecycle.py
│       │   ├── run_state.py
│       │   ├── session_state.py
│       │   └── modes.py
│       ├── storage/
│       │   ├── __init__.py
│       │   ├── sqlite.py
│       │   ├── migrations.py
│       │   ├── repositories.py
│       │   ├── task_wal.py
│       │   └── ids.py
│       ├── tasks/
│       │   ├── __init__.py
│       │   ├── models.py
│       │   ├── dag.py
│       │   ├── operations.py
│       │   ├── service.py
│       │   ├── wal.py
│       │   └── tools.py
│       ├── tools/
│       │   ├── __init__.py
│       │   ├── definitions.py
│       │   ├── registry.py
│       │   ├── execution.py
│       │   ├── builtin_code.py
│       │   ├── declarative.py
│       │   ├── agent_tools.py
│       │   ├── internal.py
│       │   └── output_limits.py
│       └── types/
│           ├── __init__.py
│           ├── content.py
│           ├── runtime.py
│           ├── tools.py
│           ├── agents.py
│           ├── permissions.py
│           └── common.py
└── tests/
    ├── conftest.py
    ├── fixtures/
    │   ├── config.py
    │   ├── fake_provider.py
    │   ├── ollama.py
    │   └── filesystem.py
    ├── unit/
    │   ├── test_config_loader.py
    │   ├── test_paths.py
    │   ├── test_types_validation.py
    │   ├── test_tool_registry.py
    │   ├── test_code_tools.py
    │   ├── test_permissions.py
    │   ├── test_instruction_catalog.py
    │   ├── test_skills.py
    │   ├── test_memory.py
    │   ├── test_task_dag.py
    │   ├── test_task_wal.py
    │   ├── test_agent_definitions.py
    │   ├── test_context_builder.py
    │   ├── test_artifacts.py
    │   └── test_error_codes.py
    ├── integration/
    │   ├── test_runtime_loop.py
    │   ├── test_run_queue_cancel.py
    │   ├── test_sqlite_replay.py
    │   ├── test_plan_task_tools.py
    │   ├── test_multi_agent.py
    │   ├── test_worker_dispatch.py
    │   ├── test_compact.py
    │   ├── test_hooks.py
    │   ├── test_mcp.py
    │   └── test_cli.py
    └── e2e/
        └── test_ollama_gemma4.py
```

## 实现计划

### 1. 工程脚手架

- 创建 `pyproject.toml`, 使用 `src/` layout。
- 配置 `agentcli = "agent_cli.cli:main"` console script。
- 依赖建议:
  - runtime: `pydantic`, `httpx`, `aiosqlite` 或标准 `sqlite3` + executor, `typing-extensions`, `anyio`。
  - test: `pytest`, `pytest-asyncio` 或 `anyio` pytest plugin。
- `agent_core.__init__` 只导出稳定 SDK 类型, 不导出内部实现模块。
- 加入 `py.typed`。

### 2. 公共类型与错误码

- 按 `21-codegen-contract.md` 生成 Pydantic 类型。
- 所有外部边界类型默认 `extra="forbid"`。
- 实现 `ErrorCode` StrEnum, 确保文档中列出的错误码都存在。
- 实现 ID helper, 统一校验安全字符、前缀和长度。
- 实现 UTC datetime 序列化 helper。

### 3. 配置与路径解析

- 实现 `SOONG_AGENT_HOME` 解析:
  - 显式 `home_dir` 优先。
  - 其次环境变量。
  - 最后 `~/.soong-agent`。
- `config.toml` 必须存在, 缺失/解析失败/schema 失败都启动失败。
- 不实现 `agentcli init`。
- 不读取 `<project>/.soong-agent/config.toml`。
- `<project>` 默认 cwd, `--path` / `project_dir` 指向文件时使用父目录, 不存在则失败。
- 路径边界统一 resolve symlink 后判断。
- 自动创建 `<project>/.soong-agent/plans` 和 `<project>/.soong-agent/tasks`。

### 4. Provider Adapter

- 实现 provider registry。
- 实现 `openai`, `anthropic`, `ollama` 三个 adapter。
- 对外不暴露 provider SDK 原始 request/response 类型。
- Provider 不支持 tool call/schema 时 run failed, 不静默退化为纯文本。
- 先用 fake stream helper 完成 runtime 单元测试, 再接入 Ollama `gemma4` 做真实集成测试。

### 5. SQLite、事件和 replay

- 实现 session SQLite schema、migration 和 repository。
- RuntimeEvent 落库 event 必须有 `seq`; 高频 delta 可不落库。
- 实现 `replay_session`, `replay_run`, `get_node_path`, `delete_session`。
- 实现 artifact manager, 大 tool 输出除 `code.read_file` 外需要截断 + artifact 引用。
- Secret redaction 应覆盖 event、artifact、debug raw payload。

### 6. Runtime Loop

- 实现 `AgentRuntime` async lifecycle。
- 实现 `runtime.start(...) -> RunHandle`。
- 实现 normal 和 orchestrator mode; orchestrator mode 的主 agent 就是 Orchestrator, 不创建两层 agent。
- 同 session active run 存在时新 run 进入 FIFO queue。
- queued run 被 cancel 时不创建模型请求, 不触发 permission callback。
- loop 支持模型 streaming、tool calls、tool result 回填、继续模型请求、终态写入。
- 同一轮多个 tool calls 可并行执行, 当前 loop 等待全部 tool calls 终态后再继续。

### 7. Context、Instructions、Skills

- 实现 Prompt Composer:
  - static system blocks。
  - dynamic system blocks。
  - non-system prompt。
  - budget 裁剪和 ContextBuildReport。
- 实现 instruction catalog:
  - 启动/run 开始扫描用户级和项目级 instruction 文件。
  - catalog 只包含路径和 frontmatter metadata, 不包含正文。
  - 没有 frontmatter 的文件也进入 catalog。
  - 同目录 `CLAUDE.md` 优先于 `AGENTS.md`。
  - 不扫描 `<project>/.soong-agent/rules`。
  - 模型用普通 `code.read_file` 读取 instruction 正文。
  - 读取 instruction 正文后注册 dynamic system block / instruction_context。
- 实现 skill catalog 和 `load_skill(name)` internal tool。
- 不实现项目级 skills / agents / tools / hooks / memory / rules。

### 8. Tools、Permissions、Hooks

- 实现 tool registry 和内置工具:
  - `code.read_file`
  - `code.list_dir`
  - `code.search`
  - `code.write_file`
  - `code.edit_file`
  - `code.run_command`
  - agent tools
  - task tools
  - internal tools
- `code.run_command` 只接受 argv list, 不接受 shell string。
- write/edit/run_command/declarative write/dangerous/network 默认询问。
- 普通 readonly 自动允许; 敏感 read/list/search 询问。
- Permission decision 只有 `allow_once`, `allow_for_session`, `deny`。
- `allow_for_session` 只在当前 session 内存生效, 不持久化。
- CLI permission callback 使用 stdin:
  - `1` allow once。
  - `2` allow for session。
  - `3` deny。
  - EOF/非法输入默认 deny。
- hooks 只读取 `${SOONG_AGENT_HOME}/hooks.json`。

### 9. Plan 与 Task

- `agent.plan_template` 返回 synthetic user/context block, 模型生成计划正文和文件名后, 再用普通 write/edit tool 写 `<project>/.soong-agent/plans/<name>.md`。
- `agent.task_template` 返回 Task DAG 写作模板。
- Task source of truth 是项目级 WAL JSONL。
- 实现 Task DAG schema、operations、ready 推进、claim、lease、terminal、replay。
- `agent.task_fail` / `agent.task_cancel` 必须强制终止所有未结束 step, 包括 claimed/running, 并取消对应 worker run。
- Orchestrator 可以修改 claimed/running step 内容, sub/worker 不能修改内容字段。
- Task completed/failed/cancelled 后不可恢复。

### 10. Multi-Agent 与 Worker

- 实现内置 AgentDefinition:
  - `default_sub_agent`
  - `default_fork_agent`
  - `default_worker_agent`
- 支持用户级 `${SOONG_AGENT_HOME}/agents/*.md`。
- 支持代码注册 AgentDefinition。
- `create_sub_agent`, `fork_agent`, `dispatch_worker` 禁止 inline system instructions。
- `allowed_tools` 只能收窄 effective tool set, 不能扩大权限。
- Worker pool 必须显式配置; orchestrator mode 无有效 worker pool 时启动失败。
- worker 可以重复引用同一个 AgentDefinition 创建多个 worker, 不支持 count 字段。
- worker run 只能 query/claim/update dispatch 指定 task 范围内的 step。

### 11. Compact 与 Memory

- compact 由 runtime 内部 fork compact agent 执行, 不是模型主动调用 `agent.fork_agent`。
- compact agent 使用内置不可覆盖 `default_compact_agent`, 不出现在 `agent.list_agent_definitions`。
- Memory Extraction Job 不是 fork/sub/child agent, 不创建 agent_id/run_id。
- Memory Extraction Job 使用 `memory.extract_model_profile`, 默认回退主模型。
- Memory Recall Selector 使用 `memory.recall_model_profile`, 默认回退主模型。
- 不支持项目记忆。
- `internal.recall_memory` 只允许 main agent / Orchestrator 使用, sub/fork/worker/compact 不暴露。
- Memory Writer 只能写 `${SOONG_AGENT_HOME}/memory/MEMORY.md` 和指定用户级 memory 子目录。

### 12. MCP

- 实现 `${SOONG_AGENT_HOME}/mcp.json` 解析。
- lazy connect。
- 连接失败的 MCP server tools 不进入 effective tool set。
- 支持 config 中 disabled servers/tools 和 tool overrides。
- MCP tool 经过统一 permission、hook、output limit、artifact、redaction 流程。

### 13. CLI

- 实现最小 CLI:
  - `agentcli chat [--path <dir-or-file>] [--orchestrator] [--session-id <id>]`
- CLI 输出人读文本。
- 不实现 `--json`。
- 不自动创建 config。
- 正常 CLI/runtime 不自动启动 Ollama。

### 14. 测试与验收

- 使用 `pytest`。
- 单元测试优先覆盖纯逻辑。
- 集成测试覆盖 runtime、storage、tools、task、agent、CLI。
- E2E 使用本机 Ollama `gemma4`。
- 测试隔离目录:
  - `SOONG_AGENT_HOME=~/.soong-agent/test-runs/<run_id>/home`
  - `<project>=~/.soong-agent/test-runs/<run_id>/project`
- 测试结束默认不删除 test-runs。
- 测试不得触碰 test-runs 之外的真实 `~/.soong-agent` 或用户文件。

## 测试用例规格

以下测试用例用于指导生成测试。测试名可以调整, 但每个行为点都要覆盖到。

### A. 工程与公开 API

| 用例 | 输入 / 操作 | 预期输出 / 断言 |
| --- | --- | --- |
| A1 package import | 在干净环境安装 editable package, 执行 `import agent_core` | import 成功; `AgentRuntime`, `UserMessage`, `RunHandle`, `RuntimeEvent`, `PermissionRequest`, `PermissionDecision`, `ToolDefinition`, `ToolResult`, `AgentDefinition` 可从公开入口导入 |
| A2 CLI entry | 执行 `agentcli --help` | 命令存在; help 中包含 `chat`; `agentcli chat --help` 包含 `--path`, `--orchestrator`, `--session-id`; 不包含 `init` 和 `--json` |
| A3 Pydantic extra forbid | 构造任一公开边界类型并传入未知字段 | 校验失败; 错误类型为 validation error; 未知字段没有被静默丢弃 |
| A4 error code completeness | 枚举 `ErrorCode` | 包含 `21-codegen-contract.md` 中列出的全部错误码; 没有拼写漂移 |

### B. Config 与路径

| 用例 | 输入 / 操作 | 预期输出 / 断言 |
| --- | --- | --- |
| B1 missing config | 设置 `SOONG_AGENT_HOME=<test_home>`, 不创建 `config.toml`, 初始化 `AgentRuntime(project_dir=<project>)` | 启动失败; error code 为 `config_error`; 不自动创建 config |
| B2 invalid TOML | 创建内容为非法 TOML 的 `<test_home>/config.toml`, 初始化 runtime | 启动失败; error code 为 `config_error`; 错误消息包含 config 路径 |
| B3 schema invalid | 创建合法 TOML 但缺少 `[model].provider` 或 provider 不合法 | 启动失败; error code 为 `config_error`; 不创建 SQLite session |
| B4 SOONG_AGENT_HOME override | 设置 `SOONG_AGENT_HOME=<run>/home`, 同时真实 `~/.soong-agent/config.toml` 存在不同配置 | runtime 只读取 `<run>/home/config.toml`; 不访问真实 home 配置 |
| B5 default home | 不传 `home_dir`, 不设置 `SOONG_AGENT_HOME` | home 解析为 `~/.soong-agent`; 测试中需要 monkeypatch home 以避免真实写入 |
| B6 project dir default | 在 `<project>` 目录作为 cwd, 初始化 `AgentRuntime()` | `<project>` 等于 cwd resolved path |
| B7 project path is file | 创建 `<project>/src/a.py`, 使用 `project_dir=<project>/src/a.py` | `<project>` 解析为 `<project>/src`; 不自动读取 `a.py` 内容 |
| B8 project path missing | 使用不存在的 `project_dir` | 启动失败; error code 为 `config_error` 或 path validation error; 不创建项目 `.soong-agent` |
| B9 no project config | 在 `<project>/.soong-agent/config.toml` 写入不同模型配置, 用户级 config 使用 Ollama | runtime 使用用户级 config; 项目 config 被完全忽略且无 warning |
| B10 auto create project dirs | runtime 启动后触发 plan/task 相关工具 | 自动创建 `<project>/.soong-agent/plans` 和 `<project>/.soong-agent/tasks`; 不创建项目级 hooks/tools/agents/skills/memory/rules |

### C. Provider

| 用例 | 输入 / 操作 | 预期输出 / 断言 |
| --- | --- | --- |
| C1 provider registry | 注册 key=`custom`, factory=fake provider, config 中 provider=`custom` | runtime 使用 fake provider; factory 收到解析后的 model config |
| C2 unsupported tool call | fake provider 标记不支持 tools, 运行需要 tool schema 的 run | run failed; error code 为 `unsupported_capability`; 不降级为纯文本 |
| C3 openai mapping | 给 adapter 输入包含 tool call delta 的 Chat Completions streaming chunk | 输出标准 `ModelEvent` tool_call start/delta/end; arguments 能重组成 dict |
| C4 anthropic mapping | 给 adapter 输入 Anthropic Messages streaming tool_use 事件 | 输出标准 `ModelEvent`; tool name 和 input 保持一致 |
| C5 ollama streaming | 本机 Ollama 运行时, 使用模型 `gemma4` 发送简单消息 | 收到 streaming text event; run 正常完成; event 中 provider 为 `ollama` |
| C6 ollama tool call | 本机 Ollama `gemma4` 收到可调用 `code.list_dir` 的请求 | 模型能发起 tool call; core 映射并执行; 最终 assistant response 可见 |

### D. Runtime Loop、事件与队列

| 用例 | 输入 / 操作 | 预期输出 / 断言 |
| --- | --- | --- |
| D1 normal run success | fake provider 返回一段 assistant text, 调用 `runtime.start("hello")` 并消费 events | 事件顺序包含 `loop_started`, assistant delta/final, `run_completed`; RunHandle status 为 completed |
| D2 orchestrator mode identity | 调用 `runtime.start("do task", mode="orchestrator")` | 主 agent role/name 为 Orchestrator; 不创建额外 center/orchestrator 双层 agent |
| D3 run queue FIFO | 同一 session 连续 start 两个 run, 第一个 fake provider 挂起, 第二个进入队列 | 第二个 RunHandle status queued; event 先输出 `run_queued`; 第一个完成后第二个输出 `loop_started` |
| D4 cancel queued run | 第二个 queued run 调用 `cancel()` | queued run 变为 cancelled/dequeued; 未创建 provider request; 未触发 permission callback |
| D5 cancel active run | active run 调用 `cancel()` | cancel_timeout 内进入 cancelled; provider stream 被关闭; 最后 active_node_id 指向最后用户可见持久化 node |
| D6 active node success | run 成功输出 assistant final | session active_node_id 指向最终 assistant node |
| D7 active node failed | provider 抛错或 tool fatal 失败 | failed assistant partial 不成为 active node; active_node_id 仍指向最后用户可见持久化 node |
| D8 parallel tool calls | fake provider 同一轮返回两个 readonly tool calls | 两个 tool handler 并行启动; loop 等两个结果都完成后再请求 provider 下一轮 |
| D9 agent tool failure policy | 同一轮两个 agent tools, 一个 child 失败一个成功 | 失败不取消另一个并行 agent tool; wait_all 后把两个结果都回填给模型 |

### E. SQLite、Replay、Artifact

| 用例 | 输入 / 操作 | 预期输出 / 断言 |
| --- | --- | --- |
| E1 migration creates schema | 使用空 `sessions.sqlite` 启动 runtime | migration 成功; 必要表存在; schema version 已记录 |
| E2 replay session | 完成一个包含 user/assistant/tool 的 run, 调用 `replay_session(session_id)` | ReplayResult 按 seq 返回持久化事件和节点; sensitive 默认被 redacted |
| E3 replay run | 同一 session 两个 run, 调用 `replay_run(run_id=第二个)` | 只返回第二个 run 相关事件/节点 |
| E4 delete active session | session 中有 active/queued run 时调用 `delete_session` | 返回 `session_active`; 不删除 SQLite 记录和 artifacts |
| E5 cleanup artifacts dry run | 创建 debug/raw artifact, 调用 `cleanup_artifacts(dry_run=True)` | 返回将删除的 artifact 列表; 文件仍存在 |
| E6 large tool output artifact | `code.run_command` 产生超过 stdout limit 的输出 | tool result stdout 被截断; 返回 `stdout_artifact_id`; artifact 文件存在且内容 redacted |
| E7 read_file no artifact | `code.read_file` 读取大文本文件 | 返回内容按行/行字节限制截断; 不创建全文 artifact |

### F. Context、Instruction、Skill

| 用例 | 输入 / 操作 | 预期输出 / 断言 |
| --- | --- | --- |
| F1 instruction catalog scan | 在 home 写 `CLAUDE.md`, `rules/a.md`; 在 project 写根和子目录 `CLAUDE.md`/`AGENTS.md` | run 开始的 static system block 包含 catalog; catalog 只有路径和 frontmatter metadata, 不含正文 |
| F2 no frontmatter instruction | 创建无 frontmatter 的 `<project>/CLAUDE.md` | 文件进入 catalog; metadata 使用相对路径等基础信息 |
| F3 CLAUDE priority | 同目录同时存在 `CLAUDE.md` 和 `AGENTS.md` | catalog 只展示 `CLAUDE.md` |
| F4 skipped dirs | 在 `<project>/node_modules/pkg/CLAUDE.md` 和 `<project>/.git/AGENTS.md` 创建文件 | catalog 不包含这些路径 |
| F5 no project rules | 创建 `<project>/.soong-agent/rules/a.md` | catalog 不扫描该文件 |
| F6 read instruction registers dynamic | 模型调用 `code.read_file` 读取 catalog 中的 instruction 文件 | tool result 正常返回文件内容; context 中新增 dynamic system block 或 `instruction_context` node |
| F7 repeated instruction read | 对同一 instruction 文件重复 `code.read_file`, 文件 hash 未变 | 第二次 tool result `already_loaded=true`; 不重复创建 instruction_context |
| F8 instruction changed | 修改已加载 instruction 文件内容后再次读取 | 新 hash 被加载; dynamic system block 更新; `already_loaded` 不为 true |
| F9 normal md not system | 读取普通业务 `README.md` | 只返回普通 file result; 不注册 dynamic system block |
| F10 skill catalog | 在 `${SOONG_AGENT_HOME}/skills/review.md` 写 frontmatter `name/description` 和 body | static system block 包含 skill catalog 的 name/description; 不包含 body |
| F11 load_skill | 模型调用 `load_skill("review")` | 返回 skill body 摘要; 写入 `skill_context`; 下轮 prompt 以 synthetic user/context message 注入 |

### G. Code Tools

| 用例 | 输入 / 操作 | 预期输出 / 断言 |
| --- | --- | --- |
| G1 read_file paging | 创建 1200 行文本, 调用 `code.read_file(path, start_line=1, max_lines=1000)` | 返回 1000 行; `truncated=true`; `next_start_line=1001` |
| G2 read_file line byte cap | 创建单行超过 4096 bytes 的文本 | 返回该行被截断; `truncated_lines` 包含行号 |
| G3 read_file binary | 读取二进制文件 | `binary=true`; 不返回二进制正文; 不创建全文 artifact |
| G4 list_dir nonrecursive | 创建目录和子目录文件, 调用 `code.list_dir(recursive=false)` | 只返回第一层 entries |
| G5 list_dir recursive limit | 调用 `code.list_dir(recursive=true, limit=2)` | 返回最多 2 条; `truncated=true` |
| G6 search default path | 在 project 内创建匹配文件, 调用 `code.search(query="needle", path=None)` | 默认搜索 `<project>`; 返回匹配文件、行号和片段 |
| G7 write_file conflict | 已存在 `a.txt`, 调用 `code.write_file(overwrite=false)` | 返回 tool error `path_conflict`; 文件内容不变 |
| G8 write_file create dirs | 调用 `code.write_file("new/dir/a.txt", create_dirs=true)` | 父目录自动创建; result 包含 bytes_written 和 created=true |
| G9 edit old new unique | 文件中唯一出现 `old`, 调用 old/new edit | 替换成功; bytes_written 正确; edits_applied=1 |
| G10 edit old ambiguous | 文件中多处出现 `old`, replace_all=false | 返回 `ambiguous_edit`; 文件不变 |
| G11 edit replace all | 文件中多处出现 `old`, replace_all=true | 全部替换成功 |
| G12 edit unified diff | 提供只修改当前 path 的单文件 unified diff | patch 成功应用; result edits_applied > 0 |
| G13 edit diff path mismatch | `path=a.txt`, diff header 指向 `b.txt` | 返回 `patch_path_mismatch`; 文件不变 |
| G14 run_command argv only | 调用 `code.run_command(argv=["python","-c","print(1)"])` | 命令执行成功; stdout 包含 `1`; 没有 shell 展开 |
| G15 run_command shell string rejected | 输入 `argv="echo hi"` 或包含 shell string schema | validation error; 不执行命令 |
| G16 run_command cwd boundary | cwd 指向 `<project>` 外且不在 allowed roots | 返回 `write_outside_allowed_roots` 或 permission denial; 不执行命令 |
| G17 run_command timeout | 命令 sleep 超过 timeout | 进程被终止; result error code `timeout`; 有 timeout event |

### H. Permissions 与 Hooks

| 用例 | 输入 / 操作 | 预期输出 / 断言 |
| --- | --- | --- |
| H1 readonly default allow | 普通 `code.read_file` 读取 project 内非敏感文件, 无 permission callback | 允许执行; 不请求权限 |
| H2 sensitive read asks | 读取 `.env` 或 `*.pem`, permission callback 返回 deny | 触发 PermissionRequest; tool result `is_error=true`, error code `permission_denied` |
| H3 write asks | 调用 `code.write_file`, callback 返回 allow_once | 触发 PermissionRequest; 本次写入成功; 下一次同 scope 写入仍会询问 |
| H4 allow_for_session cache | 第一次 `code.write_file` callback 返回 allow_for_session, 第二次同 tool+target_scope 写入 | 第二次不再调用 callback; 只在当前 session 生效 |
| H5 allow_for_session not persisted | 关闭 runtime 后重启同 session 或新 session 执行同写入 | 权限缓存不存在, 重新询问 |
| H6 no callback deny write | 无 permission callback 调用 write/edit/run_command | 默认 deny; 文件/命令无副作用 |
| H7 stdin permission choices | CLI 权限提示输入 `1`, `2`, `3`, 非法输入, EOF | 分别映射 allow_once, allow_for_session, deny, deny, deny |
| H8 hook deny | 用户级 `hooks.json` 配置某 write tool deny, callback 允许 | hook deny 优先导致 tool_result error; event 记录 hook_summary |
| H9 no project hooks | `<project>/.soong-agent/hooks.json` 配置 deny, 用户级无 hooks | 项目 hooks 被忽略; 不影响 tool 执行 |

### I. AgentDefinition 与 Multi-Agent

| 用例 | 输入 / 操作 | 预期输出 / 断言 |
| --- | --- | --- |
| I1 builtin definitions | 调用 `agent.list_agent_definitions` | 返回 `default_sub_agent`, `default_fork_agent`, `default_worker_agent`; 不返回 `default_compact_agent` |
| I2 user definition load | 在 `${SOONG_AGENT_HOME}/agents/reviewer.md` 写合法 frontmatter/body | registry 加载成功; source=user; body 作为子 agent dynamic system instructions |
| I3 invalid suggested tool | AgentDefinition suggested_tools 引用不存在工具 | definition 加载失败; error code `invalid_agent_definition` |
| I4 duplicate definition | 两个用户文件声明相同 id | 加载失败; error code `duplicate_agent_definition` |
| I5 user override builtin | 用户文件显式覆盖 builtin id | 覆盖成功; source=user; body 整份替换不继承 builtin body |
| I6 code override user | 代码注册同 id definition 并声明覆盖 | code source 生效; list 显示 source=code |
| I7 create_sub_agent default | Orchestrator 调用 `agent.create_sub_agent(task="x")` 不传 id | 使用 `default_sub_agent`; 禁止 inline system instructions |
| I8 allowed_tools shrink | 父 agent 对 child 传 `allowed_tools=["code.read_file"]` | child effective tools 只包含该工具和必要 internal; 不能调用未允许写工具 |
| I9 allowed_tools invalid | `allowed_tools` 包含不存在或被排除工具 | agent tool 返回 validation_error; 不启动 child run |
| I10 child permission context | 子 agent 调用写工具 | PermissionRequest 包含 child agent_id/run_id 和 parent_agent_id/parent_run_id |

### J. Worker 与 Orchestrator

| 用例 | 输入 / 操作 | 预期输出 / 断言 |
| --- | --- | --- |
| J1 orchestrator no pool | config 未配置有效 worker_pools, 启动 `mode="orchestrator"` | 启动失败; 不创建隐式默认 worker pool |
| J2 worker duplicate type | worker_pools 中写两个 worker, 都引用 `default_worker_agent` | 创建两个 worker; worker_id 不同; 可分别 dispatch |
| J3 worker id duplicate | 同 pool 两个 worker 显式相同 worker_id | config/schema 校验失败 |
| J4 list_workers | 调用 `agent.list_workers` | 返回 worker_id, agent_definition_id, status; 不返回 recent_results |
| J5 dispatch first idle | 未指定 worker_agent_id, pool 有两个 idle worker | 按配置顺序选择第一个 idle 且校验通过的 worker |
| J6 dispatch allowed step hard scope | Task 有 ready step s1/s2, dispatch `allowed_step_ids=["s2"]` | worker 只能 query/claim s2; 不能 claim s1 |
| J7 allowed_step_ids empty | dispatch `allowed_step_ids=[]` | validation_error; 不启动 worker run |
| J8 no ready step | dispatch scope 内 step 都未 ready | worker 成功返回 `no_step_claimed=true`; 不写 Task WAL |
| J9 worker one claim only | worker run 已 claim s1 后再次 claim s2 | 返回 `step_already_claimed_by_run` |
| J10 worker final mismatch | worker final result 与 Task step result_summary 不一致 | 调度状态以 Task DAG/WAL step 状态为准; dispatch result 摘要包含 step 状态 |

### K. Task DAG 与 WAL

| 用例 | 输入 / 操作 | 预期输出 / 断言 |
| --- | --- | --- |
| K1 task_create | 调用 `agent.task_create(task_id="t1", wal_name="work.wal.jsonl", steps=[...])` | 创建内存 DAG 和 WAL; `task_created` 写入 WAL; task_id 与 wal_path 绑定 |
| K2 duplicate task_id | 同 session active Task 再创建相同 task_id | 返回 validation_error 或 task conflict; 不创建第二个 WAL |
| K3 dependency cycle | task_update 添加形成环的 dependency | 原子校验失败; 返回 `dependency_cycle`; DAG/WAL 不变 |
| K4 ready promotion | 创建 step s2 依赖 s1, s1 completed | s2 自动从 pending 推进 ready; 写 `task_step_ready` WAL |
| K5 claim conflict | 两个 worker 并发 claim 同一个 ready step | 只有一个成功; 另一个返回 `step_already_claimed`; WAL 只有一次 claimed |
| K6 claimed to running | worker claim 后调用 task_update_step status=running | 写 `task_step_started` WAL/event; 不用普通 updated 表示 |
| K7 claimed direct complete | worker claim 后直接 completed | 允许; 写 `task_step_completed`; running 不是前置条件 |
| K8 blocked clears claim | worker 标记 blocked | 写 `task_step_blocked`; claimed_by 和 lease 清空 |
| K9 lease expired | claimed/running step lease 过期 | 写 `task_step_lease_expired`; replay 后清空 claim 并恢复 pending, 再重新 ready 推进 |
| K10 worker exit unclosed step | worker run 正常结束/取消/超时但 step 未 terminal/blocked | core 自动标记 step failed; reason 区分 worker_finished_without_step_terminal / cancelled / timeout |
| K11 orchestrator modify running | Orchestrator 对 running step 修改 title/summary/依赖 | 允许; 写 task_updated; step 仍保持 running; metadata 标记 updated_after_dispatch |
| K12 worker modify content denied | worker 调用 task_update 修改 step 内容字段 | 返回 permission/validation error; DAG/WAL 不变 |
| K13 delete dependent step | 删除仍被下游依赖的 step | 返回 `step_has_dependents`; 不自动级联删除 |
| K14 cancel claimed step directly | Orchestrator 单独 cancel claimed/running step | 返回不允许; 只有 Task 级 cancel/fail 会强制终止 claimed/running |
| K15 task_cancel | Task 有 pending/ready/claimed/running steps, 调用 `agent.task_cancel` | 所有未结束 step 写 cancelled reason=task_cancelled; claimed/running worker run 被取消; task_cancelled WAL 写入 |
| K16 task_fail | Task 有未结束 steps, 调用 `agent.task_fail` | 所有未结束 step 写 failed reason=task_failed; worker run 被取消; task_failed WAL 写入 |
| K17 task_complete optional | required step 全 completed, optional pending/ready 存在, 调用 task_complete | optional step 自动 cancelled; task_completed WAL 写入 |
| K18 task terminal update | Task completed/failed/cancelled 后 worker 迟到更新 step | 返回 `task_terminal`; 不写 Task WAL; worker 自身 transcript 可持久化 |
| K19 task_list terminal paging | 多个 terminal WAL 存在, 调用 `task_list(include_terminal=true, limit=50, offset=0)` | 按更新时间倒序最多 50 个; 不无边界 replay 全量 |
| K20 WAL replay | 删除内存 cache 后从 WAL replay Task | 状态、steps、claims、terminal 与原 DAG 一致 |

### L. Plan Tool

| 用例 | 输入 / 操作 | 预期输出 / 断言 |
| --- | --- | --- |
| L1 plan_template | 模型调用 `agent.plan_template(goal="x")` | 返回 synthetic user/context block; node_type 为 `plan_instruction`; 不自动写文件 |
| L2 plan write | 模型随后调用 `code.write_file` 写 `<project>/.soong-agent/plans/plan.md` | 文件真实写入; 走 write permission; 文件名和内容由模型生成 |
| L3 plan read ordinary | 模型读取已写 plan markdown | 使用普通 `code.read_file`; 不作为 system instruction 注入 |

### M. Compact 与 Memory

| 用例 | 输入 / 操作 | 预期输出 / 断言 |
| --- | --- | --- |
| M1 auto compact | context 超过阈值且 `compact.auto_background=true` | runtime 创建后台 compact fork agent; 当前 loop 不阻塞 |
| M2 recovery compact | active path 放不下且需要同步恢复 | runtime 同步等待 compact payload, 校验后写 compaction node |
| M3 compact hidden definition | 调用 `agent.list_agent_definitions` | 不返回 `default_compact_agent`; inspect/debug 可见 purpose=compact |
| M4 compact tool limits | compact fork 尝试调用 plan/task/recall_memory/child agent tool | tool 不可用或 `tool_not_available`; compact 只能读 context |
| M5 stale compact | compact 完成时 active path 已变且不再是前缀 | compact 标记 stale; 不写 compaction node |
| M6 memory extraction model | 配置 `memory.extract_model_profile`, 触发 Memory Extraction Job | job 使用该 model profile; 不创建 agent_id/run_id; 不占 child concurrency |
| M7 memory writer boundary | Memory Writer 尝试写项目路径或任意业务路径 | 拒绝; 只能写用户级 memory 允许路径 |
| M8 recall main only | main/Orchestrator 调用 `internal.recall_memory` | 允许; 写 `memory_context` node; 不修改 memory 文件 |
| M9 recall child denied | sub/fork/worker/compact 尝试调用 `internal.recall_memory` | tool 不暴露或返回 `tool_not_available` |
| M10 extraction source required | Memory Extraction Job 生成 memory entry 但缺少 `source_node_ids` | schema 校验失败; 不写文件; scan cursor 不推进 |

### N. MCP

| 用例 | 输入 / 操作 | 预期输出 / 断言 |
| --- | --- | --- |
| N1 mcp config load | 在 `${SOONG_AGENT_HOME}/mcp.json` 配置一个 test server | runtime lazy discovery 时读取用户级 mcp config |
| N2 mcp lazy failure | test server 启动失败 | 该 server tools 不进入 effective tool set; provider schema 不包含这些 tools |
| N3 disabled server | config 禁用某 server | 不连接该 server; tools 不可用 |
| N4 disabled tool | config 禁用某 MCP tool | server 可连接, 但该 tool 不进入 effective tool set |
| N5 mcp permission | MCP write/dangerous tool 被调用 | 走统一 permission callback、hooks、output limit、artifact、redaction |

### O. CLI 与端到端

| 用例 | 输入 / 操作 | 预期输出 / 断言 |
| --- | --- | --- |
| O1 CLI missing config | `SOONG_AGENT_HOME=<empty> agentcli chat --plain` | 非 0 退出; 人读错误提示 config missing; 不创建 config |
| O2 CLI path dir | `agentcli chat --path <project> --plain` | runtime project 为 `<project>`; 输出 assistant 文本 |
| O3 CLI path file | `agentcli chat --path <project>/src/a.py --plain` | project 为 `<project>/src`; 不自动读取 a.py |
| O4 CLI orchestrator | 带有效 worker_pools 配置执行 `agentcli chat --orchestrator --plain` | 使用 orchestrator mode; 可 dispatch worker |
| O5 CLI permission allow once | CLI 触发写工具, stdin 输入 `1` | 本次写入成功; 后续同 scope 仍提示 |
| O6 CLI permission allow session | 第一次 stdin 输入 `2`, 后续同 session 同 scope 写入 | 后续不再提示; session 结束后失效 |
| O7 CLI permission deny | stdin 输入 `3` 或非法输入 | tool denied; write/dangerous 后续 tool calls 停止; CLI 显示可读错误 |
| O8 Ollama e2e simple | 测试 fixture 如 Ollama 未运行则启动 `ollama serve`, 使用 `gemma4` 运行简单问答 | run completed; 收到 assistant 输出; 测试结束如果 fixture 启动了进程则停止进程, 不删除 test-runs |
| O9 Ollama e2e tool call | 使用 `gemma4` 让模型列出 project 目录 | 模型调用 `code.list_dir`; tool result 回填; 最终回答包含目录信息 |
| O10 test isolation | 运行完整测试套件后检查真实 `~/.soong-agent` 非 test-runs 路径 | 未被创建、修改或删除; 所有测试文件都在 `~/.soong-agent/test-runs/<run_id>` |

## 生成顺序建议

1. 先生成工程脚手架、公共类型、错误码和配置加载。
2. 生成 storage、event、artifact 基础设施。
3. 生成 provider registry 和 fake provider 测试工具。
4. 生成 runtime loop 最小闭环: user -> provider -> assistant -> events。
5. 加入 tool registry、permissions、code tools。
6. 加入 context builder、instruction catalog、skills。
7. 加入 plan/task tools 和 Task WAL。
8. 加入 multi-agent、worker pool 和 orchestrator mode。
9. 加入 compact 和 memory。
10. 加入 hooks、MCP、cleanup/replay API。
11. 加入 CLI。
12. 补齐 Ollama `gemma4` E2E 和所有边界测试。

## 最终验收标准

- `pytest` 单元测试和集成测试通过。
- 本机有 Ollama 且 `gemma4` 已 pull 时, Ollama E2E 测试通过。
- `agentcli chat --path <project> --plain` 可以使用用户级 config 启动并输出人读结果。
- `agentcli chat --orchestrator --plain` 在配置了 worker_pools 时可创建 Task、dispatch worker、写 Task WAL。
- 所有写/edit/run_command 工具都经过 permission callback 或默认 deny。
- instruction/skill/memory 都使用渐进式披露, 不把所有正文硬塞进初始 system prompt。
- 测试只写 `~/.soong-agent/test-runs/<run_id>` 和测试 project, 不触碰真实用户数据。
