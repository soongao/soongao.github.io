---
title: My Agent Core Design - Error Handling
# date: YYYY-MM-DD HH:MM:SS +/-TTTT
categories: [Agent, Agent Core]
tags: [Agent, Agent Core]     # TAG names should always be lowercase
# toc: false
---

# Error Handling

- Provider 错误可重试, 见 Provider Adapter retry 策略.
- Tool 错误返回给模型处理.
- Hook 错误默认记录但不中断, 明确 deny 除外.
- Storage 写入失败通常不能继续, loop 标记 failed.
- Prompt 太长时尝试 compact; compact 后仍过长则 prompt_too_long.
- orchestrator 模式缺少有效 worker_pools 时启动失败, 返回配置错误而不是运行中降级.
- 错误边界:
	- 可恢复的业务错误返回给模型, 例如 validation_error, permission_denied, tool_not_available, worker_busy, task_not_dispatchable, path_conflict.
	- tool handler 失败包装成 `tool_result is_error=true`, 写 tool_failed / tool_denied event, 由模型下一轮决定重试或调整.
	- 配置错误、storage fatal、migration 失败、provider unsupported capability、run 初始化失败属于 SDK/runtime 边界错误.
	- SDK/runtime 边界错误必须写结构化 error event / run.error_json, 必要时抛 `AgentCoreError`.
- Provider unsupported capability:
	- 如果本轮 effective tool set 非空, 但 provider/model 不支持 tools 或 tool schema, run 直接 failed.
	- adapter 不允许静默移除 tools 后纯文本请求.
	- 不返回 synthetic tool_not_available 让模型自修正, 因为模型请求尚未发送.
- Memory / Skill recall:
	- `recall_memory` selector 失败时返回 `tool_result is_error=true`, 不注入 memory_context, run 不直接 failed.
	- `load_skill` 读取失败时返回 `tool_result is_error=true`, 不注入 skill_context, run 不直接 failed.
- Compact:
	- automatic compact fork failed 不影响当前用户 run, 只写 compact_failed event.
	- recovery compact failed 或 recovery compact 后仍超预算, run end_reason 为 prompt_too_long.
- Cleanup:
	- cleanup dry-run 不删除文件, 只返回候选和原因.
	- cleanup 删除失败返回结构化 partial failure, 不静默忽略.
