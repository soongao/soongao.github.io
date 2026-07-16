# Other — id

## 模块概览

`mdap/id` 负责生成、解析和校验 MDAP 资源 ID。ID 固定为 40 个字符，底层表示 200 bits，使用自定义 Base32 字符集 `0123456789abcdefghjkmnpqrstvwxyz`，剔除了容易混淆的 `i/l/o/u`。

模块支持四类实体：

- `EntityTypeAsset`：`a`
- `EntityTypeSource`：`s`
- `EntityTypeArtifact`：`r`
- `EntityTypeAssetGroup`：`g`

常规 ID 由 `Generator.Generate` / 包级 `Generate` 生成，由 `Parser.Parse` / 包级 `Parse` 解析。AssetGroup 还有一条更轻量的专用路径：`GenerateAssetGroupID`、`BuildAssetGroupID`、`ParseAssetGroupID`。

## ID 格式

常规 MDAP ID 总长 200 bits，对应 25 bytes / 40 Base32 字符：

```text
明文前缀 60 bits:
T(5) + TEN6(30) + SUB4(20) + KV1(5)

混淆后缀 140 bits:
SET11(55) + DC2(10) + MT(5) + TS7(35) + X1(5) + RAND6(30)
```

字段含义集中在 `IDFields`：

- `EntityType`：实体类型字符，映射到 5 bits。
- `TenantID`：30 bits，由 `TopAccountIDToTenantID` 从账号的 `TopAccountID` 派生。
- `AccountID`：20 bits，来自 account 服务返回的 `AccountInfo.ID`。
- `GroupKey`：55 bits，子实体关联父 AssetGroup 的短键。
- `KeyVersion`：5 bits，明文保存，用于解析时选择混淆密钥。
- `VDC`：10 bits，通过 `VDCToCode` / `CodeToVDC` 映射。
- `MIMEType`：5 bits，使用 `MIMEType` 常量或 `MIMETopLevelToChar` 转换。
- `Timestamp`：35 bits，从 `EpochMs = 2012-03-01T00:00:00Z` 起按 100ms 计数。
- `Extension`、`WorkerID`、`Sequence`：由 35-bit nonce 拆出。新 ID 要求 `Extension != 0`，用于区别历史 `X1 = 0` 布局。

`IDFields.Time()` 将 `Timestamp` 转回 UTC 时间，`IDFields.String()` 提供面向调试的字段摘要。

## 生成流程

常规生成入口是：

```go
id, err := id.Generate(ctx, id.EntityTypeAsset, "space-a", groupKey, "agcq", id.MIMETypeVideo)
```

包级 `Generate` 使用全局懒加载生成器。首次调用时，`loadOrCreateGlobalGenerator` 根据 `env.PodName()` 计算 `WorkerID`，固定使用 `KeyVersion: 0` 创建 `Generator`。并发场景下全局生成器受 `globalGenerator.mu` 保护，只会初始化一次。

显式控制配置时使用 `NewGenerator`：

```go
gen, err := id.NewGenerator(id.GeneratorConfig{
    WorkerID:   8,
    KeyVersion: 0,
})
if err != nil {
    return err
}

idValue, err := gen.Generate(ctx, id.EntityTypeAsset, "space-a", 789, "agcq", id.MIMETypeVideo)
```

生成过程的关键步骤：

```mermaid
flowchart LR
    A["调用 Generate"] --> B["按 space 查询账号"]
    B --> C["TopAccountID 转 TenantID"]
    C --> D["校验实体、账号、GroupKey、VDC"]
    D --> E["生成时间戳和 nonce"]
    E --> F["组装 IDFields"]
    F --> G["generateFromFields 编码"]
    G --> H["混淆后缀并 Base32 输出"]
```

`Generator.Generate` 会调用 `getAccountByName(ctx, space)`。实际默认实现来自 `account.GetAccountByName`，测试中通过包变量替换。账号返回值参与两个字段：

- `AccountInfo.ID` 转为 `AccountID`，必须在 `[0, MaxAccountID]` 内，否则返回 `ErrAccountIDOutOfRange`。
- `AccountInfo.TopAccountID` 经 `TopAccountIDToTenantID` 转为 `TenantID`。`TopAccountID == 0` 映射为 `TenantID == 0`；非零时必须是 10 位十进制数，取前 2 位加后 7 位组成 9 位数。

`nextTimestampAndNonce` 以 100ms 为时间桶。每个新桶随机初始化一个 35-bit nonce，范围为 `[MinNonce, MaxNonce]`，保证高 5 bits 即 `Extension` 非 0；同一桶内递增。递增到 `MaxNonce` 后，`waitForNext100ms` 等待下一个 100ms 桶。

## 编码与混淆

`generateFromFields` 先构造 60-bit 明文前缀：

```text
prefix = T << 55 | TenantID << 25 | AccountID << 5 | KeyVersion
```

然后构造 140-bit 后缀。后缀在混淆前按低位到高位排列：

```text
RAND6 | X1 | TS7 | MT | DC2 | SET11
```

后缀通过 `Obfuscator` 做仿射置换：

```text
C = (P * A + B) mod 2^140
P = ((C - B) * AInv) mod 2^140
```

`NewDefaultObfuscator` 创建默认密钥，`DefaultKeyManager` 默认注册版本 `0`。如需密钥轮换，使用 `NewKeyManager`、`AddKey` 配置多个版本；`GeneratorConfig.KeyVersion` 决定生成时写入的版本，`Parser.Parse` 根据明文 `KeyVersion` 选择对应 `Obfuscator`。解析器找不到版本时返回 `ErrParseFailed` 包装的错误。

## 解析流程

常规解析入口：

```go
fields, err := id.Parse(ctx, idValue)
if err != nil {
    return err
}
fmt.Println(fields.AccountID, fields.Space, fields.Time())
```

`Parse` 使用 `DefaultParser`，显式密钥管理可用 `NewParser(km)`。

`Parser.Parse` 的流程是：

1. `DecodeBase32` 将 40 字符 ID 还原为 `[25]byte`。
2. 用 `big.Int` 提取高 60 bits 明文前缀和低 140 bits 混淆后缀。
3. 从前缀读取 `KeyVersion`，通过 `KeyManager.GetKey` 找到混淆器。
4. `Deobfuscate` 后缀。
5. 按 `RAND6 -> X1 -> TS7 -> MT -> DC2 -> SET11` 顺序解析后缀字段。
6. `CodeToVDC` 将数值 VDC 转为字符串。
7. 调用 `getAccountByID(ctx, accountID)` 补齐 `Space`。

注意：解析依赖 account 服务。如果 `getAccountByID` 失败，`Parse` 会返回带有 `get account by id <id>` 上下文的 `ErrParseFailed` 错误。

## Base32 与二进制存储

`EncodeBase32` / `DecodeBase32` 只处理完整 200-bit ID，即 `[TotalBytes]byte` 和 40 字符串之间的转换。`IsValidID` 只校验长度和字符集，支持大写输入，但规范输出为小写。

数据库需要存二进制时使用：

```go
raw, err := id.ParseToBinary(idValue)
if err != nil {
    return err
}

idValue = id.BinaryToString(raw)
```

`EncodeBase32Uint` 和 `DecodeBase32Uint` 用于固定宽度的小整数片段编码，例如 AssetGroup 专用 ID 的 `AccountID`、`GroupKey` 和 VDC code。

## AssetGroup 专用 ID

AssetGroup ID 使用独立格式，但仍保持 40 字符长度：

```text
g + accountID(4 chars) + groupKey(11 chars) + dcCode(2 chars) + padding(22 chars)
```

生成路径：

- `GenerateAssetGroupID(ctx, space)`：通过 `getAccountByName` 查询账号，随机生成非零 `GroupKey`，使用当前 `env.VDC()`。
- `BuildAssetGroupID(accountID, groupKey, vdc)`：直接按字段构造，适合已有字段或测试场景。
- `ParseAssetGroupID(ctx, id)`：调用内部 `decodeAssetGroupID` 解析字段，再通过 `getAccountByID` 补齐 `Space`。

`decodeAssetGroupID` 会校验长度、`g` 前缀、padding、Base32 字符、`AccountID` 范围和 VDC code。VDC code 为 `0` 或不存在于映射表时会报错。

## VDC 映射

`vdc.go` 内维护固定的 `vdcList` 快照，编码从 `1` 开始，`0` 保留为无效值。`VDCToCode` 和 `CodeToVDC` 基于初始化时构建的双向 map。

维护约束很重要：新增 VDC 只能追加到 `vdcList` 末尾，不能重排或删除。否则历史 ID 中已经编码的 `dcCode` 会被解释成不同机房。

`VDCCount()` 返回当前注册数量，测试中固定校验为 `265`，并验证如 `"agcq" -> 1`、`"alisg" -> 19`、`"lf" -> 140` 等哨兵映射。

## 错误边界

生成侧主要错误包括：

- `ErrInvalidEntityType`：实体类型不是 `a/s/r/g`。
- `ErrTenantIDOutOfRange`：派生后的 `TenantID` 超过 30 bits。
- `ErrAccountIDOutOfRange`：账号 ID 为负数或超过 20 bits。
- `ErrGroupKeyOutOfRange`：`GroupKey` 超过 55 bits。
- `ErrInvalidVDC`：`VDCToCode` 无法识别输入。
- `ErrWorkerIDOutOfRange` / `ErrKeyVersionOutOfRange`：`NewGenerator` 配置非法。
- `ErrInvalidTopAccountID`：非零 `TopAccountID` 不是 10 位十进制数。

解析侧主要错误包括：

- `ErrInvalidID`：Base32 ID 长度不是 40。
- `ErrInvalidCharset`：ID 包含自定义字符集外的字符。
- `ErrParseFailed`：密钥版本未知、VDC code 未知或 account 反查失败。
- `ErrUnknownVDC` / `ErrUnknownVDCCode`：VDC 字符串或数值编码不在快照中。

## 测试关注点

`generator_test.go` 覆盖 Base32 往返、实体类型和 MIME 映射、混淆器可逆性、nonce 新布局、全局生成器并发懒加载、二进制转换、密钥版本匹配、account 查询错误和范围错误。

测试中的 `withStubbedAccounts` 通过替换 `getAccountByName` / `getAccountByID` 隔离 account 服务依赖；`testGenerateFromFields` 直接调用内部 `generateFromFields`，用于验证编码、解析和位布局本身。`asset_group_test.go` 单独覆盖 AssetGroup 专用 ID 的构造、解析、padding 校验、VDC 校验和账号查询错误。