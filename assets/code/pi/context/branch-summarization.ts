/**
 * 树导航（tree navigation）场景下的分支摘要逻辑。
 *
 * 这个文件处理的不是“上下文过长时的 compaction”，而是另一类问题：
 * 当用户从 session tree 的一个分支切换到另一个分支时，
 * 被离开的那条分支上可能已经积累了很多决策、进展和文件操作痕迹。
 * 如果直接切走，这些认知成果会暂时脱离当前活跃路径。
 *
 * 因此 branch summarization 的职责是：
 * - 找出“旧位置 -> 新位置”之间被放下的那段分支；
 * - 将这段分支压缩成一条 branch_summary；
 * - 让后续在新分支继续工作时，仍能带着对旧分支成果的高层理解。
 *
 * 可以把它理解为：
 * - compaction 解决的是“上下文窗口不够大”；
 * - branch summarization 解决的是“切换分支后，如何保留离开分支的工作记忆”。
 */

import type { AgentMessage } from "@earendil-works/pi-agent-core";
import type { Model } from "@earendil-works/pi-ai";
import { completeSimple } from "@earendil-works/pi-ai";
import {
	convertToLlm,
	createBranchSummaryMessage,
	createCompactionSummaryMessage,
	createCustomMessage,
} from "../messages.ts";
import type { ReadonlySessionManager, SessionEntry } from "../session-manager.ts";
import { estimateTokens } from "./compaction.ts";
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
// Types
// ============================================================================

export interface BranchSummaryResult {
	summary?: string;
	readFiles?: string[];
	modifiedFiles?: string[];
	aborted?: boolean;
	error?: string;
}

/**
 * 默认写入 BranchSummaryEntry.details 的文件追踪信息。
 *
 * 这部分不是 branch summary 文本本身，而是额外的结构化侧信息，
 * 用于累计记录这条分支历史中：
 * - 读过哪些文件；
 * - 改过哪些文件。
 */
export interface BranchSummaryDetails {
	readFiles: string[];
	modifiedFiles: string[];
}

export type { FileOperations } from "./utils.ts";

export interface BranchPreparation {
	/** Messages extracted for summarization, in chronological order */
	messages: AgentMessage[];
	/** File operations extracted from tool calls */
	fileOps: FileOperations;
	/** Total estimated tokens in messages */
	totalTokens: number;
}

export interface CollectEntriesResult {
	/** Entries to summarize, in chronological order */
	entries: SessionEntry[];
	/** Common ancestor between old and new position, if any */
	commonAncestorId: string | null;
}

export interface GenerateBranchSummaryOptions {
	/** Model to use for summarization */
	model: Model<any>;
	/** API key for the model */
	apiKey: string;
	/** Request headers for the model */
	headers?: Record<string, string>;
	/** Abort signal for cancellation */
	signal: AbortSignal;
	/** Optional custom instructions for summarization */
	customInstructions?: string;
	/** If true, customInstructions replaces the default prompt instead of being appended */
	replaceInstructions?: boolean;
	/** Tokens reserved for prompt + LLM response (default 16384) */
	reserveTokens?: number;
}

// ============================================================================
// Entry Collection
// ============================================================================

/**
 * 收集“从旧位置切到新位置时，应该被总结”的那段 entry。
 *
 * 核心语义：
 * - oldLeafId 是当前所在位置，也就是即将离开的分支末端；
 * - targetId 是即将跳转到的新位置；
 * - 真正要总结的，不是整棵树，而是 oldLeaf 到两条路径公共祖先之间的那一段。
 *
 * 这里不会在 compaction 边界处停止：
 * - 因为 compaction entry 本身也代表历史语义；
 * - 进入 branch summary 时，它应该像普通上下文一样参与理解。
 *
 * @param session - Session manager (read-only access)
 * @param oldLeafId - Current position (where we're navigating from)
 * @param targetId - Target position (where we're navigating to)
 * @returns Entries to summarize and the common ancestor
 */
export function collectEntriesForBranchSummary(
	session: ReadonlySessionManager,
	oldLeafId: string | null,
	targetId: string,
): CollectEntriesResult {
	// 没有旧位置，说明不存在“被离开的分支”，自然也就没有可总结内容。
	if (!oldLeafId) {
		return { entries: [], commonAncestorId: null };
	}

	// 先找两条路径的最近公共祖先（lowest common ancestor 的近似语义）。
	// 之后只总结 oldLeaf -> commonAncestor 之间的那段旧分支。
	const oldPath = new Set(session.getBranch(oldLeafId).map((e) => e.id));
	const targetPath = session.getBranch(targetId);

	// targetPath 是 root-first，因此倒序扫描时最先命中的公共节点就是“最深公共祖先”。
	let commonAncestorId: string | null = null;
	for (let i = targetPath.length - 1; i >= 0; i--) {
		if (oldPath.has(targetPath[i].id)) {
			commonAncestorId = targetPath[i].id;
			break;
		}
	}

	// 从 old leaf 反向回溯到公共祖先，把“将被离开的那段分支”收集出来。
	const entries: SessionEntry[] = [];
	let current: string | null = oldLeafId;

	while (current && current !== commonAncestorId) {
		const entry = session.getEntry(current);
		if (!entry) break;
		entries.push(entry);
		current = entry.parentId;
	}

	// 回溯得到的是逆序，最后翻转成时间正序，方便后续做消息化和摘要生成。
	entries.reverse();

	return { entries, commonAncestorId };
}

// ============================================================================
// Entry to Message Conversion
// ============================================================================

/**
 * 将 session entry 投影成可参与 branch summarization 的 AgentMessage。
 *
 * 与 compaction.ts 中同名逻辑类似，但这里的语义重点是：
 * - branch_summary 和 compaction 都应被看成“可读上下文”；
 * - toolResult 单独出现时不保留，因为它依附于 assistant 的 toolCall 语义；
 * - thinking/model/custom/label/session_info 等控制态或元数据不进入总结文本。
 */
function getMessageFromEntry(entry: SessionEntry): AgentMessage | undefined {
	switch (entry.type) {
		case "message":
			// toolResult 只保留结果本身，不携带完整调用语义；
			// 为避免“只见结果不见原因”，这里直接跳过，依赖 assistant toolCall 提供语境。
			if (entry.message.role === "toolResult") return undefined;
			return entry.message;

		case "custom_message":
			return createCustomMessage(entry.customType, entry.content, entry.display, entry.details, entry.timestamp);

		case "branch_summary":
			return createBranchSummaryMessage(entry.summary, entry.fromId, entry.timestamp);

		case "compaction":
			return createCompactionSummaryMessage(entry.summary, entry.tokensBefore, entry.timestamp);

		// 这些 entry 是控制态、扩展态或展示态，不是对话内容，不进入摘要上下文。
		case "thinking_level_change":
		case "model_change":
		case "custom":
		case "label":
		case "session_info":
			return undefined;
	}
}

/**
 * 在 token 预算内准备 branch summary 的输入消息，并累计文件操作信息。
 *
 * 这里采用“消息选择”和“文件追踪”分开的两阶段策略：
 *
 * 1. 文件追踪先全量扫描
 *    - 即使某些旧消息因为 token budget 放不进总结 prompt，
 *      它们留下的 read/modify 文件痕迹仍然很重要；
 *    - 因此会先从全部 entries（尤其是历史 branch_summary.details）中提取文件操作。
 *
 * 2. 消息正文再按预算从新到旧选择
 *    - 优先保留最新的分支上下文，因为它最接近用户离开该分支时的工作状态；
 *    - 如果预算不足，旧消息会被舍弃，但文件列表仍可保留为结构化补充信息。
 *
 * 这也是为什么 fileOps 与 messages 不是简单一一对应关系。
 */
export function prepareBranchEntries(entries: SessionEntry[], tokenBudget: number = 0): BranchPreparation {
	const messages: AgentMessage[] = [];
	const fileOps = createFileOps();
	let totalTokens = 0;

	// 第一遍：先无视 token budget，全量收集文件操作。
	// 这样嵌套 branch summary 的文件轨迹也能被继续继承下来。
	// 这里只信任 pi 自己生成的 summary details；扩展生成的 details 结构不一定兼容。
	for (const entry of entries) {
		if (entry.type === "branch_summary" && !entry.fromHook && entry.details) {
			const details = entry.details as BranchSummaryDetails;
			if (Array.isArray(details.readFiles)) {
				for (const f of details.readFiles) fileOps.read.add(f);
			}
			if (Array.isArray(details.modifiedFiles)) {
				// modifiedFiles 在这里被并入 edited 集合，后面统一走 computeFileLists 做去重和格式化。
				for (const f of details.modifiedFiles) {
					fileOps.edited.add(f);
				}
			}
		}
	}

	// 第二遍：真正构造 prompt 输入时，从新到旧选择消息，尽量保留最近状态。
	for (let i = entries.length - 1; i >= 0; i--) {
		const entry = entries[i];
		const message = getMessageFromEntry(entry);
		if (!message) continue;

		// assistant/tool-call 里的文件操作也要计入 fileOps。
		extractFileOpsFromMessage(message, fileOps);

		const tokens = estimateTokens(message);

		// 先判断再加入，避免 totalTokens 超预算过多。
		if (tokenBudget > 0 && totalTokens + tokens > tokenBudget) {
			// summary entry 往往是高密度语义压缩，即使预算紧张，也尽量给它留一点空间。
			if (entry.type === "compaction" || entry.type === "branch_summary") {
				if (totalTokens < tokenBudget * 0.9) {
					messages.unshift(message);
					totalTokens += tokens;
				}
			}
			// 一旦超预算，就停止继续向更老消息扩展。
			break;
		}

		messages.unshift(message);
		totalTokens += tokens;
	}

	return { messages, fileOps, totalTokens };
}

// ============================================================================
// Summary Generation
// ============================================================================

const BRANCH_SUMMARY_PREAMBLE = `The user explored a different conversation branch before returning here.
Summary of that exploration:

`;

const BRANCH_SUMMARY_PROMPT = `Create a structured summary of this conversation branch for context when returning later.

Use this EXACT format:

## Goal
[What was the user trying to accomplish in this branch?]

## Constraints & Preferences
- [Any constraints, preferences, or requirements mentioned]
- [Or "(none)" if none were mentioned]

## Progress
### Done
- [x] [Completed tasks/changes]

### In Progress
- [ ] [Work that was started but not finished]

### Blocked
- [Issues preventing progress, if any]

## Key Decisions
- **[Decision]**: [Brief rationale]

## Next Steps
1. [What should happen next to continue this work]

Keep each section concise. Preserve exact file paths, function names, and error messages.`;

/**
 * 为“被离开的分支”生成 branch summary。
 *
 * 这个函数是分支摘要的主入口，职责包括：
 * - 根据模型上下文窗口计算可用预算；
 * - 从 entries 中筛出适合进入 prompt 的消息；
 * - 将消息序列序列化为纯文本，避免模型把它当成“继续对话”；
 * - 调用 LLM 生成结构化总结；
 * - 在 summary 末尾追加文件读写清单。
 *
 * 最终产物会被上层写成 branch_summary entry，之后在新分支上作为一条上下文消息使用。
 */
export async function generateBranchSummary(
	entries: SessionEntry[],
	options: GenerateBranchSummaryOptions,
): Promise<BranchSummaryResult> {
	const { model, apiKey, headers, signal, customInstructions, replaceInstructions, reserveTokens = 16384 } = options;

	// 分支摘要也必须服从模型上下文窗口：
	// 留出 reserveTokens 给 system prompt、用户指令以及最终生成的摘要本身。
	const contextWindow = model.contextWindow || 128000;
	const tokenBudget = contextWindow - reserveTokens;

	const { messages, fileOps } = prepareBranchEntries(entries, tokenBudget);

	if (messages.length === 0) {
		return { summary: "No content to summarize" };
	}

	// 先转成标准 LLM message，再序列化成纯文本。
	// 这样模型接收到的是“待总结材料”，而不是可直接续写的对话流。
	const llmMessages = convertToLlm(messages);
	const conversationText = serializeConversation(llmMessages);

	// 指令有两种模式：
	// - replaceInstructions=true：完全替换默认模板；
	// - 否则：在默认模板后追加 customInstructions 作为额外关注点。
	let instructions: string;
	if (replaceInstructions && customInstructions) {
		instructions = customInstructions;
	} else if (customInstructions) {
		instructions = `${BRANCH_SUMMARY_PROMPT}\n\nAdditional focus: ${customInstructions}`;
	} else {
		instructions = BRANCH_SUMMARY_PROMPT;
	}
	const promptText = `<conversation>\n${conversationText}\n</conversation>\n\n${instructions}`;

	const summarizationMessages = [
		{
			role: "user" as const,
			content: [{ type: "text" as const, text: promptText }],
			timestamp: Date.now(),
		},
	];

	// 实际发起摘要调用。
	const response = await completeSimple(
		model,
		{ systemPrompt: SUMMARIZATION_SYSTEM_PROMPT, messages: summarizationMessages },
		{ apiKey, headers, signal, maxTokens: 2048 },
	);

	// 这里显式区分 aborted / error，方便调用方决定是静默取消还是上报失败。
	if (response.stopReason === "aborted") {
		return { aborted: true };
	}
	if (response.stopReason === "error") {
		return { error: response.errorMessage || "Summarization failed" };
	}

	let summary = response.content
		.filter((c): c is { type: "text"; text: string } => c.type === "text")
		.map((c) => c.text)
		.join("\n");

	// 给 summary 加一个固定前导说明，明确它描述的是“另一条已探索分支”的成果。
	summary = BRANCH_SUMMARY_PREAMBLE + summary;

	// 文件列表作为 branch-level 工作痕迹追加到摘要末尾。
	// 这样即使正文为了节约 token 没纳入所有细节，仍能保留与代码资产相关的关键线索。
	const { readFiles, modifiedFiles } = computeFileLists(fileOps);
	summary += formatFileOperations(readFiles, modifiedFiles);

	return {
		summary: summary || "No summary generated",
		readFiles,
		modifiedFiles,
	};
}
