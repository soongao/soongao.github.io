---
title: My Agent Core Design - Codegen Contract
# date: YYYY-MM-DD HH:MM:SS +/-TTTT
categories: [Agent, Agent Core]
tags: [Agent, Agent Core]     # TAG names should always be lowercase
# toc: false
---

# Codegen Contract

本章用于把实现时容易分叉的接口、schema、内置工具和模板资源固定下来。

其他章节描述产品语义和行为, 本章描述第一版生成代码时必须落地的最小稳定契约。实现可以在内部增加字段或 helper, 但对外 API、持久化字段、tool canonical name 和错误码不能随意漂移。

## Public SDK Shape

- Python distribution name 使用 `soong-agent`.
- SDK import package name 第一版使用 `agent_core`.
- CLI 命令名使用 `soong-agent`.
- 用户侧主要入口:
	- `AgentRuntime`
	- `UserMessage`
	- `RunHandle`
	- `RuntimeEvent`
	- `PermissionRequest`
	- `PermissionDecision`
	- `ToolDefinition`
	- `ToolResult`
	- `AgentDefinition`
- `AgentRuntime` 最小构造参数:
	- `project_dir: str | Path | None = None`
	- `config_path: str | Path | None = None`
	- `home_dir: str | Path | None = None`
	- `session_db_path: str | Path | None = None`
	- `permission_callback: Callable[[PermissionRequest], Awaitable[PermissionDecision]] | None = None`
	- `provider_registry: ProviderRegistry | None = None`
	- `tool_registry: ToolRegistry | None = None`
	- `debug: bool = False`
- 用户级 home 解析:
	- `home_dir` 显式传入时优先.
	- 否则使用环境变量 `SOONG_AGENT_HOME`.
	- 否则使用 `~/.soong-agent`.
	- `config_path` 省略时固定读取 `${SOONG_AGENT_HOME}/config.toml`.
	- `config_path` 只表示 SDK/测试显式指定的用户级 config 文件路径, 不表示项目级 config 发现机制.
	- 用户级 `config.toml` 必须存在; 不存在、解析失败、schema 校验失败都使 runtime / CLI 启动失败.
	- 第一版不提供 `soong-agent init`; CLI / runtime 不自动创建默认 config.
- `<project>` 解析:
	- `project_dir` 省略时使用当前 cwd.
	- `project_dir` 指向文件时使用其父目录.
	- `project_dir` 不存在时启动失败.
	- 启动时 resolve symlink, 后续边界判断使用 resolved path.
	- runtime 不读取 `<project>/.soong-agent/config.toml`.
- `AgentRuntime` 必须支持:
	- `async with AgentRuntime(...) as runtime`
	- `await runtime.close()`
	- `await runtime.start(message: str | UserMessage, session_id: str | None = None, mode: Literal["normal", "orchestrator"] = "normal") -> RunHandle`
	- `runtime.register_provider(key: str, factory: ProviderFactory) -> None`
	- `runtime.register_tool(definition: ToolDefinition, handler: ToolHandler) -> None`
	- `runtime.register_agent_definition(definition: AgentDefinition, source: Literal["code"] = "code") -> None`
	- `await runtime.replay_session(session_id: str, from_seq: int | None = None, to_seq: int | None = None, include_sensitive: bool = False) -> ReplayResult`
	- `await runtime.replay_run(run_id: str, include_sensitive: bool = False) -> ReplayResult`
	- `await runtime.get_node_path(node_id: str) -> list[Node]`
	- `await runtime.delete_session(session_id: str) -> DeleteSessionResult`
	- `await runtime.cleanup_project_tasks(project: str | Path, dry_run: bool = True, include_failed: bool = False, include_cancelled: bool = False, older_than: datetime | None = None) -> CleanupResult`
	- `await runtime.cleanup_artifacts(session_id: str | None = None, dry_run: bool = True, include_all: bool = False, older_than: datetime | None = None, max_bytes: int | None = None) -> CleanupResult`
- `RunHandle` 最小字段:
	- `run_id: str`
	- `session_id: str`
	- `agent_id: str`
	- `status: RunStatus`
	- `mode: RunMode`
- `RunHandle` 必须支持:
	- `events(debug: bool = False) -> AsyncIterator[RuntimeEvent]`
	- `cancel() -> Awaitable[CancelResult]`
	- `inspect_child(child_run_id: str, include_sensitive: bool = False) -> Awaitable[InspectResult]`
	- `child_events(child_run_id: str, debug: bool = False) -> AsyncIterator[RuntimeEvent]`
- `run.events()` 是单消费者流, 新订阅不回放历史事件。
- 对外 SDK 不暴露 provider SDK 原始 request / response 类型。

## Core Type Contract

- 所有对外、tool、provider、storage 边界类型使用 Pydantic。
- 默认 `extra="forbid"`。
- ID 字段第一版统一是 `str`, 通过 helper 校验前缀和安全字符。
- 时间字段统一使用 UTC ISO8601 字符串落库和 WAL; Python 对外对象可以暴露 `datetime`。

### ContentBlock

- `TextBlock`
	- `type = "text"`
	- `text: str`
- `JsonBlock`
	- `type = "json"`
	- `data: Any | None`
	- `summary: str | None`
	- `artifact_id: str | None`
- `ToolCallBlock`
	- `type = "tool_call"`
	- `tool_call_id: str`
	- `name: str`
	- `arguments: dict`
	- `metadata: dict = {}`
- `ToolResultBlock`
	- `type = "tool_result"`
	- `tool_call_id: str`
	- `is_error: bool = False`
	- `content: list[ContentBlock]`
	- `error: ErrorPayload | None`
	- `metadata: dict = {}`
- `ArtifactRefBlock`
	- `type = "artifact_ref"`
	- `artifact_id: str`
	- `summary: str | None`
	- `mime_type: str | None`

### ToolResult

- `tool_call_id: str`
- `tool_name: str`
- `content: list[ContentBlock]`
- `is_error: bool = False`
- `error: ErrorPayload | None = None`
- `metadata: dict = {}`

简单 handler 返回 `str / dict / list / int / bool / None` 时, core 自动包装为 `ToolResult`。复杂 tool 推荐直接返回 `ToolResult`。

### RuntimeEvent

- `event_id: str`
- `seq: int | None`
- `run_seq: int | None`
- `session_id: str`
- `agent_id: str | None`
- `run_id: str | None`
- `level: Literal["debug", "info", "warning", "error"]`
- `event_type: EventType`
- `node_id: str | None`
- `tool_call_id: str | None`
- `payload: dict`
- `created_at: datetime`

实时流中的高频 delta event 可以没有 `seq`, 因为默认不落 SQLite。落库 event 必须有 `seq`。

### PermissionRequest

- `request_id: str`
- `session_id: str`
- `agent_id: str`
- `run_id: str`
- `parent_agent_id: str | None`
- `parent_run_id: str | None`
- `agent_role: str`
- `tool_name: str`
- `permission: Literal["readonly", "write"]`
- `tags: list[str]`
- `args_summary: str`
- `target_scope: str | None`
- `cwd: str`
- `env_summary: dict`
- `network_host: str | None`
- `dangerous: bool`
- `hook_summary: dict | None`
- `suggested_decision: PermissionDecisionKind`
- `metadata: dict = {}`

### PermissionDecision

- `decision: Literal["allow_once", "allow_for_session", "deny"]`
- `reason: str | None`
- `metadata: dict = {}`

### AgentDefinition

- `agent_definition_id: str`
- `name: str`
- `description: str`
- `body: str = ""`
- `model_profile: str | dict | None = None`
- `suggested_tools: list[str] = []`
- `tags: list[str] = []`
- `overrides: str | None = None`
- `source: Literal["builtin", "user", "code"]`
- `metadata: dict = {}`

文件形式使用 frontmatter + markdown body。frontmatter 必填 `id`, `name`, `description`; body 是该 agent 的 system instructions。

## Built-in File Tools

第一版内置文件工具使用 `code.*` canonical name。Plan 文件也通过这些普通工具写入。

- `code.read_file`
	- permission: `readonly`
	- tags: `code`, `filesystem`, `readonly`
	- input:
		- `path: str`
		- `start_line: int = 1`
		- `max_lines: int = 200`
	- constraints:
		- `start_line >= 1`
		- `1 <= max_lines <= 1000`
		- 每行最多返回 4096 bytes; 超过截断该行.
	- result:
		- `path`
		- `content`
		- `truncated: bool`
		- `next_start_line: int | None`
		- `truncated_lines: list[int]`
		- `binary: bool`
		- `already_loaded: bool | None`, 仅 instruction 文件重复加载时使用.
- `code.list_dir`
	- permission: `readonly`
	- tags: `code`, `filesystem`, `readonly`
	- input:
		- `path: str`
		- `recursive: bool = False`
		- `limit: int | None`
	- result:
		- `entries`
		- `truncated`
- `code.write_file`
	- permission: `write`
	- tags: `code`, `filesystem`, `write`
	- input:
		- `path: str`
		- `content: str`
		- `create_dirs: bool = True`
		- `overwrite: bool = False`
	- result:
		- `path`
		- `bytes_written`
		- `created: bool`
		- `overwritten: bool`
	- errors:
		- `path_conflict`, 当目标已存在且 `overwrite=false`.
- `code.edit_file`
	- permission: `write`
	- tags: `code`, `filesystem`, `write`
	- input:
		- `path: str`
		- `edits: list[{old: str, new: str, replace_all: bool = False}] | None`
		- `unified_diff: str | None`
		- `create_if_missing: bool = False`
	- constraints:
		- `edits` 和 `unified_diff` 必须二选一.
		- `edits` 使用 old/new 精确替换; old 默认必须唯一匹配.
		- `unified_diff` 必须只修改当前 `path`.
		- `unified_diff` 只支持单文件 diff; 多文件修改必须多次调用 `code.edit_file`.
		- `unified_diff` 不支持 rename/delete/binary patch.
		- `unified_diff` 必须能干净应用到当前文件内容.
	- result:
		- `path`
		- `edits_applied`
		- `bytes_written`
	- errors:
		- `file_not_found`
		- `text_not_found`
		- `ambiguous_edit`
		- `patch_apply_failed`
		- `patch_path_mismatch`
- `code.search`
	- permission: `readonly`
	- tags: `code`, `filesystem`, `readonly`
	- input:
		- `query: str`
		- `path: str | None`
		- `glob: str | None`
		- `limit: int | None`
	- result:
		- `matches`
		- `truncated`
	- default path: `<project>`
- `code.run_command`
	- permission: `write`
	- tags: `code`, `dangerous`
	- input:
		- `argv: list[str]`
		- `cwd: str | None`
		- `timeout_ms: int | None`
	- constraints:
		- 只接受 argv list, 不接受 shell string.
		- 第一版不提供 OS 级 sandbox / container sandbox.
		- 第一版安全边界来自 argv list、cwd 限制、allowed roots、env allowlist、timeout、permission/hook、输出截断/artifact 和 secret redaction.
		- `cwd` 省略时为 `<project>`.
		- `cwd` 必须位于 `<project>` 或 allowed roots 内.
		- 模型不能传 env; env 只能来自 config/tool definition allowlist.
		- 默认 timeout 120000ms, 最大 600000ms.
	- result:
		- `exit_code`
		- `stdout`
		- `stderr`
		- `stdout_artifact_id`
		- `stderr_artifact_id`
		- `truncated`

`code.read_file` 按行读取, 默认最多 200 行, 单次最多 1000 行, 每行最多 4096 bytes; 超过时截断并返回 metadata。读取超大文本不 artifact 化全文, 因为源文件本身已经存在。除 `code.read_file` 外, 其他 tool 输出过大时保存 artifact 并在 tool_result 中返回摘要和 artifact_ref。

文件工具必须 normalize path、resolve symlink, 再做边界判断。写工具默认只能写 `session.cwd` 和配置允许的 write roots。普通 read 不限制在 session.cwd, 但敏感路径需要 permission callback。

敏感路径默认包括:

- `~/.ssh`
- `~/.gnupg`
- `~/.aws`
- `~/.config/gcloud`
- `*.pem`
- `*.key`
- `.env`
- `.env.*`

命中敏感路径的 `code.read_file` / `code.list_dir` / `code.search` 必须触发 permission callback; 没有 callback 时 deny。

`code.read_file` 读取 instruction 文件时, 除普通 tool result 外还要注册 dynamic system block。普通业务文件读取不注册 dynamic system block。

## Instruction Catalog Contract

- 启动 / run 开始时构造 `instruction_catalog` static system block.
- catalog 只包含路径和 frontmatter 元信息, 不包含正文.
- 没有 frontmatter 的 instruction 文件不跳过, 使用相对路径作为基础 metadata.
- 扫描来源:
	- `${SOONG_AGENT_HOME}/CLAUDE.md`
	- `${SOONG_AGENT_HOME}/AGENTS.md`
	- `${SOONG_AGENT_HOME}/rules/**/*.md`
	- `<project>/**/CLAUDE.md`
	- `<project>/**/AGENTS.md`
- 不扫描 `<project>/.soong-agent/rules`.
- 不存在项目级 skills / agents / tools / hooks / memory / config.
- 同目录 `CLAUDE.md` 优先于 `AGENTS.md`; catalog 只展示胜出的文件.
- 扫描跳过 `.git`, `node_modules`, `.venv`, `venv`, `dist`, `build`, `target`, `.next`, `.cache`, `__pycache__`.
- catalog 最大 200 个文件, 超过按路径排序截断并标记 truncated.
- 模型通过普通 `code.read_file` 决定读取哪些 instruction 正文.
- 读取 instruction 正文后写 dynamic system block; 可选写 SQLite `node_type=instruction_context`.
- 同一 active path 重复加载相同 hash 的 instruction 不重复写 node, tool result 标记 `already_loaded=true`.
- 文件 mtime/hash 变化后允许重新加载新版 dynamic system block.

## Built-in Agent And Task Tool Schemas

内置 agent tools:

- `agent.list_agent_definitions(input={})`
- `agent.create_sub_agent(agent_definition_id?, task, context?, constraints?, allowed_tools?, expected_output_schema?, timeout_ms?)`
- `agent.fork_agent(agent_definition_id?, task, constraints?, allowed_tools?, expected_output_schema?, timeout_ms?)`
- `agent.list_workers(worker_pool_id?)`
- `agent.dispatch_worker(task_id, worker_pool_id?, worker_agent_id?, allowed_step_ids?, instruction, context?, constraints?, allowed_tools?, expected_output_schema?, timeout_ms?)`

内置 Plan / Task tools:

- `agent.plan_template(goal?, suggested_dir?)`
- `agent.task_template(goal?)`
- `agent.task_create(task_id, wal_name, title, summary, steps)`
- `agent.task_get(task_id, include_terminal_steps=False)`
- `agent.task_list(status?, include_terminal=False, limit=50, offset=0)`
- `agent.task_update(task_id, operations)`
- `agent.task_query_steps(task_id, statuses?, worker_pool_id?, claimed_by_agent_id?, include_terminal_steps=False, limit=50, offset=0)`
- `agent.task_claim_step(task_id, step_id)`
- `agent.task_update_step(task_id, step_id, status?, result_summary?, artifact_ids?, reason?)`
- `agent.task_complete(task_id, result_summary?)`
- `agent.task_fail(task_id, reason?)`
- `agent.task_cancel(task_id, reason?)`

实际 tool name 必须和这里一致。历史章节出现 "plan tool" 时, 第一版 canonical name 使用 `agent.plan_template`。

## Task WAL Payload Contract

每行 WAL 的公共字段:

- `wal_seq`
- `session_id`
- `event_id`
- `event_type`
- `actor_agent_id`
- `actor_run_id`
- `task_id`
- `step_id`
- `payload`
- `created_at`

事件 payload 第一版固定为:

- `task_created`
	- `task`: 完整 Task DAG snapshot。
- `task_running`
	- `previous_status`
	- `status = "running"`
	- `reason`
- `task_updated`
	- `operations`
	- `updated_after_dispatch_step_ids`
	- `task_summary`
- `task_reopened`
	- `previous_status`
	- `status = "pending"`
	- `reason`
- `task_completed`
	- `result_summary`
	- `cancelled_optional_step_ids`
- `task_failed`
	- `reason`
	- `failed_step_ids`
- `task_cancelled`
	- `reason`
	- `cancelled_step_ids`
- `task_step_ready`
	- `previous_status`
	- `status = "ready"`
	- `depends_on_step_ids`
- `task_step_claimed`
	- `previous_status`
	- `claimed_by_agent_id`
	- `claimed_by_run_id`
	- `lease_expires_at`
- `task_step_started`
	- `previous_status`
	- `status = "running"`
	- `lease_expires_at`
- `task_step_updated`
	- `previous_status`
	- `status`
	- `result_summary`
	- `artifact_ids`
	- `lease_expires_at`
- `task_step_blocked`
	- `previous_status`
	- `reason`
	- `result_summary`
	- `artifact_ids`
- `task_step_completed`
	- `previous_status`
	- `result_summary`
	- `artifact_ids`
- `task_step_failed`
	- `previous_status`
	- `reason`
	- `result_summary`
	- `artifact_ids`
- `task_step_cancelled`
	- `previous_status`
	- `reason`
	- `result_summary`
- `task_step_reopened`
	- `previous_status`
	- `status = "pending"`
	- `reason`
- `task_step_lease_expired`
	- `previous_status`
	- `claimed_by_agent_id`
	- `claimed_by_run_id`
	- `expired_at`

WAL replay 只依赖 `event_type` 和 `payload`, 不依赖 SQLite event。

## Error Codes

错误码第一版集中定义为 `ErrorCode` StrEnum。

- Common:
	- `validation_error`
	- `schema_error`
	- `config_error`
	- `permission_denied`
	- `tool_not_available`
	- `timeout`
	- `cancelled`
	- `internal_error`
- Provider:
	- `provider_error`
	- `unsupported_capability`
	- `provider_auth_failed`
	- `provider_rate_limited`
	- `provider_timeout`
- Storage:
	- `storage_error`
	- `migration_failed`
	- `session_active`
	- `path_conflict`
	- `file_not_found`
	- `text_not_found`
	- `ambiguous_edit`
	- `patch_apply_failed`
	- `patch_path_mismatch`
	- `write_outside_allowed_roots`
- Agent:
	- `invalid_agent_definition`
	- `duplicate_agent_definition`
	- `invalid_agent_override`
	- `child_agent_limit_exceeded`
	- `worker_busy`
	- `worker_not_available`
	- `worker_pool_busy`
- Task:
	- `task_not_found`
	- `task_terminal`
	- `task_not_dispatchable`
	- `dependency_cycle`
	- `step_not_found`
	- `step_not_ready`
	- `step_already_claimed`
	- `step_already_claimed_by_run`
	- `step_has_dependents`
	- `no_step_claimed`
	- `task_wal_unavailable`
- Memory / Skill:
	- `memory_recall_failed`
	- `memory_write_failed`
	- `skill_not_found`
	- `skill_load_failed`

`no_step_claimed` 是成功结果中的业务状态, 默认不作为 `ToolResult.is_error=true`。

## Config TOML Minimum Example

配置中的 path 字段支持两个内置占位符:

- `${SOONG_AGENT_HOME}`: runtime 解析出的用户级 home.
- `<project>`: runtime 解析出的项目工作目录.

该示例同时作为 `src/agent_core/assets/templates/config_default.toml` 的默认内容基线; 模板默认 provider 使用本地 Ollama `gemma4`.

```toml
[runtime]
cancel_timeout_ms = 10000

[model]
provider = "ollama"
base_url = "http://127.0.0.1:11434"
api_key_env = ""
name = "gemma4"
context_window = 8192
max_output_tokens = 4096
temperature = 0.2
timeout_ms = 60000

[model.retry]
max_attempts = 3
initial_backoff_ms = 500
max_backoff_ms = 8000

[model_overrides.compact]
max_output_tokens = 2048
temperature = 0.0

[context]
session_db_path = "${SOONG_AGENT_HOME}/sessions.sqlite"
active_path_only = true
reserve_output_tokens = 4096
dynamic_system_budget = 12000
task_board_token_budget = 1200
task_recent_changes_limit = 20
task_recent_changes_window_minutes = 30

[compact]
enabled = true
reserve_tokens = 8000
keep_recent_tokens = 16000
auto_background = true
recovery_sync = true
model_profile = "compact"
max_summary_tokens = 2048

[memory]
enabled = true
memory_dir = "${SOONG_AGENT_HOME}/memory"
categories = ["user", "feedback", "reference"]
extract_every_messages = 32
extract_every_tokens = 12000
idle_seconds = 120
catalog_max_tokens = 4000
recall_top_k = 5
memory_context_token_budget = 6000

[agents]
max_children_per_run = 4
max_concurrent_children_per_session = 8
default_sub_agent_definition = "default_sub_agent"
default_fork_agent_definition = "default_fork_agent"
default_child_timeout_ms = 600000
child_cancel_timeout_ms = 30000

[[agents.worker_pools]]
pool_id = "default"

[[agents.worker_pools.workers]]
worker_id = "worker_general_1"
agent_definition_id = "default_worker_agent"
allowed_tools = ["agent.task_get", "agent.task_query_steps", "agent.task_claim_step", "agent.task_update_step", "code.read_file", "code.search"]

[plan]
default_dir = "<project>/.soong-agent/plans"
template_name = "default"

[task]
wal_dir = "<project>/.soong-agent/tasks"
step_lease_timeout_ms = 300000

[permissions]
readonly_default = "allow"
write_without_callback = "deny"
remember_scope = "session"
allow_for_session_enabled = true

[permissions.network_policy]
default = "confirm"
allowed_hosts = []
allowed_domains = []

[hooks]
enabled = true
default_timeout_ms = 30000

[tools]
declarative_enabled = true
disabled = []
allowed_write_roots = []
allow_tmp_write = false
default_timeout_ms = 120000
max_timeout_ms = 600000
env_allowlist = ["PATH", "HOME", "TMPDIR"]
stdout_limit_bytes = 65536
stderr_limit_bytes = 65536
sensitive_paths = ["~/.ssh", "~/.gnupg", "~/.aws", "~/.config/gcloud", "*.pem", "*.key", ".env", ".env.*"]

[tools.network]
allowed_hosts = []
allowed_domains = []
```

CLI 最小入口固定为:

```text
soong-agent run [--path <dir-or-file>] [--orchestrator] [--session-id <id>] "message"
```

`--path` 缺省使用当前 cwd; 指向文件时使用父目录作为 `<project>`, 不自动读取该文件正文。

不提供 `soong-agent init`; 缺少 `${SOONG_AGENT_HOME}/config.toml` 时 CLI 启动失败。

CLI 第一版权限确认使用 stdin:

- 输入 `1` 或 `allow once` -> `allow_once`.
- 输入 `2` 或 `allow for session` -> `allow_for_session`.
- 输入 `3` 或 `deny` -> `deny`.
- stdin 不可用、EOF、输入无效或超时时默认 `deny`.

第一版 CLI 不提供 `--json` event stream 输出; 只提供人读文本输出。

`config_default.toml` 默认使用 `ollama` + `gemma4`; `openai` / `anthropic` 仅作为文档说明或注释示例出现, 且示例保持通用占位符, 不写公司内部 endpoint、模型名或 key 名.

Permission decision 第一版只允许:

- `allow_once`
- `allow_for_session`
- `deny`

不实现 `always_allow` / `deny_for_session`; `allow_for_session` 只在当前 session 内存生效, 不写磁盘。

## Prompt And Markdown Template Assets

代码生成时不要把大段 system prompt、Plan 模板、Task 模板、内置 AgentDefinition body 硬编码进 Python 业务逻辑。代码只固定模板 ID、加载机制、注入位置和校验规则。

第一版包内资源目录建议:

```text
src/agent_core/assets/
  prompts/
    system/
      core.md
      tool_protocol.md
      todo.md
      permissions.md
      multi_agent.md
      memory.md
      compact.md
    templates/
      config_default.toml
      plan_default.md
      task_dag_default.md
    agents/
      default_sub_agent.md
      default_fork_agent.md
      default_worker_agent.md
      default_compact_agent.md
```

实现规则:

- `asset_id` 是代码里的稳定引用, 例如 `system.core`, `template.plan.default`, `agent.default_worker_agent`。
- `asset_id -> package resource path` 的映射可以写在代码常量中。
- 具体 Markdown 正文放在资源文件里, 不写进 loop、tool registry 或 prompt composer 代码。
- 包内必需资源缺失时, SDK 启动失败或相关 tool 调用失败, 错误码使用 `config_error` / `internal_error`。
- 包内提供 `template.config.default` / `config_default.toml` 作为人读默认配置模板.
- `config_default.toml` 只作为模板资源提供, 不会被 CLI / runtime 自动写入 `${SOONG_AGENT_HOME}/config.toml`.
- `config_default.toml` 默认 provider 使用 `ollama` + `gemma4`.
- `config_default.toml` 如包含 `openai` / `anthropic` 注释示例, 只能使用通用占位符, 不写公司内部 endpoint、模型名或 key 名.
- 模板文件可以在初始代码生成阶段放最小可用占位正文, 但必须满足:
	- 文件存在。
	- 非空。
	- 有清晰标题。
	- 不包含会误导模型执行危险操作的内容。
	- metadata / event 记录 template id 和 template version。
- 占位模板示例:

```markdown
# Default Plan Template

TODO: Replace this package asset with the final plan-writing instructions.

The model should create a concise Markdown plan under the suggested project plan directory.
```

- system prompt 组装只依赖 `PromptBlock`:
	- `block_id`
	- `source`
	- `content`
	- `priority`
	- `dynamic`
	- `token_count`
	- `metadata`
- static system blocks 从包内 `prompts/system/*.md` 读取。
- static system blocks 还包括启动 / run 开始时根据外部 instruction 文件 frontmatter 构造出的 `instruction_catalog`.
- dynamic system blocks 从 AgentDefinition body、已加载 instruction 正文、skill catalog、memory catalog、runtime state 构造。
- synthetic user/context blocks 从 skill load、memory recall、plan template、task template、task board summary 构造。
- Plan template tool 和 Task template tool 返回的是 synthetic user/context block, 不是直接把模板正文拼到 system prompt。
- 内置 `default_compact_agent.md` 是 internal-only asset, 不进入 `agent.list_agent_definitions`。
- 用户级 `${SOONG_AGENT_HOME}/agents/*.md`, `${SOONG_AGENT_HOME}/skills/*.md`, 用户级/项目级 `CLAUDE.md`, `AGENTS.md`, 用户级 `${SOONG_AGENT_HOME}/rules/**/*.md`, memory md 是外部 source of truth, 不能复制进包内 assets。
- 静态 system prompt 不是写死在 Python 业务逻辑的大字符串; 它由包内 prompt assets 加启动时扫描到的 catalog metadata 组合而成。

## Template Tests

实现时至少覆盖:

- 所有 required package assets 存在且非空。
- asset loader 能通过 `asset_id` 读取内容。
- plan template tool 把 `template.plan.default` 写成 `node_type=plan_instruction`。
- task template tool 把 `template.task_dag.default` 写成 `node_type=task_instruction`。
- static system prompt composer 能按顺序加载 core / tool_protocol / todo / permissions 等 block。
- 修改模板正文不需要修改 Python 业务代码。

## Implementation Boundary

- 本章的 schema 是第一版生成代码的下限。
- 如果实现时发现某字段暂时用不到, 仍保留类型字段, 可以传空值或默认值。
- 如果实现需要新增内部字段, 放入 `metadata` 或内部 runtime 类型, 不改变 provider/tool/storage 公开契约。
- 如果需要改变 tool canonical name、WAL event type、error code、SQLite 字段, 必须先改文档再改代码。
