---
title: Opencode - Builtin Prompt
# date: YYYY-MM-DD HH:MM:SS +/-TTTT
categories: [Agent, Opencode]
tags: [Agent, Pi, Prompt]     # TAG names should always be lowercase
# toc: false
---

## OpenCode 内置 Prompt 文件清单

不包含运行时外部来源，例如项目/全局 `AGENTS.md`、`CLAUDE.md`、`CONTEXT.md`、config `instructions`、MCP prompts、skills 内容、用户自定义 command 目录等。

| Prompt 文件绝对路径 | 用处 | 加载代码位置绝对路径 |
| --- | --- | --- |
| `./opencode/packages/opencode/src/session/prompt/anthropic.txt` | Claude/Anthropic 模型专用系统提示词，定义 OpenCode 代理身份、CLI 交互风格、任务管理和工程行为约束。 | `./opencode/packages/opencode/src/session/system.ts:5`, `./opencode/packages/opencode/src/session/system.ts:29`, `./opencode/packages/opencode/src/session/llm.ts:103` |
| `./opencode/packages/opencode/src/session/prompt/beast.txt` | 老 GPT-4/o1/o3 路径使用的强自主执行系统提示词，强调持续推进、充分调研和严格验证。 | `./opencode/packages/opencode/src/session/system.ts:7`, `./opencode/packages/opencode/src/session/system.ts:20`, `./opencode/packages/opencode/src/session/llm.ts:103` |
| `./opencode/packages/opencode/src/session/prompt/build-switch.txt` | 从 plan agent 切换到 build agent 时注入，提醒模型已进入可执行/可编辑阶段。 | `./opencode/packages/opencode/src/session/prompt.ts:22`, `./opencode/packages/opencode/src/session/prompt.ts:250`, `./opencode/packages/opencode/src/session/prompt.ts:266` |
| `./opencode/packages/opencode/src/session/prompt/codex.txt` | model id 包含 `codex` 时使用的系统提示词，定义 Codex/OpenCode 风格的软件工程代理行为。 | `./opencode/packages/opencode/src/session/system.ts:12`, `./opencode/packages/opencode/src/session/system.ts:24`, `./opencode/packages/opencode/src/session/llm.ts:103` |
| `./opencode/packages/opencode/src/session/prompt/copilot-gpt-5.txt` | GitHub Copilot/GPT-5 风格的系统提示词文件。当前未发现 TypeScript 代码直接 import 或加载。 | 未发现直接加载 |
| `./opencode/packages/opencode/src/session/prompt/default.txt` | 默认模型系统提示词，定义通用 OpenCode CLI 编码代理身份、输出风格、工具使用和工程任务流程。 | `./opencode/packages/opencode/src/session/system.ts:6`, `./opencode/packages/opencode/src/session/system.ts:32`, `./opencode/packages/opencode/src/session/llm.ts:103` |
| `./opencode/packages/opencode/src/session/prompt/gemini.txt` | Gemini 模型专用系统提示词，强调行动导向、工具执行、代码修改和验证流程。 | `./opencode/packages/opencode/src/session/system.ts:8`, `./opencode/packages/opencode/src/session/system.ts:28`, `./opencode/packages/opencode/src/session/llm.ts:103` |
| `./opencode/packages/opencode/src/session/prompt/gpt.txt` | GPT 系列通用系统提示词，定义协作式工程代理、代码库优先阅读、编辑约束和响应风格。 | `./opencode/packages/opencode/src/session/system.ts:9`, `./opencode/packages/opencode/src/session/system.ts:26`, `./opencode/packages/opencode/src/session/llm.ts:103` |
| `./opencode/packages/opencode/src/session/prompt/kimi.txt` | Kimi 模型专用系统提示词，偏简洁 CLI 风格和单步工具使用约束。 | `./opencode/packages/opencode/src/session/system.ts:10`, `./opencode/packages/opencode/src/session/system.ts:31`, `./opencode/packages/opencode/src/session/llm.ts:103` |
| `./opencode/packages/opencode/src/session/prompt/max-steps.txt` | 会话达到最大 step 时作为 assistant 消息追加，要求模型停止工具调用并总结已完成、未完成和后续建议。 | `./opencode/packages/opencode/src/session/prompt.ts:23`, `./opencode/packages/opencode/src/session/prompt.ts:1458` |
| `./opencode/packages/opencode/src/session/prompt/plan-reminder-anthropic.txt` | Anthropic 风格的 plan mode reminder 文件。当前未发现 TypeScript 代码直接 import 或加载。 | 未发现直接加载 |
| `./opencode/packages/opencode/src/session/prompt/plan.txt` | 非 experimental plan mode 下给 plan agent 注入的只读规划模式约束。 | `./opencode/packages/opencode/src/session/prompt.ts:21`, `./opencode/packages/opencode/src/session/prompt.ts:239` |
| `./opencode/packages/opencode/src/session/prompt/trinity.txt` | Trinity 模型专用系统提示词，定义通用本机代理行为、工具执行和简洁回答要求。 | `./opencode/packages/opencode/src/session/system.ts:13`, `./opencode/packages/opencode/src/session/system.ts:30`, `./opencode/packages/opencode/src/session/llm.ts:103` |
| `./opencode/packages/opencode/src/agent/generate.txt` | `Agent.generate` 使用的系统提示词，用于根据用户描述生成自定义 agent 标识、使用场景和 system prompt。 | `./opencode/packages/opencode/src/agent/agent.ts:10`, `./opencode/packages/opencode/src/agent/agent.ts:340` |
| `./opencode/packages/opencode/src/agent/prompt/compaction.txt` | 隐藏 compaction agent 的系统提示词，用于把会话历史压缩为后续可恢复的锚定上下文。 | `./opencode/packages/opencode/src/agent/agent.ts:11`, `./opencode/packages/opencode/src/agent/agent.ts:192`, `./opencode/packages/opencode/src/session/llm.ts:103` |
| `./opencode/packages/opencode/src/agent/prompt/explore.txt` | `explore` 子代理的系统提示词，用于只读代码库探索、文件搜索和结果汇总。 | `./opencode/packages/opencode/src/agent/agent.ts:12`, `./opencode/packages/opencode/src/agent/agent.ts:182`, `./opencode/packages/opencode/src/session/llm.ts:103` |
| `./opencode/packages/opencode/src/agent/prompt/summary.txt` | 隐藏 summary agent 的系统提示词，用于生成 2-3 句 PR 描述风格的会话总结。 | `./opencode/packages/opencode/src/agent/agent.ts:13`, `./opencode/packages/opencode/src/agent/agent.ts:231`, `./opencode/packages/opencode/src/session/llm.ts:103` |
| `./opencode/packages/opencode/src/agent/prompt/title.txt` | 隐藏 title agent 的系统提示词，用于生成不超过 50 字符的会话标题。 | `./opencode/packages/opencode/src/agent/agent.ts:14`, `./opencode/packages/opencode/src/agent/agent.ts:216`, `./opencode/packages/opencode/src/session/llm.ts:103` |
| `./opencode/packages/opencode/src/command/template/initialize.txt` | 内置 `/init` 命令模板，用于引导创建或更新仓库 `AGENTS.md`。 | `./opencode/packages/opencode/src/command/index.ts:13`, `./opencode/packages/opencode/src/command/index.ts:88` |
| `./opencode/packages/opencode/src/command/template/review.txt` | 内置 `/review` 命令模板，用于审查未提交变更、commit、branch 或 PR。 | `./opencode/packages/opencode/src/command/index.ts:14`, `./opencode/packages/opencode/src/command/index.ts:97` |
| `./opencode/packages/opencode/src/tool/apply_patch.txt` | `apply_patch` 工具描述，告诉模型如何提交 patch 文本来修改文件。 | `./opencode/packages/opencode/src/tool/apply_patch.ts:13`, `./opencode/packages/opencode/src/tool/apply_patch.ts:301` |
| `./opencode/packages/opencode/src/tool/bash.txt` | `bash` 工具描述，说明终端命令执行、工作目录、超时、安全和 git 提交流程约束。 | `./opencode/packages/opencode/src/tool/bash.ts:6`, `./opencode/packages/opencode/src/tool/bash.ts:582` |
| `./opencode/packages/opencode/src/tool/codesearch.txt` | `codesearch` 工具描述，说明面向代码库的语义/代码搜索用途。 | `./opencode/packages/opencode/src/tool/codesearch.ts:5`, `./opencode/packages/opencode/src/tool/codesearch.ts:27` |
| `./opencode/packages/opencode/src/tool/edit.txt` | `edit` 工具描述，说明精确字符串替换、replaceAll 和编辑前读取要求。 | `./opencode/packages/opencode/src/tool/edit.ts:11`, `./opencode/packages/opencode/src/tool/edit.ts:67` |
| `./opencode/packages/opencode/src/tool/glob.txt` | `glob` 工具描述，说明按 glob 模式查找文件。 | `./opencode/packages/opencode/src/tool/glob.ts:8`, `./opencode/packages/opencode/src/tool/glob.ts:25` |
| `./opencode/packages/opencode/src/tool/grep.txt` | `grep` 工具描述，说明用正则搜索文件内容。 | `./opencode/packages/opencode/src/tool/grep.ts:8`, `./opencode/packages/opencode/src/tool/grep.ts:30` |
| `./opencode/packages/opencode/src/tool/lsp.txt` | `lsp` 工具描述，说明跳转定义、引用、hover、诊断、符号搜索等 LSP 操作。 | `./opencode/packages/opencode/src/tool/lsp.ts:5`, `./opencode/packages/opencode/src/tool/lsp.ts:43` |
| `./opencode/packages/opencode/src/tool/plan-enter.txt` | experimental plan mode 的进入工具描述文件。当前未发现 TypeScript 代码直接 import 或加载。 | 未发现直接加载 |
| `./opencode/packages/opencode/src/tool/plan-exit.txt` | `plan_exit` 工具描述，说明完成计划后请求切换到 build agent。 | `./opencode/packages/opencode/src/tool/plan.ts:10`, `./opencode/packages/opencode/src/tool/plan.ts:29` |
| `./opencode/packages/opencode/src/tool/question.txt` | `question` 工具描述，说明如何向用户发起问题。 | `./opencode/packages/opencode/src/tool/question.ts:4`, `./opencode/packages/opencode/src/tool/question.ts:20` |
| `./opencode/packages/opencode/src/tool/read.txt` | `read` 工具描述，说明读取文件/目录、offset/limit、长文件和附带加载 instruction 文件的行为。 | `./opencode/packages/opencode/src/tool/read.ts:8`, `./opencode/packages/opencode/src/tool/read.ts:288` |
| `./opencode/packages/opencode/src/tool/skill.txt` | `skill` 工具描述，说明如何按名称加载可用 skill 指令。 | `./opencode/packages/opencode/src/tool/skill.ts:8`, `./opencode/packages/opencode/src/tool/skill.ts:21` |
| `./opencode/packages/opencode/src/tool/task.txt` | `task` 工具描述，说明如何启动子代理执行并行或专门子任务。 | `./opencode/packages/opencode/src/tool/task.ts:2`, `./opencode/packages/opencode/src/tool/task.ts:170` |
| `./opencode/packages/opencode/src/tool/todowrite.txt` | `todowrite` 工具描述，说明如何维护任务列表和任务状态。 | `./opencode/packages/opencode/src/tool/todo.ts:3`, `./opencode/packages/opencode/src/tool/todo.ts:31` |
| `./opencode/packages/opencode/src/tool/webfetch.txt` | `webfetch` 工具描述，说明抓取 URL 内容及返回格式。 | `./opencode/packages/opencode/src/tool/webfetch.ts:5`, `./opencode/packages/opencode/src/tool/webfetch.ts:29` |
| `./opencode/packages/opencode/src/tool/websearch.txt` | `websearch` 工具描述，说明网络搜索参数和当前年份替换。 | `./opencode/packages/opencode/src/tool/websearch.ts:5`, `./opencode/packages/opencode/src/tool/websearch.ts:31` |
| `./opencode/packages/opencode/src/tool/write.txt` | `write` 工具描述，说明写入文件的输入和绝对路径要求。 | `./opencode/packages/opencode/src/tool/write.ts:7`, `./opencode/packages/opencode/src/tool/write.ts:36` |
