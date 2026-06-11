---
title: Claude Code - AgenticSearch
# date: YYYY-MM-DD HH:MM:SS +/-TTTT
categories: [Agent, Claude Code]
tags: [Agent, Claude Code]     # TAG names should always be lowercase
# toc: false
---

## AgenticSearch
- 转为coding场景下查找代码内容设计
- glob、grep、read 三个工具
- 不使用RAG
    - 场景不适合
    - 代码不好切片
    - 代码要精准查找, 而不是相似度
    - 代码频繁改动, 不好索引
    - 项目太大, 代码太长, RAG启动太慢
    - 黑盒
    - 只能一次召回, 找错无法修正
- agentic search可以主动探索, queryLoop的tool_use, 边查边判断是否是需要的代码片段
- 支持LSP插件, 代码检索跳转, 像ide里面那样

#### grep
- 使用rust写的riggrep, 而不是bash grep
    - 性能更好
    - bash权限太大
- 工具描述
```md
<!-- 基于 ripgrep 打造的强力搜索工具

- 搜索任务请永远使用 Grep。绝对不要用 Bash 命令调用 `grep` 或 `rg`。
  Grep 工具已经针对权限和访问做过优化。
- 输出模式："content" 返回匹配的具体行，"files_with_matches" 只返回
  文件路径（默认），"count" 只返回匹配数量
- 开放式、需要多轮迭代的搜索，请用 Agent 工具 -->
A powerful search tool built on ripgrep

- ALWAYS use Grep for search tasks. NEVER invoke `grep` or `rg` as a Bash 
  command. The Grep tool has been optimized for correct permissions and access.
- Output modes: "content" shows matching lines, "files_with_matches" shows 
  only file paths (default), "count" shows match counts
- Use Agent tool for open-ended searches requiring multiple rounds
```

#### glob
- 按pattern查文件
- 按修改时间倒序返回
- 最多只允许返回100个文件

#### read
- 一次最多读2000行, 用limit/offset读剩下的行
```md
<!-- 默认从文件开头读取，最多读 2000 行。
如果你已经知道需要文件的哪一部分，就只读那一部分。
对大文件来说，这一点特别重要。 -->
By default, it reads up to 2000 lines starting from the beginning of the file.
When you already know which part of the file you need, only read that part.
This can be important for larger files.
```
- 每次重新读, 不缓存,不索引,不预处理, 保证每次读的都是最新的

### sub-agent 探索
- 当要查询多次的时候, 派出多个sub agent去探索
- 防止主agent上下文污染
```md
<!-- 对简单、明确目标的代码搜索，直接用 Grep/Glob/Read。
对范围更广的代码库探索和深度研究，请使用 Agent 工具，并指定
subagent_type=Explore。……只有当你的任务明显需要超过 3 次查询时，
才用这种方式。 -->
For simple, directed codebase searches use Grep/Glob/Read directly.
For broader codebase exploration and deep research, use the Agent tool 
with subagent_type=Explore. ... use this only when ... your task will 
clearly require more than 3 queries.
```
- sub agent的上下文不会影响主agent
    - 只给主agent返回最终结果, 不返回过程