# 关键流程
> 项目：`bktmeta-api`。本页由当前 Codex 会话基于 GitNexus 索引元信息和 `.ua/knowledge-graph.json` 生成。
> GitNexus processes：155## 导览路径

## 1. 核心层

阅读这些节点以理解 核心层 中的职责、依赖关系和主要文件。

- `.ua/.understandignore` (file)
- `script/bootstrap.sh` (file)
- `script/pre_nginx.sh` (file)
- `script/settings.py` (file)
- `test.sh` (file)
- `build.sh` (file)
- `main.go` (file)
- `mem_limit/base_test.go` (file)
- `mem_limit/memlimit.go` (file)
- `main_test.go` (file)
- `mem_limit/memlimit_test.go` (file)
- `remote_cache/base_test.go` (file)
- `remote_cache/remote_cache.go` (file)
- `remote_cache/remote_cache_test.go` (file)
- `janus/base_test.go` (file)
- `janus/response.go` (file)
- `constant/constant.go` (file)
- `janus/response_test.go` (file)

## 2. 服务层

阅读这些节点以理解 服务层 中的职责、依赖关系和主要文件。

- `service/async_task.go` (file)
- `service/base_test.go` (file)
- `service/bpm_handler.go` (file)
- `service/bucket_doc_api.go` (file)
- `service/bucket_encryption_handler.go` (file)
- `service/bucket_handler.go` (file)
- `service/bucket_simple_handler.go` (file)
- `service/idc_proxy_handler.go` (file)
- `service/keygenerator.go` (file)
- `service/response.go` (file)
- `service/script.go` (file)
- `service/signature.go` (file)
- `service/tos_handler.go` (file)
- `service/tos_s3_bucket_handler.go` (file)
- `service/volcengine_handler.go` (file)
- `service/vsre.go` (file)
- `service/async_task_test.go` (file)
- `service/bpm_handler_test.go` (file)

## 3. 数据层

阅读这些节点以理解 数据层 中的职责、依赖关系和主要文件。

- `db/base_test.go` (file)
- `db/bucket_doc.go` (file)
- `db/bucket_idc_config.go` (file)
- `db/bucket.go` (file)
- `db/db.go` (file)
- `db/idc_proxy.go` (file)
- `db/temp_bucket.go` (file)
- `db/tosapi.go` (file)
- `db/types.go` (file)
- `db/upsert_local_region_buckets_test.go` (file)
- `db/utils.go` (file)
- `db/volc.go` (file)
- `db/bucket_doc_test.go` (file)
- `db/bucket_idc_config_test.go` (file)
- `db/bucket_test.go` (file)
- `db/db_test.go` (file)
- `db/idc_proxy_test.go` (file)
- `db/temp_bucket_test.go` (file)

## 4. 中间件层

阅读这些节点以理解 中间件层 中的职责、依赖关系和主要文件。

- `middleware/agw.go` (file)
- `middleware/base.go` (file)
- `middleware/zti_middleware.go` (file)
- `middleware/agw_test.go` (file)
- `middleware/base_test.go` (file)

## 5. 工具层

阅读这些节点以理解 工具层 中的职责、依赖关系和主要文件。

- `util/aes.go` (file)
- `util/base_test.go` (file)
- `util/cache.go` (file)
- `util/context.go` (file)
- `util/distributed_limiter.go` (file)
- `util/interface_limiter.go` (file)
- `util/key_lock.go` (file)
- `util/limiter.go` (file)
- `util/md5.go` (file)
- `util/metrics.go` (file)
- `util/once.go` (file)
- `util/aes_test.go` (file)
- `util/cache_test.go` (file)
- `util/distributed_limiter_test.go` (file)
- `util/interface_limiter_test.go` (file)
- `util/key_lock_test.go` (file)
- `util/limiter_test.go` (file)
- `util/metrics_test.go` (file)

## 6. 配置层

阅读这些节点以理解 配置层 中的职责、依赖关系和主要文件。

- `config/base_test.go` (file)
- `config/config.go` (file)
- `config/mysql.go` (file)
- `config/tcc_merge_test.go` (file)
- `config/mysql_test.go` (file)

## 7. 支撑组件

阅读这些节点以理解 Supporting Components 中的职责、依赖关系和主要文件。

- `.codebase/apps.yaml` (config)
- `.codebase/pipelines/ci.yaml` (config)
- `.codebase/pipelines/log_analysis.yaml` (config)
- `.ua/config.json` (config)
- `conf/-.prod.yml` (config)
- `conf/alisg.prod.yml` (config)
- `conf/base.yml` (config)
- `conf/boe.prod.yml` (config)
- `conf/boe.staging.default_tob_bp.yml` (config)
- `conf/boe.staging.default_tob.yml` (config)
- `conf/boe.staging.yml` (config)
- `conf/boe.test.yml` (config)
- `conf/boe.ut.yml` (config)
- `conf/boei18n.prod.yml` (config)
- `conf/boei18n.staging.yml` (config)
- `conf/boei18n.test.yml` (config)
- `conf/boettp.yml` (config)
- `conf/gl.prod.yml` (config)

## 代表性关系

| 关系 | 源 | 目标 |
| --- | --- | --- |
| imports | db/base_test.go | config/base_test.go |
| imports | db/base_test.go | config/config.go |
| imports | db/base_test.go | config/mysql_test.go |
| imports | db/base_test.go | config/mysql.go |
| imports | db/base_test.go | config/tcc_merge_test.go |
| imports | db/base_test.go | kms/base_test.go |
| imports | db/base_test.go | kms/client_test.go |
| imports | db/base_test.go | kms/client.go |
| imports | db/base_test.go | rpc/base_test.go |
| imports | db/base_test.go | rpc/bpm_test.go |
| imports | db/base_test.go | rpc/bpm.go |
| imports | db/base_test.go | rpc/f_client_test.go |
| imports | db/base_test.go | rpc/fake_client.go |
| imports | db/base_test.go | rpc/tos_idl.go |
| imports | db/base_test.go | rpc/tos_test.go |
| imports | db/base_test.go | rpc/tos.go |
| imports | db/base_test.go | util/aes_test.go |
| imports | db/base_test.go | util/aes.go |
| imports | db/base_test.go | util/base_test.go |
| imports | db/base_test.go | util/cache_test.go |
| imports | db/base_test.go | util/cache.go |
| imports | db/base_test.go | util/context.go |
| imports | db/base_test.go | util/distributed_limiter_test.go |
| imports | db/base_test.go | util/distributed_limiter.go |
| imports | db/base_test.go | util/interface_limiter_test.go |
| imports | db/base_test.go | util/interface_limiter.go |
| imports | db/base_test.go | util/key_lock_test.go |
| imports | db/base_test.go | util/key_lock.go |
| imports | db/base_test.go | util/limiter_test.go |
| imports | db/base_test.go | util/limiter.go |
| imports | db/base_test.go | util/md5.go |
| imports | db/base_test.go | util/metrics_test.go |
| imports | db/base_test.go | util/metrics.go |
| imports | db/base_test.go | util/once_test.go |
| imports | db/base_test.go | util/once.go |
| imports | db/bucket_doc.go | janus/base_test.go |
| imports | db/bucket_doc.go | janus/response_test.go |
| imports | db/bucket_doc.go | janus/response.go |
| imports | db/bucket_doc.go | rpc/base_test.go |
| imports | db/bucket_doc.go | rpc/bpm_test.go |
| imports | db/bucket_doc.go | rpc/bpm.go |
| imports | db/bucket_doc.go | rpc/f_client_test.go |
| imports | db/bucket_doc.go | rpc/fake_client.go |
| imports | db/bucket_doc.go | rpc/tos_idl.go |
| imports | db/bucket_doc.go | rpc/tos_test.go |
| imports | db/bucket_doc.go | rpc/tos.go |
| imports | db/bucket_idc_config.go | util/aes_test.go |
| imports | db/bucket_idc_config.go | util/aes.go |
| imports | db/bucket_idc_config.go | util/base_test.go |
| imports | db/bucket_idc_config.go | util/cache_test.go |
| imports | db/bucket_idc_config.go | util/cache.go |
| imports | db/bucket_idc_config.go | util/context.go |
| imports | db/bucket_idc_config.go | util/distributed_limiter_test.go |
| imports | db/bucket_idc_config.go | util/distributed_limiter.go |
| imports | db/bucket_idc_config.go | util/interface_limiter_test.go |
| imports | db/bucket_idc_config.go | util/interface_limiter.go |
| imports | db/bucket_idc_config.go | util/key_lock_test.go |
| imports | db/bucket_idc_config.go | util/key_lock.go |
| imports | db/bucket_idc_config.go | util/limiter_test.go |
| imports | db/bucket_idc_config.go | util/limiter.go |
| imports | db/bucket_idc_config.go | util/md5.go |
| imports | db/bucket_idc_config.go | util/metrics_test.go |
| imports | db/bucket_idc_config.go | util/metrics.go |
| imports | db/bucket_idc_config.go | util/once_test.go |
| imports | db/bucket_idc_config.go | util/once.go |
| imports | db/bucket.go | constant/constant.go |
| imports | db/bucket.go | dto/page.go |
| imports | db/bucket.go | dto/tempBucket.go |
| imports | db/bucket.go | kms/base_test.go |
| imports | db/bucket.go | kms/client_test.go |
| imports | db/bucket.go | kms/client.go |
| imports | db/bucket.go | util/aes_test.go |
| imports | db/bucket.go | util/aes.go |
| imports | db/bucket.go | util/base_test.go |
| imports | db/bucket.go | util/cache_test.go |
| imports | db/bucket.go | util/cache.go |
| imports | db/bucket.go | util/context.go |
| imports | db/bucket.go | util/distributed_limiter_test.go |
| imports | db/bucket.go | util/distributed_limiter.go |
| imports | db/bucket.go | util/interface_limiter_test.go |
