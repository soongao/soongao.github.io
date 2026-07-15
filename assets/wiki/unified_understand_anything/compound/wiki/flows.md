# 关键流程
> 项目：`compound`。本页由当前 Codex 会话基于 GitNexus 索引元信息和 `.ua/knowledge-graph.json` 生成。
> GitNexus processes：300## 导览路径

## 1. 核心层

阅读这些节点以理解 核心层 中的职责、依赖关系和主要文件。

- `.githooks/pre-commit` (file)
- `.ua/.understandignore` (file)
- `fuxi/core/consts/consts.go` (file)
- `fuxi/core/consts/idx_update_resp/base/base.go` (file)
- `fuxi/core/iface/test_iface/meta_storage_test.go` (file)
- `fuxi/core/storage/test_storage/storagegw_test.go` (file)
- `fuxi/fuxi_admin/.hertztool` (file)
- `fuxi/fuxi_admin/build.sh` (file)
- `fuxi/fuxi_admin/cmd/gorm_generate.go` (file)
- `fuxi/fuxi_admin/main.go` (file)
- `fuxi/fuxi_admin/router_gen.go` (file)
- `fuxi/fuxi_admin/router.go` (file)
- `fuxi/fuxi_admin/script/bootstrap.sh` (file)
- `idl/abase/abase.thrift` (file)
- `idl/base.thrift` (file)
- `idl/compound.thrift` (file)
- `idl/mdap_model.thrift` (file)
- `idl/mdap_service.thrift` (file)

## 2. 外部集成层

阅读这些节点以理解 外部集成层 中的职责、依赖关系和主要文件。

- `fuxi/client/compound/test_compound/compound_test.go` (file)
- `fuxi/client/oda/test_oda/oda_test.go` (file)
- `fuxi/client/abase/abase_test.go` (file)
- `fuxi/client/abase/abase.go` (file)
- `fuxi/client/account/account_test.go` (file)
- `fuxi/client/account/account.go` (file)
- `fuxi/client/admin/admin_test.go` (file)
- `fuxi/client/admin/admin.go` (file)
- `fuxi/client/admin/reg_attr_index_test.go` (file)
- `fuxi/client/admin/reg_attr_index.go` (file)
- `fuxi/client/bktmeta/bktmeta.go` (file)
- `fuxi/client/compound/compound.go` (file)
- `fuxi/client/doc/bulkwrite_test.go` (file)
- `fuxi/client/doc/bytedoc.go` (file)
- `fuxi/client/doc/find_one_and_update_test.go` (file)
- `fuxi/client/doc/find_one_and_update.go` (file)
- `fuxi/client/doc/utils_test.go` (file)
- `fuxi/client/doc/utils.go` (file)

## 3. 工具层

阅读这些节点以理解 工具层 中的职责、依赖关系和主要文件。

- `fuxi/comm/utils/cache/test_cache/local_test.go` (file)
- `fuxi/comm/utils/comm/test_comm/common_test.go` (file)
- `fuxi/comm/utils/comm/test_comm/ctx_test.go` (file)
- `fuxi/comm/utils/comm/test_comm/storage_test.go` (file)
- `fuxi/comm/utils/limiter/mutable_parallel_limit.go` (file)
- `fuxi/comm/utils/limiter/slide_window_percentage_limiter.go` (file)
- `fuxi/comm/utils/test_utils/kitex_gen/comm/helloservice/client.go` (file)
- `fuxi/comm/utils/test_utils/kitex_gen/comm/helloservice/helloservice.go` (file)
- `fuxi/comm/utils/test_utils/kitex_gen/comm/helloservice/server.go` (file)
- `fuxi/comm/utils/test_utils/mine/mine.go` (file)
- `fuxi/comm/utils/uuid/type1.go` (file)
- `fuxi/core/utils/params/test_params/params_test.go` (file)
- `fuxi/comm/utils/limiter/mutable_parallel_limit_test.go` (file)
- `fuxi/comm/utils/limiter/slide_window_percentage_limiter_test.go` (file)
- `fuxi/comm/utils/test_utils/mine/mine_test.go` (file)
- `fuxi/comm/utils/maps/maps.go` (file)
- `fuxi/comm/utils/maps/sorted_map.go` (file)
- `fuxi/comm/utils/maps/tree_map.go` (file)

## 4. 服务层

阅读这些节点以理解 服务层 中的职责、依赖关系和主要文件。

- `fuxi/core/service/idx/archive/docs/tla/IdxFlawA.tla` (file)
- `fuxi/core/service/idx/archive/docs/tla/IdxFlawB.tla` (file)
- `fuxi/core/service/idx/archive/docs/tla/IdxFlawC.tla` (file)
- `fuxi/core/service/idx/archive/docs/tla/IdxFlawD.tla` (file)
- `fuxi/core/service/idx/archive/docs/tla/IdxLiveness.tla` (file)
- `fuxi/core/service/idx/reconcile/applier.go` (file)
- `fuxi/core/service/idx/reconcile/checkpoint_bytedoc_test.go` (file)
- `fuxi/core/service/idx/reconcile/checkpoint.go` (file)
- `fuxi/core/service/idx/reconcile/doc.go` (file)
- `fuxi/core/service/idx/reconcile/docstore.go` (file)
- `fuxi/core/service/idx/reconcile/lock_bytedoc_test.go` (file)
- `fuxi/core/service/idx/reconcile/lock.go` (file)
- `fuxi/core/service/idx/reconcile/offline/offline.go` (file)
- `fuxi/core/service/idx/reconcile/offline/placeholder.go` (file)
- `fuxi/core/service/idx/reconcile/types.go` (file)
- `fuxi/core/service/test_service/index_test.go` (file)
- `fuxi/core/service/test_service/meta_test.go` (file)
- `fuxi/core/service/idx/reconcile/applier_test.go` (file)

## 5. 界面层

阅读这些节点以理解 界面层 中的职责、依赖关系和主要文件。

- `fuxi/core/utils/view/sql.go` (file)
- `fuxi/core/utils/view/sql_test.go` (file)

## 6. 接口层

阅读这些节点以理解 接口层 中的职责、依赖关系和主要文件。

- `handler/test_handler/handler_bytedoc_dollar_and_test.go` (file)
- `handler/test_handler/handler_gsi_direct_test.go` (file)
- `handler/test_handler/handler_gsi_test.go` (file)
- `handler/test_handler/handler_test.go` (file)
- `handler/test_handler/mocka_prepare_test.go` (file)
- `handler/test_handler/ttl_test.go` (file)
- `fuxi/fuxi_admin/biz/handler/collection_uniqueness_simple_bucket_test.go` (file)
- `fuxi/fuxi_admin/biz/handler/collection_uniqueness.go` (file)
- `fuxi/fuxi_admin/biz/handler/configurationsHandler.go` (file)
- `fuxi/fuxi_admin/biz/handler/ping.go` (file)
- `fuxi/fuxi_admin/biz/handler/schemaBindingsHandler.go` (file)
- `fuxi/fuxi_admin/biz/handler/schemaDefinitionsHandler.go` (file)
- `fuxi/fuxi_admin/biz/handler/schemaHandler.go` (file)
- `fuxi/fuxi_admin/biz/handler/collection_uniqueness_test.go` (file)
- `fuxi/fuxi_admin/biz/handler/configurationsHandler_test.go` (file)
- `fuxi/fuxi_admin/biz/handler/schemaBindingsHandler_test.go` (file)
- `fuxi/fuxi_admin/biz/handler/schemaDefinitionsHandler_test.go` (file)
- `fuxi/fuxi_admin/biz/handler/schemaHandler_test.go` (file)

## 7. 测试层

阅读这些节点以理解 测试层 中的职责、依赖关系和主要文件。

- `fuxi/core/test/storage.go` (file)
- `fuxi/core/test/test_common.go` (file)

## 8. 配置层

阅读这些节点以理解 配置层 中的职责、依赖关系和主要文件。

- `fuxi/fuxi_admin/config/validator.go` (file)
- `fuxi/fuxi_admin/config/validator_test.go` (file)
- `fuxi/fuxi_admin/configs/config.go` (file)
- `fuxi/fuxi_admin/configs/tcc.go` (file)
- `fuxi/fuxi_admin/configs/config_test.go` (file)
- `fuxi/core/config/constant.go` (file)
- `fuxi/core/config/keys.go` (file)
- `fuxi/core/config/structs.go` (file)

## 9. 中间件层

阅读这些节点以理解 中间件层 中的职责、依赖关系和主要文件。

- `fuxi/fuxi_admin/middleware/federation_proxy.go` (file)
- `fuxi/fuxi_admin/middleware/log.go` (file)

## 10. 数据层

阅读这些节点以理解 数据层 中的职责、依赖关系和主要文件。

- `fuxi/fuxi_admin/schema/interface.go` (file)
- `fuxi/fuxi_admin/schema/schema_manager.go` (file)
- `fuxi/fuxi_admin/schema/schema.go` (file)
- `fuxi/fuxi_admin/schema/schema_test.go` (file)
- `fuxi/fuxi_admin/dal/model/attr_schema.gen.go` (file)
- `fuxi/fuxi_admin/dal/model/configurations.gen.go` (file)
- `fuxi/fuxi_admin/dal/model/provider_setting.gen.go` (file)
- `fuxi/fuxi_admin/dal/model/schema_bindings.gen.go` (file)
- `fuxi/fuxi_admin/dal/model/schema_definitions.gen.go` (file)
- `fuxi/core/consts/entity/attr_value_test.go` (file)
- `fuxi/core/consts/entity/attr_value.go` (file)
- `fuxi/core/consts/entity/bucket_test.go` (file)
- `fuxi/core/consts/entity/bucket.go` (file)
- `fuxi/core/consts/entity/event.go` (file)
- `fuxi/core/consts/entity/idx_test.go` (file)
- `fuxi/core/consts/entity/idx.go` (file)
- `fuxi/core/consts/entity/idxcolval_test.go` (file)
- `fuxi/core/consts/entity/idxcolval.go` (file)

## 11. 支撑组件

阅读这些节点以理解 Supporting Components 中的职责、依赖关系和主要文件。

- `.bytedev/unit_test.yaml` (config)
- `.codebase/apps.yaml` (config)
- `.codebase/pipelines/ci.yaml` (config)
- `.codebase/pipelines/log_analysis.yaml` (config)
- `.ua/config.json` (config)
- `AGENTS.md` (document)
- `CLAUDE.md` (document)
- `conf/compound/base.yml` (config)
- `conf/compound/kitex.yml` (config)
- `conf/service_inline_config.yaml` (config)
- `constitution.md` (document)
- `docs/AGENTS.md` (document)
- `docs/api/api-reference.md` (document)
- `docs/api/README.md` (document)
- `docs/architecture/architecture-detailed.md` (document)
- `docs/architecture/business-logic.md` (document)
- `docs/architecture/configuration.md` (document)
- `docs/architecture/data-flow.md` (document)

## 代表性关系

| 关系 | 源 | 目标 |
| --- | --- | --- |
| imports | fuxi/client/abase/abase_test.go | fuxi/core/iface/iface.go |
| imports | fuxi/client/abase/abase_test.go | fuxi/core/utils/shield/shield_test.go |
| imports | fuxi/client/abase/abase_test.go | fuxi/core/utils/shield/shield.go |
| imports | fuxi/client/abase/abase_test.go | fuxi/core/utils/vers/version_test.go |
| imports | fuxi/client/abase/abase_test.go | fuxi/core/utils/vers/version.go |
| imports | fuxi/client/abase/abase_test.go | kitex_gen/bytedance/videoarch/compound/compound.go |
| imports | fuxi/client/abase/abase_test.go | kitex_gen/bytedance/videoarch/compound/k-compound.go |
| imports | fuxi/client/abase/abase_test.go | kitex_gen/bytedance/videoarch/compound/k-consts.go |
| imports | fuxi/client/abase/abase.go | fuxi/comm/utils/comm/common.go |
| imports | fuxi/client/abase/abase.go | fuxi/comm/utils/comm/ctx.go |
| imports | fuxi/client/abase/abase.go | fuxi/comm/utils/comm/storage.go |
| imports | fuxi/client/abase/abase.go | fuxi/comm/utils/errs/errs_test.go |
| imports | fuxi/client/abase/abase.go | fuxi/comm/utils/errs/errs.go |
| imports | fuxi/client/abase/abase.go | fuxi/comm/utils/strs/str.go |
| imports | fuxi/client/abase/abase.go | fuxi/comm/utils/timing/timing_test.go |
| imports | fuxi/client/abase/abase.go | fuxi/comm/utils/timing/timing.go |
| imports | fuxi/client/abase/abase.go | fuxi/core/consts/entity/attr_value_test.go |
| imports | fuxi/client/abase/abase.go | fuxi/core/consts/entity/attr_value.go |
| imports | fuxi/client/abase/abase.go | fuxi/core/consts/entity/bucket_test.go |
| imports | fuxi/client/abase/abase.go | fuxi/core/consts/entity/bucket.go |
| imports | fuxi/client/abase/abase.go | fuxi/core/consts/entity/event.go |
| imports | fuxi/client/abase/abase.go | fuxi/core/consts/entity/idx_test.go |
| imports | fuxi/client/abase/abase.go | fuxi/core/consts/entity/idx.go |
| imports | fuxi/client/abase/abase.go | fuxi/core/consts/entity/idxcolval_test.go |
| imports | fuxi/client/abase/abase.go | fuxi/core/consts/entity/idxcolval.go |
| imports | fuxi/client/abase/abase.go | fuxi/core/consts/entity/meta.go |
| imports | fuxi/client/abase/abase.go | fuxi/core/consts/entity/scope.go |
| imports | fuxi/client/abase/abase.go | fuxi/core/consts/entity/storage.go |
| imports | fuxi/client/abase/abase.go | fuxi/core/iface/iface.go |
| imports | fuxi/client/abase/abase.go | fuxi/core/serializer/kv_test.go |
| imports | fuxi/client/abase/abase.go | fuxi/core/serializer/kv.go |
| imports | fuxi/client/abase/abase.go | fuxi/core/utils/shield/shield_test.go |
| imports | fuxi/client/abase/abase.go | fuxi/core/utils/shield/shield.go |
| imports | fuxi/client/abase/abase.go | fuxi/core/utils/vers/version_test.go |
| imports | fuxi/client/abase/abase.go | fuxi/core/utils/vers/version.go |
| imports | fuxi/client/account/account.go | fuxi/comm/utils/errs/errs_test.go |
| imports | fuxi/client/account/account.go | fuxi/comm/utils/errs/errs.go |
| imports | fuxi/client/account/account.go | kitex_gen/bytedance/videoarch/compound/mdap/k-consts.go |
| imports | fuxi/client/account/account.go | kitex_gen/bytedance/videoarch/compound/mdap/k-mdap_service.go |
| imports | fuxi/client/account/account.go | kitex_gen/bytedance/videoarch/compound/mdap/mdap_service.go |
| imports | fuxi/client/admin/admin_test.go | fuxi/core/consts/entity/attr_value_test.go |
| imports | fuxi/client/admin/admin_test.go | fuxi/core/consts/entity/attr_value.go |
| imports | fuxi/client/admin/admin_test.go | fuxi/core/consts/entity/bucket_test.go |
| imports | fuxi/client/admin/admin_test.go | fuxi/core/consts/entity/bucket.go |
| imports | fuxi/client/admin/admin_test.go | fuxi/core/consts/entity/event.go |
| imports | fuxi/client/admin/admin_test.go | fuxi/core/consts/entity/idx_test.go |
| imports | fuxi/client/admin/admin_test.go | fuxi/core/consts/entity/idx.go |
| imports | fuxi/client/admin/admin_test.go | fuxi/core/consts/entity/idxcolval_test.go |
| imports | fuxi/client/admin/admin_test.go | fuxi/core/consts/entity/idxcolval.go |
| imports | fuxi/client/admin/admin_test.go | fuxi/core/consts/entity/meta.go |
| imports | fuxi/client/admin/admin_test.go | fuxi/core/consts/entity/scope.go |
| imports | fuxi/client/admin/admin_test.go | fuxi/core/consts/entity/storage.go |
| imports | fuxi/client/admin/admin_test.go | fuxi/core/utils/cctx/cctx_test.go |
| imports | fuxi/client/admin/admin_test.go | fuxi/core/utils/cctx/cctx.go |
| imports | fuxi/client/admin/admin_test.go | kitex_gen/bytedance/videoarch/compound/compound.go |
| imports | fuxi/client/admin/admin_test.go | kitex_gen/bytedance/videoarch/compound/k-compound.go |
| imports | fuxi/client/admin/admin_test.go | kitex_gen/bytedance/videoarch/compound/k-consts.go |
| imports | fuxi/client/admin/admin.go | fuxi/core/consts/entity/attr_value_test.go |
| imports | fuxi/client/admin/admin.go | fuxi/core/consts/entity/attr_value.go |
| imports | fuxi/client/admin/admin.go | fuxi/core/consts/entity/bucket_test.go |
| imports | fuxi/client/admin/admin.go | fuxi/core/consts/entity/bucket.go |
| imports | fuxi/client/admin/admin.go | fuxi/core/consts/entity/event.go |
| imports | fuxi/client/admin/admin.go | fuxi/core/consts/entity/idx_test.go |
| imports | fuxi/client/admin/admin.go | fuxi/core/consts/entity/idx.go |
| imports | fuxi/client/admin/admin.go | fuxi/core/consts/entity/idxcolval_test.go |
| imports | fuxi/client/admin/admin.go | fuxi/core/consts/entity/idxcolval.go |
| imports | fuxi/client/admin/admin.go | fuxi/core/consts/entity/meta.go |
| imports | fuxi/client/admin/admin.go | fuxi/core/consts/entity/scope.go |
| imports | fuxi/client/admin/admin.go | fuxi/core/consts/entity/storage.go |
| imports | fuxi/client/admin/admin.go | fuxi/core/utils/cctx/cctx_test.go |
| imports | fuxi/client/admin/admin.go | fuxi/core/utils/cctx/cctx.go |
| imports | fuxi/client/admin/admin.go | fuxi/core/utils/comm_test.go |
| imports | fuxi/client/admin/admin.go | fuxi/core/utils/comm.go |
| imports | fuxi/client/admin/admin.go | fuxi/core/utils/env.go |
| imports | fuxi/client/admin/admin.go | fuxi/core/utils/id.go |
| imports | fuxi/client/admin/admin.go | kitex_gen/bytedance/videoarch/compound/compound.go |
| imports | fuxi/client/admin/admin.go | kitex_gen/bytedance/videoarch/compound/k-compound.go |
| imports | fuxi/client/admin/admin.go | kitex_gen/bytedance/videoarch/compound/k-consts.go |
| imports | fuxi/client/admin/reg_attr_index_test.go | kitex_gen/bytedance/videoarch/compound/compound.go |
| imports | fuxi/client/admin/reg_attr_index_test.go | kitex_gen/bytedance/videoarch/compound/k-compound.go |
