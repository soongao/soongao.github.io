/**
 * Agent 低层运行循环。
 *
 * 这份实现有一个非常重要的设计约束：
 * - 在 loop 内部，始终优先操作项目自己的 `AgentMessage[]` 抽象；
 * - 只有真正发起模型请求的那一刻，才把它转换成 provider/LLM 认识的 `Message[]`。
 *
 * 这样做的收益是：
 * 1. transcript、toolResult、队列注入、事件发射都围绕统一的数据结构展开；
 * 2. provider 协议差异被压缩在 `streamAssistantResponse()` 的边界处；
 * 3. 上层 `Agent` 可以把它当成一个“纯循环内核”来复用，而不必把运行时状态硬编码进这里。
 */

import {
	type AssistantMessage,
	type Context,
	EventStream,
	streamSimple,
	type ToolResultMessage,
	validateToolArguments,
} from "@earendil-works/pi-ai";
import type {
	AgentContext,
	AgentEvent,
	AgentLoopConfig,
	AgentMessage,
	AgentTool,
	AgentToolCall,
	AgentToolResult,
	StreamFn,
} from "./types.ts";

/**
 * 事件下沉接口。
 *
 * low-level loop 不直接依赖 UI、存储或日志系统，只要求调用方提供一个
 * `emit()` 回调。谁消费这些事件、如何等待这些事件，交给外层包装层决定。
 */
export type AgentEventSink = (event: AgentEvent) => Promise<void> | void;

/**
 * 从新的 prompt 启动一次 agent loop。
 *
 * 这里属于“带新用户输入启动”的入口：
 * - 先把 prompt 拼进 context；
 * - 再为这些 prompt 发出 message_start / message_end；
 * - 然后进入共享的 `runLoop()` 主骨架。
 *
 * 注意它返回的是 `EventStream`：
 * - 调用方既可以边消费事件边更新 UI；
 * - 也可以在流结束时拿到本次 run 新产生的 `AgentMessage[]`。
 */
export function agentLoop(
	prompts: AgentMessage[],
	context: AgentContext,
	config: AgentLoopConfig,
	signal?: AbortSignal,
	streamFn?: StreamFn,
): EventStream<AgentEvent, AgentMessage[]> {
	const stream = createAgentStream();

	void runAgentLoop(
		prompts,
		context,
		config,
		async (event) => {
			stream.push(event);
		},
		signal,
		streamFn,
	).then((messages) => {
		stream.end(messages);
	});

	return stream;
}

/**
 * 从现有 transcript 继续执行 loop，但不额外追加新消息。
 *
 * 这个入口主要服务于“继续上一轮合法上下文”的场景，例如：
 * - 末尾已经有 user message，希望继续让 assistant 回复；
 * - 末尾已经有 toolResult，希望让 assistant 消化工具结果并继续推理。
 *
 * 关键协议约束：
 * - provider 发请求时，最后一条可见消息必须能解释成 user / toolResult；
 * - 如果最后一条是 assistant，那么协议上表示“assistant 刚说完，但没有新的触发输入”，
 *   这是不完整 turn，provider 往往会拒绝。
 *
 * 这里只能做 role 级别的粗校验；更深一层的合法性仍取决于 `convertToLlm()` 的实际转换结果。
 */
export function agentLoopContinue(
	context: AgentContext,
	config: AgentLoopConfig,
	signal?: AbortSignal,
	streamFn?: StreamFn,
): EventStream<AgentEvent, AgentMessage[]> {
	if (context.messages.length === 0) {
		throw new Error("Cannot continue: no messages in context");
	}

	if (context.messages[context.messages.length - 1].role === "assistant") {
		throw new Error("Cannot continue from message role: assistant");
	}

	const stream = createAgentStream();

	void runAgentLoopContinue(
		context,
		config,
		async (event) => {
			stream.push(event);
		},
		signal,
		streamFn,
	).then((messages) => {
		stream.end(messages);
	});

	return stream;
}

export async function runAgentLoop(
	prompts: AgentMessage[],
	context: AgentContext,
	config: AgentLoopConfig,
	emit: AgentEventSink,
	signal?: AbortSignal,
	streamFn?: StreamFn,
): Promise<AgentMessage[]> {
	// `newMessages` 只记录本次 run 新增的 transcript 片段，方便最终 `agent_end`
	// 或调用方只拿到“增量结果”，而不是整份历史上下文。
	const newMessages: AgentMessage[] = [...prompts];
	// `currentContext` 是本次循环可变的工作视图：后续 assistant、toolResult、steering
	// 消息都会继续推入这里，但不会回写调用方传入的原始对象引用。
	const currentContext: AgentContext = {
		...context,
		messages: [...context.messages, ...prompts],
	};

	await emit({ type: "agent_start" });
	await emit({ type: "turn_start" });
	for (const prompt of prompts) {
		await emit({ type: "message_start", message: prompt });
		await emit({ type: "message_end", message: prompt });
	}

	await runLoop(currentContext, newMessages, config, signal, emit, streamFn);
	return newMessages;
}

export async function runAgentLoopContinue(
	context: AgentContext,
	config: AgentLoopConfig,
	emit: AgentEventSink,
	signal?: AbortSignal,
	streamFn?: StreamFn,
): Promise<AgentMessage[]> {
	if (context.messages.length === 0) {
		throw new Error("Cannot continue: no messages in context");
	}

	if (context.messages[context.messages.length - 1].role === "assistant") {
		throw new Error("Cannot continue from message role: assistant");
	}

	const newMessages: AgentMessage[] = [];
	// continue 场景不追加 prompt，因此直接从现有 context 拷贝出工作快照。
	const currentContext: AgentContext = { ...context };

	await emit({ type: "agent_start" });
	await emit({ type: "turn_start" });

	await runLoop(currentContext, newMessages, config, signal, emit, streamFn);
	return newMessages;
}

function createAgentStream(): EventStream<AgentEvent, AgentMessage[]> {
	// `agent_end` 被定义为流的终止事件；同时它也携带最终聚合出的本次 run 增量消息。
	return new EventStream<AgentEvent, AgentMessage[]>(
		(event: AgentEvent) => event.type === "agent_end",
		(event: AgentEvent) => (event.type === "agent_end" ? event.messages : []),
	);
}

/**
 * `agentLoop()` 与 `agentLoopContinue()` 共用的主循环骨架。
 *
 * 可以把它理解成“两层循环”：
 * - 外层循环：agent 原本要停下时，看看 follow-up 队列里有没有“收尾接力”消息；
 * - 内层循环：持续处理 assistant 响应、tool call 批次，以及 turn 之间注入的 steering 消息。
 *
 * 核心不变量：
 * 1. 每次真正请求模型前，`currentContext.messages` 都是一份完整、可见、合法的 transcript；
 * 2. assistant turn 完成后，toolResult 会被补回 transcript，再决定是否下一轮继续；
 * 3. `prepareNextTurn()` 只影响“下一次 provider 请求”，绝不回改已经在飞的请求。
 */
async function runLoop(
	initialContext: AgentContext,
	newMessages: AgentMessage[],
	initialConfig: AgentLoopConfig,
	signal: AbortSignal | undefined,
	emit: AgentEventSink,
	streamFn?: StreamFn,
): Promise<void> {
	let currentContext = initialContext;
	let config = initialConfig;
	let firstTurn = true;
	// run 一开始先 drain 一次 steering。
	// 这让“用户在 agent 还没正式请求模型前插入的中途纠偏消息”可以在第一轮就生效。
	let pendingMessages: AgentMessage[] = (await config.getSteeringMessages?.()) || [];

	// 外层：agent 本来要停时，允许 follow-up 把它再次拉起，形成“结束前再干一点”的语义。
	while (true) {
		let hasMoreToolCalls = true;

		// 内层：只要还有工具链没走完，或者还有待注入的 steering 消息，就继续 turn。
		while (hasMoreToolCalls || pendingMessages.length > 0) {
			if (!firstTurn) {
				await emit({ type: "turn_start" });
			} else {
				firstTurn = false;
			}

			// 先把 steering / follow-up 注入的 user 侧消息真正写入 transcript，
			// 再请求 assistant。这样 provider 看到的是合法且完整的上下文。
			if (pendingMessages.length > 0) {
				for (const message of pendingMessages) {
					await emit({ type: "message_start", message });
					await emit({ type: "message_end", message });
					currentContext.messages.push(message);
					newMessages.push(message);
				}
				pendingMessages = [];
			}

			// 进入 provider 边界，流式地产生 assistant 响应。
			const message = await streamAssistantResponse(currentContext, config, signal, emit, streamFn);
			newMessages.push(message);

			// 一旦 provider 层已经明确给出 error/aborted stopReason，本轮不再尝试 tool calls。
			// 这里直接结束 turn 并结束整个 agent run。
			if (message.stopReason === "error" || message.stopReason === "aborted") {
				await emit({ type: "turn_end", message, toolResults: [] });
				await emit({ type: "agent_end", messages: newMessages });
				return;
			}

			// assistant message 中可能带有一个或多个 toolCall。
			// 这些 toolCall 是 provider 根据上面传入的 `Context.tools` 生成的结构化调用请求；
			// 本地执行完成后，toolResult 会写回 transcript，下一轮 assistant 再消费这些结果。
			// 是否继续 loop，很大程度由这一批工具结果是否要求 terminate 决定。
			const toolCalls = message.content.filter((c) => c.type === "toolCall");

			const toolResults: ToolResultMessage[] = [];
			hasMoreToolCalls = false;
			if (toolCalls.length > 0) {
				const executedToolBatch = await executeToolCalls(currentContext, message, config, signal, emit);
				toolResults.push(...executedToolBatch.messages);
				// 只有整批工具结果没有“全员 terminate=true”时，assistant 才会在下一轮继续消费这些结果。
				hasMoreToolCalls = !executedToolBatch.terminate;

				for (const result of toolResults) {
					currentContext.messages.push(result);
					newMessages.push(result);
				}
			}

			// `turn_end` 的定义是：assistant 消息以及它触发出的 toolResult 已全部落定。
			await emit({ type: "turn_end", message, toolResults });

			// save-point 风格的下一轮准备钩子：
			// 上层可在这里替换 context / model / thinking level，但只能影响“下一次”请求。
			const nextTurnContext = {
				message,
				toolResults,
				context: currentContext,
				newMessages,
			};
			const nextTurnSnapshot = await config.prepareNextTurn?.(nextTurnContext);
			if (nextTurnSnapshot) {
				currentContext = nextTurnSnapshot.context ?? currentContext;
				config = {
					...config,
					model: nextTurnSnapshot.model ?? config.model,
					reasoning:
						nextTurnSnapshot.thinkingLevel === undefined
							? config.reasoning
							: nextTurnSnapshot.thinkingLevel === "off"
								? undefined
								: nextTurnSnapshot.thinkingLevel,
				};
			}

			// 允许调用方在每个 turn 结束后做统一停止判定，例如达到目标、命中守卫、进入人工接管等。
			if (
				await config.shouldStopAfterTurn?.({
					message,
					toolResults,
					context: currentContext,
					newMessages,
				})
			) {
				await emit({ type: "agent_end", messages: newMessages });
				return;
			}

			// 在 turn 与 turn 之间的安全点再次读取 steering queue。
			pendingMessages = (await config.getSteeringMessages?.()) || [];
		}

		// 走到这里表示：
		// - 当前没有待继续的工具链；
		// - 也没有待注入的 steering。
		// 因此 agent“理论上”可以停下，但 follow-up 允许它继续接后续任务。
		const followUpMessages = (await config.getFollowUpMessages?.()) || [];
		if (followUpMessages.length > 0) {
			// follow-up 本质上仍然会在下一轮开始前作为 pending user 侧消息注入。
			pendingMessages = followUpMessages;
			continue;
		}

		// 没有后续任务，完整结束整个 run。
		break;
	}

	await emit({ type: "agent_end", messages: newMessages });
}

/**
 * 向 LLM/provider 发起一次 assistant 响应请求，并把流式事件折叠回 `AssistantMessage`。
 *
 * 这是整个 low-level loop 中最关键的“协议边界函数”：
 * - 上游输入是项目内部的 `AgentMessage[]`；
 * - 下游输出是 provider 流；
 * - 中间在这里完成上下文转换、模型调用、partial message 更新、最终 message 提交。
 *
 * 一定要注意：
 * - partial assistant message 会先临时写入 `context.messages`；
 * - 最终 `done/error` 时再被 finalMessage 覆盖；
 * - 因此 transcript 里始终只有一个“当前位置的 assistant message 槽位”，不会越流越多。
 */
async function streamAssistantResponse(
	context: AgentContext,
	config: AgentLoopConfig,
	signal: AbortSignal | undefined,
	emit: AgentEventSink,
	streamFn?: StreamFn,
): Promise<AssistantMessage> {
	// 第一步：允许上层在 provider 调用前重写可见上下文。
	// 常见用途包括 compaction、上下文裁剪、插入系统性摘要等。
	let messages = context.messages;
	if (config.transformContext) {
		messages = await config.transformContext(messages, signal);
	}

	// 第二步：把项目内部 transcript 转成 provider/LLM 真实接受的消息格式。
	const llmMessages = await config.convertToLlm(messages);

	// 第三步：组装 provider 调用上下文。
	//
	// `context.tools` 是当前 active tools 的快照。provider 层会把这些统一 Tool schema
	// 转换成 OpenAI/Anthropic/Gemini 等后端各自的 tool/function calling 格式。
	// 如果模型选择调用工具，后续流事件中会出现 toolCall block，再由本文件执行本地工具。
	const llmContext: Context = {
		systemPrompt: context.systemPrompt,
		messages: llmMessages,
		tools: context.tools,
	};

	const streamFunction = streamFn || streamSimple;

	// 在真正请求前再解析 API key，而不是在 Agent 构造时缓存。
	// 这样可以兼容短期 token、轮换凭证或外部动态鉴权。
	const resolvedApiKey =
		(config.getApiKey ? await config.getApiKey(config.model.provider) : undefined) || config.apiKey;

	const response = await streamFunction(config.model, llmContext, {
		...config,
		apiKey: resolvedApiKey,
		signal,
	});

	let partialMessage: AssistantMessage | null = null;
	let addedPartial = false;

	for await (const event of response) {
		switch (event.type) {
			case "start":
				// provider 开始返回 assistant 消息时，先把 partial 占位写进 transcript，
				// 后续 delta 都会更新同一个位置。
				partialMessage = event.partial;
				context.messages.push(partialMessage);
				addedPartial = true;
				await emit({ type: "message_start", message: { ...partialMessage } });
				break;

			case "text_start":
			case "text_delta":
			case "text_end":
			case "thinking_start":
			case "thinking_delta":
			case "thinking_end":
			case "toolcall_start":
			case "toolcall_delta":
			case "toolcall_end":
				if (partialMessage) {
					// 每个 streaming 事件都携带最新 partial，外层 UI 通过 message_update 增量刷新。
					partialMessage = event.partial;
					context.messages[context.messages.length - 1] = partialMessage;
					await emit({
						type: "message_update",
						assistantMessageEvent: event,
						message: { ...partialMessage },
					});
				}
				break;

			case "done":
			case "error": {
				// 无论正常完成还是 provider 错误，都用 `response.result()` 取最终定稿消息。
				// 这样 transcript 只保留最终版 assistant message，而不保留中间 partial 快照。
				const finalMessage = await response.result();
				if (addedPartial) {
					context.messages[context.messages.length - 1] = finalMessage;
				} else {
					context.messages.push(finalMessage);
				}
				if (!addedPartial) {
					await emit({ type: "message_start", message: { ...finalMessage } });
				}
				await emit({ type: "message_end", message: finalMessage });
				return finalMessage;
			}
		}
	}

	const finalMessage = await response.result();
	// 理论兜底：若上面的流事件分支没有提前 return，仍确保生成一条完整 assistant message。
	if (addedPartial) {
		context.messages[context.messages.length - 1] = finalMessage;
	} else {
		context.messages.push(finalMessage);
		await emit({ type: "message_start", message: { ...finalMessage } });
	}
	await emit({ type: "message_end", message: finalMessage });
	return finalMessage;
}

/**
 * 执行 assistant message 中携带的 tool calls。
 *
 * 这里先做一次“批次级调度决策”：
 * - 如果全局配置要求顺序执行，走 sequential；
 * - 如果任意单个 tool 声明自己必须顺序执行，也整体降级为 sequential；
 * - 否则才走 parallel。
 *
 * 之所以按“整批降级”处理，而不是部分并行、部分串行混搭，是为了保持批次语义简单，
 * 避免在一个 assistant turn 里出现难以解释的依赖竞态。
 */
async function executeToolCalls(
	currentContext: AgentContext,
	assistantMessage: AssistantMessage,
	config: AgentLoopConfig,
	signal: AbortSignal | undefined,
	emit: AgentEventSink,
): Promise<ExecutedToolCallBatch> {
	// 这里再次从 assistantMessage 中取 toolCall，保证调度逻辑只依赖最终定稿消息，
	// 不依赖 streaming 期间的 partial toolCall 片段。
	const toolCalls = assistantMessage.content.filter((c) => c.type === "toolCall");
	const hasSequentialToolCall = toolCalls.some(
		(tc) => currentContext.tools?.find((t) => t.name === tc.name)?.executionMode === "sequential",
	);
	if (config.toolExecution === "sequential" || hasSequentialToolCall) {
		return executeToolCallsSequential(currentContext, assistantMessage, toolCalls, config, signal, emit);
	}
	return executeToolCallsParallel(currentContext, assistantMessage, toolCalls, config, signal, emit);
}

type ExecutedToolCallBatch = {
	/** 本批 tool calls 产生的 transcript 级 toolResult 消息。 */
	messages: ToolResultMessage[];
	/** 只有本批全部 finalized 结果都声明 terminate=true，才终止下一轮 assistant 继续。 */
	terminate: boolean;
};

async function executeToolCallsSequential(
	currentContext: AgentContext,
	assistantMessage: AssistantMessage,
	toolCalls: AgentToolCall[],
	config: AgentLoopConfig,
	signal: AbortSignal | undefined,
	emit: AgentEventSink,
): Promise<ExecutedToolCallBatch> {
	// 顺序模式强调“单调用完整闭环”：一个 toolCall 从 prepare 到 emit result 全部结束后，
	// 才会开始下一个。这种模式时序最稳定，也最适合存在依赖链的工具。
	const finalizedCalls: FinalizedToolCallOutcome[] = [];
	const messages: ToolResultMessage[] = [];

	for (const toolCall of toolCalls) {
		await emit({
			type: "tool_execution_start",
			toolCallId: toolCall.id,
			toolName: toolCall.name,
			args: toolCall.arguments,
		});

		const preparation = await prepareToolCall(currentContext, assistantMessage, toolCall, config, signal);
		let finalized: FinalizedToolCallOutcome;
		if (preparation.kind === "immediate") {
			finalized = {
				toolCall,
				result: preparation.result,
				isError: preparation.isError,
			};
		} else {
			const executed = await executePreparedToolCall(preparation, signal, emit);
			finalized = await finalizeExecutedToolCall(
				currentContext,
				assistantMessage,
				preparation,
				executed,
				config,
				signal,
			);
		}

		await emitToolExecutionEnd(finalized, emit);
		const toolResultMessage = createToolResultMessage(finalized);
		await emitToolResultMessage(toolResultMessage, emit);
		finalizedCalls.push(finalized);
		messages.push(toolResultMessage);

		if (signal?.aborted) {
			break;
		}
	}

	return {
		messages,
		terminate: shouldTerminateToolBatch(finalizedCalls),
	};
}

async function executeToolCallsParallel(
	currentContext: AgentContext,
	assistantMessage: AssistantMessage,
	toolCalls: AgentToolCall[],
	config: AgentLoopConfig,
	signal: AbortSignal | undefined,
	emit: AgentEventSink,
): Promise<ExecutedToolCallBatch> {
	// 并行模式下，prepare 阶段仍按 assistant 原顺序串行进行；
	// 真正并发的是 execute + finalize。
	// 这样做的好处是：
	// 1. 参数准备/校验/beforeHook 仍具确定性；
	// 2. 真正耗时的工具执行可以并发；
	// 3. 结果消息最终仍能按原 toolCall 顺序落回 transcript。
	const finalizedCalls: FinalizedToolCallEntry[] = [];

	for (const toolCall of toolCalls) {
		await emit({
			type: "tool_execution_start",
			toolCallId: toolCall.id,
			toolName: toolCall.name,
			args: toolCall.arguments,
		});

		const preparation = await prepareToolCall(currentContext, assistantMessage, toolCall, config, signal);
		if (preparation.kind === "immediate") {
			const finalized = {
				toolCall,
				result: preparation.result,
				isError: preparation.isError,
			} satisfies FinalizedToolCallOutcome;
			await emitToolExecutionEnd(finalized, emit);
			finalizedCalls.push(finalized);
			if (signal?.aborted) {
				break;
			}
			continue;
		}

		finalizedCalls.push(async () => {
			const executed = await executePreparedToolCall(preparation, signal, emit);
			const finalized = await finalizeExecutedToolCall(
				currentContext,
				assistantMessage,
				preparation,
				executed,
				config,
				signal,
			);
			await emitToolExecutionEnd(finalized, emit);
			return finalized;
		});
		if (signal?.aborted) {
			break;
		}
	}

	const orderedFinalizedCalls = await Promise.all(
		finalizedCalls.map((entry) => (typeof entry === "function" ? entry() : Promise.resolve(entry))),
	);
	// 注意：`Promise.all` 返回结果顺序与输入数组顺序一致，
	// 因此即使并发执行，toolResult message 仍会按 assistant 原始 toolCall 顺序写回 transcript。
	const messages: ToolResultMessage[] = [];
	for (const finalized of orderedFinalizedCalls) {
		const toolResultMessage = createToolResultMessage(finalized);
		await emitToolResultMessage(toolResultMessage, emit);
		messages.push(toolResultMessage);
	}

	return {
		messages,
		terminate: shouldTerminateToolBatch(orderedFinalizedCalls),
	};
}

type PreparedToolCall = {
	kind: "prepared";
	toolCall: AgentToolCall;
	tool: AgentTool<any>;
	args: unknown;
};

type ImmediateToolCallOutcome = {
	kind: "immediate";
	result: AgentToolResult<any>;
	isError: boolean;
};

type ExecutedToolCallOutcome = {
	result: AgentToolResult<any>;
	isError: boolean;
};

type FinalizedToolCallOutcome = {
	toolCall: AgentToolCall;
	result: AgentToolResult<any>;
	isError: boolean;
};

type FinalizedToolCallEntry = FinalizedToolCallOutcome | (() => Promise<FinalizedToolCallOutcome>);

function shouldTerminateToolBatch(finalizedCalls: FinalizedToolCallOutcome[]): boolean {
	// 这里采用“全员 terminate 才停止”的批次语义，而不是某个工具单独 terminate 就硬停。
	// 这避免多工具批次中出现一部分工具要求结束、另一部分仍需继续的歧义状态。
	return finalizedCalls.length > 0 && finalizedCalls.every((finalized) => finalized.result.terminate === true);
}

function prepareToolCallArguments(tool: AgentTool<any>, toolCall: AgentToolCall): AgentToolCall {
	// 允许工具先做一轮轻量参数重写，例如补默认值、兼容旧字段名、归一化输入结构。
	if (!tool.prepareArguments) {
		return toolCall;
	}
	const preparedArguments = tool.prepareArguments(toolCall.arguments);
	if (preparedArguments === toolCall.arguments) {
		return toolCall;
	}
	return {
		...toolCall,
		arguments: preparedArguments as Record<string, any>,
	};
}

async function prepareToolCall(
	currentContext: AgentContext,
	assistantMessage: AssistantMessage,
	toolCall: AgentToolCall,
	config: AgentLoopConfig,
	signal: AbortSignal | undefined,
): Promise<PreparedToolCall | ImmediateToolCallOutcome> {
	// prepare 阶段只负责“让工具变成可执行状态”，不真正跑工具。
	// 它统一处理：查找工具、参数预处理、schema 校验、beforeToolCall 审批/拦截。
	//
	// 工具查找只发生在当前 context.tools 中，也就是本次 run 开始时 active tools 的快照。
	// registry 中存在但未启用的工具，或者运行中才被启用的工具，都不会被本次 toolCall 找到。
	const tool = currentContext.tools?.find((t) => t.name === toolCall.name);
	if (!tool) {
		return {
			kind: "immediate",
			result: createErrorToolResult(`Tool ${toolCall.name} not found`),
			isError: true,
		};
	}

	try {
		const preparedToolCall = prepareToolCallArguments(tool, toolCall);
		// validateToolArguments 会按工具的 TypeBox/JSON schema 校验，并尽量做安全的类型转换。
		// 通过校验后的 args 才会传给 before hook 和真正的 tool.execute。
		const validatedArgs = validateToolArguments(tool, preparedToolCall);
		if (config.beforeToolCall) {
			// before hook 常用于权限检查、审计、策略拦截、额度控制等。
			const beforeResult = await config.beforeToolCall(
				{
					assistantMessage,
					toolCall,
					args: validatedArgs,
					context: currentContext,
				},
				signal,
			);
			if (signal?.aborted) {
				return {
					kind: "immediate",
					result: createErrorToolResult("Operation aborted"),
					isError: true,
				};
			}
			if (beforeResult?.block) {
				return {
					kind: "immediate",
					result: createErrorToolResult(beforeResult.reason || "Tool execution was blocked"),
					isError: true,
				};
			}
		}
		if (signal?.aborted) {
			// abort 被编码成普通的 error toolResult，而不是抛出异常中断整个批次，
			// 这样 transcript 语义更统一，上层也更容易消费。
			return {
				kind: "immediate",
				result: createErrorToolResult("Operation aborted"),
				isError: true,
			};
		}
		return {
			kind: "prepared",
			toolCall,
			tool,
			args: validatedArgs,
		};
	} catch (error) {
		// 参数预处理、schema 校验、before hook 任一失败，都立即转成“immediate error result”。
		return {
			kind: "immediate",
			result: createErrorToolResult(error instanceof Error ? error.message : String(error)),
			isError: true,
		};
	}
}

async function executePreparedToolCall(
	prepared: PreparedToolCall,
	signal: AbortSignal | undefined,
	emit: AgentEventSink,
): Promise<ExecutedToolCallOutcome> {
	// 工具执行过程中允许通过回调持续上报 partialResult。
	// 这些更新事件先被收集为 Promise，最后统一 await，保证所有 update 事件在 end 之前完成投递。
	const updateEvents: Promise<void>[] = [];

	try {
		// 只有 prepared 状态的 toolCall 才会走到真正 execute。
		// immediate error（工具不存在、参数错误、before hook block、abort）不会调用工具实现。
		const result = await prepared.tool.execute(
			prepared.toolCall.id,
			prepared.args as never,
			signal,
			(partialResult) => {
				updateEvents.push(
					Promise.resolve(
						emit({
							type: "tool_execution_update",
							toolCallId: prepared.toolCall.id,
							toolName: prepared.toolCall.name,
							args: prepared.toolCall.arguments,
							partialResult,
						}),
					),
				);
			},
		);
		await Promise.all(updateEvents);
		return { result, isError: false };
	} catch (error) {
		// 工具异常不会向外抛出，而是被折叠成普通错误结果，继续遵守统一 transcript 协议。
		await Promise.all(updateEvents);
		return {
			result: createErrorToolResult(error instanceof Error ? error.message : String(error)),
			isError: true,
		};
	}
}

async function finalizeExecutedToolCall(
	currentContext: AgentContext,
	assistantMessage: AssistantMessage,
	prepared: PreparedToolCall,
	executed: ExecutedToolCallOutcome,
	config: AgentLoopConfig,
	signal: AbortSignal | undefined,
): Promise<FinalizedToolCallOutcome> {
	// finalize 阶段是 execute 之后的最后一层包装：
	// - after hook 可以改写内容、details、terminate、isError；
	// - 最终产物仍然统一收束为 `FinalizedToolCallOutcome`。
	let result = executed.result;
	let isError = executed.isError;

	if (config.afterToolCall) {
		try {
			// after hook 常用于清洗结果、补充元数据、统一错误格式、决定是否 terminate。
			// 注意它看到的是工具执行后的结果；如果工具执行抛错，也会先被编码成错误 result 再进入这里。
			const afterResult = await config.afterToolCall(
				{
					assistantMessage,
					toolCall: prepared.toolCall,
					args: prepared.args,
					result,
					isError,
					context: currentContext,
				},
				signal,
			);
			if (afterResult) {
				result = {
					content: afterResult.content ?? result.content,
					details: afterResult.details ?? result.details,
					terminate: afterResult.terminate ?? result.terminate,
				};
				isError = afterResult.isError ?? isError;
			}
		} catch (error) {
			// 即使 after hook 自己抛错，也不要让 loop 崩掉，而是把它编码为工具错误结果。
			result = createErrorToolResult(error instanceof Error ? error.message : String(error));
			isError = true;
		}
	}

	return {
		toolCall: prepared.toolCall,
		result,
		isError,
	};
}

function createErrorToolResult(message: string): AgentToolResult<any> {
	// 统一错误编码：工具不存在、校验失败、abort、执行异常、after hook 异常，
	// 最终都收敛成相同结构的 `AgentToolResult`。
	return {
		content: [{ type: "text", text: message }],
		details: {},
	};
}

async function emitToolExecutionEnd(finalized: FinalizedToolCallOutcome, emit: AgentEventSink): Promise<void> {
	// `tool_execution_end` 描述的是“执行生命周期结束”，还不是 transcript 已提交。
	// transcript 提交发生在随后的 `emitToolResultMessage()` 中。
	await emit({
		type: "tool_execution_end",
		toolCallId: finalized.toolCall.id,
		toolName: finalized.toolCall.name,
		result: finalized.result,
		isError: finalized.isError,
	});
}

function createToolResultMessage(finalized: FinalizedToolCallOutcome): ToolResultMessage {
	// 把 finalized 工具结果编码成 transcript 中正式可见的 `toolResult` message。
	// assistant 下一轮继续推理时看到的就是这类消息，而不是内部的执行对象。
	return {
		role: "toolResult",
		toolCallId: finalized.toolCall.id,
		toolName: finalized.toolCall.name,
		content: finalized.result.content,
		details: finalized.result.details,
		isError: finalized.isError,
		timestamp: Date.now(),
	};
}

async function emitToolResultMessage(toolResultMessage: ToolResultMessage, emit: AgentEventSink): Promise<void> {
	// 对 transcript 来说，toolResult 与 user/assistant 一样，也是标准 message 生命周期：
	// start -> end。这里只是没有 streaming update 过程。
	await emit({ type: "message_start", message: toolResultMessage });
	await emit({ type: "message_end", message: toolResultMessage });
}
