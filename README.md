# 期货以损定仓计算器

一个运行在浏览器中的期货仓位风险估算工具。用户填写或选择合约参数、账户权益、资金预算、开仓价、止损价及费用假设后，页面会计算理论最大手数，并可额外评估实际计划开仓数量。

本项目只根据输入参数进行数学估算；不接入实时行情、账户、支付、券商或自动下单接口。

## 技术栈

- Vite
- React
- TypeScript
- Tailwind CSS
- Vitest 与 Testing Library
- Python 数据构建、校验与前端同步脚本

## 安装与启动

前置条件：安装 Node.js 与 Python。

```bash
npm install
npm run dev
```

启动后，在终端输出的本地地址中打开页面。Vite 常会提供 `http://localhost:5173` 一类地址，实际端口以终端输出为准。

## 常用命令

```bash
# 启动本地开发服务器
npm run dev

# 运行前端测试、代码检查和生产构建
npm test
npm run lint
npm run build

# 一次更新固定参数、动态费用及两个前端生成模块
npm run data:update

# 校验固定参数、动态费用、质量报告和前端生成模块是否全部同步
npm run data:check-all
```

`data:update` 会依次构建固定参数、同步 `officialContracts.ts`、构建动态手续费/保证金数据，再同步 `exchangeFeeMargins.ts`。

`data:check-all` 适合本地提交前或 CI 执行：它会执行固定参数 JSON Schema 与业务校验、验证动态费用覆盖报告，并检查以下生成文件是否已经过期。若本地存在未公开的动态费用 Excel 快照，会额外重新生成并逐字校验动态产物；公开 CI 不提交该快照，改为校验已提交的动态 JSON、未解决清单、覆盖报告及前端同步文件。若重新生成会产生变化，命令会失败并提示运行 `npm run data:update`。

- `outputs/china-futures-contracts.json`
- `src/data/officialContracts.ts`
- `outputs/exchange-fee-margin.json`
- `src/data/exchangeFeeMargins.ts`

生产构建输出位于 `dist/`。

## 功能概览

- 按交易所选择已核实期货品种，自动填入合约乘数、最小变动价位及可覆盖品种的保证金、开仓手续费和平仓手续费。
- 支持手动修改合约规格、费用规则、账户权益、可用资金、最大保证金占用比例、价格、双边滑点和风险参数。
- 支持按账户权益比例或固定金额设置单笔风险额度。
- 支持做多、做空的止损方向、价格最小变动单位和字段级业务校验。
- 展示风险限制、保证金限制、理论最大开仓手数及保证金预算。
- 支持填写可选的计划开仓手数，展示计划止损亏损、风险占权益比例、保证金占用、占用比例和开仓后剩余可用资金；超出风险或保证金上限时保留输入并明确警告，不会自动改写计划手数。
- 有效计算结果可保存到浏览器 `localStorage`；支持加载、删除、二次确认清空和恢复演示参数。

## 核心计算口径

以下符号使用用户输入或当前选中合约的数据：

- 账户权益：`E`
- 可用资金：`F`
- 最大保证金占用比例：`U`
- 风险比例或固定风险金额：`R%`、`A`
- 计划开仓价、止损价：`P_entry`、`P_stop`
- 合约乘数、最小变动价位：`M`、`T`
- 开仓、平仓不利滑点跳数：`S_entry`、`S_exit`
- 保证金比例：`G`

### 风险额度与保证金预算

```text
允许风险金额 = E × R% ÷ 100             （比例模式）
允许风险金额 = A                          （固定金额模式）
保证金预算 = min(E, F) × U
每手估算保证金 = P_entry × M × G
```

### 双边滑点

```text
开仓滑点成本 = S_entry × T × M
平仓滑点成本 = S_exit × T × M
总滑点成本 = 开仓滑点成本 + 平仓滑点成本
```

旧历史记录只有单一滑点字段时，会迁移为开仓滑点 0 跳、平仓滑点为旧值，以保持原有总滑点成本。

### 双边手续费

手续费可按两种规则填写或自动带入：

- 固定金额：每手固定人民币金额。
- 成交额比例：`费率 × 成交价 × 合约乘数`。

```text
开仓手续费 = 按开仓价和开仓手续费规则计算
平仓手续费 = 按止损价和当前平仓手续费规则计算
总手续费 = 开仓手续费 + 平仓手续费

每手预计止损损失 = 价格止损损失 + 总滑点成本 + 总手续费
价格止损损失 = |P_entry - P_stop| × M
```

当前应用的动态费用自动带入仅使用平昨手续费字段；平今差异、合约月份差异和交易所临时调整尚未完整进入计算模型。若实际交易为平今、指定合约月份或适用临时规则，必须手动核对并填写实际费用。

### 理论最大手数与计划手数

```text
风险限制下最多手数 = floor(允许风险金额 ÷ 每手预计止损损失)
保证金限制下最多手数 = floor(保证金预算 ÷ 每手估算保证金)
理论最大开仓手数 = max(0, min(风险限制手数, 保证金限制手数))
```

填写计划手数后，页面以该数值重新计算实际预计止损亏损、风险占权益比例、保证金占用、保证金占用比例和开仓后剩余可用资金。计划手数超过任一理论上限时仅显示警告，仍保留理论计算结果和用户原始输入。

## 固定合约参数与动态费用数据

两类数据严格分离，避免将会随账户、合约月份或交易规则变化的费用写入固定合约规格。

### 固定合约参数

- 数据文件：`outputs/china-futures-contracts.json`
- 前端同步模块：`src/data/officialContracts.ts`
- 当前已纳入：**86 个**中国境内期货品种。
- 包含：交易所、品种代码、合约乘数、最小变动价位、每跳价值、来源 URL、来源发布日期、核验状态和核对日期。
- 校验：`futures-contracts.schema.json`、产品类型枚举、日期不能晚于当前日期、交易所名称/官方域名映射、同交易所品种代码唯一及每跳价值公式。
- 未解决项单独保存在：`outputs/unresolved-contracts.csv`，不会进入最终固定参数数据集。

### 动态手续费与保证金

- 数据文件：`outputs/exchange-fee-margin.json`
- 前端同步模块：`src/data/exchangeFeeMargins.ts`
- 当前自动带入覆盖：**74/86（86.0%）**；覆盖和未解决分类以 `outputs/fee-margin-coverage-report.md` 为准。重复快照键会整组排除，不会选择其中任意一条自动带入。
- 当前来源：用户确认的 `outputs/exchange_fee_margin_snapshot.xlsx` 快照；该工作簿的创建日期为 **2026-07-17**。该日期仅表示当前快照的可追溯时间，不替代交易所公告日期或实际账户适用日期。
- 动态数据未覆盖、无法唯一映射或存在重复快照记录的品种，不会伪造自动参数；用户须根据交易所、期货公司、账户和实际合约手动填写保证金与开平手续费。
- 未解决动态费用项单独保存在：`outputs/unresolved-fee-margins.csv`。当前覆盖报告会区分缺失快照、重复记录、无法映射记录和无效快照/键。

自动带入的保证金是快照中的交易所层面参数，不包含期货公司加收、账户差异、持仓变化、临时风控措施或盘中调整。所有自动带入值都应在交易前重新核对。

## 数据更新规则

1. 更新或确认固定参数源数据、动态费用快照后，运行 `npm run data:update`。
2. 运行 `npm run data:check-all`；若失败，不应将不一致的生成文件视为已同步。
3. 查看固定参数质量报告 `outputs/data-quality-report.md` 与动态覆盖报告 `outputs/fee-margin-coverage-report.md`。
4. 任何无法核实或无法唯一映射的数据必须保留在相应 unresolved 文件中，不得为提高覆盖率猜测填充。

## 主要文件结构

```text
src/
├── App.tsx                         页面组合与派生状态
├── components/
│   ├── ContractSection.tsx         品种、固定规格与交易成本
│   ├── RiskSection.tsx             账户、资金和风险预算
│   ├── TradePlanSection.tsx        方向、滑点、价格与计划手数
│   ├── PositionResult.tsx          理论仓位与实际计划评估
│   └── HistoryList.tsx             本地历史记录界面
├── hooks/
│   ├── usePositionForm.ts          表单状态和品种切换
│   └── useCalculationHistory.ts    历史记录交互状态
├── data/
│   ├── officialContracts.ts        由固定参数 JSON 同步的前端数据
│   └── exchangeFeeMargins.ts       由动态费用 JSON 同步的前端数据
├── lib/
│   ├── calculator.ts               风险、保证金、双边费用和计划手数计算
│   ├── validation.ts               统一业务校验入口
│   ├── fees.ts                     固定金额/成交额比例手续费计算
│   └── history.ts                  浏览器本地历史记录与模型迁移
└── types/position.ts               输入、合约和计算结果类型

scripts/
├── build_china_futures_contracts.py  固定参数构建、Schema/业务校验和质量报告
├── build_exchange_fee_margins.py    动态费用构建和覆盖报告
├── sync_official_contracts.py       固定参数 JSON → TypeScript 同步
├── sync_exchange_fee_margins.py     动态费用 JSON → TypeScript 同步
├── check_data_pipeline.py           全量一致性检查
└── test_data_pipeline.py            数据管线回归测试

outputs/
├── china-futures-contracts.json
├── exchange-fee-margin.json
├── data-quality-report.md
├── fee-margin-coverage-report.md
├── unresolved-contracts.csv
└── unresolved-fee-margins.csv
```

## 风险免责声明

本工具仅根据用户输入参数进行数学估算，不提供投资建议，不保证计算结果、行情数据、保证金比例、手续费或实际成交结果的准确性。期货交易具有高风险，实际交易前请以交易所、期货公司及个人交易规则为准。

滑点、成交价差异、行情跳空、流动性变化、保证金调整、手续费调整、平今平昨差异、合约月份差异、交易所临时规则及个人风控规则等因素，均可能使实际结果与页面估算不同。

工具不替用户作出交易决定，也不执行任何交易操作。
