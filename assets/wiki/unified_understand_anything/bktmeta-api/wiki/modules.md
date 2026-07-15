# 关键模块
> 项目：`bktmeta-api`。本页由当前 Codex 会话基于 GitNexus 索引元信息和 `.ua/knowledge-graph.json` 生成。
> GitNexus clusters：80本页按顶层目录组织模块视图，适合快速定位职责边界。

## conf

该目录包含 55 个文件级节点。类型分布：config: 55。

- `conf/-.prod.yml`：conf/-.prod.yml 是 yaml config 文件。
- `conf/alisg.prod.yml`：conf/alisg.prod.yml 是 yaml config 文件。
- `conf/base.yml`：conf/base.yml 是 yaml config 文件。
- `conf/boe.prod.yml`：conf/boe.prod.yml 是 yaml config 文件。
- `conf/boe.staging.default_tob_bp.yml`：conf/boe.staging.default_tob_bp.yml 是 yaml config 文件。
- `conf/boe.staging.default_tob.yml`：conf/boe.staging.default_tob.yml 是 yaml config 文件。
- `conf/boe.staging.yml`：conf/boe.staging.yml 是 yaml config 文件。
- `conf/boe.test.yml`：conf/boe.test.yml 是 yaml config 文件。
- `conf/boe.ut.yml`：conf/boe.ut.yml 是 yaml config 文件。
- `conf/boei18n.prod.yml`：conf/boei18n.prod.yml 是 yaml config 文件。
- `conf/boei18n.staging.yml`：conf/boei18n.staging.yml 是 yaml config 文件。
- `conf/boei18n.test.yml`：conf/boei18n.test.yml 是 yaml config 文件。
- `conf/boettp.yml`：conf/boettp.yml 是 yaml config 文件。
- `conf/gl.prod.yml`：conf/gl.prod.yml 是 yaml config 文件。
- `conf/gl2.prod.yml`：conf/gl2.prod.yml 是 yaml config 文件。
- `conf/hj.prod.yml`：conf/hj.prod.yml 是 yaml config 文件。

## service

该目录包含 30 个文件级节点。类型分布：file: 30。

- `service/async_task_test.go`：service/async_task_test.go 是 go code 文件，包含 3 个函数。
- `service/async_task.go`：service/async_task.go 是 go code 文件，包含 9 个函数。
- `service/base_test.go`：service/base_test.go 是 go code 文件，包含 2 个函数。
- `service/bpm_handler_test.go`：service/bpm_handler_test.go 是 go code 文件，包含 10 个函数。
- `service/bpm_handler.go`：service/bpm_handler.go 是 go code 文件，包含 27 个函数、13 个类型/类。
- `service/bucket_doc_api_test.go`：service/bucket_doc_api_test.go 是 go code 文件，包含 4 个函数。
- `service/bucket_doc_api.go`：service/bucket_doc_api.go 是 go code 文件，包含 8 个函数。
- `service/bucket_encryption_handler_test.go`：service/bucket_encryption_handler_test.go 是 go code 文件，包含 1 个函数。
- `service/bucket_encryption_handler.go`：service/bucket_encryption_handler.go 是 go code 文件，包含 2 个函数。
- `service/bucket_handler_test.go`：service/bucket_handler_test.go 是 go code 文件，包含 16 个函数。
- `service/bucket_handler.go`：service/bucket_handler.go 是 go code 文件，包含 65 个函数、10 个类型/类。
- `service/bucket_simple_handler.go`：service/bucket_simple_handler.go 是 go code 文件，包含 5 个函数。
- `service/idc_proxy_handler_test.go`：service/idc_proxy_handler_test.go 是 go code 文件，包含 8 个函数。
- `service/idc_proxy_handler.go`：service/idc_proxy_handler.go 是 go code 文件，包含 19 个函数、1 个类型/类。
- `service/keygenerator_test.go`：service/keygenerator_test.go 是 go code 文件，包含 4 个函数。
- `service/keygenerator.go`：service/keygenerator.go 是 go code 文件，包含 5 个函数。

## db

该目录包含 28 个文件级节点。类型分布：file: 21，table: 7。

- `db/base_test.go`：db/base_test.go 是 go code 文件，包含 1 个函数。
- `db/bucket_doc_test.go`：db/bucket_doc_test.go 是 go code 文件，包含 4 个函数。
- `db/bucket_doc.go`：db/bucket_doc.go 是 go code 文件，包含 10 个函数、4 个类型/类。
- `db/bucket_idc_config_test.go`：db/bucket_idc_config_test.go 是 go code 文件，包含 1 个函数。
- `db/bucket_idc_config.go`：db/bucket_idc_config.go 是 go code 文件，包含 2 个函数。
- `db/bucket_test.go`：db/bucket_test.go 是 go code 文件，包含 8 个函数。
- `db/bucket.go`：db/bucket.go 是 go code 文件，包含 21 个函数、1 个类型/类。
- `db/db_test.go`：db/db_test.go 是 go code 文件，包含 3 个函数。
- `db/db.go`：db/db.go 是 go code 文件，包含 7 个函数、3 个类型/类。
- `db/db.sql`：db/db.sql 是 sql data 文件，包含 6 个定义。
- `db/db.sql`：table: t_bucket (0 fields)
- `db/db.sql`：table: t_new_bucket_temp (0 fields)
- `db/db.sql`：table: t_bucket_idc_config (0 fields)
- `db/db.sql`：table: t_idc_proxy (0 fields)
- `db/db.sql`：table: t_idc_meta (0 fields)
- `db/db.sql`：table: t_volcengine_iam (0 fields)

## util

该目录包含 19 个文件级节点。类型分布：file: 19。

- `util/aes_test.go`：util/aes_test.go 是 go code 文件，包含 1 个函数。
- `util/aes.go`：util/aes.go 是 go code 文件，包含 4 个函数。
- `util/base_test.go`：util/base_test.go 是 go code 文件，包含 1 个函数。
- `util/cache_test.go`：util/cache_test.go 是 go code 文件，包含 2 个函数。
- `util/cache.go`：util/cache.go 是 go code 文件，包含 3 个函数。
- `util/context.go`：util/context.go 是 go code 文件，包含 5 个函数、1 个类型/类。
- `util/distributed_limiter_test.go`：util/distributed_limiter_test.go 是 go code 文件，包含 1 个函数。
- `util/distributed_limiter.go`：util/distributed_limiter.go 是 go code 文件，包含 2 个函数、2 个类型/类。
- `util/interface_limiter_test.go`：util/interface_limiter_test.go 是 go code 文件，包含 10 个函数。
- `util/interface_limiter.go`：util/interface_limiter.go 是 go code 文件，包含 6 个函数、1 个类型/类。
- `util/key_lock_test.go`：util/key_lock_test.go 是 go code 文件，包含 1 个函数。
- `util/key_lock.go`：util/key_lock.go 是 go code 文件，包含 3 个函数、1 个类型/类。
- `util/limiter_test.go`：util/limiter_test.go 是 go code 文件，包含 2 个函数。
- `util/limiter.go`：util/limiter.go 是 go code 文件，包含 3 个函数、1 个类型/类。
- `util/md5.go`：util/md5.go 是 go code 文件，包含 1 个函数。
- `util/metrics_test.go`：util/metrics_test.go 是 go code 文件，包含 3 个函数。

## rpc

该目录包含 8 个文件级节点。类型分布：file: 8。

- `rpc/base_test.go`：rpc/base_test.go 是 go code 文件，包含 1 个函数。
- `rpc/bpm_test.go`：rpc/bpm_test.go 是 go code 文件，包含 1 个函数。
- `rpc/bpm.go`：rpc/bpm.go 是 go code 文件，包含 5 个函数、4 个类型/类。
- `rpc/f_client_test.go`：rpc/f_client_test.go 是 go code 文件，包含 7 个函数。
- `rpc/fake_client.go`：rpc/fake_client.go 是 go code 文件，包含 7 个函数、2 个类型/类。
- `rpc/tos_idl.go`：rpc/tos_idl.go 是 go code 文件，包含 13 个类型/类。
- `rpc/tos_test.go`：rpc/tos_test.go 是 go code 文件，包含 6 个函数。
- `rpc/tos.go`：rpc/tos.go 是 go code 文件，包含 9 个函数、3 个类型/类。

## .

该目录包含 7 个文件级节点。类型分布：file: 4，config: 2，document: 1。

- `build.sh`：build.sh 是 shell script 文件。
- `go.mod`：go.mod 是 mod config 文件。
- `go.sum`：go.sum 是 sum config 文件。
- `main_test.go`：main_test.go 是 go code 文件，包含 1 个函数。
- `main.go`：main.go 是 go code 文件，包含 1 个函数。
- `README.md`：README.md 是 markdown docs 文件。
- `test.sh`：test.sh 是 shell script 文件。

## tcc

该目录包含 6 个文件级节点。类型分布：file: 6。

- `tcc/base_test.go`：tcc/base_test.go 是 go code 文件，包含 1 个函数。
- `tcc/keys.go`：tcc/keys.go 是 go code 文件。
- `tcc/tcc_client_test.go`：tcc/tcc_client_test.go 是 go code 文件，包含 1 个函数。
- `tcc/tcc_client.go`：tcc/tcc_client.go 是 go code 文件，包含 1 个函数。
- `tcc/tcc_config_test.go`：tcc/tcc_config_test.go 是 go code 文件，包含 18 个函数。
- `tcc/tcc_config.go`：tcc/tcc_config.go 是 go code 文件，包含 16 个函数、1 个类型/类。

## config

该目录包含 5 个文件级节点。类型分布：file: 5。

- `config/base_test.go`：config/base_test.go 是 go code 文件，包含 1 个函数。
- `config/config.go`：config/config.go 是 go code 文件，包含 2 个函数、22 个类型/类。
- `config/mysql_test.go`：config/mysql_test.go 是 go code 文件，包含 3 个函数。
- `config/mysql.go`：config/mysql.go 是 go code 文件，包含 3 个函数、1 个类型/类。
- `config/tcc_merge_test.go`：config/tcc_merge_test.go 是 go code 文件，包含 3 个函数。

## middleware

该目录包含 5 个文件级节点。类型分布：file: 5。

- `middleware/agw_test.go`：middleware/agw_test.go 是 go code 文件，包含 2 个函数。
- `middleware/agw.go`：middleware/agw.go 是 go code 文件，包含 4 个函数、1 个类型/类。
- `middleware/base_test.go`：middleware/base_test.go 是 go code 文件，包含 15 个函数。
- `middleware/base.go`：middleware/base.go 是 go code 文件，包含 9 个函数。
- `middleware/zti_middleware.go`：middleware/zti_middleware.go 是 go code 文件，包含 2 个函数。

## .codebase

该目录包含 3 个文件级节点。类型分布：config: 3。

- `.codebase/apps.yaml`：.codebase/apps.yaml 是 yaml config 文件。
- `.codebase/pipelines/ci.yaml`：.codebase/pipelines/ci.yaml 是 yaml config 文件。
- `.codebase/pipelines/log_analysis.yaml`：.codebase/pipelines/log_analysis.yaml 是 yaml config 文件。

## errno

该目录包含 3 个文件级节点。类型分布：file: 3。

- `errno/error.go`：errno/error.go 是 go code 文件。
- `errno/response_test.go`：errno/response_test.go 是 go code 文件，包含 6 个函数。
- `errno/response.go`：errno/response.go 是 go code 文件，包含 6 个函数、1 个类型/类。

## janus

该目录包含 3 个文件级节点。类型分布：file: 3。

- `janus/base_test.go`：janus/base_test.go 是 go code 文件，包含 2 个函数。
- `janus/response_test.go`：janus/response_test.go 是 go code 文件，包含 2 个函数。
- `janus/response.go`：janus/response.go 是 go code 文件，包含 2 个函数、1 个类型/类。

## jwt

该目录包含 3 个文件级节点。类型分布：file: 3。

- `jwt/base_test.go`：jwt/base_test.go 是 go code 文件，包含 1 个函数。
- `jwt/jwt_test.go`：jwt/jwt_test.go 是 go code 文件，包含 1 个函数。
- `jwt/jwt.go`：jwt/jwt.go 是 go code 文件，包含 1 个函数。

## kms

该目录包含 3 个文件级节点。类型分布：file: 3。

- `kms/base_test.go`：kms/base_test.go 是 go code 文件，包含 1 个函数。
- `kms/client_test.go`：kms/client_test.go 是 go code 文件，包含 2 个函数。
- `kms/client.go`：kms/client.go 是 go code 文件，包含 5 个函数。

## mem_limit

该目录包含 3 个文件级节点。类型分布：file: 3。

- `mem_limit/base_test.go`：mem_limit/base_test.go 是 go code 文件，包含 1 个函数。
- `mem_limit/memlimit_test.go`：mem_limit/memlimit_test.go 是 go code 文件，包含 1 个函数。
- `mem_limit/memlimit.go`：mem_limit/memlimit.go 是 go code 文件，包含 4 个函数、1 个类型/类。

## remote_cache

该目录包含 3 个文件级节点。类型分布：file: 3。

- `remote_cache/base_test.go`：remote_cache/base_test.go 是 go code 文件，包含 1 个函数。
- `remote_cache/remote_cache_test.go`：remote_cache/remote_cache_test.go 是 go code 文件，包含 1 个函数。
- `remote_cache/remote_cache.go`：remote_cache/remote_cache.go 是 go code 文件，包含 3 个函数。

## script

该目录包含 3 个文件级节点。类型分布：file: 3。

- `script/bootstrap.sh`：script/bootstrap.sh 是 shell script 文件。
- `script/pre_nginx.sh`：script/pre_nginx.sh 是 shell script 文件。
- `script/settings.py`：script/settings.py 是 python code 文件。

## .ua

该目录包含 2 个文件级节点。类型分布：config: 1，file: 1。

- `.ua/.understandignore`：.ua/.understandignore 是 unknown code 文件。
- `.ua/config.json`：.ua/config.json 是 json config 文件。

## dto

该目录包含 2 个文件级节点。类型分布：file: 2。

- `dto/page.go`：dto/page.go 是 go code 文件，包含 2 个类型/类。
- `dto/tempBucket.go`：dto/tempBucket.go 是 go code 文件，包含 1 个类型/类。

## constant

该目录包含 1 个文件级节点。类型分布：file: 1。

- `constant/constant.go`：constant/constant.go 是 go code 文件。
