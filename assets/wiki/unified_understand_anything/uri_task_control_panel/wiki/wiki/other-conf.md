# Other — conf

## 模块概览

`conf` 模块保存服务运行所需的 YAML 配置，目前包含两类配置：

- `conf/base.yml`：业务运行、外部依赖、任务控制相关配置。
- `conf/hertz.config.yaml`：Hertz 服务在 `Develop` 和 `Product` 环境下的启动与日志配置。

该模块不包含 Go 函数、类或可执行逻辑；调用图中也没有内部调用、外部调用或执行流。它的作用是作为配置源，被代码库中的配置加载逻辑读取后用于初始化 Redis、心跳、任务分发、Lambda 调用、StorageGW、Hertz 服务端口和日志行为。

## `conf/base.yml`

`base.yml` 是核心业务配置文件，按功能域组织。

### `Redis`

```yaml
Redis:
  Cluster: toutiao.redis.videoarch_storage_test
```

`Redis.Cluster` 指定 Redis 集群名。当前值为 `toutiao.redis.videoarch_storage_test`，通常用于任务状态、心跳、屏障或临时控制信息的持久化依赖。

### `Heartbeat`

```yaml
Heartbeat:
  TTLSec: 90
  NextIntervalSec: 30
```

心跳配置控制任务或执行节点的存活状态更新节奏。

| 配置项 | 当前值 | 含义 |
| --- | ---: | --- |
| `Heartbeat.TTLSec` | `90` | 心跳记录的 TTL，单位为秒 |
| `Heartbeat.NextIntervalSec` | `30` | 下一次心跳上报间隔，单位为秒 |

开发时需要保证 `NextIntervalSec` 明显小于 `TTLSec`，否则心跳可能在下一次续期前过期。

### `Barrier`

```yaml
Barrier:
  CheckIntervalSec: 10
```

`Barrier.CheckIntervalSec` 表示屏障状态检查间隔，单位为秒。该配置适用于需要等待多个并发任务、分片任务或阶段性任务全部完成后再继续推进的场景。

### `Fanout`

```yaml
Fanout:
  Concurrency: 64
  MaxRetries: 3
```

任务扇出配置控制并发度和重试次数。

| 配置项 | 当前值 | 含义 |
| --- | ---: | --- |
| `Fanout.Concurrency` | `64` | 扇出处理的并发上限 |
| `Fanout.MaxRetries` | `3` | 单个扇出操作最大重试次数 |

调整 `Concurrency` 会直接影响下游服务、Redis、Lambda 或 RPC 的压力；调整前需要结合下游限流能力和任务规模评估。

### `Job`

```yaml
Job:
  TTLSec: 2592000
```

`Job.TTLSec` 表示任务记录 TTL，单位为秒。当前值 `2592000` 等于 30 天，用于控制任务元信息或任务状态的保留周期。

### `WriterRPC`

```yaml
WriterRPC:
  PSM: bytedance.videoarch.uri_writer
  TimeoutMs: 3000
```

`WriterRPC` 配置 URI Writer 服务的 RPC 调用信息。

| 配置项 | 当前值 | 含义 |
| --- | --- | --- |
| `WriterRPC.PSM` | `bytedance.videoarch.uri_writer` | Writer RPC 服务标识 |
| `WriterRPC.TimeoutMs` | `3000` | RPC 超时时间，单位为毫秒 |

当写入链路出现超时、失败或下游不可用时，应优先检查这里的 `PSM` 和 `TimeoutMs` 是否与目标环境匹配。

### `Lambda`

```yaml
Lambda:
  GatewayURL: 'https://boe-v-lambda.bytedance.net/lambda/apis/gateway/v1/invoke'
  ReaderFunction: uri_source_reader
  WriterFunction: uri_writer
  Qualifier: prod
  InvokeType: async
  TimeoutMs: 5000
  ControlPlanePSM: bytedance.videoarch.uri_task_control_panel
  ControlPlaneCluster: default
```

`Lambda` 配置用于通过网关调用 Reader 和 Writer 函数。

| 配置项 | 当前值 | 含义 |
| --- | --- | --- |
| `Lambda.GatewayURL` | `https://boe-v-lambda.bytedance.net/lambda/apis/gateway/v1/invoke` | Lambda 网关地址 |
| `Lambda.ReaderFunction` | `uri_source_reader` | 读取源数据的函数名 |
| `Lambda.WriterFunction` | `uri_writer` | 写入处理的函数名 |
| `Lambda.Qualifier` | `prod` | 函数版本或别名标识 |
| `Lambda.InvokeType` | `async` | 调用类型，当前为异步调用 |
| `Lambda.TimeoutMs` | `5000` | 网关调用超时时间，单位为毫秒 |
| `Lambda.ControlPlanePSM` | `bytedance.videoarch.uri_task_control_panel` | 控制面服务 PSM |
| `Lambda.ControlPlaneCluster` | `default` | 控制面服务集群 |

这里同时包含函数侧配置和控制面标识。修改函数名、`Qualifier` 或 `GatewayURL` 时，需要确认目标环境中的函数已经部署，并且控制面服务信息与当前运行环境一致。

### `StorageGW`

```yaml
StorageGW:
  AccessKey: '7d304abe58df7c8f77cd99edfc438024'
  SecretKey: '08037274a64e56b87504811acad18438'
  PSM: bytedance.videoarch.uri_task_control_panel
  Cluster: default
  ListPageSize: 1000
```

`StorageGW` 配置用于访问存储网关。

| 配置项 | 当前值 | 含义 |
| --- | --- | --- |
| `StorageGW.AccessKey` | `7d304abe58df7c8f77cd99edfc438024` | 存储网关访问凭证 |
| `StorageGW.SecretKey` | `08037274a64e56b87504811acad18438` | 存储网关密钥 |
| `StorageGW.PSM` | `bytedance.videoarch.uri_task_control_panel` | 调用方或服务标识 |
| `StorageGW.Cluster` | `default` | 目标集群 |
| `StorageGW.ListPageSize` | `1000` | 列表接口分页大小 |

`AccessKey` 和 `SecretKey` 属于敏感配置。修改、迁移或提交配置时，需要遵循仓库和平台的密钥管理规范，避免将生产密钥混入测试环境配置。

## `conf/hertz.config.yaml`

`hertz.config.yaml` 定义 Hertz 服务在不同运行环境下的基础行为，目前包含 `Develop` 和 `Product` 两套配置。

### `Develop`

```yaml
Develop:
    ServicePort: "6789"
    DebugPort: "6790"
    EnablePprof: true
    LogLevel: "debug"
    ConsoleLog: true
    AgentLog: true
    FileLog: true
```

开发环境开启了更详细的调试能力：

| 配置项 | 当前值 | 含义 |
| --- | --- | --- |
| `Develop.ServicePort` | `"6789"` | 服务监听端口 |
| `Develop.DebugPort` | `"6790"` | 调试端口 |
| `Develop.EnablePprof` | `true` | 是否开启 pprof |
| `Develop.LogLevel` | `"debug"` | 日志级别 |
| `Develop.ConsoleLog` | `true` | 是否输出控制台日志 |
| `Develop.AgentLog` | `true` | 是否输出 Agent 日志 |
| `Develop.FileLog` | `true` | 是否输出文件日志 |

### `Product`

```yaml
Product:
    ServicePort: "6789"
    DebugPort: "6790"
    EnablePprof: true
    LogLevel: "info"
    ConsoleLog: false
    AgentLog: true
    FileLog: true
```

生产环境与开发环境使用相同端口，但日志策略更收敛：

| 配置项 | 当前值 | 含义 |
| --- | --- | --- |
| `Product.ServicePort` | `"6789"` | 服务监听端口 |
| `Product.DebugPort` | `"6790"` | 调试端口 |
| `Product.EnablePprof` | `true` | 是否开启 pprof |
| `Product.LogLevel` | `"info"` | 日志级别 |
| `Product.ConsoleLog` | `false` | 是否输出控制台日志 |
| `Product.AgentLog` | `true` | 是否输出 Agent 日志 |
| `Product.FileLog` | `true` | 是否输出文件日志 |

`Develop` 和 `Product` 的主要差异是：

- `LogLevel`：开发环境为 `debug`，生产环境为 `info`。
- `ConsoleLog`：开发环境开启，生产环境关闭。

## 与代码库的连接方式

`conf` 模块本身没有执行入口，也不直接调用其他模块。它通过“被读取”的方式参与系统运行：

1. 服务启动时，配置加载逻辑读取 `conf/base.yml` 和 `conf/hertz.config.yaml`。
2. 运行时组件根据配置初始化外部依赖，例如 Redis、Writer RPC、Lambda 网关和 StorageGW。
3. Hertz 服务根据当前环境选择 `Develop` 或 `Product` 配置，决定端口、pprof、日志级别和日志输出目标。
4. 任务控制相关逻辑使用 `Heartbeat`、`Barrier`、`Fanout` 和 `Job` 配置控制调度节奏、并发度、重试次数和状态保留时间。

由于当前模块没有调用图边，维护重点不在函数关系，而在配置字段的语义一致性、环境隔离和下游依赖匹配。

## 修改配置时的注意事项

- 修改 `Redis.Cluster`、`WriterRPC.PSM`、`Lambda.GatewayURL`、`Lambda.*Function`、`StorageGW.PSM` 或 `StorageGW.Cluster` 时，需要确认目标环境的服务和资源已经存在。
- 修改 `Fanout.Concurrency` 前，需要评估下游 RPC、Lambda、Redis 和存储网关的承载能力。
- 修改 `Heartbeat.TTLSec` 或 `Heartbeat.NextIntervalSec` 时，需要保持续期间隔小于 TTL。
- 修改 `Job.TTLSec` 会影响任务状态保留周期，可能影响问题追溯、重试和清理策略。
- `StorageGW.AccessKey` 和 `StorageGW.SecretKey` 是敏感字段，不应随意复制到其他环境。
- `hertz.config.yaml` 中端口值使用字符串形式，例如 `"6789"`；新增环境配置时应保持同样的数据形态，避免配置解析行为不一致。