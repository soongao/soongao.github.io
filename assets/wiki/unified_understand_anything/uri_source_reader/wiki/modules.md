# 关键模块
> 项目：`uri_source_reader`。本页由当前 Codex 会话基于 GitNexus 索引元信息和 `.ua/knowledge-graph.json` 生成。
> GitNexus clusters：55本页按顶层目录组织模块视图，适合快速定位职责边界。

## internal

该目录包含 27 个文件级节点。类型分布：file: 27。

- `internal/bucketing/bucketing_test.go`：internal/bucketing/bucketing_test.go 是 go code 文件，包含 2 个函数。
- `internal/bucketing/bucketing.go`：internal/bucketing/bucketing.go 是 go code 文件，包含 7 个函数、1 个类型/类。
- `internal/source/hdfsparquet/bucketer.go`：internal/source/hdfsparquet/bucketer.go 是 go code 文件，包含 1 个函数、1 个类型/类。
- `internal/source/hdfsparquet/extra_query_client_test.go`：internal/source/hdfsparquet/extra_query_client_test.go 是 go code 文件，包含 2 个函数、1 个类型/类。
- `internal/source/hdfsparquet/extra_query_client.go`：internal/source/hdfsparquet/extra_query_client.go 是 go code 文件，包含 2 个函数、1 个类型/类。
- `internal/source/hdfsparquet/extractor_test.go`：internal/source/hdfsparquet/extractor_test.go 是 go code 文件，包含 39 个函数、4 个类型/类。
- `internal/source/hdfsparquet/extractor.go`：internal/source/hdfsparquet/extractor.go 是 go code 文件，包含 18 个函数、1 个类型/类。
- `internal/source/hdfsparquet/hdfs_integration_test.go`：internal/source/hdfsparquet/hdfs_integration_test.go 是 go code 文件，包含 1 个函数。
- `internal/source/hdfsparquet/iterator_test.go`：internal/source/hdfsparquet/iterator_test.go 是 go code 文件，包含 2 个函数。
- `internal/source/hdfsparquet/iterator.go`：internal/source/hdfsparquet/iterator.go 是 go code 文件，包含 7 个函数。
- `internal/source/hdfsparquet/parser.go`：internal/source/hdfsparquet/parser.go 是 go code 文件，包含 2 个函数、1 个类型/类。
- `internal/source/hdfsparquet/path_compat.go`：internal/source/hdfsparquet/path_compat.go 是 go code 文件，包含 1 个函数。
- `internal/source/hdfsparquet/reader_helpers_test.go`：internal/source/hdfsparquet/reader_helpers_test.go 是 go code 文件，包含 5 个函数。
- `internal/source/hdfsparquet/reader_progress_test.go`：internal/source/hdfsparquet/reader_progress_test.go 是 go code 文件，包含 8 个函数、1 个类型/类。
- `internal/source/hdfsparquet/reader.go`：internal/source/hdfsparquet/reader.go 是 go code 文件，包含 8 个函数、3 个类型/类。
- `internal/source/hdfsparquet/scanner.go`：internal/source/hdfsparquet/scanner.go 是 go code 文件，包含 4 个函数。

## .

该目录包含 13 个文件级节点。类型分布：config: 5，pipeline: 4，file: 3，service: 1。

- `.env`：.env 是 config config 文件，包含 2 个定义。
- `.env`：variable: HDFS_CLIENT_SCM_REPO (0 fields)
- `.env`：variable: HDFS_CLIENT_SCM_VER (0 fields)
- `build.sh`：build.sh 是 shell script 文件。
- `go.mod`：go.mod 是 mod config 文件。
- `go.sum`：go.sum 是 sum config 文件。
- `main_test.go`：main_test.go 是 go code 文件，包含 24 个函数、4 个类型/类。
- `main.go`：main.go 是 go code 文件，包含 13 个函数、11 个类型/类。
- `Makefile`：Makefile 是 makefile infra 文件，包含 4 个步骤。
- `Makefile`：Step: default
- `Makefile`：Step: build
- `Makefile`：Step: test
- `Makefile`：Step: clean

## sink

该目录包含 6 个文件级节点。类型分布：file: 6。

- `sink/local_test.go`：sink/local_test.go 是 go code 文件，包含 2 个函数。
- `sink/local.go`：sink/local.go 是 go code 文件，包含 13 个函数、3 个类型/类。
- `sink/types.go`：sink/types.go 是 go code 文件，包含 5 个类型/类。
- `sink/writer_rpc_benchmark_test.go`：sink/writer_rpc_benchmark_test.go 是 go code 文件，包含 10 个函数、1 个类型/类。
- `sink/writer_rpc_test.go`：sink/writer_rpc_test.go 是 go code 文件，包含 25 个函数、1 个类型/类。
- `sink/writer_rpc.go`：sink/writer_rpc.go 是 go code 文件，包含 61 个函数、13 个类型/类。

## controlplane

该目录包含 5 个文件级节点。类型分布：file: 5。

- `controlplane/client.go`：controlplane/client.go 是 go code 文件，包含 5 个函数、2 个类型/类。
- `controlplane/reporter_test.go`：controlplane/reporter_test.go 是 go code 文件，包含 1 个函数。
- `controlplane/reporter.go`：controlplane/reporter.go 是 go code 文件，包含 8 个函数、1 个类型/类。
- `controlplane/tracker.go`：controlplane/tracker.go 是 go code 文件，包含 8 个函数、1 个类型/类。
- `controlplane/types.go`：controlplane/types.go 是 go code 文件，包含 7 个类型/类。

## .ua

该目录包含 2 个文件级节点。类型分布：config: 1，file: 1。

- `.ua/.understandignore`：.ua/.understandignore 是 unknown code 文件。
- `.ua/config.json`：.ua/config.json 是 json config 文件。

## diagnostics

该目录包含 1 个文件级节点。类型分布：file: 1。

- `diagnostics/writer_rpc_diagnosis.html`：diagnostics/writer_rpc_diagnosis.html 是 html markup 文件。
