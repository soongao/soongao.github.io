import type {
	AssistantMessage,
	AssistantMessageEvent,
	ImageContent,
	Message,
	Model,
	SimpleStreamOptions,
	streamSimple,
	TextContent,
	Tool,
	ToolResultMessage,
} from "@earendil-works/pi-ai";
import type { Static, TSchema } from "typebox";

/**
 * Stream function used by the agent loop.
 *
 * Contract:
 * - Must not throw or return a rejected promise for request/model/runtime failures.
 * - Must return an AssistantMessageEventStream.
 * - Failures must be encoded in the returned stream via protocol events and a
 *   final AssistantMessage with stopReason "error" or "aborted" and errorMessage.
 */
export type StreamFn = (
	...args: Parameters<typeof streamSimple>
) => ReturnType<typeof streamSimple> | Promise<ReturnType<typeof streamSimple>>;

/**
 * 工具执行模式。
 *
 * 一个 assistant 响应里可能同时包含多个 toolCall。这里控制这些 toolCall 如何执行：
 * - "sequential"：严格串行。每个工具都完整经历 prepare -> execute -> finalize 后，才开始下一个。
 * - "parallel"：先按顺序完成所有工具的 prepare 阶段，再并发执行允许并发的工具。
 *
 * 并行模式下，`tool_execution_end` 会按实际完成顺序发出；但最终写入 transcript 的
 * toolResult message 仍按 assistant 原始 toolCall 顺序排列，保证模型后续看到的上下文稳定。
 */
export type ToolExecutionMode = "sequential" | "parallel";

/**
 * 队列消息消费模式。
 *
 * steering/follow-up 消息不会立即打断 provider 请求，而是在 turn 之间的安全点被注入。
 * - "all"：一次性取出并注入所有排队消息；
 * - "one-at-a-time"：每次只取最早的一条，剩余消息留到后续安全点继续穿插。
 */
export type QueueMode = "all" | "one-at-a-time";

/**
 * assistant message 中的一条 toolCall content block。
 *
 * 模型要求调用工具时会产出这个结构，agent-loop 用 `name` 在当前 active tools 中查找目标工具。
 */
export type AgentToolCall = Extract<AssistantMessage["content"][number], { type: "toolCall" }>;

/**
 * `beforeToolCall` hook 的返回值。
 *
 * 这个 hook 发生在工具参数通过 schema 校验之后、真正 execute 之前。
 * 返回 `{ block: true }` 会阻止工具执行，agent-loop 会把它转换成错误 toolResult，
 * 从而保持 transcript 协议完整。
 */
export interface BeforeToolCallResult {
	/** 是否阻止这次工具调用继续执行。 */
	block?: boolean;
	/** 阻止原因，会作为错误 toolResult 的文本返回给模型。 */
	reason?: string;
}

/**
 * `afterToolCall` hook 的返回值。
 *
 * 这个 hook 发生在 execute 已完成之后、`tool_execution_end` 和 toolResult message 发出之前。
 * 它允许上层统一改写工具结果，例如脱敏、补充 details、调整错误标记或请求提前停止。
 *
 * 合并语义是字段级替换：未提供的字段保留原工具执行结果；`content` 和 `details` 不做深合并。
 */
export interface AfterToolCallResult {
	/** 替换后的模型可见内容。 */
	content?: (TextContent | ImageContent)[];
	/** 替换后的结构化详情，通常给 UI、导出或日志使用。 */
	details?: unknown;
	/** 覆盖这次工具结果是否应被视为错误。 */
	isError?: boolean;
	/**
	 * 提示 agent 在当前工具批次之后停止。
	 * 只有同一批所有 finalized 工具结果都设置为 true，agent-loop 才会真正停止继续请求模型。
	 */
	terminate?: boolean;
}

/** 传给 `beforeToolCall` 的上下文。 */
export interface BeforeToolCallContext {
	/** 发起这次 toolCall 的完整 assistant message。 */
	assistantMessage: AssistantMessage;
	/** assistant message content 中的原始 toolCall block。 */
	toolCall: AgentToolCall;
	/** 已按目标工具 schema 校验并可能完成类型转换的参数。 */
	args: unknown;
	/** prepare 阶段看到的当前 agent 上下文快照。 */
	context: AgentContext;
}

/** 传给 `afterToolCall` 的上下文。 */
export interface AfterToolCallContext {
	/** 发起这次 toolCall 的完整 assistant message。 */
	assistantMessage: AssistantMessage;
	/** assistant message content 中的原始 toolCall block。 */
	toolCall: AgentToolCall;
	/** 已按目标工具 schema 校验并可能完成类型转换的参数。 */
	args: unknown;
	/** 工具 execute 返回的原始结果，尚未应用 after hook 的覆盖。 */
	result: AgentToolResult<any>;
	/** 当前结果是否被视为错误。 */
	isError: boolean;
	/** finalize 阶段看到的当前 agent 上下文快照。 */
	context: AgentContext;
}

/** Context passed to `shouldStopAfterTurn`. */
export interface ShouldStopAfterTurnContext {
	/** The assistant message that completed the turn. */
	message: AssistantMessage;
	/** Tool result messages passed to the preceding `turn_end` event. */
	toolResults: ToolResultMessage[];
	/** Current agent context after the turn's assistant message and tool results have been appended. */
	context: AgentContext;
	/** Messages that this loop invocation will return if it exits at this point. Prompt runs include the initial prompt messages; continuation runs do not include pre-existing context messages. */
	newMessages: AgentMessage[];
}

/** Replacement runtime state used by the agent loop before starting another provider request. */
export interface AgentLoopTurnUpdate {
	/** Context for the next provider request. */
	context?: AgentContext;
	/** Model for the next provider request. */
	model?: Model<any>;
	/** Thinking level for the next provider request. */
	thinkingLevel?: ThinkingLevel;
}

export interface PrepareNextTurnContext extends ShouldStopAfterTurnContext {}

export interface AgentLoopConfig extends SimpleStreamOptions {
	model: Model<any>;

	/**
	 * Converts AgentMessage[] to LLM-compatible Message[] before each LLM call.
	 *
	 * Each AgentMessage must be converted to a UserMessage, AssistantMessage, or ToolResultMessage
	 * that the LLM can understand. AgentMessages that cannot be converted (e.g., UI-only notifications,
	 * status messages) should be filtered out.
	 *
	 * Contract: must not throw or reject. Return a safe fallback value instead.
	 * Throwing interrupts the low-level agent loop without producing a normal event sequence.
	 *
	 * @example
	 * ```typescript
	 * convertToLlm: (messages) => messages.flatMap(m => {
	 *   if (m.role === "custom") {
	 *     // Convert custom message to user message
	 *     return [{ role: "user", content: m.content, timestamp: m.timestamp }];
	 *   }
	 *   if (m.role === "notification") {
	 *     // Filter out UI-only messages
	 *     return [];
	 *   }
	 *   // Pass through standard LLM messages
	 *   return [m];
	 * })
	 * ```
	 */
	convertToLlm: (messages: AgentMessage[]) => Message[] | Promise<Message[]>;

	/**
	 * Optional transform applied to the context before `convertToLlm`.
	 *
	 * Use this for operations that work at the AgentMessage level:
	 * - Context window management (pruning old messages)
	 * - Injecting context from external sources
	 *
	 * Contract: must not throw or reject. Return the original messages or another
	 * safe fallback value instead.
	 *
	 * @example
	 * ```typescript
	 * transformContext: async (messages) => {
	 *   if (estimateTokens(messages) > MAX_TOKENS) {
	 *     return pruneOldMessages(messages);
	 *   }
	 *   return messages;
	 * }
	 * ```
	 */
	transformContext?: (messages: AgentMessage[], signal?: AbortSignal) => Promise<AgentMessage[]>;

	/**
	 * Resolves an API key dynamically for each LLM call.
	 *
	 * Useful for short-lived OAuth tokens (e.g., GitHub Copilot) that may expire
	 * during long-running tool execution phases.
	 *
	 * Contract: must not throw or reject. Return undefined when no key is available.
	 */
	getApiKey?: (provider: string) => Promise<string | undefined> | string | undefined;

	/**
	 * Called after each turn fully completes and `turn_end` has been emitted.
	 *
	 * If it returns true, the loop emits `agent_end` and exits before polling steering or follow-up queues,
	 * without starting another LLM call. The current assistant response and any tool executions finish normally.
	 *
	 * Use this to request a graceful stop after the current turn, e.g. before context gets too full.
	 *
	 * Contract: must not throw or reject. Throwing interrupts the low-level agent loop without producing a normal event sequence.
	 */
	shouldStopAfterTurn?: (context: ShouldStopAfterTurnContext) => boolean | Promise<boolean>;

	/**
	 * Called after `turn_end` and before the loop decides whether another provider request should start.
	 * Return replacement context/model/thinking state to affect the next turn in this run.
	 * Return undefined to keep using the current context/config.
	 */
	prepareNextTurn?: (
		context: PrepareNextTurnContext,
	) => AgentLoopTurnUpdate | undefined | Promise<AgentLoopTurnUpdate | undefined>;

	/**
	 * Returns steering messages to inject into the conversation mid-run.
	 *
	 * Called after the current assistant turn finishes executing its tool calls, unless `shouldStopAfterTurn` exits first.
	 * If messages are returned, they are added to the context before the next LLM call.
	 * Tool calls from the current assistant message are not skipped.
	 *
	 * Use this for "steering" the agent while it's working.
	 *
	 * Contract: must not throw or reject. Return [] when no steering messages are available.
	 */
	getSteeringMessages?: () => Promise<AgentMessage[]>;

	/**
	 * Returns follow-up messages to process after the agent would otherwise stop.
	 *
	 * Called when the agent has no more tool calls and no steering messages.
	 * If messages are returned, they're added to the context and the agent
	 * continues with another turn.
	 *
	 * Use this for follow-up messages that should wait until the agent finishes.
	 *
	 * Contract: must not throw or reject. Return [] when no follow-up messages are available.
	 */
	getFollowUpMessages?: () => Promise<AgentMessage[]>;

	/**
	 * 工具执行模式。
	 *
	 * 这是本次 loop 的默认策略。单个工具仍可通过 `AgentTool.executionMode` 覆盖；
	 * 只要同一批 toolCall 中有任意工具声明 sequential，整批都会降级为串行执行。
	 *
	 * 默认值："parallel"。
	 */
	toolExecution?: ToolExecutionMode;

	/**
	 * 工具执行前 hook。
	 *
	 * 调用时机：工具存在、参数预处理和 schema 校验都已经完成，但 execute 尚未开始。
	 * 返回 `{ block: true }` 可以阻止执行；agent-loop 会发出错误 toolResult，而不是破坏事件序列。
	 * hook 会收到当前 agent abort signal，长耗时逻辑需要自行尊重它。
	 */
	beforeToolCall?: (context: BeforeToolCallContext, signal?: AbortSignal) => Promise<BeforeToolCallResult | undefined>;

	/**
	 * 工具执行后 hook。
	 *
	 * 调用时机：execute 已经完成或抛错被编码成错误结果之后，`tool_execution_end` 和
	 * toolResult message 尚未发出之前。返回值可以覆盖部分结果字段。
	 */
	afterToolCall?: (context: AfterToolCallContext, signal?: AbortSignal) => Promise<AfterToolCallResult | undefined>;
}

/**
 * Thinking/reasoning level for models that support it.
 * Note: "xhigh" is only supported by selected model families. Use model thinking-level metadata
 * from @earendil-works/pi-ai to detect support for a concrete model.
 */
export type ThinkingLevel = "off" | "minimal" | "low" | "medium" | "high" | "xhigh";

/**
 * Extensible interface for custom app messages.
 * Apps can extend via declaration merging:
 *
 * @example
 * ```typescript
 * declare module "@mariozechner/agent" {
 *   interface CustomAgentMessages {
 *     artifact: ArtifactMessage;
 *     notification: NotificationMessage;
 *   }
 * }
 * ```
 */
export interface CustomAgentMessages {
	// Empty by default - apps extend via declaration merging
}

/**
 * AgentMessage: Union of LLM messages + custom messages.
 * This abstraction allows apps to add custom message types while maintaining
 * type safety and compatibility with the base LLM messages.
 */
export type AgentMessage = Message | CustomAgentMessages[keyof CustomAgentMessages];

/**
 * Public agent state.
 *
 * `tools` and `messages` use accessor properties so implementations can copy
 * assigned arrays before storing them.
 */
export interface AgentState {
	/** System prompt sent with each model request. */
	systemPrompt: string;
	/** Active model used for future turns. */
	model: Model<any>;
	/** Requested reasoning level for future turns. */
	thinkingLevel: ThinkingLevel;
	/** Available tools. Assigning a new array copies the top-level array. */
	set tools(tools: AgentTool<any>[]);
	get tools(): AgentTool<any>[];
	/** Conversation transcript. Assigning a new array copies the top-level array. */
	set messages(messages: AgentMessage[]);
	get messages(): AgentMessage[];
	/**
	 * True while the agent is processing a prompt or continuation.
	 *
	 * This remains true until awaited `agent_end` listeners settle.
	 */
	readonly isStreaming: boolean;
	/** Partial assistant message for the current streamed response, if any. */
	readonly streamingMessage?: AgentMessage;
	/** Tool call ids currently executing. */
	readonly pendingToolCalls: ReadonlySet<string>;
	/** Error message from the most recent failed or aborted assistant turn, if any. */
	readonly errorMessage?: string;
}

/**
 * 工具产生的结果。
 *
 * 同一个结构既用于最终结果，也用于 `onUpdate` 上报的流式部分结果。
 * `content` 会进入 transcript 并返回给模型，`details` 主要给 UI、日志和导出使用。
 */
export interface AgentToolResult<T> {
	/** 返回给模型的文本或图片内容。 */
	content: (TextContent | ImageContent)[];
	/** 任意结构化详情，不直接作为模型上下文的一部分。 */
	details: T;
	/**
	 * 提示当前工具批次结束后停止继续请求模型。
	 * 只有同一批所有 finalized 结果都为 true，批次才会真正 terminate。
	 */
	terminate?: boolean;
}

/** 工具执行过程中用于上报部分结果的回调。 */
export type AgentToolUpdateCallback<T = any> = (partialResult: AgentToolResult<T>) => void;

/**
 * agent-core 运行时使用的工具协议。
 *
 * 它继承 pi-ai 的基础 Tool，因此 name/description/parameters 会被传给 provider，
 * 让模型知道有哪些工具以及参数 schema。execute 只在模型真的返回 toolCall 后由 agent-loop 调用。
 *
 * coding-agent 的 ToolDefinition 会在 session 层被包装成这个类型；agent-core 不关心
 * TUI 渲染、promptSnippet 或扩展加载来源。
 */
export interface AgentTool<TParameters extends TSchema = TSchema, TDetails = any> extends Tool<TParameters> {
	/** UI 展示用的人类可读名称。 */
	label: string;
	/**
	 * 参数兼容处理钩子。
	 *
	 * 模型或历史 transcript 可能使用旧字段名/旧结构；这里允许工具在 schema 校验前
	 * 做轻量归一化。返回值必须符合 `TParameters`。
	 */
	prepareArguments?: (args: unknown) => Static<TParameters>;
	/**
	 * 执行工具调用。
	 *
	 * 约定：工具失败时直接 throw，由 agent-loop 统一编码成错误 toolResult；
	 * 工具自身不需要也不应该手动构造错误 transcript。
	 */
	execute: (
		toolCallId: string,
		params: Static<TParameters>,
		signal?: AbortSignal,
		onUpdate?: AgentToolUpdateCallback<TDetails>,
	) => Promise<AgentToolResult<TDetails>>;
	/**
	 * 单工具执行模式覆盖。
	 *
	 * 如果工具声明 "sequential"，包含它的整批 toolCall 都会串行执行。
	 * 文件写入、shell 命令等有副作用工具通常应使用串行模式。
	 *
	 * 未设置时使用 loop 的默认执行模式。
	 */
	executionMode?: ToolExecutionMode;
}

/** Context snapshot passed into the low-level agent loop. */
export interface AgentContext {
	/** System prompt included with the request. */
	systemPrompt: string;
	/** Transcript visible to the model. */
	messages: AgentMessage[];
	/** Tools available for this run. */
	tools?: AgentTool<any>[];
}

/**
 * Events emitted by the Agent for UI updates.
 *
 * `agent_end` is the last event emitted for a run, but awaited `Agent.subscribe()`
 * listeners for that event are still part of run settlement. The agent becomes
 * idle only after those listeners finish.
 */
export type AgentEvent =
	// Agent lifecycle
	| { type: "agent_start" }
	| { type: "agent_end"; messages: AgentMessage[] }
	// Turn lifecycle - a turn is one assistant response + any tool calls/results
	| { type: "turn_start" }
	| { type: "turn_end"; message: AgentMessage; toolResults: ToolResultMessage[] }
	// Message lifecycle - emitted for user, assistant, and toolResult messages
	| { type: "message_start"; message: AgentMessage }
	// Only emitted for assistant messages during streaming
	| { type: "message_update"; message: AgentMessage; assistantMessageEvent: AssistantMessageEvent }
	| { type: "message_end"; message: AgentMessage }
	// 工具执行生命周期：
	// start/update/end 描述的是本地执行过程；真正写入 transcript 的 toolResult 仍通过
	// message_start/message_end 单独发出，这样 UI 能区分“工具正在跑”和“结果已进入上下文”。
	| { type: "tool_execution_start"; toolCallId: string; toolName: string; args: any }
	| { type: "tool_execution_update"; toolCallId: string; toolName: string; args: any; partialResult: any }
	| { type: "tool_execution_end"; toolCallId: string; toolName: string; result: any; isError: boolean };
