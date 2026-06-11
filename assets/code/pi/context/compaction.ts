/**
 * 长 session 的上下文压缩（compaction）实现。
 *
 * 这个文件只负责“纯逻辑层”的压缩决策与摘要生成，不负责 session 文件的落盘：
 * - SessionManager 负责把 append-only tree 持久化到 JSONL；
 * - 本文件负责决定“从哪里切”、“哪些消息被总结”、“summary 怎么生成”；
 * - 压缩完成后，SessionManager 会把 compaction entry 追加进树，然后重新加载上下文。
 *
 * 可以把它理解成：
 * 1. 先根据 keepRecentTokens 找到应该保留的尾部边界；
 * 2. 将边界之前的历史消息总结成 summary；
 * 3. 后续 buildSessionContext() 不再直接送入那些旧消息，而是送入：
 *    compaction summary + firstKeptEntryId 之后的保留消息。
 */

import type { AgentMessage, StreamFn, ThinkingLevel } from "@earendil-works/pi-agent-core";
import type { AssistantMessage, Context, Model, SimpleStreamOptions, Usage } from "@earendil-works/pi-ai";
import { completeSimple } from "@earendil-works/pi-ai";
import {
	convertToLlm,
	createBranchSummaryMessage,
	createCompactionSummaryMessage,
	createCustomMessage,
} from "../messages.ts";
import { buildSessionContext, type CompactionEntry, type SessionEntry } from "../session-manager.ts";
import {
	computeFileLists,
	createFileOps,
	extractFileOpsFromMessage,
	type FileOperations,
	formatFileOperations,
	SUMMARIZATION_SYSTEM_PROMPT,
	serializeConversation,
} from "./utils.ts";

// ============================================================================
// File Operation Tracking
// ============================================================================

/**
 * 默认写入 CompactionEntry.details 的结构。
 *
 * 这里不是“压缩算法本身”的必要字段，而是 Pi 默认实现附带保存的辅助信息：
 * 用于告诉后续模型/用户，这段被总结的历史里读过哪些文件、改过哪些文件。
 */
export interface CompactionDetails {
	readFiles: string[];
	modifiedFiles: string[];
}

/**
 * 从待总结消息中提取文件操作，并与上一次 compaction 累积的文件列表合并。
 *
 * 设计意图：
 * - file tracking 不是只看“本次被总结的消息”；
 * - 如果之前已经做过 compaction，那么上一轮 summary 中的文件操作也要延续下来；
 * - 这样多轮 compaction 之后，summary 仍然能保留完整的文件工作脉络。
 */
function extractFileOperations(
	messages: AgentMessage[],
	entries: SessionEntry[],
	prevCompactionIndex: number,
): FileOperations {
	const fileOps = createFileOps();

	// Collect from previous compaction's details (if pi-generated)
	if (prevCompactionIndex >= 0) {
		const prevCompaction = entries[prevCompactionIndex] as CompactionEntry;
		if (!prevCompaction.fromHook && prevCompaction.details) {
			// fromHook field kept for session file compatibility
			const details = prevCompaction.details as CompactionDetails;
			if (Array.isArray(details.readFiles)) {
				for (const f of details.readFiles) fileOps.read.add(f);
			}
			if (Array.isArray(details.modifiedFiles)) {
				for (const f of details.modifiedFiles) fileOps.edited.add(f);
			}
		}
	}

	// Extract from tool calls in messages
	for (const msg of messages) {
		extractFileOpsFromMessage(msg, fileOps);
	}

	return fileOps;
}

// ============================================================================
// Message Extraction
// ============================================================================

/**
 * Extract AgentMessage from an entry if it produces one.
 * Returns undefined for entries that don't contribute to LLM context.
 */
function getMessageFromEntry(entry: SessionEntry): AgentMessage | undefined {
	// 这里做的是“entry -> 可进入 LLM 上下文的消息”的投影。
	// 注意：session tree 里不是所有 entry 都是消息；有些只是控制态或持久化元数据。
	if (entry.type === "message") {
		return entry.message;
	}
	if (entry.type === "custom_message") {
		return createCustomMessage(entry.customType, entry.content, entry.display, entry.details, entry.timestamp);
	}
	if (entry.type === "branch_summary") {
		return createBranchSummaryMessage(entry.summary, entry.fromId, entry.timestamp);
	}
	if (entry.type === "compaction") {
		return createCompactionSummaryMessage(entry.summary, entry.tokensBefore, entry.timestamp);
	}
	return undefined;
}

/**
 * compaction 过程在“准备待总结消息”时，会刻意跳过已有 compaction entry。
 *
 * 原因：
 * - 旧 compaction 的 summary 会通过 previousSummary 参与下一轮增量更新；
 * - 如果这里再把 compaction entry 转成消息塞回去，就会造成 summary 自我重复引用。
 */
function getMessageFromEntryForCompaction(entry: SessionEntry): AgentMessage | undefined {
	if (entry.type === "compaction") {
		return undefined;
	}
	return getMessageFromEntry(entry);
}

/**
 * compact() 的输出结果。
 * 真正写入 session tree 时，SessionManager 还会补上新的 entry id / parentId 并负责 append。
 */
export interface CompactionResult<T = unknown> {
	summary: string;
	firstKeptEntryId: string;
	tokensBefore: number;
	/** Extension-specific data (e.g., ArtifactIndex, version markers for structured compaction) */
	details?: T;
}

// ============================================================================
// Types
// ============================================================================

export interface CompactionSettings {
	enabled: boolean;
	reserveTokens: number;
	keepRecentTokens: number;
}

export const DEFAULT_COMPACTION_SETTINGS: CompactionSettings = {
	enabled: true,
	reserveTokens: 16384,
	keepRecentTokens: 20000,
};

// ============================================================================
// Token calculation
// ============================================================================

/**
 * 从 provider usage 中计算上下文 token 数。
 *
 * 优先使用模型原生返回的 totalTokens；
 * 如果某些 provider 没有提供 totalTokens，则退化为 input/output/cacheRead/cacheWrite 的求和。
 */
export function calculateContextTokens(usage: Usage): number {
	return usage.totalTokens || usage.input + usage.output + usage.cacheRead + usage.cacheWrite;
}

/**
 * 从 assistant 消息中提取 usage。
 *
 * 被 aborted / error 终止的响应不作为可靠 usage 来源，
 * 因为这类消息往往没有完整、可复用的 token 统计。
 */
function getAssistantUsage(msg: AgentMessage): Usage | undefined {
	if (msg.role === "assistant" && "usage" in msg) {
		const assistantMsg = msg as AssistantMessage;
		if (assistantMsg.stopReason !== "aborted" && assistantMsg.stopReason !== "error" && assistantMsg.usage) {
			return assistantMsg.usage;
		}
	}
	return undefined;
}

/**
 * Find the last non-aborted assistant message usage from session entries.
 */
export function getLastAssistantUsage(entries: SessionEntry[]): Usage | undefined {
	for (let i = entries.length - 1; i >= 0; i--) {
		const entry = entries[i];
		if (entry.type === "message") {
			const usage = getAssistantUsage(entry.message);
			if (usage) return usage;
		}
	}
	return undefined;
}

export interface ContextUsageEstimate {
	tokens: number;
	usageTokens: number;
	trailingTokens: number;
	lastUsageIndex: number | null;
}

function getLastAssistantUsageInfo(messages: AgentMessage[]): { usage: Usage; index: number } | undefined {
	for (let i = messages.length - 1; i >= 0; i--) {
		const usage = getAssistantUsage(messages[i]);
		if (usage) return { usage, index: i };
	}
	return undefined;
}

/**
 * 估算当前消息序列占用的上下文 token。
 *
 * 核心策略：
 * - 如果最近一条 assistant 响应带有 usage，那么它天然包含“到那一刻为止”的真实上下文 token 统计；
 * - 只需要对那之后新增的 trailing messages 再做 heuristic 估算；
 * - 如果完全没有 usage，可退化为对全部消息逐条 estimateTokens()。
 *
 * 这样既尽量利用真实统计数据，又能兼容还没拿到 usage 的消息尾部。
 */
export function estimateContextTokens(messages: AgentMessage[]): ContextUsageEstimate {
	const usageInfo = getLastAssistantUsageInfo(messages);

	if (!usageInfo) {
		let estimated = 0;
		for (const message of messages) {
			estimated += estimateTokens(message);
		}
		return {
			tokens: estimated,
			usageTokens: 0,
			trailingTokens: estimated,
			lastUsageIndex: null,
		};
	}

	const usageTokens = calculateContextTokens(usageInfo.usage);
	let trailingTokens = 0;
	for (let i = usageInfo.index + 1; i < messages.length; i++) {
		trailingTokens += estimateTokens(messages[i]);
	}

	return {
		tokens: usageTokens + trailingTokens,
		usageTokens,
		trailingTokens,
		lastUsageIndex: usageInfo.index,
	};
}

/**
 * Check if compaction should trigger based on context usage.
 */
export function shouldCompact(contextTokens: number, contextWindow: number, settings: CompactionSettings): boolean {
	if (!settings.enabled) return false;
	return contextTokens > contextWindow - settings.reserveTokens;
}

// ============================================================================
// Cut point detection
// ============================================================================

/**
 * 用字符数 / 4 的启发式方式估算单条消息 token 数。
 *
 * 这不是 tokenizer 级精确计算，而是“偏保守”的近似：
 * - 文本按 chars / 4 估；
 * - 图片按 4800 chars（约 1200 tokens）折算；
 * - assistant 的 thinking / toolCall 参数也计入，避免低估真实占用。
 *
 * 保守估计的目的，是让 compaction 更愿意提前触发，而不是等到真正超窗才处理。
 */
export function estimateTokens(message: AgentMessage): number {
	let chars = 0;

	switch (message.role) {
		case "user": {
			const content = (message as { content: string | Array<{ type: string; text?: string }> }).content;
			if (typeof content === "string") {
				chars = content.length;
			} else if (Array.isArray(content)) {
				for (const block of content) {
					if (block.type === "text" && block.text) {
						chars += block.text.length;
					}
				}
			}
			return Math.ceil(chars / 4);
		}
		case "assistant": {
			const assistant = message as AssistantMessage;
			for (const block of assistant.content) {
				if (block.type === "text") {
					chars += block.text.length;
				} else if (block.type === "thinking") {
					chars += block.thinking.length;
				} else if (block.type === "toolCall") {
					chars += block.name.length + JSON.stringify(block.arguments).length;
				}
			}
			return Math.ceil(chars / 4);
		}
		case "custom":
		case "toolResult": {
			if (typeof message.content === "string") {
				chars = message.content.length;
			} else {
				for (const block of message.content) {
					if (block.type === "text" && block.text) {
						chars += block.text.length;
					}
					if (block.type === "image") {
						// 图像没有直接文本长度，这里用固定成本近似，避免把多模态上下文严重低估。
						chars += 4800; // ≈ 1200 tokens
					}
				}
			}
			return Math.ceil(chars / 4);
		}
		case "bashExecution": {
			chars = message.command.length + message.output.length;
			return Math.ceil(chars / 4);
		}
		case "branchSummary":
		case "compactionSummary": {
			chars = message.summary.length;
			return Math.ceil(chars / 4);
		}
	}

	return 0;
}

/**
 * 找出“允许切分”的 entry 索引集合。
 *
 * 允许切分的位置本质上是“一个语义块的起点”：
 * - user / assistant / bashExecution / custom-like message 可以作为边界；
 * - toolResult 不能单独作为切点，因为它必须和触发它的 tool call 一起保留，
 *   否则保留下来的上下文会只剩结果、失去调用原因。
 *
 * 额外注意：
 * - branch_summary、custom_message 虽然不是普通 message entry，但语义上也属于可独立进入上下文的消息，
 *   因此也被视作合法 cut point。
 */
function findValidCutPoints(entries: SessionEntry[], startIndex: number, endIndex: number): number[] {
	const cutPoints: number[] = [];
	for (let i = startIndex; i < endIndex; i++) {
		const entry = entries[i];
		switch (entry.type) {
			case "message": {
				const role = entry.message.role;
				switch (role) {
					case "bashExecution":
					case "custom":
					case "branchSummary":
					case "compactionSummary":
					case "user":
					case "assistant":
						cutPoints.push(i);
						break;
					case "toolResult":
						break;
				}
				break;
			}
			case "thinking_level_change":
			case "model_change":
			case "compaction":
			case "branch_summary":
			case "custom":
			case "custom_message":
			case "label":
			case "session_info":
				break;
		}

		// branch_summary and custom_message are user-role messages, valid cut points
		if (entry.type === "branch_summary" || entry.type === "custom_message") {
			cutPoints.push(i);
		}
	}
	return cutPoints;
}

/**
 * 向前定位“当前 turn 的起点”。
 *
 * turn 的定义是：
 * 从 user / bashExecution / 可视作 user 侧输入的 branch_summary、custom_message 开始，
 * 到下一个 user 侧输入出现之前结束。
 *
 * 这个函数只在“cut 点落在 turn 中间”时使用，用来把 turn prefix 单独抽出来总结。
 */
export function findTurnStartIndex(entries: SessionEntry[], entryIndex: number, startIndex: number): number {
	for (let i = entryIndex; i >= startIndex; i--) {
		const entry = entries[i];
		// branch_summary and custom_message are user-role messages, can start a turn
		if (entry.type === "branch_summary" || entry.type === "custom_message") {
			return i;
		}
		if (entry.type === "message") {
			const role = entry.message.role;
			if (role === "user" || role === "bashExecution") {
				return i;
			}
		}
	}
	return -1;
}

export interface CutPointResult {
	/** Index of first entry to keep */
	firstKeptEntryIndex: number;
	/** Index of user message that starts the turn being split, or -1 if not splitting */
	turnStartIndex: number;
	/** Whether this cut splits a turn (cut point is not a user message) */
	isSplitTurn: boolean;
}

/**
 * 在 path entries 中找到“从哪里开始保留尾部”的切点。
 *
 * 算法思路：
 * 1. 从最新 entry 往回走，累计消息大小；
 * 2. 一旦累计值达到 keepRecentTokens，就说明“尾部预算”已经够了；
 * 3. 再把当前位置对齐到最近的合法 cut point；
 * 4. 最终返回 firstKeptEntryIndex。
 *
 * 这里的“切”不是把树裁掉，而是决定：
 * - cut 点之前的内容进入 summary；
 * - cut 点及之后的内容继续原样保留在运行时上下文中。
 *
 * 还要特别处理 split turn：
 * - 如果 cut 点不是 user 起点，而是落在 assistant / custom-like message 上，
 *   说明一个 turn 太大，大到必须在 turn 中间切；
 * - 此时需要找到 turnStartIndex，把这段 turn prefix 单独做摘要，保证语义连贯。
 */
export function findCutPoint(
	entries: SessionEntry[],
	startIndex: number,
	endIndex: number,
	keepRecentTokens: number,
): CutPointResult {
	const cutPoints = findValidCutPoints(entries, startIndex, endIndex);

	if (cutPoints.length === 0) {
		return { firstKeptEntryIndex: startIndex, turnStartIndex: -1, isSplitTurn: false };
	}

	// 从后往前累计“要原样保留”的尾部大小。
	let accumulatedTokens = 0;
	let cutIndex = cutPoints[0]; // Default: keep from first message (not header)

	for (let i = endIndex - 1; i >= startIndex; i--) {
		const entry = entries[i];
		if (entry.type !== "message") continue;

		// 这里只看 message entry 的估算大小；控制态 entry 不直接计入消息 token。
		const messageTokens = estimateTokens(entry.message);
		accumulatedTokens += messageTokens;

		// Check if we've exceeded the budget
		if (accumulatedTokens >= keepRecentTokens) {
			// Find the closest valid cut point at or after this entry
			for (let c = 0; c < cutPoints.length; c++) {
				if (cutPoints[c] >= i) {
					cutIndex = cutPoints[c];
					break;
				}
			}
			break;
		}
	}

	// 如果 cut 点前面紧挨着一些非消息 entry（例如 model/thinking 变化），
	// 也一并纳入 kept 区域，避免上下文从中间断开配置态。
	while (cutIndex > startIndex) {
		const prevEntry = entries[cutIndex - 1];
		// Stop at session header or compaction boundaries
		if (prevEntry.type === "compaction") {
			break;
		}
		if (prevEntry.type === "message") {
			// Stop if we hit any message
			break;
		}
		// Include this non-message entry (bash, settings change, etc.)
		cutIndex--;
	}

	// 如果 cut 点本身不是 user 起点，就可能是 split turn。
	const cutEntry = entries[cutIndex];
	const isUserMessage = cutEntry.type === "message" && cutEntry.message.role === "user";
	const turnStartIndex = isUserMessage ? -1 : findTurnStartIndex(entries, cutIndex, startIndex);

	return {
		firstKeptEntryIndex: cutIndex,
		turnStartIndex,
		isSplitTurn: !isUserMessage && turnStartIndex !== -1,
	};
}

// ============================================================================
// Summarization
// ============================================================================

const SUMMARIZATION_PROMPT = `The messages above are a conversation to summarize. Create a structured context checkpoint summary that another LLM will use to continue the work.

Use this EXACT format:

## Goal
[What is the user trying to accomplish? Can be multiple items if the session covers different tasks.]

## Constraints & Preferences
- [Any constraints, preferences, or requirements mentioned by user]
- [Or "(none)" if none were mentioned]

## Progress
### Done
- [x] [Completed tasks/changes]

### In Progress
- [ ] [Current work]

### Blocked
- [Issues preventing progress, if any]

## Key Decisions
- **[Decision]**: [Brief rationale]

## Next Steps
1. [Ordered list of what should happen next]

## Critical Context
- [Any data, examples, or references needed to continue]
- [Or "(none)" if not applicable]

Keep each section concise. Preserve exact file paths, function names, and error messages.`;

const UPDATE_SUMMARIZATION_PROMPT = `The messages above are NEW conversation messages to incorporate into the existing summary provided in <previous-summary> tags.

Update the existing structured summary with new information. RULES:
- PRESERVE all existing information from the previous summary
- ADD new progress, decisions, and context from the new messages
- UPDATE the Progress section: move items from "In Progress" to "Done" when completed
- UPDATE "Next Steps" based on what was accomplished
- PRESERVE exact file paths, function names, and error messages
- If something is no longer relevant, you may remove it

Use this EXACT format:

## Goal
[Preserve existing goals, add new ones if the task expanded]

## Constraints & Preferences
- [Preserve existing, add new ones discovered]

## Progress
### Done
- [x] [Include previously done items AND newly completed items]

### In Progress
- [ ] [Current work - update based on progress]

### Blocked
- [Current blockers - remove if resolved]

## Key Decisions
- **[Decision]**: [Brief rationale] (preserve all previous, add new)

## Next Steps
1. [Update based on current state]

## Critical Context
- [Preserve important context, add new if needed]

Keep each section concise. Preserve exact file paths, function names, and error messages.`;

function createSummarizationOptions(
	model: Model<any>,
	maxTokens: number,
	apiKey: string | undefined,
	headers: Record<string, string> | undefined,
	signal: AbortSignal | undefined,
	thinkingLevel: ThinkingLevel | undefined,
): SimpleStreamOptions {
	const options: SimpleStreamOptions = { maxTokens, signal, apiKey, headers };
	if (model.reasoning && thinkingLevel && thinkingLevel !== "off") {
		options.reasoning = thinkingLevel;
	}
	return options;
}

async function completeSummarization(
	model: Model<any>,
	context: Context,
	options: SimpleStreamOptions,
	streamFn?: StreamFn,
): Promise<AssistantMessage> {
	if (!streamFn) {
		return completeSimple(model, context, options);
	}
	const stream = await streamFn(model, context, options);
	return stream.result();
}

/**
 * 调用 LLM 为一段历史对话生成结构化摘要。
 *
 * 这是 compaction 的核心摘要函数，负责把“待压缩的消息序列”变成可重新注入上下文的 summary 文本。
 * 它既支持首轮总结，也支持在已有 summary 基础上做增量更新。
 *
 * 两种工作模式：
 * 1. 首次总结
 *    - 当 previousSummary 不存在时，使用 SUMMARIZATION_PROMPT；
 *    - 模型直接根据 currentMessages 生成一份新的结构化 checkpoint summary。
 *
 * 2. 增量更新
 *    - 当 previousSummary 存在时，使用 UPDATE_SUMMARIZATION_PROMPT；
 *    - 模型会把“旧 summary + 新消息”合并成一份更新后的 summary，
 *      而不是从零开始重写，借此实现滚动 compaction。
 *
 * 重要实现点：
 * - currentMessages 不会直接以“原始对话消息数组”形式喂给模型，
 *   而是先 convertToLlm()，再 serializeConversation() 序列化成纯文本；
 * - 这样做是为了明确告诉模型：这些内容是“待总结材料”，不是要继续续写的对话；
 * - previousSummary 会放进 <previous-summary> 标签中，让模型把它当作现有状态快照；
 * - customInstructions 不是替换默认模板，而是以 Additional focus 的形式附加，
 *   用来强调本次总结应额外关注的点；
 * - maxTokens 使用 reserveTokens 的 80% 作为上限，避免摘要本身把保留预算全部耗尽。
 *
 * 返回值：
 * - 返回纯文本 summary；
 * - 调用方（如 compact()）会再决定是否附加文件列表、如何写入 compaction entry。
 */
export async function generateSummary(
	currentMessages: AgentMessage[],
	model: Model<any>,
	reserveTokens: number,
	apiKey: string | undefined,
	headers?: Record<string, string>,
	signal?: AbortSignal,
	customInstructions?: string,
	previousSummary?: string,
	thinkingLevel?: ThinkingLevel,
	streamFn?: StreamFn,
): Promise<string> {
	const maxTokens = Math.min(
		Math.floor(0.8 * reserveTokens),
		model.maxTokens > 0 ? model.maxTokens : Number.POSITIVE_INFINITY,
	);

	// Use update prompt if we have a previous summary, otherwise initial prompt
	let basePrompt = previousSummary ? UPDATE_SUMMARIZATION_PROMPT : SUMMARIZATION_PROMPT;
	if (customInstructions) {
		basePrompt = `${basePrompt}\n\nAdditional focus: ${customInstructions}`;
	}

	// Serialize conversation to text so model doesn't try to continue it
	// Convert to LLM messages first (handles custom types like bashExecution, custom, etc.)
	const llmMessages = convertToLlm(currentMessages);
	const conversationText = serializeConversation(llmMessages);

	// Build the prompt with conversation wrapped in tags
	let promptText = `<conversation>\n${conversationText}\n</conversation>\n\n`;
	if (previousSummary) {
		promptText += `<previous-summary>\n${previousSummary}\n</previous-summary>\n\n`;
	}
	promptText += basePrompt;

	const summarizationMessages = [
		{
			role: "user" as const,
			content: [{ type: "text" as const, text: promptText }],
			timestamp: Date.now(),
		},
	];

	const completionOptions = createSummarizationOptions(model, maxTokens, apiKey, headers, signal, thinkingLevel);

	const response = await completeSummarization(
		model,
		{ systemPrompt: SUMMARIZATION_SYSTEM_PROMPT, messages: summarizationMessages },
		completionOptions,
		streamFn,
	);

	if (response.stopReason === "error") {
		throw new Error(`Summarization failed: ${response.errorMessage || "Unknown error"}`);
	}

	const textContent = response.content
		.filter((c): c is { type: "text"; text: string } => c.type === "text")
		.map((c) => c.text)
		.join("\n");

	return textContent;
}

// ============================================================================
// Compaction Preparation (for extensions)
// ============================================================================

export interface CompactionPreparation {
	/** UUID of first entry to keep */
	firstKeptEntryId: string;
	/** Messages that will be summarized and discarded */
	messagesToSummarize: AgentMessage[];
	/** Messages that will be turned into turn prefix summary (if splitting) */
	turnPrefixMessages: AgentMessage[];
	/** Whether this is a split turn (cut point in middle of turn) */
	isSplitTurn: boolean;
	tokensBefore: number;
	/** Summary from previous compaction, for iterative update */
	previousSummary?: string;
	/** File operations extracted from messagesToSummarize */
	fileOps: FileOperations;
	/** Compaction settions from settings.jsonl	*/
	settings: CompactionSettings;
}

export function prepareCompaction(
	pathEntries: SessionEntry[],
	settings: CompactionSettings,
): CompactionPreparation | undefined {
	// 防止连续在“已经是 compaction entry 的尾部”上再次 compaction。
	// 这种情况下新的 compaction 不会带来有效信息增量，反而容易制造重复 summary。
	if (pathEntries.length > 0 && pathEntries[pathEntries.length - 1].type === "compaction") {
		return undefined;
	}

	let prevCompactionIndex = -1;
	for (let i = pathEntries.length - 1; i >= 0; i--) {
		if (pathEntries[i].type === "compaction") {
			prevCompactionIndex = i;
			break;
		}
	}

	let previousSummary: string | undefined;
	let boundaryStart = 0;
	if (prevCompactionIndex >= 0) {
		const prevCompaction = pathEntries[prevCompactionIndex] as CompactionEntry;
		previousSummary = prevCompaction.summary;
		// 新一轮 compaction 不是从“上一个 compaction entry 自己”开始，而是从它当时保留的边界开始。
		// 这样上一轮保留下来的消息也能在下一轮被重新纳入总结，实现滚动更新。
		const firstKeptEntryIndex = pathEntries.findIndex((entry) => entry.id === prevCompaction.firstKeptEntryId);
		boundaryStart = firstKeptEntryIndex >= 0 ? firstKeptEntryIndex : prevCompactionIndex + 1;
	}
	const boundaryEnd = pathEntries.length;

	// tokensBefore 基于“真实可见上下文”计算，而不是简单对 pathEntries 求和。
	// 这样写入 compaction entry 的 token 统计，才能准确反映被这次 summary 替换掉的上下文规模。
	const tokensBefore = estimateContextTokens(buildSessionContext(pathEntries).messages).tokens;

	const cutPoint = findCutPoint(pathEntries, boundaryStart, boundaryEnd, settings.keepRecentTokens);

	// Get UUID of first kept entry
	const firstKeptEntry = pathEntries[cutPoint.firstKeptEntryIndex];
	if (!firstKeptEntry?.id) {
		return undefined; // Session needs migration
	}
	const firstKeptEntryId = firstKeptEntry.id;

	const historyEnd = cutPoint.isSplitTurn ? cutPoint.turnStartIndex : cutPoint.firstKeptEntryIndex;

	// history 部分：完整 turn 的历史，会被主 summary 吸收。
	const messagesToSummarize: AgentMessage[] = [];
	for (let i = boundaryStart; i < historyEnd; i++) {
		const msg = getMessageFromEntryForCompaction(pathEntries[i]);
		if (msg) messagesToSummarize.push(msg);
	}

	// split turn 部分：如果切点落在一个超大 turn 的中间，
	// 则把 turn 前缀单独抽出来做 turn-prefix summary。
	const turnPrefixMessages: AgentMessage[] = [];
	if (cutPoint.isSplitTurn) {
		for (let i = cutPoint.turnStartIndex; i < cutPoint.firstKeptEntryIndex; i++) {
			const msg = getMessageFromEntryForCompaction(pathEntries[i]);
			if (msg) turnPrefixMessages.push(msg);
		}
	}

	// 文件操作是累积语义的一部分，因此要和 previous compaction 的 details 合并。
	const fileOps = extractFileOperations(messagesToSummarize, pathEntries, prevCompactionIndex);

	// Also extract file ops from turn prefix if splitting
	if (cutPoint.isSplitTurn) {
		for (const msg of turnPrefixMessages) {
			extractFileOpsFromMessage(msg, fileOps);
		}
	}

	return {
		firstKeptEntryId,
		messagesToSummarize,
		turnPrefixMessages,
		isSplitTurn: cutPoint.isSplitTurn,
		tokensBefore,
		previousSummary,
		fileOps,
		settings,
	};
}

// ============================================================================
// Main compaction function
// ============================================================================

const TURN_PREFIX_SUMMARIZATION_PROMPT = `This is the PREFIX of a turn that was too large to keep. The SUFFIX (recent work) is retained.

Summarize the prefix to provide context for the retained suffix:

## Original Request
[What did the user ask for in this turn?]

## Early Progress
- [Key decisions and work done in the prefix]

## Context for Suffix
- [Information needed to understand the retained recent work]

Be concise. Focus on what's needed to understand the kept suffix.`;

/**
 * 根据 prepareCompaction() 的结果真正调用模型生成摘要。
 *
 * 主流程：
 * - 普通情况：只生成一份 history summary；
 * - split turn：并行生成 history summary + turn prefix summary，再合并成最终 summary；
 * - 最后再附加文件读写清单，作为对后继模型非常有价值的工作记忆。
 *
 * 返回的是“待写入 compaction entry 的 payload”，不是最终 session entry。
 */
export async function compact(
	preparation: CompactionPreparation,
	model: Model<any>,
	apiKey: string | undefined,
	headers?: Record<string, string>,
	customInstructions?: string,
	signal?: AbortSignal,
	thinkingLevel?: ThinkingLevel,
	streamFn?: StreamFn,
): Promise<CompactionResult> {
	const {
		firstKeptEntryId,
		messagesToSummarize,
		turnPrefixMessages,
		isSplitTurn,
		tokensBefore,
		previousSummary,
		fileOps,
		settings,
	} = preparation;

	// 真正昂贵的部分是 LLM summarization 调用。
	// split turn 场景下，两份 summary 相互独立，因此这里并行生成以降低总延迟。
	let summary: string;

	if (isSplitTurn && turnPrefixMessages.length > 0) {
		// 一份总结完整历史；另一份总结被切开的 turn 前半段。
		const [historyResult, turnPrefixResult] = await Promise.all([
			messagesToSummarize.length > 0
				? generateSummary(
						messagesToSummarize,
						model,
						settings.reserveTokens,
						apiKey,
						headers,
						signal,
						customInstructions,
						previousSummary,
						thinkingLevel,
						streamFn,
					)
				: Promise.resolve("No prior history."),
			generateTurnPrefixSummary(
				turnPrefixMessages,
				model,
				settings.reserveTokens,
				apiKey,
				headers,
				signal,
				thinkingLevel,
				streamFn,
			),
		]);
		// 最终仍落成单个 compaction summary，便于后续作为一条 compactionSummary message 注入上下文。
		summary = `${historyResult}\n\n---\n\n**Turn Context (split turn):**\n\n${turnPrefixResult}`;
	} else {
		// 常规路径：没有 split turn，只需要总结完整历史部分。
		summary = await generateSummary(
			messagesToSummarize,
			model,
			settings.reserveTokens,
			apiKey,
			headers,
			signal,
			customInstructions,
			previousSummary,
			thinkingLevel,
			streamFn,
		);
	}

	// 将文件级工作痕迹显式拼进 summary 末尾。
	// 这样即使原始工具调用已经被压缩掉，后续模型仍知道哪些文件被读过/改过。
	const { readFiles, modifiedFiles } = computeFileLists(fileOps);
	summary += formatFileOperations(readFiles, modifiedFiles);

	if (!firstKeptEntryId) {
		throw new Error("First kept entry has no UUID - session may need migration");
	}

	return {
		summary,
		firstKeptEntryId,
		tokensBefore,
		details: { readFiles, modifiedFiles } as CompactionDetails,
	};
}

/**
 * 为 split turn 的前缀生成补充摘要。
 *
 * 适用场景：
 * - 某一个 turn 太长，keepRecentTokens 无法完整保留；
 * - 系统决定保留该 turn 的后半段（suffix）；
 * - 那么需要把前半段（prefix）压成一小段“理解后半段所需的背景说明”。
 *
 * 注意这里给的 token budget 比普通 history summary 更小，
 * 因为它只是辅助解释 retained suffix，不需要覆盖整段历史。
 */
async function generateTurnPrefixSummary(
	messages: AgentMessage[],
	model: Model<any>,
	reserveTokens: number,
	apiKey: string | undefined,
	headers?: Record<string, string>,
	signal?: AbortSignal,
	thinkingLevel?: ThinkingLevel,
	streamFn?: StreamFn,
): Promise<string> {
	const maxTokens = Math.min(
		Math.floor(0.5 * reserveTokens),
		model.maxTokens > 0 ? model.maxTokens : Number.POSITIVE_INFINITY,
	); // Smaller budget for turn prefix
	const llmMessages = convertToLlm(messages);
	const conversationText = serializeConversation(llmMessages);
	const promptText = `<conversation>\n${conversationText}\n</conversation>\n\n${TURN_PREFIX_SUMMARIZATION_PROMPT}`;
	const summarizationMessages = [
		{
			role: "user" as const,
			content: [{ type: "text" as const, text: promptText }],
			timestamp: Date.now(),
		},
	];

	const response = await completeSummarization(
		model,
		{ systemPrompt: SUMMARIZATION_SYSTEM_PROMPT, messages: summarizationMessages },
		createSummarizationOptions(model, maxTokens, apiKey, headers, signal, thinkingLevel),
		streamFn,
	);

	if (response.stopReason === "error") {
		throw new Error(`Turn prefix summarization failed: ${response.errorMessage || "Unknown error"}`);
	}

	return response.content
		.filter((c): c is { type: "text"; text: string } => c.type === "text")
		.map((c) => c.text)
		.join("\n");
}
