# Other — specs

## 模块定位

`docs/specs/` 是 Compound 的 living specs 目录，用来保存各 capability 当前生效的需求契约。这里的文档不是设计草稿，也不是实现笔记，而是每个 capability 的 source of truth：归档后的需求、场景、覆盖测试和能力边界都以这里为准。

该模块没有运行时代码，也没有函数调用链。它通过目录结构、Markdown 约定和归档流程连接到仓库其他部分，主要服务于开发、评审、测试补齐和后续变更判断。

## 目录结构

`docs/specs/README.md` 是 living specs 的总索引，列出所有 capability：

- `abase-storage-db-table/`
- `setattr-timing-instrumentation/`
- `table-prefix-config/`
- `table-prefix-plugin/`
- `documentation-system/`
- `gsi-index-runtime/`
- `gsi-service-meta-orchestration/`
- `gsi-reconcile-framework/`
- `offline-snapshot-reader/`
- `binding-index-config/`
- `bytedoc-error-mapping/`

每个 capability 通常包含一个 `spec.md`，少数 capability 也包含本地 `README.md`，例如 `documentation-system/README.md`。`spec.md` 保存该 capability 当前生效的目的、需求、场景和测试映射。

## 工作方式

`docs/specs/` 只在 change archive 阶段修改。新增、修改或移除 Requirement 时，不应直接编辑 living spec，而是先在 `docs/changes/<slug>/` 下完成 proposal、design、tasks 和 spec-delta，等 change 归档后再合并到对应 `docs/specs/<capability>/spec.md`。

核心流转关系如下：

```mermaid
flowchart LR
    A["变更提案"] --> B["设计与任务拆分"]
    B --> C["spec-delta"]
    C --> D["实现与测试"]
    D --> E["archive"]
    E --> F["living spec"]
```

这种流程保证 `docs/specs/` 始终表达“已经归档生效”的契约，而不是进行中的讨论。

## `README.md` 索引职责

`docs/specs/README.md` 维护 capability 级别的总览表。表格字段包括：

- `Capability`：指向对应 capability 目录。
- `主题`：用一句话说明能力范围。
- `Owner`：该 capability 的维护方。
- `最后归档合并`：最近一次归档日期。

这个索引用于快速定位契约来源，也用于判断某个需求应该落在哪个 capability 下。新增 capability 时，需要在这里增加对应行，并创建 `docs/specs/<capability>/spec.md`。

## `spec.md` 文档约定

每个 `spec.md` 以 capability 标题开始，并在开头声明维护信息：

- `Owner`
- `Reviewers`
- `创建日期`
- `最后归档合并`

随后通常包含 `Purpose` 和 `Requirements`。`Purpose` 说明能力边界和存在原因，`Requirements` 则用可验证的需求描述系统必须满足的行为。

Requirement 下使用 Scenario 描述具体触发条件和期望结果，并通过“覆盖测试”绑定到真实测试文件、测试函数和必要的行号。例如 `binding-index-config/spec.md` 会把 `GetIdxCfg`、`GetIdxCfgBySchema`、`gsi_indexes` 字段校验等需求映射到 `fuxi/client/admin/admin_test.go` 和 `fuxi/fuxi_admin/config/validator_test.go` 中的具体测试。

## EARS 与覆盖测试

该模块要求每条 Requirement 使用 EARS 风格描述，常见关键词包括 `WHEN`、`IF`、`WHERE`、`MUST`、`SHALL`。这让需求更接近可执行验收条件，而不是笼统描述。

每个 Scenario 都必须包含“覆盖测试”。设计阶段可以临时使用带说明的 `TBD`，但归档前应替换成真实测试路径。当前部分历史 spec 中仍存在 `TBD(...)`，这些条目表示已识别的测试缺口，例如：

- `offline-snapshot-reader/spec.md` 中 placeholder reader 和 snapshot reader 的测试尚待补齐。
- `gsi-index-runtime/spec.md` 中 typed index 列范围查询、写删匹配等测试尚待补齐。
- `setattr-timing-instrumentation/spec.md` 中阈值日志触发路径仍缺少自动化集成测试。

开发者修改相关代码时，应优先检查这些 `TBD` 是否已经可以补上。

## 与代码库的连接

`docs/specs/` 不直接调用代码，但通过测试引用和能力边界约束代码演进。典型连接方式包括：

- GSI 运行时相关 spec 约束 `fuxi/core/service/idx/`、`fuxi/core/consts/entity/`、`fuxi/core/service/meta/`。
- GSI 配置相关 spec 约束 `fuxi/fuxi_admin/config/validator_test.go`、`fuxi/client/admin/admin_test.go`。
- repair / reconcile 相关 spec 约束 `fuxi/core/service/index_repair.go`、`fuxi/core/service/idx/reconcile/`。
- Admin 表名前缀能力约束 `fuxi/fuxi_admin/dal/`。
- Bytedoc 错误映射约束 `fuxi/client/doc/` 和 `handler/test_handler/handler_test.go`。

因此，修改实现前应先查看对应 capability 的 `spec.md`，确认当前行为是否已被声明为契约；修改测试时也应同步确认覆盖测试引用是否仍准确。

## 贡献注意事项

不要把进行中的设计直接写入 `docs/specs/`。如果行为尚未归档，应放在 `docs/changes/<slug>/` 下。

不要在 spec 中发明不存在的 API、函数或测试名。覆盖测试必须引用仓库中的真实路径和真实测试函数。

不要把 Scenario 写成实现细节流水账。Scenario 应描述外部可观察行为，必要时再在说明中点出实现约束。

如果某个需求目前只有手工验证或缺测试，应明确保留 `TBD(owner 待补：...)`，并写清建议补充的测试位置和断言目标。