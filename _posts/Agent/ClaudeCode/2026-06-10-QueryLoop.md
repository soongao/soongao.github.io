---
title: Claude Code - Query Loop
# date: YYYY-MM-DD HH:MM:SS +/-TTTT
categories: [Agent, Claude Code]
tags: [Agent, Claude Code, Loop]     # TAG names should always be lowercase
# toc: false
---

## Query Loop
### Overview 伪代码调用关系
- ts语法糖, 异步生成器, 边执行边抛输出
```ts
// 第一层 ask：SDK 入口，一次性调用
async function* ask(params) {
    const engine = new QueryEngine(config)
    yield* engine.submitMessage(params.prompt)
}

// 第二层 QueryEngine：管这次对话的会话状态
class QueryEngine {
    async *submitMessage(prompt) {
        // 处理 /斜杠命令、组装系统提示、注入上下文 ……
        yield* query({ messages, systemPrompt, tools, ... })
    }
}

// 第三层 query：流式包装层
asyncfunction* query(params) {
    yield* queryLoop(params)
}

// 第四层 queryLoop：核心循环本体
async function* queryLoop(params) {
    while (true) {
        // 准备消息 → 调模型 → 判断 → 执行工具 → 塞回结果
    }
}
```
### queryLoop
```ts
async function* queryLoop(params) {
    let state = { messages: [...], turnCount: 1, ... }

    while (true) {
        // 1. 准备消息：必要时压缩
        const messagesForQuery = maybeCompact(state.messages)

        // 2. 流式调大模型，边收边处理
        let toolUseBlocks = []
        let needsFollowUp = false
        for await (const chunk of callModel(messagesForQuery)) {
            yield chunk  // 文字块即时抛给用户
            if (chunk 是 tool_use 块) {
                toolUseBlocks.push(chunk)
                needsFollowUp = true
            }
        }

        // 3. 判断继续还是结束
        if (!needsFollowUp) {
            return { reason: 'completed' }
        }

        // 4. 执行所有 tool_use（可并行/串行）
        const toolResults = await runTools(toolUseBlocks)

        // 5. 塞回结果进下一轮
        state = {
            ...state,
            messages: [...messagesForQuery, ...assistantMessages, ...toolResults],
            turnCount: state.turnCount + 1,
        }
        // continue 回到 while 头部
    }
}
```
- Anthropic response
    - text block 和 tool_use block
    - 和OpenAI response有差别的

### 退出原因
- 模型resp没有tool_use就completed
    - 正常结束
- max_turns: 达到最大turns
- aborted_streaming: 用户终止了模型输出
- aborted_tools: 用户终止了工具执行
- prompt_too_long: 消息太长, 压缩也进不了上下文窗口
- max_output_tokens_recovery: 模型输出被截断, 多次尝试续写还是失败
- stop_hook_prevented: 自定义了stop hook(例如执行git push前要先执行lint, 可是没有执行, 于是在stop hook被拦下)
- image_error
- 细分一共17种
#### 异常退出处理
- 识别错误状态
- 做必要的清理(例如取消正在执行的工具, 解锁资源等)
- 返回结构化reason, 让调用者知道结束原因

### 执行工具
- 只读工具流式执行
```ts
// 模型流式输出时，每识别到一个工具调用就立刻丢到后台开跑
streamingToolExecutor.addTool(toolBlock, message)

// 模型流完后，把所有已完成的工具结果一次性收回来
const toolUpdates = streamingToolExecutor.getRemainingResults()
```
- 会改状态的工具串行
    - 工具定义时声明属性(只读还是会改状态), 为指定默认会改状态兜底

### State
- 一个loop中跨turn传递
```ts
type State = {
  messages: Message[]                    // 累积的对话消息历史
  turnCount: number                      // 当前是第几轮
  maxOutputTokensRecoveryCount: number   // 输出截断已经恢复了几次
  hasAttemptedReactiveCompact: boolean   // 本轮是不是已经触发过压缩了, 避免反复压缩
}
```

### tool_use block
- 每个tool_use block都必须要有一个tool_result block对应
- 如果输出了tool_use block但是tool被终止了, 没有tool_result, 会创建一个假的结果(yieldMissingToolResultBlocks)
```ts
yield 一条用户角色消息({
  类型: 'tool_result',           // 标明这是个工具结果
  内容: '这个工具没执行成功',     // 解释为啥失败
  is_error: true,                // 打个错误标记
  tool_use_id: 对应的工具调用ID, // 让 API 能配对上
})
```

### 模型output max token处理
- 静默升档
    - 触发8K截断时, 将上限调成64K
- 模型续写
    - 64K还是截断了, 在下一轮消息中插入「上次输出超长被截断了，请直接从断点续写，不要道歉、不要回顾你刚才在干什么、把剩余工作拆成更小的块」提示
    - 进行nudge(轻推续写), 续写尝试次数达到上限就返回错误
