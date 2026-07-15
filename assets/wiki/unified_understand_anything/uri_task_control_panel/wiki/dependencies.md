# 依赖关系
> 项目：`uri_task_control_panel`。本页由当前 Codex 会话基于 GitNexus 索引元信息和 `.ua/knowledge-graph.json` 生成。## 内部 imports 热点

| 目录依赖 | 次数 |
| --- | --- |
| internal/api -> internal/store | 6 |
| internal/barrier -> internal/store | 6 |
| internal/collector -> internal/store | 6 |
| internal/finalizer -> internal/store | 6 |
| internal/job -> internal/scheduler | 6 |
| internal/job -> internal/store | 6 |
| cmd -> internal/job | 4 |
| internal/api -> internal/types | 4 |
| internal/api -> internal/job | 4 |
| internal/barrier -> internal/types | 4 |
| internal/collector -> internal/types | 4 |
| internal/job -> internal/config | 4 |
| internal/job -> internal/types | 4 |
| internal/store -> internal/types | 4 |
| cmd -> internal/api | 3 |
| cmd -> internal/scheduler | 3 |
| cmd -> internal/store | 3 |
| cmd -> internal/barrier | 2 |
| cmd -> internal/collector | 2 |
| cmd -> internal/finalizer | 2 |
| cmd -> internal/writerrpc | 2 |
| examples/hertz_client -> internal/types | 2 |
| internal/api -> internal/config | 2 |
| internal/api -> internal/collector | 2 |
| internal/barrier -> internal/config | 2 |
| internal/finalizer -> internal/config | 2 |
| internal/finalizer -> internal/types | 2 |
| internal/scheduler -> internal/config | 2 |
| internal/store -> internal/config | 2 |
| cmd -> internal/config | 1 |
| internal/collector -> internal/config | 1 |

## 外部 Go 依赖

- `code.byted.org/gopkg/env`
- `code.byted.org/gopkg/logs/v2`
- `code.byted.org/gopkg/tccclient`
- `code.byted.org/inf/hdfs-go-sdk-on-cgo`
- `code.byted.org/kite/kitex`
- `code.byted.org/kv/goredis/v5`
- `code.byted.org/kv/redis-v6`
- `code.byted.org/middleware/hertz`
- `code.byted.org/overpass/bytedance_videoarch_uri_task_control_panel`
- `code.byted.org/videoarch/caesar_config/v4`
- `code.byted.org/videoarch/storagegw-go`
- `github.com/alicebob/miniredis/v2`
- `github.com/cloudwego/hertz`
- `github.com/google/uuid`
- `github.com/stretchr/testify`
- `code.byted.org/aiops/apm_vendor_byted`
- `code.byted.org/aiops/metrics_codec`
- `code.byted.org/aiops/monitoring-common-go`
- `code.byted.org/bytedtrace/bytedtrace-client-go`
- `code.byted.org/bytedtrace/bytedtrace-common/go`
- `code.byted.org/bytedtrace/bytedtrace-compatible-lightweight-go`
- `code.byted.org/bytedtrace/bytedtrace-conf-provider-client-go`
- `code.byted.org/bytedtrace/bytedtrace-gls-switch`
- `code.byted.org/bytedtrace/http-client-trace-wrapper`
- `code.byted.org/bytedtrace/interface-go`
- `code.byted.org/bytedtrace/serializer-go`
- `code.byted.org/golf/consul`
- `code.byted.org/gopkg/apm_vendor_interface`
- `code.byted.org/gopkg/asynccache`
- `code.byted.org/gopkg/consul`
- `code.byted.org/gopkg/ctxvalues`
- `code.byted.org/gopkg/debug`
- `code.byted.org/gopkg/etcd_util`
- `code.byted.org/gopkg/etcdproxy`
- `code.byted.org/gopkg/logid`
- `code.byted.org/gopkg/logs`
- `code.byted.org/gopkg/metainfo`
- `code.byted.org/gopkg/metrics`
- `code.byted.org/gopkg/metrics/v3`
- `code.byted.org/gopkg/metrics/v4`
- `code.byted.org/gopkg/metrics_core`
- `code.byted.org/gopkg/net2`
- `code.byted.org/gopkg/pkg`
- `code.byted.org/gopkg/retry`
- `code.byted.org/gopkg/stats`
- `code.byted.org/gopkg/thrift`
- `code.byted.org/gopkg/tos`
- `code.byted.org/hystrix/hystrix-go`
- `code.byted.org/inf/infsecc`
- `code.byted.org/inf/sarama`
- `code.byted.org/kite/rpal`
- `code.byted.org/kv/backoff`
- `code.byted.org/kv/circuitbreaker`
- `code.byted.org/lang/trace`
- `code.byted.org/lidar/profiler`
- `code.byted.org/lidar/profiler/hertz`
- `code.byted.org/lidar/profiler/kitex`
- `code.byted.org/log_market/gosdk`
- `code.byted.org/log_market/loghelper`
- `code.byted.org/log_market/tracelog`
- `code.byted.org/log_market/ttlogagent_gosdk`
- `code.byted.org/log_market/ttlogagent_gosdk/v4`
- `code.byted.org/middleware/fic_client`
- `code.byted.org/middleware/gocaller`
- `code.byted.org/security/certinfo`
- `code.byted.org/security/cryptoutils`
- `code.byted.org/security/go-spiffe-v2`
- `code.byted.org/security/gokms-extension`
- `code.byted.org/security/golangope`
- `code.byted.org/security/kms-v2-sdk-golang`
- `code.byted.org/security/memfd`
- `code.byted.org/security/sensitive_finder_engine`
- `code.byted.org/security/spiffe_spire`
- `code.byted.org/security/volc_kms_encryption_sdk/v2`
- `code.byted.org/security/volczti-helper`
- `code.byted.org/security/zero-trust-identity-helper`
- `code.byted.org/security/zti-jwt-helper-golang`
- `code.byted.org/service_mesh/consul`
- `code.byted.org/service_mesh/mesh_transport`
- `code.byted.org/service_mesh/shmipc`

## 维护建议

- 目录依赖次数高的位置通常是稳定接口或耦合热点，修改前先检查调用方。
- 跨服务 SDK、RPC/Overpass、Redis/HDFS/TOS 这类依赖通常是运行时风险点，应优先补充集成测试或 mock。
- 生成代码目录如 `kitex_gen` 通常不应作为业务逻辑入口阅读。
