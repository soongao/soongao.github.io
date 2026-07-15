# 关键流程
> 项目：`uri_source_reader`。本页由当前 Codex 会话基于 GitNexus 索引元信息和 `.ua/knowledge-graph.json` 生成。
> GitNexus processes：107## 导览路径

## 1. 核心层

阅读这些节点以理解 核心层 中的职责、依赖关系和主要文件。

- `.ua/.understandignore` (file)
- `build.sh` (file)
- `diagnostics/writer_rpc_diagnosis.html` (file)
- `internal/source/hdfsparquet/testdata/oABGAFmIb82G5FeeAXQKfeImLUI2FAtktStlAI.m3u8` (file)
- `main.go` (file)
- `controlplane/client.go` (file)
- `controlplane/reporter.go` (file)
- `controlplane/tracker.go` (file)
- `controlplane/types.go` (file)
- `internal/source/tosinventorycsv/reader_benchmark_test.go` (file)
- `internal/source/tosinventorycsv/reader.go` (file)
- `main_test.go` (file)
- `controlplane/reporter_test.go` (file)
- `internal/source/tosinventorycsv/reader_test.go` (file)
- `internal/source/hdfsparquet/bucketer.go` (file)
- `internal/source/hdfsparquet/extra_query_client.go` (file)
- `internal/source/hdfsparquet/extractor.go` (file)
- `internal/source/hdfsparquet/hdfs_integration_test.go` (file)

## 2. 支撑组件

阅读这些节点以理解 Supporting Components 中的职责、依赖关系和主要文件。

- `.env` (config)
- `.ua/config.json` (config)
- `go.mod` (config)
- `go.sum` (config)
- `Makefile` (service)
- `.env` (config)
- `.env` (config)
- `main.go` (function)
- `main.go` (function)
- `main.go` (function)
- `main.go` (function)
- `main.go` (function)
- `main.go` (function)
- `main.go` (function)
- `main.go` (function)
- `main.go` (function)
- `main.go` (function)
- `main.go` (function)

## 代表性关系

| 关系 | 源 | 目标 |
| --- | --- | --- |
| imports | internal/source/hdfsparquet/bucketer.go | internal/source/sourcecommon/sink_stage_test.go |
| imports | internal/source/hdfsparquet/bucketer.go | internal/source/sourcecommon/sink_stage.go |
| imports | internal/source/hdfsparquet/extractor_test.go | internal/bucketing/bucketing_test.go |
| imports | internal/source/hdfsparquet/extractor_test.go | internal/bucketing/bucketing.go |
| imports | internal/source/hdfsparquet/extractor.go | internal/source/manifest/manifest.go |
| imports | internal/source/hdfsparquet/extractor.go | sink/local_test.go |
| imports | internal/source/hdfsparquet/extractor.go | sink/local.go |
| imports | internal/source/hdfsparquet/extractor.go | sink/types.go |
| imports | internal/source/hdfsparquet/extractor.go | sink/writer_rpc_benchmark_test.go |
| imports | internal/source/hdfsparquet/extractor.go | sink/writer_rpc_test.go |
| imports | internal/source/hdfsparquet/extractor.go | sink/writer_rpc.go |
| imports | internal/source/hdfsparquet/types.go | internal/bucketing/bucketing_test.go |
| imports | internal/source/hdfsparquet/types.go | internal/bucketing/bucketing.go |
| imports | internal/source/hdfsparquet/types.go | sink/local_test.go |
| imports | internal/source/hdfsparquet/types.go | sink/local.go |
| imports | internal/source/hdfsparquet/types.go | sink/types.go |
| imports | internal/source/hdfsparquet/types.go | sink/writer_rpc_benchmark_test.go |
| imports | internal/source/hdfsparquet/types.go | sink/writer_rpc_test.go |
| imports | internal/source/hdfsparquet/types.go | sink/writer_rpc.go |
| imports | internal/source/sourcecommon/sink_stage_test.go | sink/local_test.go |
| imports | internal/source/sourcecommon/sink_stage_test.go | sink/local.go |
| imports | internal/source/sourcecommon/sink_stage_test.go | sink/types.go |
| imports | internal/source/sourcecommon/sink_stage_test.go | sink/writer_rpc_benchmark_test.go |
| imports | internal/source/sourcecommon/sink_stage_test.go | sink/writer_rpc_test.go |
| imports | internal/source/sourcecommon/sink_stage_test.go | sink/writer_rpc.go |
| imports | internal/source/sourcecommon/sink_stage.go | sink/local_test.go |
| imports | internal/source/sourcecommon/sink_stage.go | sink/local.go |
| imports | internal/source/sourcecommon/sink_stage.go | sink/types.go |
| imports | internal/source/sourcecommon/sink_stage.go | sink/writer_rpc_benchmark_test.go |
| imports | internal/source/sourcecommon/sink_stage.go | sink/writer_rpc_test.go |
| imports | internal/source/sourcecommon/sink_stage.go | sink/writer_rpc.go |
| imports | internal/source/tosinventorycsv/reader_test.go | internal/bucketing/bucketing_test.go |
| imports | internal/source/tosinventorycsv/reader_test.go | internal/bucketing/bucketing.go |
| imports | internal/source/tosinventorycsv/reader_test.go | sink/local_test.go |
| imports | internal/source/tosinventorycsv/reader_test.go | sink/local.go |
| imports | internal/source/tosinventorycsv/reader_test.go | sink/types.go |
| imports | internal/source/tosinventorycsv/reader_test.go | sink/writer_rpc_benchmark_test.go |
| imports | internal/source/tosinventorycsv/reader_test.go | sink/writer_rpc_test.go |
| imports | internal/source/tosinventorycsv/reader_test.go | sink/writer_rpc.go |
| imports | internal/source/tosinventorycsv/reader.go | internal/bucketing/bucketing_test.go |
| imports | internal/source/tosinventorycsv/reader.go | internal/bucketing/bucketing.go |
| imports | internal/source/tosinventorycsv/reader.go | internal/source/manifest/manifest.go |
| imports | internal/source/tosinventorycsv/reader.go | internal/source/sourcecommon/sink_stage_test.go |
| imports | internal/source/tosinventorycsv/reader.go | internal/source/sourcecommon/sink_stage.go |
| imports | internal/source/tosinventorycsv/reader.go | sink/local_test.go |
| imports | internal/source/tosinventorycsv/reader.go | sink/local.go |
| imports | internal/source/tosinventorycsv/reader.go | sink/types.go |
| imports | internal/source/tosinventorycsv/reader.go | sink/writer_rpc_benchmark_test.go |
| imports | internal/source/tosinventorycsv/reader.go | sink/writer_rpc_test.go |
| imports | internal/source/tosinventorycsv/reader.go | sink/writer_rpc.go |
| imports | main_test.go | internal/source/hdfsparquet/bucketer.go |
| imports | main_test.go | internal/source/hdfsparquet/extra_query_client_test.go |
| imports | main_test.go | internal/source/hdfsparquet/extra_query_client.go |
| imports | main_test.go | internal/source/hdfsparquet/extractor_test.go |
| imports | main_test.go | internal/source/hdfsparquet/extractor.go |
| imports | main_test.go | internal/source/hdfsparquet/hdfs_integration_test.go |
| imports | main_test.go | internal/source/hdfsparquet/iterator_test.go |
| imports | main_test.go | internal/source/hdfsparquet/iterator.go |
| imports | main_test.go | internal/source/hdfsparquet/parser.go |
| imports | main_test.go | internal/source/hdfsparquet/path_compat.go |
| imports | main_test.go | internal/source/hdfsparquet/reader_helpers_test.go |
| imports | main_test.go | internal/source/hdfsparquet/reader_progress_test.go |
| imports | main_test.go | internal/source/hdfsparquet/reader.go |
| imports | main_test.go | internal/source/hdfsparquet/scanner.go |
| imports | main_test.go | internal/source/hdfsparquet/storagegw.go |
| imports | main_test.go | internal/source/hdfsparquet/types.go |
| imports | main_test.go | internal/source/hdfsparquet/uri.go |
| imports | main_test.go | internal/source/hdfsparquet/wrapper.go |
| imports | main.go | controlplane/client.go |
| imports | main.go | controlplane/reporter_test.go |
| imports | main.go | controlplane/reporter.go |
| imports | main.go | controlplane/tracker.go |
| imports | main.go | controlplane/types.go |
| imports | main.go | internal/bucketing/bucketing_test.go |
| imports | main.go | internal/bucketing/bucketing.go |
| imports | main.go | internal/source/hdfsparquet/bucketer.go |
| imports | main.go | internal/source/hdfsparquet/extra_query_client_test.go |
| imports | main.go | internal/source/hdfsparquet/extra_query_client.go |
| imports | main.go | internal/source/hdfsparquet/extractor_test.go |
| imports | main.go | internal/source/hdfsparquet/extractor.go |
