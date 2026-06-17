# Plan & Todo

- Plan / Task / Todo 的自然语言内容都主要由模型生成.
- core 通过 system prompt、tool instruction、tool schema 和内置模板工具引导模型产出内容形态.
- 三者的区别不在内容是否由模型生成, 而在持久化位置、可见性、机器字段、调度语义和上下文进入方式.

## Todo
- Todo 只通过静态 system prompt 说明.
- Todo 是模型在单个 agent loop 内自我组织工作的短期 scratchpad.
- 第一版不提供 todo tool.
- 第一版不持久化 todo.
- Todo 不写 SQLite node/event, 不写 project 文件, 不进入 task WAL.
- Todo 不默认暴露给用户.
- Todo 不参与 multi-agent 调度、ownership、attempt、依赖或重试.
- Todo 不作为结构化进度 source of truth; 结构化执行状态只看 Task DAG.

## Plan
- Plan 是面向用户/上层调用方的人读 Markdown 文档.
- Plan 没有独立状态机.
- Plan 没有 SQLite 当前状态表.
- Plan 没有专门的 PlanFileRef / plan index source of truth.
- Plan 文件就是普通项目文件, 只约定默认放在 `<project>/.soong-agent/plans/`.
- Plan 文件名由模型根据本次计划内容生成候选名, 例如 `implement-auth-flow.md`; 不固定为 `plan.md`.
- core 不从 title/summary 硬编码生成 slug.
- core 只校验模型给出的文件名:
	- 只允许安全文件名字符, 默认 `a-z0-9-_`.
	- 必须以 `.md` 结尾.
	- 不允许 `/`, `..`, hidden filename, 空文件名或绝对路径.
	- 超过长度限制返回 validation_error.
	- 文件已存在时返回 path_conflict, 由模型选择新名字或请求用户处理.
- Plan Markdown 过大时, 按普通文件和 artifact 规则处理, 不为 Plan 设计特殊大文件逻辑.
- Plan 文件写入必须走普通 file write/edit tool.
- 高风险 write / dangerous 仍然走 permission.

## Plan Tool
- 内置 plan tool 的 canonical name 是 `agent.plan_template`.
- `agent.plan_template` 是模板/上下文工具, 不直接创建或修改文件.
- `agent.plan_template` 读取 SDK 内置的 Plan 写作模板.
- `agent.plan_template` 把 Plan 写作模板、当前用户目标、建议路径目录和必要约束组合成一个 synthetic user block.
- `agent.plan_template` 的返回形态类似 skill loading:
	- tool 执行结果会作为 `node_type=plan_instruction` 的 user/context block 进入下一轮模型上下文.
	- 它不是普通 assistant 文本, 也不是 system prompt.
	- 它不自动常驻上下文; 只按普通上下文预算和节点选择规则进入后续 prompt.
- 模型收到 plan instruction 后, 选择计划文件名, 再调用普通 write/edit tool 写入 `<project>/.soong-agent/plans/<model-chosen-name>.md`.
- `agent.plan_template` 返回内容只指导写作, 不代表 Plan 已创建.
- Plan 是否成功创建以普通 write/edit tool 的结果为准.
- `agent.plan_template` 不解析、不校验、不索引已生成的 Plan Markdown.
- 已生成的 Plan 和其他 Markdown 文件一样, 后续需要读取时调用普通 read tool.

## Plan Tool Permission
- `agent.plan_template` 是 internal readonly/context tool.
- `agent.plan_template` 只允许 main agent / Orchestrator 使用.
- sub agent / fork agent 不允许使用 `agent.plan_template`.
- sub agent / fork agent 的 effective tool set 中默认不包含 `agent.plan_template`.
- 如果模型仍然调用不可用的 `agent.plan_template`, core 返回 `tool_not_available`.

## Relationship
- Plan / Todo / Task 是不同对象, 不做结构化关联:
	- Plan 是人读计划文件.
	- Todo 是单个 loop 的临时 scratchpad.
	- Task 是Orchestrator 维护的内存 DAG.
- Plan / Todo / Task 的正文都可以由模型生成和改写, 但 core 只信任各自明确的机器字段、工具输入和状态约束.
- Todo / Task 可以在说明中自然提到某个 Plan 路径, 但 core 不解析、不校验、不建立外键.
- 执行中允许模型拆分内部 todo.
- Task 进度不自动改写 Plan.
