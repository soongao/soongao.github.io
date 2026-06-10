---
title: Claude Code - Multi Agent
# date: YYYY-MM-DD HH:MM:SS +/-TTTT
categories: [Agent, Claude Code]
tags: [Agent, Claude Code, Multi Agent]     # TAG names should always be lowercase
# toc: false
---

### Multi Agent
![multi agent overview](/soongao.github.io/assets/img/agent-files/claudecode/multiagent/overview.webp)
#### Sub-Agent
##### 隔离
###### tool隔离
- 所有subagent通用黑名单
	- 能派新sub agent的工具
	- 能主动问用户问题的工具
	- 能切换规划模式的工具
	- 能停止其他任务的工具
- 自定义agent多套一层黑名单
- 后台异步agent走白名单
```ts
// src/tools/AgentTool/agentToolUtils.ts:70
export function filterToolsForAgent({ tools, isBuiltIn, isAsync, permissionMode }): Tools {
	return tools.filter(tool => {
		if (tool.name.startsWith('mcp__')) return true// MCP 工具全放行
		if (ALL_AGENT_DISALLOWED_TOOLS.has(tool.name)) return false // 黑名单
		if (!isBuiltIn && CUSTOM_AGENT_DISALLOWED_TOOLS.has(tool.name)) return false // custom agent 黑名单
		if (isAsync && !ASYNC_AGENT_ALLOWED_TOOLS.has(tool.name)) return false
		return true
	})
}
```
###### context隔离
- `读文件的缓存` 要复制一份给sub agent
- `改全局状态` 这件事对sub agent 直接关闭
- `注册后台任务` sub agent保留这个接口
- 给每个sub agent发独立 ID、深度代代+1
```ts
	// src/utils/forkedAgent.ts:345
	export function createSubagentContext(parentContext, overrides): ToolUseContext {
		return {
			// 决策一：文件读缓存克隆一份
			readFileState: cloneFileStateCache(parentContext.readFileState),
			// 决策二：写全局状态直接设为空操作
			setAppState: () => {},
			// 决策三：但任务注册的通路例外保留
			setAppStateForTasks: parentContext.setAppStateForTasks ?? parentContext.setAppState,
			// 决策四：独立 ID + 深度 +1
			agentId: overrides?.agentId ?? createAgentId(),
			queryTracking: {
				chainId: randomUUID(),
				depth: (parentContext.queryTracking?.depth ?? -1) + 1,
			},
			// ...其他字段略
		}
	}
```
##### 父子agent通信
###### 父 -> 子
- 消息队列 + 异步通知
- sub agent 档案
```ts
// src/tasks/LocalAgentTask/LocalAgentTask.tsx:116
export type LocalAgentTaskState = TaskStateBase & {
	type: 'local_agent';
	agentId: string;               // 子 agent 唯一 ID
	prompt: string;                // 初始任务
	agentType: string;
	status: TaskStatus;            // pending/running/completed/failed/killed
	result?: AgentToolResult;      // 完成后的结果
	progress?: AgentProgress;      // 进度
	isBackgrounded: boolean;       // 是否已转后台
	pendingMessages: string[];     // 信箱：父 agent 扔进来的待处理消息
	messages?: Message[];
};
```
- 消息投递
```ts
// src/tools/SendMessageTool/SendMessageTool.ts:800
const task = appState.tasks[agentId]
if (isLocalAgentTask(task) && !isMainSessionTask(task)) {
	if (task.status === 'running') {
		queuePendingMessage(agentId, input.message, context.setAppStateForTasks)
		return { data: { success: true, message: 'Message queued...' } }
	}
	// 任务已停止，自动唤醒从 transcript 里恢复
	const result = await resumeAgentBackground({ agentId, prompt: input.message, ... })
}
```
```ts
// src/tasks/LocalAgentTask/LocalAgentTask.tsx:162
export function queuePendingMessage(taskId, msg, setAppState): void {
	updateTaskState<LocalAgentTaskState>(taskId, setAppState, task => ({
		...task,
		pendingMessages: [...task.pendingMessages, msg]
	}));
}
```
##### 子 -> 父
- 将完成通知拼成XML, 伪装成用户消息, 放进父agent的对话中
```xml
<task-notification>
<task-id>agent-a1b</task-id>
<output-file>/tmp/xxx.txt</output-file>
<status>completed</status>
<summary>Agent "Investigate auth bug" completed</summary>
<result>Found null pointer in src/auth/validate.ts:42...</result>
<usage>
<total_tokens>12345</total_tokens>
<tool_uses>8</tool_uses>
<duration_ms>34567</duration_ms>
</usage>
</task-notification>
```
```ts
// src/tasks/LocalAgentTask/LocalAgentTask.tsx:197
const message = `<${TASK_NOTIFICATION_TAG}>
				<${TASK_ID_TAG}>${taskId}</${TASK_ID_TAG}>
				<${OUTPUT_FILE_TAG}>${outputPath}</${OUTPUT_FILE_TAG}>
				<${STATUS_TAG}>${status}</${STATUS_TAG}>
				<${SUMMARY_TAG}>${summary}</${SUMMARY_TAG}>${resultSection}${usageSection}
				</${TASK_NOTIFICATION_TAG}>`;
enqueuePendingNotification({ value: message, mode: 'task-notification' });
```
##### auto-background
- 父agent同步等待sub agent完成(一个阈值时间内), 超过阈值, sub agent转后台执行
```ts
// src/tools/AgentTool/AgentTool.tsx:72
function getAutoBackgroundMs(): number {
  if (isEnvTruthy(process.env.CLAUDE_AUTO_BACKGROUND_TASKS) 
      || getFeatureValue_CACHED_MAY_BE_STALE('tengu_auto_background_agents', false)) {
    return 120_000;  // 2 分钟
  }
  return 0;
}
```
#### Fork Agent
- 利用到prompt cache, fork sub agent和父agent的system prompt一致
```ts
// src/utils/forkedAgent.ts:57
export type CacheSafeParams = {
	/** System prompt - 必须跟父完全一致 */
  	systemPrompt: SystemPrompt
	/** User context - 拼接在消息前，影响缓存 */
	userContext: { [k: string]: string }
	/** System context - 拼接在 system prompt 后，影响缓存 */
	systemContext: { [k: string]: string }
	/** 工具池、模型等所在的上下文 */
	toolUseContext: ToolUseContext
	/** 父 agent 的消息前缀，用于缓存共享 */
	forkContextMessages: Message[]
}
```
- fork agent的system prompt和父agent一致, 不用自己生成
```ts
// src/tools/AgentTool/forkSubagent.ts:60
export const FORK_AGENT = {
	agentType: FORK_SUBAGENT_TYPE,
	tools: ['*'],             // 用父的完整工具池
	maxTurns: 200,
	model: 'inherit',          // 继承父的模型
	permissionMode: 'bubble',  // 权限弹窗浮到父终端
	source: 'built-in',
	getSystemPrompt: () => '', // 返回空串！
} satisfies BuiltInAgentDefinition
```
- fork 和 coordinate互斥
```ts
// src/tools/AgentTool/forkSubagent.ts:32
export function isForkSubagentEnabled(): boolean {
	if (feature('FORK_SUBAGENT')) {
		if (isCoordinatorMode()) returnfalse// 互斥！
		if (getIsNonInteractiveSession()) return false
		return true
	}
	return false
}
```
#### Coordinator-Worker
- coordinate模式要显式打开
```ts
// src/coordinator/coordinatorMode.ts:36
export function isCoordinatorMode(): boolean {
  if (feature('COORDINATOR_MODE')) { // 编译时的功能开关
    return isEnvTruthy(process.env.CLAUDE_CODE_COORDINATOR_MODE) // 环境变量 CLAUDE_CODE_COORDINATOR_MODE=1
  }
  return false
}
```
- 主agent只做`派 worker`, `收结果`, `合成答案`; system prompt支持
```md
You are Claude Code, an AI assistant that orchestrates software engineering 
tasks across multiple workers.

## 1. Your Role
You are a **coordinator**. Your job is to:
- Help the user achieve their goal
- Direct workers to research, implement and verify code changes
- Synthesize results and communicate with the user
- Answer questions directly when possible, don't delegate work 
  that you can handle without tools

你的身份是协调者，你的工作是指挥 worker 去做研究、实现、验证，然后自己合成结果跟用户交流。能自己回答的问题不要派人去做。
```
- coordinator的builtin工具
```ts
// src/coordinator/coordinatorMode.ts:29
const INTERNAL_WORKER_TOOLS = new Set([
	TEAM_CREATE_TOOL_NAME,       // 创建 worker 团队
	TEAM_DELETE_TOOL_NAME,       // 解散团队
	SEND_MESSAGE_TOOL_NAME,      // 给 worker 发消息
	SYNTHETIC_OUTPUT_TOOL_NAME,  // 合成最终输出给用户
])
```
- 支持并行创建worker, 部分system prompt
```md
Parallelism is your superpower. Workers are async. Launch independent workers concurrently whenever possible, don't serialize work that can run simultaneously and look for opportunities to fan out.

并行是你的超能力，worker 全是异步的，能并行的绝不串行，多找机会一口气派一堆出去。
```
- 持续派活时, 是resume old agent 还是 spawn new agent
	- 新任务跟 worker 现有上下文高度相关（比如刚查的文件现在要改），续命老 worker
	- 新任务跟 worker 现有上下文没关系，或者之前 worker 的工作走偏了，派新 worker