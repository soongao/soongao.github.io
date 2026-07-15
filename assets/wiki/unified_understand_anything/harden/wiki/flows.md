# 关键流程
> 项目：`harden`。本页由当前 Codex 会话基于 GitNexus 索引元信息和 `.ua/knowledge-graph.json` 生成。
> GitNexus processes：50## 导览路径

## 1. 核心层

阅读这些节点以理解 核心层 中的职责、依赖关系和主要文件。

- `.ua/.understandignore` (file)
- `script/bootstrap.sh` (file)
- `script/settings.py` (file)
- `udpserver/protocol/gen_proto.sh` (file)
- `build.sh` (file)
- `main.go` (file)
- `conRemote/baseInfo.go` (file)
- `conRemote/concurrentBase.go` (file)
- `conRemote/config.go` (file)
- `conRemote/enter.go` (file)
- `conRemote/leave.go` (file)
- `conRemote/uuidsBase.go` (file)
- `remote/baseInfo.go` (file)
- `remote/isThrottled.go` (file)
- `remote/rateLimit.go` (file)
- `remote/sync.go` (file)
- `remote/v2/get_all_token_buckets.go` (file)
- `remote/v2/rate_limit.go` (file)

## 2. 中间件层

阅读这些节点以理解 中间件层 中的职责、依赖关系和主要文件。

- `middleware/group_middleware.go` (file)

## 3. 配置层

阅读这些节点以理解 配置层 中的职责、依赖关系和主要文件。

- `config/config.go` (file)

## 4. 支撑组件

阅读这些节点以理解 Supporting Components 中的职责、依赖关系和主要文件。

- `.codebase/pipelines/ci.yaml` (config)
- `.codebase/pipelines/footprint_scan_field.yml` (config)
- `.codebase/pipelines/log_analysis.yaml` (config)
- `.ua/config.json` (config)
- `conf/alinc2.prod.yml` (config)
- `conf/base.yml` (config)
- `conf/boe.staging.default_tob_bp.yml` (config)
- `conf/boe.staging.yml` (config)
- `conf/boe.unit_test.yml` (config)
- `conf/boei18n.staging.default_tob.yml` (config)
- `conf/boei18n.staging.yml` (config)
- `conf/boei18n.yml` (config)
- `conf/hl.prod.default_tob.yml` (config)
- `conf/hl.prod.default.yml` (config)
- `conf/hl.prod.transcode.yml` (config)
- `conf/hl.prod.unit_test.yml` (config)
- `conf/hl.prod.vframe.yml` (config)
- `conf/hl.prod.yml` (config)

## 代表性关系

| 关系 | 源 | 目标 |
| --- | --- | --- |
| imports | addr/addr.go | consistent/consistent_test.go |
| imports | addr/addr.go | consistent/consistent.go |
| imports | addr/addr.go | consistent/example_test.go |
| imports | addr/addr.go | metrics/metrics.go |
| imports | conRemote/concurrentBase.go | metrics/metrics.go |
| imports | conRemote/config.go | metrics/metrics.go |
| imports | conRemote/enter.go | metrics/metrics.go |
| imports | conRemote/leave.go | metrics/metrics.go |
| imports | conRemote/uuidsBase.go | metrics/metrics.go |
| imports | main.go | config/config.go |
| imports | main.go | conRemote/baseInfo.go |
| imports | main.go | conRemote/concurrentBase.go |
| imports | main.go | conRemote/config.go |
| imports | main.go | conRemote/enter.go |
| imports | main.go | conRemote/leave.go |
| imports | main.go | conRemote/uuidsBase.go |
| imports | main.go | metrics/metrics.go |
| imports | main.go | middleware/group_middleware.go |
| imports | main.go | remote/baseInfo.go |
| imports | main.go | remote/isThrottled.go |
| imports | main.go | remote/rateLimit.go |
| imports | main.go | remote/sync.go |
| imports | main.go | remote/v2/get_all_token_buckets.go |
| imports | main.go | remote/v2/rate_limit.go |
| imports | main.go | remote/v2/sync.go |
| imports | main.go | syncer/base.go |
| imports | main.go | syncer/init.go |
| imports | main.go | syncer/pack.go |
| imports | main.go | syncer/sdk.go |
| imports | main.go | syncer/send.go |
| imports | main.go | syncer/v2/base.go |
| imports | main.go | syncer/v2/init.go |
| imports | main.go | syncer/v2/pack.go |
| imports | main.go | syncer/v2/sdk.go |
| imports | main.go | syncer/v2/send.go |
| imports | main.go | tcc/tcc.go |
| imports | main.go | tokens/group_test.go |
| imports | main.go | tokens/group.go |
| imports | main.go | udpserver/server.go |
| imports | main.go | udpserver/stackprinter.go |
| imports | metrics/metrics.go | config/config.go |
| imports | metrics/metrics.go | tcc/tcc.go |
| imports | remote/isThrottled.go | metrics/metrics.go |
| imports | remote/isThrottled.go | token/token_bucket_test.go |
| imports | remote/isThrottled.go | token/token_bucket.go |
| imports | remote/isThrottled.go | tokens/group_test.go |
| imports | remote/isThrottled.go | tokens/group.go |
| imports | remote/rateLimit.go | metrics/metrics.go |
| imports | remote/rateLimit.go | syncer/base.go |
| imports | remote/rateLimit.go | syncer/init.go |
| imports | remote/rateLimit.go | syncer/pack.go |
| imports | remote/rateLimit.go | syncer/sdk.go |
| imports | remote/rateLimit.go | syncer/send.go |
| imports | remote/rateLimit.go | token/token_bucket_test.go |
| imports | remote/rateLimit.go | token/token_bucket.go |
| imports | remote/rateLimit.go | tokens/group_test.go |
| imports | remote/rateLimit.go | tokens/group.go |
| imports | remote/sync.go | metrics/metrics.go |
| imports | remote/sync.go | token/token_bucket_test.go |
| imports | remote/sync.go | token/token_bucket.go |
| imports | remote/sync.go | tokens/group_test.go |
| imports | remote/sync.go | tokens/group.go |
| imports | remote/sync.go | types/reserve.go |
| imports | remote/v2/get_all_token_buckets.go | tokens/group_test.go |
| imports | remote/v2/get_all_token_buckets.go | tokens/group.go |
| imports | remote/v2/rate_limit.go | metrics/metrics.go |
| imports | remote/v2/rate_limit.go | syncer/v2/base.go |
| imports | remote/v2/rate_limit.go | syncer/v2/init.go |
| imports | remote/v2/rate_limit.go | syncer/v2/pack.go |
| imports | remote/v2/rate_limit.go | syncer/v2/sdk.go |
| imports | remote/v2/rate_limit.go | syncer/v2/send.go |
| imports | remote/v2/rate_limit.go | token/token_bucket_test.go |
| imports | remote/v2/rate_limit.go | token/token_bucket.go |
| imports | remote/v2/rate_limit.go | tokens/group_test.go |
| imports | remote/v2/rate_limit.go | tokens/group.go |
| imports | remote/v2/sync.go | metrics/metrics.go |
| imports | remote/v2/sync.go | token/token_bucket_test.go |
| imports | remote/v2/sync.go | token/token_bucket.go |
| imports | remote/v2/sync.go | tokens/group_test.go |
| imports | remote/v2/sync.go | tokens/group.go |
