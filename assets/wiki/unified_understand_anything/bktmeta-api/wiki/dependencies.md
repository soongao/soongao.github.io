# 依赖关系
> 项目：`bktmeta-api`。本页由当前 Codex 会话基于 GitNexus 索引元信息和 `.ua/knowledge-graph.json` 生成。## 内部 imports 热点

| 目录依赖 | 次数 |
| --- | --- |
| service -> db | 399 |
| db -> util | 133 |
| service -> rpc | 96 |
| service -> util | 76 |
| service -> errno | 69 |
| service -> middleware | 65 |
| service -> config | 60 |
| db -> rpc | 40 |
| janus -> util | 38 |
| middleware -> util | 38 |
| tcc -> util | 38 |
| . -> service | 30 |
| service -> tcc | 30 |
| util -> config | 30 |
| db -> config | 25 |
| . -> db | 21 |
| rpc -> config | 20 |
| tcc -> config | 20 |
| kms -> util | 19 |
| . -> util | 19 |
| remote_cache -> util | 19 |
| rpc -> util | 19 |
| middleware -> tcc | 18 |
| jwt -> config | 15 |
| middleware -> config | 15 |
| remote_cache -> tcc | 12 |
| janus -> middleware | 10 |
| remote_cache -> config | 10 |
| db -> kms | 9 |
| middleware -> kms | 9 |
| middleware -> errno | 9 |
| service -> remote_cache | 9 |
| service -> kms | 9 |
| . -> rpc | 8 |
| db -> dto | 6 |
| janus -> errno | 6 |
| . -> tcc | 6 |
| mem_limit -> tcc | 6 |
| rpc -> jwt | 6 |
| rpc -> kms | 6 |
| service -> jwt | 6 |
| service -> dto | 6 |
| janus -> config | 5 |
| kms -> config | 5 |
| . -> config | 5 |
| . -> middleware | 5 |
| mem_limit -> config | 5 |
| db -> janus | 3 |
| . -> janus | 3 |
| . -> jwt | 3 |

## 外部 Go 依赖

- `code.byted.org/bytedoc/mongo-go-driver`
- `code.byted.org/bytedtrace/interface-go`
- `code.byted.org/gin/ginex`
- `code.byted.org/gopkg/consul`
- `code.byted.org/gopkg/ctxvalues`
- `code.byted.org/gopkg/env`
- `code.byted.org/gopkg/gorm`
- `code.byted.org/gopkg/idgenerator/v2`
- `code.byted.org/gopkg/logid`
- `code.byted.org/gopkg/logs`
- `code.byted.org/gopkg/metrics/v3`
- `code.byted.org/gopkg/mysql-driver`
- `code.byted.org/gopkg/retry`
- `code.byted.org/gopkg/tccclient`
- `code.byted.org/kv/goredis/v5`
- `code.byted.org/lidar/agent`
- `code.byted.org/middleware/hertz`
- `code.byted.org/paas/cloud-sdk-go`
- `code.byted.org/security/kms-v2-sdk-golang`
- `code.byted.org/security/zti-jwt-golang`
- `code.byted.org/sre/bytetree_go_sdk`
- `code.byted.org/videoarch-sre/change_platform_sdk`
- `code.byted.org/videoarch/account-sdk`
- `code.byted.org/videoarch/bktmeta-sdk-go`
- `code.byted.org/videoarch/caesar_config`
- `code.byted.org/videoarch/cloud_gopkg`
- `code.byted.org/videoarch/env`
- `code.byted.org/videoarch/event_center-sdk`
- `code.byted.org/videoarch/go-remote-cache`
- `code.byted.org/videoarch/harden-sdk`
- `code.byted.org/videoarch/iamsdk`
- `code.byted.org/videoarch/storagegw-go`
- `code.byted.org/videoarch/vfastcache`
- `code.byted.org/videoarch/vsre-client`
- `dario.cat/mergo`
- `github.com/agiledragon/gomonkey/v2`
- `github.com/alecthomas/assert`
- `github.com/dgrijalva/jwt-go`
- `github.com/gin-gonic/gin`
- `github.com/google/uuid`
- `github.com/kr/pretty`
- `github.com/pkg/errors`
- `github.com/stretchr/testify`
- `github.com/volcengine/ve-tos-golang-sdk/v2`
- `golang.org/x/time`
- `gopkg.in/yaml.v3`
- `code.byted.org/aiops/apm_vendor_byted`
- `code.byted.org/aiops/metrics_codec`
- `code.byted.org/aiops/monitoring-common-go`
- `code.byted.org/bytedtrace/bytedtrace-client-go`
- `code.byted.org/bytedtrace/bytedtrace-common/go`
- `code.byted.org/bytedtrace/bytedtrace-compatible-client-go`
- `code.byted.org/bytedtrace/bytedtrace-compatible-lightweight-go`
- `code.byted.org/bytedtrace/bytedtrace-conf-provider-client-go`
- `code.byted.org/bytedtrace/bytedtrace-gls-switch`
- `code.byted.org/bytedtrace/http-client-trace-wrapper`
- `code.byted.org/bytedtrace/serializer-go`
- `code.byted.org/golf/consul`
- `code.byted.org/gopkg/apm_vendor_interface`
- `code.byted.org/gopkg/asyncache`
- `code.byted.org/gopkg/asynccache`
- `code.byted.org/gopkg/circuitbreaker`
- `code.byted.org/gopkg/debug`
- `code.byted.org/gopkg/etcd_util`
- `code.byted.org/gopkg/etcdproxy`
- `code.byted.org/gopkg/idgenerator`
- `code.byted.org/gopkg/logs/v2`
- `code.byted.org/gopkg/metainfo`
- `code.byted.org/gopkg/metrics`
- `code.byted.org/gopkg/metrics/v4`
- `code.byted.org/gopkg/metrics_core`
- `code.byted.org/gopkg/net2`
- `code.byted.org/gopkg/pkg`
- `code.byted.org/gopkg/rand`
- `code.byted.org/gopkg/refresh_cache`
- `code.byted.org/gopkg/stats`
- `code.byted.org/gopkg/thrift`
- `code.byted.org/gopkg/tos`
- `code.byted.org/hystrix/hystrix-go`
- `code.byted.org/inf/infsecc`

## 维护建议

- 目录依赖次数高的位置通常是稳定接口或耦合热点，修改前先检查调用方。
- 跨服务 SDK、RPC/Overpass、Redis/HDFS/TOS 这类依赖通常是运行时风险点，应优先补充集成测试或 mock。
- 生成代码目录如 `kitex_gen` 通常不应作为业务逻辑入口阅读。
