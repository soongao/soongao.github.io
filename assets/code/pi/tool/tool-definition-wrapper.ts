import type { AgentTool } from "@earendil-works/pi-agent-core";
import type { ExtensionContext, ToolDefinition } from "../extensions/types.ts";

/**
 * 将 coding-agent 层的 ToolDefinition 包装成 agent-core 层的 AgentTool。
 *
 * ToolDefinition 比 AgentTool 信息更全：它知道 UI 渲染、promptSnippet/promptGuidelines、
 * 以及扩展运行时上下文 ctx。agent-core 不应该依赖这些 coding-agent 概念，所以这里做一次边界适配：
 * - schema、名称、描述和执行模式原样交给 agent-core；
 * - execute 调用时临时创建 ExtensionContext，再传回 ToolDefinition.execute；
 * - 渲染器和 prompt 元数据不进入 AgentTool，它们仍由 AgentSession 的定义注册表维护。
 */
export function wrapToolDefinition<TDetails = unknown>(
	definition: ToolDefinition<any, TDetails>,
	ctxFactory?: () => ExtensionContext,
): AgentTool<any, TDetails> {
	return {
		name: definition.name,
		label: definition.label,
		description: definition.description,
		parameters: definition.parameters,
		prepareArguments: definition.prepareArguments,
		executionMode: definition.executionMode,
		execute: (toolCallId, params, signal, onUpdate) =>
			definition.execute(toolCallId, params, signal, onUpdate, ctxFactory?.() as ExtensionContext),
	};
}

/**
 * 批量包装工具定义。
 *
 * AgentSession 在刷新工具注册表时会先收集所有 ToolDefinition，再统一调用这里生成
 * `agent.state.tools` 需要的 AgentTool 数组。
 */
export function wrapToolDefinitions(
	definitions: ToolDefinition<any, any>[],
	ctxFactory?: () => ExtensionContext,
): AgentTool<any>[] {
	return definitions.map((definition) => wrapToolDefinition(definition, ctxFactory));
}

/**
 * 从已有 AgentTool 反向合成一个最小 ToolDefinition。
 *
 * `baseToolsOverride` 允许调用方直接提供低层 AgentTool。为了让 AgentSession 内部仍保持
 * “定义注册表优先”的结构，这里把 AgentTool 补成 ToolDefinition。合成出来的定义没有
 * promptSnippet、promptGuidelines 或自定义渲染器，只保留低层执行所必需的信息。
 */
export function createToolDefinitionFromAgentTool(tool: AgentTool<any>): ToolDefinition<any, unknown> {
	return {
		name: tool.name,
		label: tool.label,
		description: tool.description,
		parameters: tool.parameters as any,
		prepareArguments: tool.prepareArguments,
		executionMode: tool.executionMode,
		execute: async (toolCallId, params, signal, onUpdate) => tool.execute(toolCallId, params, signal, onUpdate),
	};
}
