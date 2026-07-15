# 依赖关系
> 项目：`harden`。本页由当前 Codex 会话基于 GitNexus 索引元信息和 `.ua/knowledge-graph.json` 生成。## 内部 imports 热点

| 目录依赖 | 次数 |
| --- | --- |
| . -> conRemote | 6 |
| remote -> token | 6 |
| remote -> tokens | 6 |
| remote/v2 -> tokens | 6 |
| syncer -> tokens | 6 |
| conRemote -> metrics | 5 |
| . -> syncer | 5 |
| . -> syncer/v2 | 5 |
| remote -> syncer | 5 |
| remote/v2 -> syncer/v2 | 5 |
| udpserver -> syncer | 5 |
| . -> remote | 4 |
| remote/v2 -> token | 4 |
| syncer -> types | 4 |
| syncer -> metrics | 4 |
| syncer -> token | 4 |
| addr -> consistent | 3 |
| . -> remote/v2 | 3 |
| remote -> metrics | 3 |
| syncer -> addr | 3 |
| syncer/v2 -> types/v2 | 3 |
| syncer/v2 -> metrics | 3 |
| syncer/v2 -> addr | 3 |
| tokens -> addr | 3 |
| . -> tokens | 2 |
| . -> udpserver | 2 |
| remote/v2 -> metrics | 2 |
| syncer/v2 -> tokens | 2 |
| syncer/v2 -> token | 2 |
| token -> metrics | 2 |
| token -> rate | 2 |
| tokens -> token | 2 |
| udpserver -> token | 2 |
| udpserver -> tokens | 2 |
| addr -> metrics | 1 |
| . -> config | 1 |
| . -> metrics | 1 |
| . -> middleware | 1 |
| . -> tcc | 1 |
| metrics -> config | 1 |
| metrics -> tcc | 1 |
| remote -> types | 1 |
| remote/v2 -> types/v2 | 1 |
| syncer -> config | 1 |
| syncer/v2 -> config | 1 |
| syncer/v2 -> tcc | 1 |
| tokens -> config | 1 |
| tokens -> metrics | 1 |
| udpserver -> metrics | 1 |
| udpserver -> udpserver/protocol | 1 |

## 外部 Go 依赖

- `code.byted.org/gopkg/consul`
- `code.byted.org/gopkg/env`
- `code.byted.org/gopkg/etcd_util`
- `code.byted.org/gopkg/gopool`
- `code.byted.org/gopkg/logs`
- `code.byted.org/gopkg/metrics/v4`
- `code.byted.org/gopkg/singleflight`
- `code.byted.org/gopkg/tccclient`
- `code.byted.org/lidar/agent`
- `code.byted.org/middleware/hertz`
- `code.byted.org/videoarch/caesar_config`
- `code.byted.org/videoarch/james-sdk`
- `github.com/bytedance/mockey`
- `github.com/facebookgo/ensure`
- `github.com/golang/protobuf`
- `github.com/kr/pretty`
- `github.com/smartystreets/goconvey`
- `code.byted.org/aiops/apm_vendor_byted`
- `code.byted.org/aiops/metrics_codec`
- `code.byted.org/aiops/monitoring-common-go`
- `code.byted.org/bytedtrace/bytedtrace-client-go`
- `code.byted.org/bytedtrace/bytedtrace-common/go`
- `code.byted.org/bytedtrace/bytedtrace-conf-provider-client-go`
- `code.byted.org/bytedtrace/interface-go`
- `code.byted.org/bytedtrace/serializer-go`
- `code.byted.org/gopkg/apm_vendor_interface`
- `code.byted.org/gopkg/asynccache`
- `code.byted.org/gopkg/ctxvalues`
- `code.byted.org/gopkg/debug`
- `code.byted.org/gopkg/etcdproxy`
- `code.byted.org/gopkg/logid`
- `code.byted.org/gopkg/metainfo`
- `code.byted.org/gopkg/metrics`
- `code.byted.org/gopkg/metrics/v3`
- `code.byted.org/gopkg/metrics_core`
- `code.byted.org/gopkg/net2`
- `code.byted.org/gopkg/rand`
- `code.byted.org/gopkg/rwlock`
- `code.byted.org/gopkg/stats`
- `code.byted.org/log_market/gosdk`
- `code.byted.org/log_market/loghelper`
- `code.byted.org/log_market/tracelog`
- `code.byted.org/log_market/ttlogagent_gosdk`
- `code.byted.org/middleware/fic_client`
- `code.byted.org/middleware/mcache`
- `code.byted.org/middleware/multisyscall`
- `code.byted.org/middleware/netpoll`
- `code.byted.org/security/go-spiffe-v2`
- `code.byted.org/security/sensitive_finder_engine`
- `code.byted.org/security/zti-jwt-helper-golang`
- `github.com/BurntSushi/toml`
- `github.com/Knetic/govaluate`
- `github.com/agiledragon/gomonkey/v2`
- `github.com/beorn7/perks`
- `github.com/bytedance/gopkg`
- `github.com/caarlos0/env/v6`
- `github.com/choleraehyq/pid`
- `github.com/davecgh/go-spew`
- `github.com/facebookgo/stack`
- `github.com/facebookgo/subset`
- `github.com/fsnotify/fsnotify`
- `github.com/go-kit/log`
- `github.com/go-logfmt/logfmt`
- `github.com/gogo/protobuf`
- `github.com/google/go-cmp`
- `github.com/gopherjs/gopherjs`
- `github.com/gorilla/mux`
- `github.com/hashicorp/hcl`
- `github.com/json-iterator/go`
- `github.com/jtolds/gls`
- `github.com/klauspost/compress`
- `github.com/kr/text`
- `github.com/magiconair/properties`
- `github.com/mitchellh/mapstructure`
- `github.com/modern-go/concurrent`
- `github.com/modern-go/reflect2`
- `github.com/mohae/deepcopy`
- `github.com/opentracing/opentracing-go`
- `github.com/pelletier/go-toml`
- `github.com/pierrec/lz4/v4`

## 维护建议

- 目录依赖次数高的位置通常是稳定接口或耦合热点，修改前先检查调用方。
- 跨服务 SDK、RPC/Overpass、Redis/HDFS/TOS 这类依赖通常是运行时风险点，应优先补充集成测试或 mock。
- 生成代码目录如 `kitex_gen` 通常不应作为业务逻辑入口阅读。
