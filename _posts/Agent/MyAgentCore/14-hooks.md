# Hooks

- Hook 配置参考 Claude Code / Trae 风格, 使用用户级 JSON:
	- `${SOONG_AGENT_HOME}/hooks.json`
	- 默认正常运行时等价于 `~/.soong-agent/hooks.json`.
- 不存在项目级 hooks.
- runtime 不读取 `<project>/.soong-agent/hooks.json`.
- 用户级 hooks 是否启用由 `config.toml` 的 `hooks.enabled` 控制.
- `hooks.json` 只声明 hook 规则, 不绕过 permission、command runner 边界或 timeout.
- hook command 复用 command/declarative tool 的 command runner、env allowlist、working_dir 校验和 timeout 规则.
- 第一版 command runner 不提供 OS 级 sandbox / container sandbox.
- hook command 本身不再单独弹 permission prompt, 因为 hooks 来自用户级配置.
- hook command 默认 cwd 为 `<project>`.

## Hook Config

- Hook 配置结构:
	- 顶层 `version`.
	- `hooks` 下按事件分组.
	- 每个事件是规则数组.
	- 规则可带 `matcher`.
	- 规则内包含多个 hook.
- Hook matcher 第一版只支持简单匹配:
	- event type 精确匹配.
	- canonical tool name 精确匹配.
	- tag 精确匹配.
	- path prefix 匹配.
	- 不支持正则、glob 或复杂表达式.
- 第一版 hook 类型只支持 command:
	- `{ "type": "command", "command": "..." }`
	- command hook 可以使用 shell string, 但来源必须是用户级 hooks.json.

## Hook Protocol

- Hook 协议:
	- stdin JSON 输入.
	- stdout JSON 输出, 格式为 `{ "decision": "allow" | "deny", "reason": "...", "metadata": {}, "logs": [] }`.
	- stdout JSON 决定 allow / deny.
	- exit code 非 0 才认为 hook failed.
	- stderr 作为日志记录到 event/debug, stderr 非空不影响 hook decision.
- Hook 触发点:
	- SessionStart
	- UserPromptSubmit
	- PreToolUse
	- PostToolUse
	- Stop

## Hook Boundaries

- 第一版只允许阻止, 不允许 patch prompt/context/tool args/tool result.
- PreToolUse 可以 deny tool, 对应 tool_denied / hook_denied; 不直接产生 aborted_tools.
- Stop 可以 deny loop 结束, 对应 stop_hook_prevented.
- PostToolUse 第一版只观察, 不阻止、不 patch tool result.
- UserPromptSubmit 第一版只观察, 不能阻止用户输入.
- 其他 hook event 第一版只观察, 不阻止、不 patch.
- Hook 默认串行执行, 按配置顺序.
- Hook 支持 timeout.
- Hook 失败默认记录错误但不中断 loop, 除非返回明确 deny.

## Deny Semantics

- hook deny 和 permission deny 使用同一种工具失败语义.
- deny 后写 `tool_result is_error=true`, 同时写 denied event.
- readonly deny 后可以继续执行后续安全 readonly tool calls.
- write / dangerous deny 后停止后续 tool calls, 返回模型下一轮处理.
- PreToolUse hook deny 后不再调用 Permission callback.

## Plan And Stop

- Plan 没有专门 hook:
	- `agent.plan_template` 只返回写作模板 context block.
	- Plan 文件由普通 write/edit tool 创建.
	- write/edit tool 的 PreToolUse / PostToolUse hook 已覆盖 Plan 文件写入.
	- core 不定义 PlanModeComplete hook.
- PostToolUse hook 输入:
	- 小 tool result 传全文.
	- 大 tool result 先 artifact 化, hook 只收到 summary + artifact_ref.
- Stop hook deny 后:
	- 写 hook_denied / stop_hook_prevented event.
	- 不结束 loop.
	- 写内部 system_note 或 hook_context node.
	- 该 node 在下一轮映射为 synthetic user/context message.
	- 内容说明 Stop hook prevented completion 和 hook reason.
	- 不提升为 system 指令.
	- 让模型根据 hook reason 继续执行.
