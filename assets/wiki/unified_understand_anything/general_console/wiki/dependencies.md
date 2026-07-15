# 依赖关系
> 项目：`general_console`。本页由当前 Codex 会话基于 GitNexus 索引元信息和 `.ua/knowledge-graph.json` 生成。## 内部 imports 热点

| 目录依赖 | 次数 |
| --- | --- |
| . -> biz/handler | 132 |
| biz/handler -> biz/errno | 76 |
| biz/handler -> biz/middleware | 75 |
| biz/handler -> biz/config | 54 |
| biz/handler -> biz/util | 49 |
| biz/middleware -> biz/errno | 16 |
| biz/dal/dao -> biz/util | 14 |
| biz/handler -> biz/dal/dao | 14 |
| biz/dal/dao -> biz/config | 12 |
| biz/handler -> biz/rpc | 12 |
| biz/idl/kitex_gen/bytedance/videoarch/object_duplication_manager/objectduplicationmanager -> biz/idl/kitex_gen/bytedance/videoarch/object_duplication_manager | 12 |
| biz/rpc -> biz/config | 12 |
| . -> biz/middleware | 10 |
| biz/rpc -> biz/model | 9 |
| biz/handler -> biz/idl/kitex_gen/bytedance/videoarch/object_duplication_manager/objectduplicationmanager | 8 |
| biz/errno -> biz/dal/dao | 7 |
| biz/errno -> biz/util | 7 |
| . -> biz/dal/dao | 7 |
| . -> biz/util | 7 |
| biz/errno -> biz/config | 6 |
| biz/handler -> biz/model | 6 |
| biz/idl/kitex_gen/bytedance/videoarch/object_duplication_manager -> biz/idl/kitex_gen/base | 6 |
| . -> biz/config | 6 |
| biz/rpc -> biz/errno | 4 |
| . -> biz/rpc | 4 |
| biz/handler -> biz/idl/kitex_gen/bytedance/videoarch/object_duplication_manager | 3 |
| biz/dal/dao -> biz/dal/dto | 2 |
| biz/handler -> biz/dal/dto | 1 |

## 外部 Go 依赖

- `code.byted.org/bytecloud/iam_sdk`
- `code.byted.org/bytecloud/intelligen`
- `code.byted.org/dp/gotqs`
- `code.byted.org/gopkg/consul`
- `code.byted.org/gopkg/ctxvalues`
- `code.byted.org/gopkg/env`
- `code.byted.org/gopkg/gomonkey`
- `code.byted.org/gopkg/gorm`
- `code.byted.org/gopkg/logid`
- `code.byted.org/gopkg/logs`
- `code.byted.org/gopkg/metrics/v3`
- `code.byted.org/gopkg/mysql-driver`
- `code.byted.org/gopkg/retry`
- `code.byted.org/gopkg/tccclient`
- `code.byted.org/inf/infsecc`
- `code.byted.org/kite/kitex`
- `code.byted.org/kite/kitex-overpass-suite`
- `code.byted.org/kite/kitex/pkg/protocol/bthrift`
- `code.byted.org/middleware/hertz`
- `code.byted.org/overpass/bytedance_videoarch_compound`
- `code.byted.org/overpass/toutiao_videoarch_video_data_access`
- `code.byted.org/paas/cloud-sdk-go`
- `code.byted.org/sre/bytetree_go_sdk`
- `code.byted.org/videoarch/account-sdk`
- `code.byted.org/videoarch/bktmeta-sdk-go`
- `code.byted.org/videoarch/caesar_config`
- `code.byted.org/videoarch/cloud_gopkg`
- `code.byted.org/videoarch/general_file_manager_go`
- `code.byted.org/videoarch/iamsdk`
- `code.byted.org/videoarch/mdap_auth`
- `code.byted.org/videoarch/uploader_v5`
- `code.byted.org/videoarch/vvid`
- `github.com/agiledragon/gomonkey/v2`
- `github.com/apache/thrift`
- `github.com/bytedance/sonic`
- `github.com/cloudwego/hertz`
- `github.com/kr/pretty`
- `github.com/niemeyer/pretty`
- `github.com/stretchr/testify`
- `gopkg.in/yaml.v3`
- `code.byted.org/aiops/apm_vendor_byted`
- `code.byted.org/aiops/metrics_codec`
- `code.byted.org/aiops/monitoring-common-go`
- `code.byted.org/bytedtrace-contrib/kitex-go`
- `code.byted.org/bytedtrace/bytedtrace-client-go`
- `code.byted.org/bytedtrace/bytedtrace-common/go`
- `code.byted.org/bytedtrace/bytedtrace-conf-provider-client-go`
- `code.byted.org/bytedtrace/bytedtrace-gls-switch`
- `code.byted.org/bytedtrace/http-client-trace-wrapper`
- `code.byted.org/bytedtrace/interface-go`
- `code.byted.org/bytedtrace/serializer-go`
- `code.byted.org/cpputil/model`
- `code.byted.org/golf/consul`
- `code.byted.org/gopkg/apm_vendor_interface`
- `code.byted.org/gopkg/asyncache`
- `code.byted.org/gopkg/asynccache`
- `code.byted.org/gopkg/circuitbreaker`
- `code.byted.org/gopkg/debug`
- `code.byted.org/gopkg/etcd_util`
- `code.byted.org/gopkg/etcdproxy`
- `code.byted.org/gopkg/logs/v2`
- `code.byted.org/gopkg/metainfo`
- `code.byted.org/gopkg/metrics`
- `code.byted.org/gopkg/metrics/v4`
- `code.byted.org/gopkg/metrics_core`
- `code.byted.org/gopkg/net2`
- `code.byted.org/gopkg/pkg`
- `code.byted.org/gopkg/stats`
- `code.byted.org/gopkg/thrift`
- `code.byted.org/gopkg/tos`
- `code.byted.org/hystrix/hystrix-go`
- `code.byted.org/iespkg/bytedkits-go/goext`
- `code.byted.org/iespkg/retry-go`
- `code.byted.org/inf/authcenter`
- `code.byted.org/inf/sarama`
- `code.byted.org/kite/endpoint`
- `code.byted.org/kite/kitc`
- `code.byted.org/kite/kitutil`
- `code.byted.org/kite/rpal`
- `code.byted.org/kitex/apache_monitor`

## 维护建议

- 目录依赖次数高的位置通常是稳定接口或耦合热点，修改前先检查调用方。
- 跨服务 SDK、RPC/Overpass、Redis/HDFS/TOS 这类依赖通常是运行时风险点，应优先补充集成测试或 mock。
- 生成代码目录如 `kitex_gen` 通常不应作为业务逻辑入口阅读。
