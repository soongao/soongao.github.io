# 依赖关系
> 项目：`uri_writer`。本页由当前 Codex 会话基于 GitNexus 索引元信息和 `.ua/knowledge-graph.json` 生成。## 内部 imports 热点

| 目录依赖 | 次数 |
| --- | --- |
| writer -> writer | 45 |
| service -> writer | 30 |
| writer -> config | 20 |
| cmd/writer_server -> writer | 15 |
| lifecycle -> writer | 15 |
| . -> writer | 15 |
| kitex_gen/uri_writer/writerservice -> kitex_gen/uri_writer | 9 |
| writer -> service | 9 |
| kitex_gen/uri_writer -> kitex_gen/base | 6 |
| writer -> kitex_gen/base | 6 |
| writer -> kitex_gen/uri_writer | 6 |
| router -> config | 4 |
| lifecycle -> service | 3 |
| service -> kitex_gen/uri_writer | 3 |
| service -> kitex_gen/uri_writer/writerservice | 3 |
| writer -> kitex_gen/uri_writer/writerservice | 3 |
| cmd/writer_server -> config | 2 |
| . -> config | 2 |
| service -> config | 2 |
| writer -> router | 2 |
| cmd/writer_server -> lifecycle | 1 |
| . -> lifecycle | 1 |
| writer -> lifecycle | 1 |
| writer -> controlplane | 1 |

## 外部 Go 依赖

- `code.byted.org/gopkg/env`
- `code.byted.org/gopkg/logs/v2`
- `code.byted.org/inf/hdfs-go-sdk-on-cgo`
- `code.byted.org/kite/kitex`
- `code.byted.org/kv/goredis`
- `code.byted.org/middleware/hertz`
- `code.byted.org/v_lambda/lambda-go-sdk`
- `github.com/cloudwego/gopkg`
- `github.com/cloudwego/kitex`
- `github.com/golang/snappy`
- `github.com/klauspost/compress`
- `github.com/shirou/gopsutil/v3`
- `github.com/xitongsys/parquet-go`
- `code.byted.org/aiops/apm_vendor_byted`
- `code.byted.org/aiops/metrics_codec`
- `code.byted.org/aiops/monitoring-common-go`
- `code.byted.org/bytedtrace/bytedtrace-client-go`
- `code.byted.org/bytedtrace/bytedtrace-common/go`
- `code.byted.org/bytedtrace/bytedtrace-compatible-lightweight-go`
- `code.byted.org/bytedtrace/bytedtrace-conf-provider-client-go`
- `code.byted.org/bytedtrace/bytedtrace-gls-switch`
- `code.byted.org/bytedtrace/interface-go`
- `code.byted.org/bytedtrace/serializer-go`
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
- `code.byted.org/gopkg/stats`
- `code.byted.org/gopkg/tccclient`
- `code.byted.org/gopkg/thrift`
- `code.byted.org/inf/infsecc`
- `code.byted.org/kite/rpal`
- `code.byted.org/kv/backoff`
- `code.byted.org/kv/circuitbreaker`
- `code.byted.org/kv/goredis/v5`
- `code.byted.org/kv/redis-v6`
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
- `code.byted.org/security/go-spiffe-v2`
- `code.byted.org/security/memfd`
- `code.byted.org/security/sensitive_finder_engine`
- `code.byted.org/security/zti-jwt-helper-golang`
- `code.byted.org/service_mesh/mesh_transport`
- `code.byted.org/service_mesh/shmipc`
- `code.byted.org/trace/trace-client-go`
- `code.byted.org/ttarch/spd_kitex_section`
- `github.com/Knetic/govaluate`
- `github.com/agiledragon/gomonkey`
- `github.com/alicebob/gopher-json`
- `github.com/alicebob/miniredis`
- `github.com/apache/arrow/go/arrow`
- `github.com/apache/thrift`
- `github.com/beorn7/perks`
- `github.com/bits-and-blooms/bitset`
- `github.com/bits-and-blooms/bloom/v3`
- `github.com/bytedance/gopkg`
- `github.com/bytedance/mockey`
- `github.com/bytedance/sonic`
- `github.com/bytedance/sonic/loader`

## 维护建议

- 目录依赖次数高的位置通常是稳定接口或耦合热点，修改前先检查调用方。
- 跨服务 SDK、RPC/Overpass、Redis/HDFS/TOS 这类依赖通常是运行时风险点，应优先补充集成测试或 mock。
- 生成代码目录如 `kitex_gen` 通常不应作为业务逻辑入口阅读。
