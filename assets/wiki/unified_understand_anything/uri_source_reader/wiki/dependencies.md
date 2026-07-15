# 依赖关系
> 项目：`uri_source_reader`。本页由当前 Codex 会话基于 GitNexus 索引元信息和 `.ua/knowledge-graph.json` 生成。## 内部 imports 热点

| 目录依赖 | 次数 |
| --- | --- |
| . -> internal/source/hdfsparquet | 36 |
| internal/source/hdfsparquet -> sink | 12 |
| internal/source/sourcecommon -> sink | 12 |
| internal/source/tosinventorycsv -> sink | 12 |
| . -> sink | 6 |
| . -> controlplane | 5 |
| internal/source/hdfsparquet -> internal/bucketing | 4 |
| internal/source/tosinventorycsv -> internal/bucketing | 4 |
| . -> internal/source/tosinventorycsv | 3 |
| internal/source/hdfsparquet -> internal/source/sourcecommon | 2 |
| internal/source/tosinventorycsv -> internal/source/sourcecommon | 2 |
| . -> internal/bucketing | 2 |
| internal/source/hdfsparquet -> internal/source/manifest | 1 |
| internal/source/tosinventorycsv -> internal/source/manifest | 1 |

## 外部 Go 依赖

- `code.byted.org/gopkg/env`
- `code.byted.org/gopkg/logs/v2`
- `code.byted.org/inf/hdfs-go-sdk-on-cgo`
- `code.byted.org/kite/kitex`
- `code.byted.org/kv/goredis`
- `code.byted.org/middleware/hertz`
- `code.byted.org/overpass/bytedance_videoarch_uri_task_control_panel`
- `code.byted.org/v_lambda/lambda-go-sdk`
- `code.byted.org/videoarch/media-parser-go`
- `code.byted.org/videoarch/storagegw-go`
- `code.byted.org/videoarch/video_extra_query`
- `github.com/google/uuid`
- `github.com/xitongsys/parquet-go`
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
- `code.byted.org/cpputil/model`
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
- `code.byted.org/gopkg/tccclient`
- `code.byted.org/gopkg/thrift`
- `code.byted.org/gopkg/tos`
- `code.byted.org/hystrix/hystrix-go`
- `code.byted.org/iespkg/bytedkits-go/goext`
- `code.byted.org/iespkg/retry-go`
- `code.byted.org/inf/infsecc`
- `code.byted.org/inf/sarama`
- `code.byted.org/kite/kitex-overpass-suite`
- `code.byted.org/kite/rpal`
- `code.byted.org/kv/backoff`
- `code.byted.org/kv/circuitbreaker`
- `code.byted.org/kv/goredis/v5`
- `code.byted.org/kv/redis-v6`
- `code.byted.org/lang/trace`
- `code.byted.org/lidar/profiler`
- `code.byted.org/lidar/profiler/hertz`
- `code.byted.org/log_market/gosdk`
- `code.byted.org/log_market/loghelper`
- `code.byted.org/log_market/tracelog`
- `code.byted.org/log_market/ttlogagent_gosdk`
- `code.byted.org/log_market/ttlogagent_gosdk/v4`
- `code.byted.org/middleware/fic_client`
- `code.byted.org/middleware/gocaller`
- `code.byted.org/overpass/common`
- `code.byted.org/overpass/toutiao_videoarch_video_data_access`
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

## 维护建议

- 目录依赖次数高的位置通常是稳定接口或耦合热点，修改前先检查调用方。
- 跨服务 SDK、RPC/Overpass、Redis/HDFS/TOS 这类依赖通常是运行时风险点，应优先补充集成测试或 mock。
- 生成代码目录如 `kitex_gen` 通常不应作为业务逻辑入口阅读。
