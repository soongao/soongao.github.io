---
title: Claude Code - Context Manage
# date: YYYY-MM-DD HH:MM:SS +/-TTTT
categories: [Agent, Claude Code]
tags: [Agent, Claude Code, Context]     # TAG names should always be lowercase
# toc: false
---

### Context Manage
#### Context Compact
![contex compact overall](/assets/img/agent-files/claudecode/context/context_overall.webp)
##### 大结果存磁盘
- 单个工具结果过大, 将完整内容写到磁盘上, 消息里只留下一个很小的摘要
- 消息级总量控制, 如果一条消息里所有工具结果总大小过大, 将最大的几个存磁盘
```ts
async function maybePersistLargeToolResult(
  toolResultBlock: ToolResultBlockParam,
  toolName: string,
): Promise<ToolResultBlockParam> {
	const size = contentSize(content)
	// 单个工具结果超过阈值（默认约 50KB）？
	if (size <= threshold) {
		return toolResultBlock  // 没超，原样通过
	}
	// 超了！把完整内容存到磁盘文件
	const result = await persistToolResult(content, toolUseId)
	// 用一个 2KB 的预览替换原内容
	const preview = buildLargeToolResultMessage(result)
	return { ...toolResultBlock, content: preview }
}
```
##### Snip (手动截断): 清理不需要的历史
- 将对话开头最早一批的老消息移除, 并且插入一个标记, 标明之前的消息被清除了
- 会将snipTokensFreed传给auto-compact层
	- snip释放了足够的空间, auto-compact就不用触发了
```ts
if (feature('HISTORY_SNIP')) {
  const snipResult = snipModule.snipCompactIfNeeded(messagesForQuery)
  messagesForQuery = snipResult.messages
  snipTokensFreed = snipResult.tokensFreed
  if (snipResult.boundaryMessage) {
    yield snipResult.boundaryMessage  // 插入边界标记
  }
}
```
##### Micro-Compact: 清理旧的且可重新获取的内容
- 半旧不新的内容, 可以按时间衰减, 裁剪旧的工具结果
- 可以重复获取的工具结果可以裁剪
```ts
const COMPACTABLE_TOOLS = new Set([
  FILE_READ_TOOL_NAME,    // 读文件 → 可以重新读
  ...SHELL_TOOL_NAMES,    // 执行命令 → 可以重新执行
  GREP_TOOL_NAME,         // 搜索 → 可以重新搜
  GLOB_TOOL_NAME,         // 查找文件 → 可以重新查
  WEB_SEARCH_TOOL_NAME,   // 搜索网页 → 可以重新搜
  FILE_EDIT_TOOL_NAME,    // 编辑文件 → 结果可裁剪
  FILE_WRITE_TOOL_NAME,   // 写文件 → 结果可裁剪
])
```
- 保留最近N个, 清理其他的
	- 被裁剪的工具用一个标记替代
```ts
// 收集所有可裁剪工具的结果 ID
const compactableIds = collectCompactableToolIds(messages)
// 保留最近 N 个，其余全部清理
const keepRecent = Math.max(1, config.keepRecent)  // 至少保留 1 个
const keepSet = new Set(compactableIds.slice(-keepRecent))
const clearSet = compactableIds.filter(id => !keepSet.has(id))
```
```ts
export const TIME_BASED_MC_CLEARED_MESSAGE =
  '[Old tool result content cleared]'
```
##### Context Collapse (读时投影): 调用API时动态压缩上下文
- 不修改原始消息, 在进入llm前, 动态计算一个压缩的消息给模型
	- 90% 上下文窗口: 主动开始分段压缩旧消息
	- 95% 上下文窗口: 紧急压缩更多内容
```ts
// 这是 query.ts 中的调用
// 注意：这是一个"读时投影"——不修改 REPL 的完整历史，
// 只在发送给 API 时计算压缩视图
if (feature('CONTEXT_COLLAPSE') && contextCollapse) {
  const collapseResult = await contextCollapse.applyCollapsesIfNeeded(
    messagesForQuery,
    toolUseContext,
    querySource,
  )
  messagesForQuery = collapseResult.messages
}
```
##### Auto-Compact (全量摘要): 全量重写对话, 重新生成新消息链
- 强制13K缓冲区: 有效窗口 - 13K缓冲区 = 触发阈值
	- Anthropic跑了数据统计, P99.99的摘要长度不会超过留13K token长度
```ts
export const AUTOCOMPACT_BUFFER_TOKENS = 13_000

function getAutoCompactThreshold(model: string): number {
  const effectiveContextWindow = getEffectiveContextWindowSize(model)
  // 有效窗口 - 13K 缓冲区 = 触发阈值
  return effectiveContextWindow - AUTOCOMPACT_BUFFER_TOKENS
}
```
- 手动和自动触发
	- 手动触发: /compact
	- 自动触发: suppressFollowUpQuestions=True, 不允许在摘要生成后继续提问
- 安全机制
	- circuit breaker: auto-compact连续失败3次, 停止重试, 熔断
	- 防止摘要生成递归
		- 摘要任务是由sub agent去跑的, 防止sub agent再触发auto-compact
```ts
// 当压缩任务跑起来时被标记为compact, 会话记忆任务被标记成session_memory, 这两个来源的消息不回被再压缩
if (querySource === 'session_memory' || querySource === 'compact') {
  return false
}
```
###### 压缩后的消息
![auto compact msg](/assets/img/agent-files/claudecode/context/auto_compact_msg.webp)
- 存在Lost in the Middle, 所以全量压缩, 最近的N轮会话也不保留
	- 最近对话中的关键上下文通过`附件`形式保留
- 压缩后整个对话历史重写成4段结构
```ts
export function buildPostCompactMessages(result: CompactionResult): Message[] {
  return [
	// 手动 or 自动压缩, 压缩前token数, 最后一条消息id等
    result.boundaryMarker,      // 压缩边界标记
	// 全部历史消息的压缩
    ...result.summaryMessages,  // 摘要消息
	// 最近读的文件, 当前的计划文件, skills, 运行中的异步任务状态等
    ...result.attachments,      // 文件、技能、计划等附件
    ...result.hookResults,      // hook 执行结果
  ]
}
```
- auto-compact之前会再做一次microcompact作为预处理
- 恢复策略 (附件)
	- 最多重新加载5个文件; 每个文件最多5k token; 总量不超过50k token
```ts
export const POST_COMPACT_MAX_TOKENS_PER_FILE = 5_000
export const POST_COMPACT_TOKEN_BUDGET = 50_000
export const POST_COMPACT_MAX_FILES_TO_RESTORE = 5
```
- system prompt
	- 不压缩, 通过buildEffectiveSystemPrompt()重新构造
- 异步任务
	- 要通过附件进行保留
- CLAUDE.md
	- 不被压缩, 清空缓存, 下轮对话通过getUserContext()重新读取
- 摘要任务prompt
```md
CRITICAL: Respond with TEXT ONLY. Do NOT call any tools.
- Do NOT use Read, Bash, Grep, Glob, Edit, Write, or ANY other tool.
- Tool calls will be REJECTED and will waste your only turn.
- Your entire response must be plain text.
```
- 摘要输出格式
![summary prompt](/assets/img/agent-files/claudecode/context/summary_prompt.webp)
```md
<analysis>
[模型的推理草稿，分析对话哪些重要]
</analysis>

<summary>
[结构化的摘要，按 9 个清单分块]
!摘要开头声明: 
本会话是从之前一次因上下文耗尽而中断的对话延续过来的。以下摘要概述了之前的对话内容。
1. Primary Request and Intent（主要请求和意图）
2. Key Technical Concepts（关键技术概念）
3. Files and Code Sections（涉及的文件和代码段）
4. Errors and fixes（碰到的错误和修复方式）
5. Problem Solving（解决的问题）
6. All user messages（所有用户消息）
7. Pending Tasks（待办任务）
8. Current Work（当前正在做的事）
9. Optional Next Step（下一步建议）
</summary>
```
- 使用当前对话模型进行摘要任务
	- 保证摘要质量(不用小模型)
	- 能复用prompt cache
