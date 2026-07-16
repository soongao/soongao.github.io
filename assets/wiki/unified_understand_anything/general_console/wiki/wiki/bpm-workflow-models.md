# BPM Workflow Models

## 模块概览

`biz/model/bpm_workflow.go` 定义了 BPM 工作流的基础数据模型：`BPMWorkflowBasic`。该模块只包含结构体声明，不包含方法、函数、校验逻辑或业务流程控制。

`BPMWorkflowBasic` 的主要职责是承载工作流基础信息，并通过 `json` tag 约定对外序列化字段名。它适合作为接口响应、接口请求中嵌套对象，或服务层与展示层之间传递 BPM 工作流摘要信息的数据结构。

## 核心类型

### `BPMWorkflowBasic`

```go
type BPMWorkflowBasic struct {
	CreateAssignee        string `json:"create_assignee"`
	CreateOperator        string `json:"create_operator"`
	RejectOperator        string `json:"reject_operator"`
	ID                    int64  `json:"id"`
	StatusName            string `json:"status_name"`
	Status                string `json:"status"`
	Creator               string `json:"creator"`
	Assignee              string `json:"assignee"`
	WorkflowConfigVersion int64  `json:"workflow_config_version"`
	CreateTime            int64  `json:"ctime"`
	UpdateTime            int64  `json:"utime"`
	Version               int64  `json:"version"`
	Branch                string `json:"branch"`
	Finished              int64  `json:"finished"`
	IsPlatform            int64  `json:"is_platform"`
	CurrentAssignees      string `json:"current_assignees"`
}
```

该结构体是一个纯数据模型，字段全部导出，便于 Go 代码直接读写，也便于 `encoding/json` 按照 tag 进行序列化和反序列化。

## 字段说明

| Go 字段 | JSON 字段 | 类型 | 含义 |
|---|---|---:|---|
| `ID` | `id` | `int64` | 工作流实例或记录的唯一标识。 |
| `Status` | `status` | `string` | 工作流状态编码。 |
| `StatusName` | `status_name` | `string` | 工作流状态的展示名称。 |
| `Creator` | `creator` | `string` | 工作流创建人。 |
| `Assignee` | `assignee` | `string` | 当前或默认处理人。 |
| `CurrentAssignees` | `current_assignees` | `string` | 当前处理人集合的字符串表示。具体格式由上下游约定。 |
| `CreateAssignee` | `create_assignee` | `string` | 创建阶段的处理人。 |
| `CreateOperator` | `create_operator` | `string` | 创建操作人。 |
| `RejectOperator` | `reject_operator` | `string` | 驳回操作人。 |
| `WorkflowConfigVersion` | `workflow_config_version` | `int64` | 工作流配置版本。 |
| `Version` | `version` | `int64` | 工作流记录自身版本。 |
| `CreateTime` | `ctime` | `int64` | 创建时间戳。单位未在模型中声明，应以上游数据约定为准。 |
| `UpdateTime` | `utime` | `int64` | 更新时间戳。单位未在模型中声明，应以上游数据约定为准。 |
| `Branch` | `branch` | `string` | 工作流关联分支。 |
| `Finished` | `finished` | `int64` | 是否完成的数值标记。具体枚举含义由业务层约定。 |
| `IsPlatform` | `is_platform` | `int64` | 是否平台相关工作流的数值标记。具体枚举含义由业务层约定。 |

## 设计特点

`BPMWorkflowBasic` 不封装行为，只表达数据形状。模块中没有内部调用、外部调用或执行流，因此它不会直接驱动 BPM 流程，也不会执行状态迁移、权限判断、时间转换或字段校验。

这种设计意味着：

- 字段合法性需要由创建该结构体的上游逻辑保证。
- `Status`、`Finished`、`IsPlatform` 等字段的枚举含义不在该模型内定义。
- `CreateTime` 和 `UpdateTime` 只是 `int64`，模型本身不区分秒、毫秒或其他时间单位。
- `CurrentAssignees` 是字符串而不是切片，调用方需要知道其具体编码格式。

## JSON 使用方式

该模型通过 struct tag 固定 JSON 字段名。例如 `CreateTime` 会序列化为 `ctime`，`WorkflowConfigVersion` 会序列化为 `workflow_config_version`。

```go
workflow := model.BPMWorkflowBasic{
	ID:                    123,
	Status:                "running",
	StatusName:            "进行中",
	Creator:               "alice",
	Assignee:              "bob",
	WorkflowConfigVersion: 2,
	CreateTime:            1710000000,
	UpdateTime:            1710000300,
	Version:               1,
	Branch:                "main",
	Finished:              0,
	IsPlatform:            1,
	CurrentAssignees:      "bob",
}
```

序列化后的字段会遵循模型中的 `json` tag，而不是 Go 字段名：

```json
{
  "id": 123,
  "status": "running",
  "status_name": "进行中",
  "creator": "alice",
  "assignee": "bob",
  "workflow_config_version": 2,
  "ctime": 1710000000,
  "utime": 1710000300,
  "version": 1,
  "branch": "main",
  "finished": 0,
  "is_platform": 1,
  "current_assignees": "bob"
}
```

## 与代码库的连接方式

当前模块没有函数，因此调用图中不会出现内部调用、外部调用或执行流。它与代码库其他部分的连接通常发生在类型层面：其他包可以引用 `model.BPMWorkflowBasic` 来声明接口返回值、组装响应数据、接收反序列化结果，或在业务逻辑之间传递工作流基础信息。

维护该模型时需要注意 JSON 字段名的兼容性。修改字段名、类型或 tag 都可能影响依赖该结构体的接口契约；新增字段通常风险较低，但仍需要确认前后端、存储映射或 RPC/HTTP 协议是否接受该变化。