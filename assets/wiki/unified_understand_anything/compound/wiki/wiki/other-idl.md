# Other — idl

## idl 模块

`idl` 模块用于维护 Thrift IDL，并通过 `kitex` 生成项目使用的 RPC 代码。当前模块只有一个脚本入口：[idl/run.sh](/Users/bytedance/videoarch/compound/idl/run.sh:1)，不包含运行时代码、函数或类，也没有内部调用链。

### 作用

该模块的核心职责是把 Thrift 定义转换为 Go 代码，生成结果写入仓库根目录下的 `kitex_gen`：

```sh
kitex -module code.byted.org/videoarch/compound -gen-path ../kitex_gen ./compound.thrift
kitex -module code.byted.org/videoarch/compound -gen-path ../kitex_gen ./abase/abase.thrift
```

这两条命令分别生成：

- `./compound.thrift` 对应的 Kitex 代码
- `./abase/abase.thrift` 对应的 Kitex 代码

生成代码的 Go module 路径固定为：

```text
code.byted.org/videoarch/compound
```

因此，生成代码中的 import 路径会与当前仓库的 Go module 保持一致。

### 关键文件

`idl/run.sh`

这是唯一的生成入口。脚本顺序执行两个 `kitex` 命令：

1. 读取 `idl/compound.thrift`
2. 读取 `idl/abase/abase.thrift`
3. 将生成结果写入 `../kitex_gen`

`compound.thrift`

主 IDL 文件，通常承载项目自身的 RPC 服务、结构体、枚举或请求响应定义。

`abase/abase.thrift`

基础依赖 IDL。它被单独生成，说明项目中有代码或其他 IDL 依赖 `abase` 下的类型定义。

`kitex_gen`

生成代码目录。业务代码通常不会直接依赖 `idl` 目录，而是 import `kitex_gen` 下的生成包。

### 使用方式

应在 `idl` 目录下执行脚本，因为脚本里的 Thrift 路径和生成路径都是相对路径：

```sh
cd idl
sh run.sh
```

如果从仓库根目录直接执行：

```sh
sh idl/run.sh
```

脚本中的 `./compound.thrift` 会被解析为仓库根目录下的 `compound.thrift`，导致找不到文件。因此该脚本依赖当前工作目录为 `idl`。

### 生成行为

`kitex` 命令中的参数含义如下：

```sh
kitex \
  -module code.byted.org/videoarch/compound \
  -gen-path ../kitex_gen \
  ./compound.thrift
```

- `-module code.byted.org/videoarch/compound`：指定生成代码所属的 Go module。
- `-gen-path ../kitex_gen`：指定生成代码输出目录。
- `./compound.thrift`：指定输入的 Thrift 文件。

两条命令是顺序执行的，没有额外依赖检测、清理逻辑或错误恢复逻辑。任意一条命令失败时，脚本会继续执行下一条，除非调用方显式使用 `set -e` 或 shell 环境中配置了失败即退出。

### 与代码库的关系

`idl` 模块本身不参与服务运行，也不会在业务执行链路中被调用。它是代码生成阶段的输入源。

典型开发链路是：

1. 修改 `idl/compound.thrift` 或 `idl/abase/abase.thrift`
2. 在 `idl` 目录执行 `sh run.sh`
3. 检查 `kitex_gen` 下生成代码的变化
4. 更新依赖生成类型的业务代码
5. 运行相关测试或编译检查

业务代码应该依赖生成后的 Go 类型，而不是解析或读取 Thrift 文件本身。

### 维护注意事项

修改 Thrift 文件后，需要同步重新生成 `kitex_gen`，否则业务代码可能仍然引用旧的结构体、枚举或服务定义。

如果新增 Thrift 文件，需要同时判断是否应该加入 `run.sh`。当前脚本只生成 `compound.thrift` 和 `abase/abase.thrift`，新增文件不会被自动处理。

如果调整 Go module 路径，必须同步修改 `run.sh` 中的 `-module` 参数，否则生成代码的 import 路径会与仓库不一致。

如果希望脚本在第一条生成命令失败时停止，可以在脚本顶部增加：

```sh
set -e
```

这属于脚本行为变更，需要确认现有开发流程是否依赖“继续执行后续生成命令”的行为。