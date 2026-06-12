import {
	type ImageContent,
	type Message,
	type Model,
	type SimpleStreamOptions,
	streamSimple,
	type TextContent,
	type ThinkingBudgets,
	type Transport,
} from "@earendil-works/pi-ai";
import { runAgentLoop, runAgentLoopContinue } from "./agent-loop.ts";
import type {
	AfterToolCallContext,
	AfterToolCallResult,
	AgentContext,
	AgentEvent,
	AgentLoopConfig,
	AgentLoopTurnUpdate,
	AgentMessage,
	AgentState,
	AgentTool,
	BeforeToolCallContext,
	BeforeToolCallResult,
	QueueMode,
	StreamFn,
	ToolExecutionMode,
} from "./types.ts";

export type { QueueMode } from "./types.ts";

/**
 * 默认的 transcript → LLM 消息转换函数。
 *
 * 默认策略非常克制：
 * - 只保留 provider 能直接理解的 `user` / `assistant` / `toolResult`；
 * - 不在这里做压缩、改写、摘要拼装等高级逻辑。
 *
 * 更复杂的上下文改写应通过 `transformContext` 或自定义 `convertToLlm` 注入。
 */
function defaultConvertToLlm(messages: AgentMessage[]): Message[] {
	return messages.filter(
		(message) => message.role === "user" || message.role === "assistant" || message.role === "toolResult",
	);
}

/**
 * 失败兜底消息的零 usage 占位值。
 *
 * 当 run 在 provider 之外、或还没拿到有效 usage 就失败时，
 * `handleRunFailure()` 会构造一条 assistant error message；那时 usage 只能用这组空值占位。
 */
const EMPTY_USAGE = {
	input: 0,
	output: 0,
	cacheRead: 0,
	cacheWrite: 0,
	totalTokens: 0,
	cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 },
};

/**
 * 构造 Agent 初始状态时使用的保底模型对象。
 *
 * 它不是一个真正可调用的模型，只是为了让状态在“尚未显式提供 model”时仍保持结构完整。
 */
const DEFAULT_MODEL = {
	id: "unknown",
	name: "unknown",
	api: "unknown",
	provider: "unknown",
	baseUrl: "",
	reasoning: false,
	input: [],
	cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
	contextWindow: 0,
	maxTokens: 0,
} satisfies Model<any>;

type MutableAgentState = Omit<AgentState, "isStreaming" | "streamingMessage" | "pendingToolCalls" | "errorMessage"> & {
	isStreaming: boolean;
	streamingMessage?: AgentMessage;
	pendingToolCalls: Set<string>;
	errorMessage?: string;
};

/**
 * 创建内部可变状态对象。
 *
 * 这里故意把 `tools` / `messages` 包装成 getter/setter：
 * - 读时返回当前内部数组；
 * - 写时复制顶层数组，避免外部把同一个数组引用直接塞进来后再悄悄原地修改。
 *
 * 它不是“深拷贝一切”，而是做了运行时最关键的顶层防御复制。
 */
function createMutableAgentState(
	initialState?: Partial<Omit<AgentState, "pendingToolCalls" | "isStreaming" | "streamingMessage" | "errorMessage">>,
): MutableAgentState {
	let tools = initialState?.tools?.slice() ?? [];
	let messages = initialState?.messages?.slice() ?? [];

	return {
		systemPrompt: initialState?.systemPrompt ?? "",
		model: initialState?.model ?? DEFAULT_MODEL,
		thinkingLevel: initialState?.thinkingLevel ?? "off",
		get tools() {
			return tools;
		},
		set tools(nextTools: AgentTool<any>[]) {
			tools = nextTools.slice();
		},
		get messages() {
			return messages;
		},
		set messages(nextMessages: AgentMessage[]) {
			messages = nextMessages.slice();
		},
		isStreaming: false,
		streamingMessage: undefined,
		pendingToolCalls: new Set<string>(),
		errorMessage: undefined,
	};
}

/** Options for constructing an {@link Agent}. */
export interface AgentOptions {
	initialState?: Partial<Omit<AgentState, "pendingToolCalls" | "isStreaming" | "streamingMessage" | "errorMessage">>;
	convertToLlm?: (messages: AgentMessage[]) => Message[] | Promise<Message[]>;
	transformContext?: (messages: AgentMessage[], signal?: AbortSignal) => Promise<AgentMessage[]>;
	streamFn?: StreamFn;
	getApiKey?: (provider: string) => Promise<string | undefined> | string | undefined;
	onPayload?: SimpleStreamOptions["onPayload"];
	onResponse?: SimpleStreamOptions["onResponse"];
	beforeToolCall?: (context: BeforeToolCallContext, signal?: AbortSignal) => Promise<BeforeToolCallResult | undefined>;
	afterToolCall?: (context: AfterToolCallContext, signal?: AbortSignal) => Promise<AfterToolCallResult | undefined>;
	prepareNextTurn?: (
		signal?: AbortSignal,
	) => Promise<AgentLoopTurnUpdate | undefined> | AgentLoopTurnUpdate | undefined;
	steeringMode?: QueueMode;
	followUpMode?: QueueMode;
	sessionId?: string;
	thinkingBudgets?: ThinkingBudgets;
	transport?: Transport;
	maxRetryDelayMs?: number;
	toolExecution?: ToolExecutionMode;
}

/**
 * 一个很小但很关键的消息队列实现。
 *
 * 这套队列同时服务于：
 * - steering：在当前 run 的安全点，把新的 user 侧指令插入下一轮 assistant 请求前；
 * - follow-up：当 agent 原本要停时，再补一批“收尾/接力”消息。
 *
 * `mode` 决定 drain 行为：
 * - `all`：一次取空；
 * - `one-at-a-time`：每次只取一条，便于更细粒度地穿插 turn。
 */
class PendingMessageQueue {
	private messages: AgentMessage[] = [];
	public mode: QueueMode;

	constructor(mode: QueueMode) {
		this.mode = mode;
	}

	/** 仅入队，不触发即时执行；真正消费发生在 low-level loop 的安全 drain 点。 */
	enqueue(message: AgentMessage): void {
		this.messages.push(message);
	}

	hasItems(): boolean {
		return this.messages.length > 0;
	}

	/**
	 * 根据当前 queue mode 提取待消费消息。
	 *
	 * 注意这里是 destructive drain：
	 * - 被取出的消息会从队列里移除；
	 * - 因此调用方必须只在真正准备消费的安全点调用它。
	 */
	drain(): AgentMessage[] {
		if (this.mode === "all") {
			const drained = this.messages.slice();
			this.messages = [];
			return drained;
		}

		const first = this.messages[0];
		if (!first) {
			return [];
		}
		this.messages = this.messages.slice(1);
		return [first];
	}

	clear(): void {
		this.messages = [];
	}
}

type ActiveRun = {
	promise: Promise<void>;
	resolve: () => void;
	abortController: AbortController;
};

/**
 * `Agent` 是 low-level loop 之上的有状态包装层。
 *
 * 它的职责不是替代 `runAgentLoop()`，而是把“运行时拥有者”需要承担的状态集中起来：
 * - 持有当前 transcript 与工具列表；
 * - 维护 activeRun / abortController / streamingMessage / pendingToolCalls；
 * - 对外暴露 `prompt()` / `continue()` / `steer()` / `followUp()` 等 API；
 * - 把 low-level loop 的事件归约回本地状态，并转发给订阅者。
 *
 * 可以把它理解成：
 * - `agent-loop.ts` 负责“如何跑一轮循环”；
 * - `agent.ts` 负责“谁拥有这次运行，以及如何把运行折叠回可观察状态”。
 */
export class Agent {
	private _state: MutableAgentState;
	private readonly listeners = new Set<(event: AgentEvent, signal: AbortSignal) => Promise<void> | void>();
	private readonly steeringQueue: PendingMessageQueue;
	private readonly followUpQueue: PendingMessageQueue;

	public convertToLlm: (messages: AgentMessage[]) => Message[] | Promise<Message[]>;
	public transformContext?: (messages: AgentMessage[], signal?: AbortSignal) => Promise<AgentMessage[]>;
	public streamFn: StreamFn;
	public getApiKey?: (provider: string) => Promise<string | undefined> | string | undefined;
	public onPayload?: SimpleStreamOptions["onPayload"];
	public onResponse?: SimpleStreamOptions["onResponse"];
	public beforeToolCall?: (
		context: BeforeToolCallContext,
		signal?: AbortSignal,
	) => Promise<BeforeToolCallResult | undefined>;
	public afterToolCall?: (
		context: AfterToolCallContext,
		signal?: AbortSignal,
	) => Promise<AfterToolCallResult | undefined>;
	public prepareNextTurn?: (
		signal?: AbortSignal,
	) => Promise<AgentLoopTurnUpdate | undefined> | AgentLoopTurnUpdate | undefined;
	private activeRun?: ActiveRun;
	/** Session identifier forwarded to providers for cache-aware backends. */
	public sessionId?: string;
	/** Optional per-level thinking token budgets forwarded to the stream function. */
	public thinkingBudgets?: ThinkingBudgets;
	/** Preferred transport forwarded to the stream function. */
	public transport: Transport;
	/** Optional cap for provider-requested retry delays. */
	public maxRetryDelayMs?: number;
	/** Tool execution strategy for assistant messages that contain multiple tool calls. */
	public toolExecution: ToolExecutionMode;

	constructor(options: AgentOptions = {}) {
		// 构造函数只做“装配”，不启动任何 run。
		// 真正的执行入口是 `prompt()` / `continue()`。
		this._state = createMutableAgentState(options.initialState);
		this.convertToLlm = options.convertToLlm ?? defaultConvertToLlm;
		this.transformContext = options.transformContext;
		this.streamFn = options.streamFn ?? streamSimple;
		this.getApiKey = options.getApiKey;
		this.onPayload = options.onPayload;
		this.onResponse = options.onResponse;
		this.beforeToolCall = options.beforeToolCall;
		this.afterToolCall = options.afterToolCall;
		this.prepareNextTurn = options.prepareNextTurn;
		this.steeringQueue = new PendingMessageQueue(options.steeringMode ?? "one-at-a-time");
		this.followUpQueue = new PendingMessageQueue(options.followUpMode ?? "one-at-a-time");
		this.sessionId = options.sessionId;
		this.thinkingBudgets = options.thinkingBudgets;
		this.transport = options.transport ?? "auto";
		this.maxRetryDelayMs = options.maxRetryDelayMs;
		this.toolExecution = options.toolExecution ?? "parallel";
	}

	/**
	 * 订阅 agent 生命周期事件。
	 *
	 * 这里有一个很重要的语义：listener 不只是“旁路观察者”，它们的 Promise 也属于
	 * 当前 run 的 settlement 范围。也就是说：
	 * - 事件按订阅顺序依次 await；
	 * - `agent_end` 发出后，只有所有 listener 都 settle，Agent 才真正变 idle。
	 *
	 * 这种设计让外层 UI、持久化、hook 系统可以可靠地把“事件处理完成”纳入 run 完成语义。
	 */
	subscribe(listener: (event: AgentEvent, signal: AbortSignal) => Promise<void> | void): () => void {
		this.listeners.add(listener);
		return () => this.listeners.delete(listener);
	}

	/**
	 * 当前 Agent 视角下的运行状态。
	 *
	 * 注意：`state` 是内部状态对象本身，而不是一次性快照。
	 * 但对 `state.tools` / `state.messages` 的重新赋值会复制顶层数组，减少共享引用带来的意外修改。
	 */
	get state(): AgentState {
		return this._state;
	}

	/** 控制 steering queue 每次 drain 一条还是全部。 */
	set steeringMode(mode: QueueMode) {
		this.steeringQueue.mode = mode;
	}

	get steeringMode(): QueueMode {
		return this.steeringQueue.mode;
	}

	/** 控制 follow-up queue 每次 drain 一条还是全部。 */
	set followUpMode(mode: QueueMode) {
		this.followUpQueue.mode = mode;
	}

	get followUpMode(): QueueMode {
		return this.followUpQueue.mode;
	}

	/**
	 * 将消息放入 steering queue。
	 *
	 * 这不是立即打断当前 provider 请求，而是在当前 turn 结束后的安全点，
	 * 作为“下一轮 assistant 请求前的额外 user 侧输入”被注入。
	 */
	steer(message: AgentMessage): void {
		this.steeringQueue.enqueue(message);
	}

	/**
	 * 将消息放入 follow-up queue。
	 *
	 * 与 steering 的差别在于：follow-up 只有当 low-level loop 本来要停止时才会被消费，
	 * 适合“收尾再做一点事”“串行追加下一小段任务”这类语义。
	 */
	followUp(message: AgentMessage): void {
		this.followUpQueue.enqueue(message);
	}

	/** Remove all queued steering messages. */
	clearSteeringQueue(): void {
		this.steeringQueue.clear();
	}

	/** Remove all queued follow-up messages. */
	clearFollowUpQueue(): void {
		this.followUpQueue.clear();
	}

	/** Remove all queued steering and follow-up messages. */
	clearAllQueues(): void {
		this.clearSteeringQueue();
		this.clearFollowUpQueue();
	}

	/** 只要 steering / follow-up 任一队列非空，就返回 true。 */
	hasQueuedMessages(): boolean {
		return this.steeringQueue.hasItems() || this.followUpQueue.hasItems();
	}

	/** 当前活跃 run 的 abort signal；没有活跃 run 时返回 undefined。 */
	get signal(): AbortSignal | undefined {
		return this.activeRun?.abortController.signal;
	}

	/**
	 * 中止当前 run。
	 *
	 * 这里只负责触发 `AbortController.abort()`；真正的收尾、失败编码、状态清理由
	 * low-level loop 与 `runWithLifecycle()` 的 finally 路径完成。
	 */
	abort(): void {
		this.activeRun?.abortController.abort();
	}

	/**
	 * 在当前 run 完整 settle 后 resolve。
	 *
	 * 这里强调的是“完整 settle”，不是仅仅“provider 已返回”。
	 * 它会等到：
	 * - low-level loop 发完事件；
	 * - `agent_end` 相关 listeners settle；
	 * - `finishRun()` 清空 runtime-owned 状态。
	 */
	waitForIdle(): Promise<void> {
		return this.activeRun?.promise ?? Promise.resolve();
	}

	/**
	 * 重置 transcript、运行时临时状态和所有队列。
	 *
	 * 这是本地状态清空，不会触发一轮新的 loop，也不会给订阅者补发回滚事件。
	 */
	reset(): void {
		this._state.messages = [];
		this._state.isStreaming = false;
		this._state.streamingMessage = undefined;
		this._state.pendingToolCalls = new Set<string>();
		this._state.errorMessage = undefined;
		this.clearFollowUpQueue();
		this.clearSteeringQueue();
	}

	/**
	 * 启动一次新的 prompt。
	 *
	 * 支持三种输入形态：
	 * - string：最常见的用户文本输入；
	 * - 单条 `AgentMessage`；
	 * - 一批 `AgentMessage`，适合更底层或更高级的调用方。
	 */
	async prompt(message: AgentMessage | AgentMessage[]): Promise<void>;
	async prompt(input: string, images?: ImageContent[]): Promise<void>;
	async prompt(input: string | AgentMessage | AgentMessage[], images?: ImageContent[]): Promise<void> {
		if (this.activeRun) {
			throw new Error(
				"Agent is already processing a prompt. Use steer() or followUp() to queue messages, or wait for completion.",
			);
		}
		// `normalizePromptInput()` 负责把多种输入形态统一折叠成标准 `AgentMessage[]`。
		const messages = this.normalizePromptInput(input, images);
		await this.runPromptMessages(messages);
	}

	/**
	 * 从当前 transcript 继续执行。
	 *
	 * 这里对末尾消息角色有严格约束：
	 * - 如果最后一条是 user / toolResult，则可以直接 `runContinuation()`；
	 * - 如果最后一条是 assistant，则说明还缺少新的触发输入，必须优先尝试消费 steering / follow-up；
	 * - 如果 assistant 结尾且两个队列都空，就会抛错，拒绝非法继续。
	 */
	async continue(): Promise<void> {
		if (this.activeRun) {
			throw new Error("Agent is already processing. Wait for completion before continuing.");
		}

		const lastMessage = this._state.messages[this._state.messages.length - 1];
		if (!lastMessage) {
			throw new Error("No messages to continue from");
		}

		if (lastMessage.role === "assistant") {
			// 先尝试 steering：这是“当前 run 中途纠偏”的最高优先级继续路径。
			const queuedSteering = this.steeringQueue.drain();
			if (queuedSteering.length > 0) {
				await this.runPromptMessages(queuedSteering, { skipInitialSteeringPoll: true });
				return;
			}

			// steering 没有时，再尝试 follow-up：这是“本来要停时继续接力”的路径。
			const queuedFollowUps = this.followUpQueue.drain();
			if (queuedFollowUps.length > 0) {
				await this.runPromptMessages(queuedFollowUps);
				return;
			}

			throw new Error("Cannot continue from message role: assistant");
		}

		await this.runContinuation();
	}

	private normalizePromptInput(
		input: string | AgentMessage | AgentMessage[],
		images?: ImageContent[],
	): AgentMessage[] {
		// 批量消息直接原样返回，调用方已显式提供结构化 transcript 片段。
		if (Array.isArray(input)) {
			return input;
		}

		// 单条结构化消息包一层数组即可。
		if (typeof input !== "string") {
			return [input];
		}

		// 纯文本输入会被规范化为一条 user message；附带图片时一起放进 content 数组。
		const content: Array<TextContent | ImageContent> = [{ type: "text", text: input }];
		if (images && images.length > 0) {
			content.push(...images);
		}
		return [{ role: "user", content, timestamp: Date.now() }];
	}

	private async runPromptMessages(
		messages: AgentMessage[],
		options: { skipInitialSteeringPoll?: boolean } = {},
	): Promise<void> {
		// 所有 run 入口最终都汇聚到 `runWithLifecycle()`，由它统一接管 activeRun、abort、失败与清理语义。
		await this.runWithLifecycle(async (signal) => {
			await runAgentLoop(
				messages,
				this.createContextSnapshot(),
				this.createLoopConfig(options),
				(event) => this.processEvents(event),
				signal,
				this.streamFn,
			);
		});
	}

	private async runContinuation(): Promise<void> {
		// continue 场景不追加消息，只把当前快照直接交给 low-level loop。
		await this.runWithLifecycle(async (signal) => {
			await runAgentLoopContinue(
				this.createContextSnapshot(),
				this.createLoopConfig(),
				(event) => this.processEvents(event),
				signal,
				this.streamFn,
			);
		});
	}

	private createContextSnapshot(): AgentContext {
		// 这里返回的是“用于本次 run 的快照”，不是 live 绑定。
		// 这样低层 loop 可以安全地在自己的工作上下文里 push message，而不会直接共享外层数组引用。
		//
		// tools 也只复制当前 active tools：AgentSession.setActiveToolsByName() 写入的工具才会出现在这里，
		// 也才会在下一次 provider 请求中暴露给模型。registry 中存在但未启用的工具不会进入本次上下文。
		return {
			systemPrompt: this._state.systemPrompt,
			messages: this._state.messages.slice(),
			tools: this._state.tools.slice(),
		};
	}

	private createLoopConfig(options: { skipInitialSteeringPoll?: boolean } = {}): AgentLoopConfig {
		let skipInitialSteeringPoll = options.skipInitialSteeringPoll === true;
		return {
			model: this._state.model,
			reasoning: this._state.thinkingLevel === "off" ? undefined : this._state.thinkingLevel,
			sessionId: this.sessionId,
			onPayload: this.onPayload,
			onResponse: this.onResponse,
			transport: this.transport,
			thinkingBudgets: this.thinkingBudgets,
			maxRetryDelayMs: this.maxRetryDelayMs,
			toolExecution: this.toolExecution,
			// 工具调用前后 hook 由上层应用安装。coding-agent 的 AgentSession 会把它们接到
			// extension 的 tool_call/tool_result 事件上；agent-core 只负责在正确生命周期调用。
			beforeToolCall: this.beforeToolCall,
			afterToolCall: this.afterToolCall,
			// `prepareNextTurn` 通过闭包在真正调用时读取当前 signal，
			// 避免把旧 run 的 signal 提前捕获进去。
			prepareNextTurn: this.prepareNextTurn ? async () => await this.prepareNextTurn?.(this.signal) : undefined,
			convertToLlm: this.convertToLlm,
			transformContext: this.transformContext,
			getApiKey: this.getApiKey,
			getSteeringMessages: async () => {
				// 特殊开关：某些 continue 分支已经手动 drain 过 steering，
				// 这时要跳过 low-level loop 启动时的首次 steering poll，避免重复消费。
				if (skipInitialSteeringPoll) {
					skipInitialSteeringPoll = false;
					return [];
				}
				return this.steeringQueue.drain();
			},
			getFollowUpMessages: async () => this.followUpQueue.drain(),
		};
	}

	private async runWithLifecycle(executor: (signal: AbortSignal) => Promise<void>): Promise<void> {
		// 整个 Agent 的运行时生命周期闸门：同一时刻只允许一个活跃 run。
		if (this.activeRun) {
			throw new Error("Agent is already processing.");
		}

		const abortController = new AbortController();
		// `waitForIdle()` 依赖这对 promise/resolve 来感知“完整 run settlement”。
		let resolvePromise = () => {};
		const promise = new Promise<void>((resolve) => {
			resolvePromise = resolve;
		});
		this.activeRun = { promise, resolve: resolvePromise, abortController };

		// 进入运行态：streaming 打开，旧的 streamingMessage 与 errorMessage 清空。
		this._state.isStreaming = true;
		this._state.streamingMessage = undefined;
		this._state.errorMessage = undefined;

		try {
			await executor(abortController.signal);
		} catch (error) {
			// 任何未被 low-level loop 自行编码的错误，最终都会被包装成 assistant error message，
			// 保证 transcript 与事件语义一致。
			await this.handleRunFailure(error, abortController.signal.aborted);
		} finally {
			// 无论成功、失败还是 abort，最后都必须通过 `finishRun()` 回到 idle 态。
			this.finishRun();
		}
	}

	private async handleRunFailure(error: unknown, aborted: boolean): Promise<void> {
		// 这里不是简单地记录日志，而是主动合成一条 assistant message，
		// 让“失败”也走完整的 message/turn/agent 生命周期。
		const failureMessage = {
			role: "assistant",
			content: [{ type: "text", text: "" }],
			api: this._state.model.api,
			provider: this._state.model.provider,
			model: this._state.model.id,
			usage: EMPTY_USAGE,
			stopReason: aborted ? "aborted" : "error",
			errorMessage: error instanceof Error ? error.message : String(error),
			timestamp: Date.now(),
		} satisfies AgentMessage;
		await this.processEvents({ type: "message_start", message: failureMessage });
		await this.processEvents({ type: "message_end", message: failureMessage });
		await this.processEvents({ type: "turn_end", message: failureMessage, toolResults: [] });
		await this.processEvents({ type: "agent_end", messages: [failureMessage] });
	}

	private finishRun(): void {
		// `agent_end` 之后真正清空运行态的位置在这里，而不是发事件的瞬间。
		// 这保证了 listener settlement 仍处在“active run”上下文中。
		this._state.isStreaming = false;
		this._state.streamingMessage = undefined;
		this._state.pendingToolCalls = new Set<string>();
		this.activeRun?.resolve();
		this.activeRun = undefined;
	}

	/**
	 * 对 low-level loop 事件做本地状态归约，然后再按顺序 await 所有 listener。
	 *
	 * 这里的顺序很重要：
	 * 1. 先把 Agent 本地状态更新到与事件一致；
	 * 2. 再把这个“已归约后的状态”暴露给 listeners；
	 * 3. listeners 结束后，run 才继续进入下一步。
	 *
	 * 因此 `processEvents()` 本质上既是状态 reducer，也是生命周期同步点。
	 */
	private async processEvents(event: AgentEvent): Promise<void> {
		switch (event.type) {
			case "message_start":
				// assistant / user / toolResult 的 message_start 都会先体现在 streamingMessage 上。
				this._state.streamingMessage = event.message;
				break;

			case "message_update":
				// 只有 assistant streaming 期间会持续更新。
				this._state.streamingMessage = event.message;
				break;

			case "message_end":
				// 一条消息正式落地 transcript 的时刻。
				this._state.streamingMessage = undefined;
				this._state.messages.push(event.message);
				break;

			case "tool_execution_start": {
				// 使用新的 Set 引用而不是原地 mutate，便于依赖引用变更的上层观察者感知更新。
				const pendingToolCalls = new Set(this._state.pendingToolCalls);
				pendingToolCalls.add(event.toolCallId);
				this._state.pendingToolCalls = pendingToolCalls;
				break;
			}

			case "tool_execution_end": {
				// 工具一旦结束，就从 pending 集合移除；至于 transcript 中的 toolResult 提交，
				// 会由后续 message_start/message_end 单独表示。
				const pendingToolCalls = new Set(this._state.pendingToolCalls);
				pendingToolCalls.delete(event.toolCallId);
				this._state.pendingToolCalls = pendingToolCalls;
				break;
			}

			case "turn_end":
				// 只有 assistant error message 才会把 `errorMessage` 显式投射到 Agent state。
				if (event.message.role === "assistant" && event.message.errorMessage) {
					this._state.errorMessage = event.message.errorMessage;
				}
				break;

			case "agent_end":
				// `agent_end` 只是说明 low-level loop 不会再发新事件；
				// 真正 idle 仍要等 listeners 以及 `finishRun()`。
				this._state.streamingMessage = undefined;
				break;
		}

		const signal = this.activeRun?.abortController.signal;
		if (!signal) {
			throw new Error("Agent listener invoked outside active run");
		}
		for (const listener of this.listeners) {
			await listener(event, signal);
		}
	}
}
