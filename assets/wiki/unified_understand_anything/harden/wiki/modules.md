# 关键模块
> 项目：`harden`。本页由当前 Codex 会话基于 GitNexus 索引元信息和 `.ua/knowledge-graph.json` 生成。
> GitNexus clusters：30本页按顶层目录组织模块视图，适合快速定位职责边界。

## conf

该目录包含 39 个文件级节点。类型分布：config: 39。

- `conf/alinc2.prod.yml`：conf/alinc2.prod.yml 是 yaml config 文件。
- `conf/base.yml`：conf/base.yml 是 yaml config 文件。
- `conf/boe.staging.default_tob_bp.yml`：conf/boe.staging.default_tob_bp.yml 是 yaml config 文件。
- `conf/boe.staging.yml`：conf/boe.staging.yml 是 yaml config 文件。
- `conf/boe.unit_test.yml`：conf/boe.unit_test.yml 是 yaml config 文件。
- `conf/boei18n.staging.default_tob.yml`：conf/boei18n.staging.default_tob.yml 是 yaml config 文件。
- `conf/boei18n.staging.yml`：conf/boei18n.staging.yml 是 yaml config 文件。
- `conf/boei18n.yml`：conf/boei18n.yml 是 yaml config 文件。
- `conf/hl.prod.default_tob.yml`：conf/hl.prod.default_tob.yml 是 yaml config 文件。
- `conf/hl.prod.default.yml`：conf/hl.prod.default.yml 是 yaml config 文件。
- `conf/hl.prod.transcode.yml`：conf/hl.prod.transcode.yml 是 yaml config 文件。
- `conf/hl.prod.unit_test.yml`：conf/hl.prod.unit_test.yml 是 yaml config 文件。
- `conf/hl.prod.vframe.yml`：conf/hl.prod.vframe.yml 是 yaml config 文件。
- `conf/hl.prod.yml`：conf/hl.prod.yml 是 yaml config 文件。
- `conf/lf.prod.default_tob.yml`：conf/lf.prod.default_tob.yml 是 yaml config 文件。
- `conf/lf.prod.default.yml`：conf/lf.prod.default.yml 是 yaml config 文件。

## syncer

该目录包含 10 个文件级节点。类型分布：file: 10。

- `syncer/base.go`：syncer/base.go 是 go code 文件，包含 1 个类型/类。
- `syncer/init.go`：syncer/init.go 是 go code 文件，包含 3 个函数。
- `syncer/pack.go`：syncer/pack.go 是 go code 文件，包含 3 个函数。
- `syncer/sdk.go`：syncer/sdk.go 是 go code 文件，包含 2 个函数。
- `syncer/send.go`：syncer/send.go 是 go code 文件，包含 1 个函数。
- `syncer/v2/base.go`：syncer/v2/base.go 是 go code 文件，包含 1 个类型/类。
- `syncer/v2/init.go`：syncer/v2/init.go 是 go code 文件，包含 3 个函数。
- `syncer/v2/pack.go`：syncer/v2/pack.go 是 go code 文件，包含 2 个函数。
- `syncer/v2/sdk.go`：syncer/v2/sdk.go 是 go code 文件，包含 1 个函数。
- `syncer/v2/send.go`：syncer/v2/send.go 是 go code 文件，包含 1 个函数。

## udpserver

该目录包含 9 个文件级节点。类型分布：schema: 5，file: 4。

- `udpserver/protocol/gen_proto.sh`：udpserver/protocol/gen_proto.sh 是 shell script 文件。
- `udpserver/protocol/payload.pb.go`：udpserver/protocol/payload.pb.go 是 go code 文件，包含 53 个函数、8 个类型/类。
- `udpserver/protocol/payload.proto`：udpserver/protocol/payload.proto 是 protobuf data 文件，包含 4 个定义。
- `udpserver/protocol/payload.proto`：message: ReserveNRequest (6 fields)
- `udpserver/protocol/payload.proto`：message: ReserveNResponse (1 fields)
- `udpserver/protocol/payload.proto`：message: Request (1 fields)
- `udpserver/protocol/payload.proto`：message: Response (1 fields)
- `udpserver/server.go`：udpserver/server.go 是 go code 文件，包含 4 个函数、1 个类型/类。
- `udpserver/stackprinter.go`：udpserver/stackprinter.go 是 go code 文件，包含 3 个函数。

## remote

该目录包含 7 个文件级节点。类型分布：file: 7。

- `remote/baseInfo.go`：remote/baseInfo.go 是 go code 文件。
- `remote/isThrottled.go`：remote/isThrottled.go 是 go code 文件，包含 1 个函数。
- `remote/rateLimit.go`：remote/rateLimit.go 是 go code 文件，包含 1 个函数。
- `remote/sync.go`：remote/sync.go 是 go code 文件，包含 1 个函数。
- `remote/v2/get_all_token_buckets.go`：remote/v2/get_all_token_buckets.go 是 go code 文件，包含 1 个函数。
- `remote/v2/rate_limit.go`：remote/v2/rate_limit.go 是 go code 文件，包含 1 个函数。
- `remote/v2/sync.go`：remote/v2/sync.go 是 go code 文件，包含 1 个函数。

## conRemote

该目录包含 6 个文件级节点。类型分布：file: 6。

- `conRemote/baseInfo.go`：conRemote/baseInfo.go 是 go code 文件，包含 3 个类型/类。
- `conRemote/concurrentBase.go`：conRemote/concurrentBase.go 是 go code 文件，包含 3 个函数。
- `conRemote/config.go`：conRemote/config.go 是 go code 文件，包含 3 个函数。
- `conRemote/enter.go`：conRemote/enter.go 是 go code 文件，包含 3 个函数。
- `conRemote/leave.go`：conRemote/leave.go 是 go code 文件，包含 1 个函数。
- `conRemote/uuidsBase.go`：conRemote/uuidsBase.go 是 go code 文件，包含 5 个函数。

## .

该目录包含 5 个文件级节点。类型分布：config: 2，file: 2，document: 1。

- `build.sh`：build.sh 是 shell script 文件。
- `go.mod`：go.mod 是 mod config 文件。
- `go.sum`：go.sum 是 sum config 文件。
- `main.go`：main.go 是 go code 文件，包含 1 个函数。
- `README.md`：README.md 是 markdown docs 文件。

## consistent

该目录包含 4 个文件级节点。类型分布：file: 3，document: 1。

- `consistent/consistent_test.go`：consistent/consistent_test.go 是 go code 文件，包含 37 个函数、1 个类型/类。
- `consistent/consistent.go`：consistent/consistent.go 是 go code 文件，包含 18 个函数、1 个类型/类。
- `consistent/example_test.go`：consistent/example_test.go 是 go code 文件，包含 3 个函数。
- `consistent/README.md`：consistent/README.md 是 markdown docs 文件。

## .codebase

该目录包含 3 个文件级节点。类型分布：config: 3。

- `.codebase/pipelines/ci.yaml`：.codebase/pipelines/ci.yaml 是 yaml config 文件。
- `.codebase/pipelines/footprint_scan_field.yml`：.codebase/pipelines/footprint_scan_field.yml 是 yaml config 文件。
- `.codebase/pipelines/log_analysis.yaml`：.codebase/pipelines/log_analysis.yaml 是 yaml config 文件。

## addr

该目录包含 3 个文件级节点。类型分布：file: 3。

- `addr/addr_test.go`：addr/addr_test.go 是 go code 文件，包含 1 个函数。
- `addr/addr.go`：addr/addr.go 是 go code 文件，包含 8 个函数、2 个类型/类。
- `addr/get_addr.go`：addr/get_addr.go 是 go code 文件，包含 1 个函数。

## .ua

该目录包含 2 个文件级节点。类型分布：config: 1，file: 1。

- `.ua/.understandignore`：.ua/.understandignore 是 unknown code 文件。
- `.ua/config.json`：.ua/config.json 是 json config 文件。

## rate

该目录包含 2 个文件级节点。类型分布：file: 2。

- `rate/rate_test.go`：rate/rate_test.go 是 go code 文件，包含 35 个函数、3 个类型/类。
- `rate/rate.go`：rate/rate.go 是 go code 文件，包含 31 个函数、2 个类型/类。

## script

该目录包含 2 个文件级节点。类型分布：file: 2。

- `script/bootstrap.sh`：script/bootstrap.sh 是 shell script 文件。
- `script/settings.py`：script/settings.py 是 python code 文件。

## token

该目录包含 2 个文件级节点。类型分布：file: 2。

- `token/token_bucket_test.go`：token/token_bucket_test.go 是 go code 文件，包含 7 个函数。
- `token/token_bucket.go`：token/token_bucket.go 是 go code 文件，包含 21 个函数、7 个类型/类。

## tokens

该目录包含 2 个文件级节点。类型分布：file: 2。

- `tokens/group_test.go`：tokens/group_test.go 是 go code 文件，包含 1 个函数。
- `tokens/group.go`：tokens/group.go 是 go code 文件，包含 7 个函数。

## types

该目录包含 2 个文件级节点。类型分布：file: 2。

- `types/reserve.go`：types/reserve.go 是 go code 文件，包含 2 个类型/类。
- `types/v2/sync_struct.go`：types/v2/sync_struct.go 是 go code 文件，包含 2 个类型/类。

## config

该目录包含 1 个文件级节点。类型分布：file: 1。

- `config/config.go`：config/config.go 是 go code 文件，包含 1 个函数、1 个类型/类。

## metrics

该目录包含 1 个文件级节点。类型分布：file: 1。

- `metrics/metrics.go`：metrics/metrics.go 是 go code 文件，包含 10 个函数。

## middleware

该目录包含 1 个文件级节点。类型分布：file: 1。

- `middleware/group_middleware.go`：middleware/group_middleware.go 是 go code 文件，包含 1 个函数。

## tcc

该目录包含 1 个文件级节点。类型分布：file: 1。

- `tcc/tcc.go`：tcc/tcc.go 是 go code 文件，包含 4 个函数、1 个类型/类。
