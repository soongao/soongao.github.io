# 关键流程
> 项目：`general_console`。本页由当前 Codex 会话基于 GitNexus 索引元信息和 `.ua/knowledge-graph.json` 生成。
> GitNexus processes：269## 导览路径

## 1. 核心层

阅读这些节点以理解 核心层 中的职责、依赖关系和主要文件。

- `.hertztool` (file)
- `.ua/.understandignore` (file)
- `biz/base.thrift` (file)
- `biz/dal/.gitkeep` (file)
- `biz/idl/object_duplication_manager.thrift` (file)
- `build.sh` (file)
- `main.go` (file)
- `router_gen.go` (file)
- `router.go` (file)
- `script/bootstrap.sh` (file)
- `router_test.go` (file)
- `biz/rpc/bktmeta.go` (file)
- `biz/rpc/nontt_tos.go` (file)
- `biz/rpc/bktmeta_test.go` (file)
- `biz/rpc/nontt_tos_test.go` (file)
- `biz/idl/kitex_gen/bytedance/videoarch/object_duplication_manager/objectduplicationmanager/client.go` (file)
- `biz/idl/kitex_gen/bytedance/videoarch/object_duplication_manager/objectduplicationmanager/invoker.go` (file)
- `biz/idl/kitex_gen/bytedance/videoarch/object_duplication_manager/objectduplicationmanager/objectduplicationmanager.go` (file)

## 2. 服务层

阅读这些节点以理解 服务层 中的职责、依赖关系和主要文件。

- `biz/service/.gitkeep` (file)

## 3. 接口层

阅读这些节点以理解 接口层 中的职责、依赖关系和主要文件。

- `biz/handler/account.go` (file)
- `biz/handler/authorize.go` (file)
- `biz/handler/base_test.go` (file)
- `biz/handler/bpm.go` (file)
- `biz/handler/config.go` (file)
- `biz/handler/domain.go` (file)
- `biz/handler/general.go` (file)
- `biz/handler/mdap_artifact.go` (file)
- `biz/handler/mdap_asset_group.go` (file)
- `biz/handler/mdap_clients.go` (file)
- `biz/handler/mdap_grant_space_role.go` (file)
- `biz/handler/mdap_processing_task.go` (file)
- `biz/handler/mdap_source_hive_tqs.go` (file)
- `biz/handler/mdap_source_hive.go` (file)
- `biz/handler/mdap_source.go` (file)
- `biz/handler/mdap_space.go` (file)
- `biz/handler/mdap.go` (file)
- `biz/handler/object.go` (file)

## 4. 中间件层

阅读这些节点以理解 中间件层 中的职责、依赖关系和主要文件。

- `biz/middleware/base.go` (file)
- `biz/middleware/mdap_response_test.go` (file)
- `biz/middleware/parse_mdap_auth.go` (file)
- `biz/middleware/base_test.go` (file)
- `biz/middleware/parse_mdap_auth_test.go` (file)

## 5. 数据层

阅读这些节点以理解 数据层 中的职责、依赖关系和主要文件。

- `biz/model/bktmeta.go` (file)
- `biz/model/bpm_workflow.go` (file)
- `biz/model/tos.go` (file)

## 6. 工具层

阅读这些节点以理解 工具层 中的职责、依赖关系和主要文件。

- `biz/util/base_test.go` (file)
- `biz/util/ctx.go` (file)
- `biz/util/iam.go` (file)
- `biz/util/metrics.go` (file)
- `biz/util/ctx_test.go` (file)
- `biz/util/iam_test.go` (file)
- `biz/util/metrics_test.go` (file)

## 7. 配置层

阅读这些节点以理解 配置层 中的职责、依赖关系和主要文件。

- `biz/config/base_test.go` (file)
- `biz/config/config.go` (file)
- `biz/config/mysql.go` (file)
- `biz/config/tcc.go` (file)
- `biz/config/mysql_test.go` (file)
- `biz/config/tcc_test.go` (file)

## 8. 支撑组件

阅读这些节点以理解 Supporting Components 中的职责、依赖关系和主要文件。

- `.codebase/apps.yaml` (config)
- `.codebase/pipelines/ci.yaml` (config)
- `.codebase/pipelines/log_analysis.yaml` (config)
- `.ua/config.json` (config)
- `biz/dal/db/db.sql` (table)
- `conf/base.yml` (config)
- `conf/boe.staging.yml` (config)
- `conf/boe.test.yml` (config)
- `conf/boe.ut.yml` (config)
- `conf/boei18n.staging.yml` (config)
- `conf/config.yml` (config)
- `conf/gl2.prod.yml` (config)
- `conf/hertz.config.yaml` (config)
- `conf/hj.prod.yml` (config)
- `conf/hl.prod.yml` (config)
- `conf/ie.prod.yml` (config)
- `conf/jj.prod.yml` (config)
- `conf/lf.prod.yml` (config)

## 代表性关系

| 关系 | 源 | 目标 |
| --- | --- | --- |
| imports | biz/dal/dao/authority_test.go | biz/dal/dto/authority.go |
| imports | biz/dal/dao/authority.go | biz/dal/dto/authority.go |
| imports | biz/dal/dao/authority.go | biz/util/base_test.go |
| imports | biz/dal/dao/authority.go | biz/util/ctx_test.go |
| imports | biz/dal/dao/authority.go | biz/util/ctx.go |
| imports | biz/dal/dao/authority.go | biz/util/iam_test.go |
| imports | biz/dal/dao/authority.go | biz/util/iam.go |
| imports | biz/dal/dao/authority.go | biz/util/metrics_test.go |
| imports | biz/dal/dao/authority.go | biz/util/metrics.go |
| imports | biz/dal/dao/base_test.go | biz/config/base_test.go |
| imports | biz/dal/dao/base_test.go | biz/config/config.go |
| imports | biz/dal/dao/base_test.go | biz/config/mysql_test.go |
| imports | biz/dal/dao/base_test.go | biz/config/mysql.go |
| imports | biz/dal/dao/base_test.go | biz/config/tcc_test.go |
| imports | biz/dal/dao/base_test.go | biz/config/tcc.go |
| imports | biz/dal/dao/base_test.go | biz/util/base_test.go |
| imports | biz/dal/dao/base_test.go | biz/util/ctx_test.go |
| imports | biz/dal/dao/base_test.go | biz/util/ctx.go |
| imports | biz/dal/dao/base_test.go | biz/util/iam_test.go |
| imports | biz/dal/dao/base_test.go | biz/util/iam.go |
| imports | biz/dal/dao/base_test.go | biz/util/metrics_test.go |
| imports | biz/dal/dao/base_test.go | biz/util/metrics.go |
| imports | biz/dal/dao/db.go | biz/config/base_test.go |
| imports | biz/dal/dao/db.go | biz/config/config.go |
| imports | biz/dal/dao/db.go | biz/config/mysql_test.go |
| imports | biz/dal/dao/db.go | biz/config/mysql.go |
| imports | biz/dal/dao/db.go | biz/config/tcc_test.go |
| imports | biz/dal/dao/db.go | biz/config/tcc.go |
| imports | biz/errno/base_test.go | biz/config/base_test.go |
| imports | biz/errno/base_test.go | biz/config/config.go |
| imports | biz/errno/base_test.go | biz/config/mysql_test.go |
| imports | biz/errno/base_test.go | biz/config/mysql.go |
| imports | biz/errno/base_test.go | biz/config/tcc_test.go |
| imports | biz/errno/base_test.go | biz/config/tcc.go |
| imports | biz/errno/base_test.go | biz/dal/dao/authority_test.go |
| imports | biz/errno/base_test.go | biz/dal/dao/authority.go |
| imports | biz/errno/base_test.go | biz/dal/dao/base_test.go |
| imports | biz/errno/base_test.go | biz/dal/dao/db_test.go |
| imports | biz/errno/base_test.go | biz/dal/dao/db.go |
| imports | biz/errno/base_test.go | biz/dal/dao/utils_test.go |
| imports | biz/errno/base_test.go | biz/dal/dao/utils.go |
| imports | biz/errno/base_test.go | biz/util/base_test.go |
| imports | biz/errno/base_test.go | biz/util/ctx_test.go |
| imports | biz/errno/base_test.go | biz/util/ctx.go |
| imports | biz/errno/base_test.go | biz/util/iam_test.go |
| imports | biz/errno/base_test.go | biz/util/iam.go |
| imports | biz/errno/base_test.go | biz/util/metrics_test.go |
| imports | biz/errno/base_test.go | biz/util/metrics.go |
| imports | biz/handler/account.go | biz/errno/base_test.go |
| imports | biz/handler/account.go | biz/errno/error.go |
| imports | biz/handler/account.go | biz/errno/response_test.go |
| imports | biz/handler/account.go | biz/errno/response.go |
| imports | biz/handler/account.go | biz/middleware/base_test.go |
| imports | biz/handler/account.go | biz/middleware/base.go |
| imports | biz/handler/account.go | biz/middleware/mdap_response_test.go |
| imports | biz/handler/account.go | biz/middleware/parse_mdap_auth_test.go |
| imports | biz/handler/account.go | biz/middleware/parse_mdap_auth.go |
| imports | biz/handler/account.go | biz/util/base_test.go |
| imports | biz/handler/account.go | biz/util/ctx_test.go |
| imports | biz/handler/account.go | biz/util/ctx.go |
| imports | biz/handler/account.go | biz/util/iam_test.go |
| imports | biz/handler/account.go | biz/util/iam.go |
| imports | biz/handler/account.go | biz/util/metrics_test.go |
| imports | biz/handler/account.go | biz/util/metrics.go |
| imports | biz/handler/authorize.go | biz/config/base_test.go |
| imports | biz/handler/authorize.go | biz/config/config.go |
| imports | biz/handler/authorize.go | biz/config/mysql_test.go |
| imports | biz/handler/authorize.go | biz/config/mysql.go |
| imports | biz/handler/authorize.go | biz/config/tcc_test.go |
| imports | biz/handler/authorize.go | biz/config/tcc.go |
| imports | biz/handler/authorize.go | biz/dal/dto/authority.go |
| imports | biz/handler/authorize.go | biz/errno/base_test.go |
| imports | biz/handler/authorize.go | biz/errno/error.go |
| imports | biz/handler/authorize.go | biz/errno/response_test.go |
| imports | biz/handler/authorize.go | biz/errno/response.go |
| imports | biz/handler/authorize.go | biz/middleware/base_test.go |
| imports | biz/handler/authorize.go | biz/middleware/base.go |
| imports | biz/handler/authorize.go | biz/middleware/mdap_response_test.go |
| imports | biz/handler/authorize.go | biz/middleware/parse_mdap_auth_test.go |
| imports | biz/handler/authorize.go | biz/middleware/parse_mdap_auth.go |
