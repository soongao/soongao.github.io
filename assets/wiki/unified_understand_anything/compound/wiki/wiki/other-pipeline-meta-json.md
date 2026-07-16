# Other — pipeline_meta.json

## 模块定位

`pipeline_meta.json` 是一个轻量级元数据文件，用于声明当前模块或任务关联的 CI 流水线配置与具体作业标识。它本身不包含可执行逻辑，也不会在运行时发起函数调用；它的作用是为代码库中的自动化系统提供定位信息。

```json
{
  "pipeline_file": ".codebase/pipelines/ci.yaml",
  "job_id": "unit_testing"
}
```

## 字段说明

`pipeline_file` 指向实际的流水线定义文件：

```json
"pipeline_file": ".codebase/pipelines/ci.yaml"
```

该路径表示 CI 配置位于仓库内的 `.codebase/pipelines/ci.yaml`。消费该元数据的工具可以通过这个字段找到完整的流水线定义。

`job_id` 指定流水线中的目标作业：

```json
"job_id": "unit_testing"
```

当前值 `unit_testing` 表示该元数据关联的是单元测试作业。具体作业行为应以 `.codebase/pipelines/ci.yaml` 中对应的 `unit_testing` 配置为准。

## 工作方式

该文件通常不会被业务代码直接引用，也不参与应用运行流程。它更像是一个索引文件：

1. 自动化工具读取 `pipeline_meta.json`。
2. 根据 `pipeline_file` 找到 CI 流水线文件。
3. 根据 `job_id` 定位流水线中的具体作业。
4. 后续执行、展示或分析逻辑由外部工具完成。

由于文件中没有函数、类或脚本入口，调用图中没有内部调用、外部调用或入口调用是符合预期的。

## 与代码库的关系

`pipeline_meta.json` 将当前上下文绑定到 `.codebase/pipelines/ci.yaml` 中的 `unit_testing` 作业。它不定义测试命令，也不描述测试策略；这些细节应维护在实际流水线文件中。

修改该文件时需要保持两个字段与流水线配置一致：

- `pipeline_file` 必须指向存在的流水线配置文件。
- `job_id` 必须匹配该流水线文件中真实存在的作业标识。

如果重命名或迁移 `.codebase/pipelines/ci.yaml` 中的作业，需要同步更新 `job_id`，否则依赖该元数据的工具可能无法定位目标 CI 作业。