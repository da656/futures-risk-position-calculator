// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'
import App from './App'
import { HISTORY_STORAGE_KEY } from './lib/history'

afterEach(() => {
  cleanup()
  localStorage.clear()
})

describe('输入参数表单', () => {
  it('切换品种时自动填充该合约的默认参数', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.selectOptions(screen.getByLabelText('品种'), 'shfe-cu')

    expect((screen.getByLabelText('合约乘数') as HTMLInputElement).value).toBe('5')
    expect((screen.getByLabelText('最小变动价位') as HTMLInputElement).value).toBe('10')
    expect((screen.getByLabelText('保证金比例') as HTMLInputElement).value).toBe('0.11')
    expect((screen.getByLabelText('开仓手续费') as HTMLInputElement).value).toBe('0.875')
    expect((screen.getByLabelText('平仓手续费（平昨）') as HTMLInputElement).value).toBe('0.8725')
    expect(screen.getByText('资料表自动带入')).not.toBeNull()
  })

  it('对快照未覆盖品种不沿用其他品种的自动费用参数', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.selectOptions(screen.getByLabelText('品种'), 'cffex-tf')

    expect((screen.getByLabelText('保证金比例') as HTMLInputElement).value).toBe('0')
    expect((screen.getByLabelText('开仓手续费') as HTMLInputElement).value).toBe('0')
    expect(screen.getByText('未提供自动参数，请手动填写')).not.toBeNull()
  })

  it('切换风险模式后只显示对应的风险输入项', async () => {
    const user = userEvent.setup()
    render(<App />)

    expect(screen.getByLabelText('风险比例（%）')).not.toBeNull()
    expect(screen.queryByLabelText('固定风险金额（元）')).toBeNull()

    await user.click(screen.getByLabelText('固定金额'))

    expect(screen.queryByLabelText('风险比例（%）')).toBeNull()
    expect(screen.getByLabelText('固定风险金额（元）')).not.toBeNull()
  })

  it('允许编辑合约参数并在不合理数值时显示字段提示', async () => {
    const user = userEvent.setup()
    render(<App />)
    const multiplier = screen.getByLabelText('合约乘数')

    await user.clear(multiplier)
    await user.type(multiplier, '20')
    expect((multiplier as HTMLInputElement).value).toBe('20')

    await user.clear(multiplier)
    expect(screen.getAllByText('合约乘数必须大于 0。')[0]).not.toBeNull()
  })

  it('无关字段校验失败时仍保留自动比例手续费的显示值', async () => {
    const user = userEvent.setup()
    render(<App />)
    const openFee = screen.getByLabelText('开仓手续费') as HTMLInputElement
    const closeFee = screen.getByLabelText('平仓手续费（平昨）') as HTMLInputElement
    const originalOpenFee = openFee.value
    const originalCloseFee = closeFee.value

    await user.clear(screen.getByLabelText('账户权益'))

    expect(openFee.value).toBe(originalOpenFee)
    expect(closeFee.value).toBe(originalCloseFee)
  })
})


describe('双边滑点口径', () => {
  it('分别展示开仓和平仓滑点输入，并明确总滑点成本公式', () => {
    render(<App />)

    expect((screen.getByLabelText('开仓滑点（跳）') as HTMLInputElement).value).toBe('0')
    expect((screen.getByLabelText('平仓滑点（跳）') as HTMLInputElement).value).toBe('1')
    expect(screen.getByText('总滑点成本 =（开仓滑点跳数 + 平仓滑点跳数）× 最小变动价位 × 合约乘数。')).not.toBeNull()
    expect(screen.getByText('开仓滑点成本')).not.toBeNull()
    expect(screen.getByText('平仓滑点成本')).not.toBeNull()
    expect(screen.getByText('总滑点成本')).not.toBeNull()
  })
})

describe('计划手数评估', () => {
  it('保留超出理论上限的计划手数，明确提示超限原因并可使用建议手数', async () => {
    const user = userEvent.setup()
    render(<App />)
    const plannedLots = screen.getByLabelText('计划开仓手数（可选）')

    await user.type(plannedLots, '2')

    expect(screen.getByText('理论最大开仓：1 手')).not.toBeNull()
    expect(screen.getByText('实际计划手数')).not.toBeNull()
    expect(screen.getByText('计划手数超过风险限制：计划 2 手，风险上限 1 手。')).not.toBeNull()
    expect((plannedLots as HTMLInputElement).value).toBe('2')

    await user.click(screen.getByRole('button', { name: '使用建议手数' }))
    expect((plannedLots as HTMLInputElement).value).toBe('1')
    expect(screen.queryByText(/计划手数超过/)).toBeNull()
  })
})

describe('保证金资金使用模型', () => {
  it('默认使用账户权益作为可用资金，并允许用最大占用比例限制保证金预算', async () => {
    const user = userEvent.setup()
    render(<App />)

    expect((screen.getByLabelText('可用资金（元）') as HTMLInputElement).value).toBe('10000')
    expect((screen.getByLabelText('最大保证金占用比例（%）') as HTMLInputElement).value).toBe('60')

    const availableFunds = screen.getByLabelText('可用资金（元）')
    await user.clear(availableFunds)
    await user.type(availableFunds, '5000')

    expect(screen.getByText('保证金预算')).not.toBeNull()
    expect(screen.getAllByText('¥3,000.00')[0]).not.toBeNull()
    expect(screen.getByText('开仓后剩余可用资金')).not.toBeNull()
    expect(screen.getAllByText('¥2,550.00')[0]).not.toBeNull()
    expect(screen.getByText('风险预算占账户权益比例')).not.toBeNull()
    expect(screen.getAllByText('2.00%')[0]).not.toBeNull()
  })
})

describe('实时计算结果面板', () => {
  it('显示初始演示数据的计算明细与推荐手数', () => {
    render(<App />)

    expect(screen.getByText('理论最大开仓：1 手')).not.toBeNull()
    expect(screen.getAllByText('¥200.00').length).toBeGreaterThan(0)
    expect(screen.getAllByText('¥116.99')[0]).not.toBeNull()
    expect(screen.getAllByText('¥2,450.00')[0]).not.toBeNull()
    expect(screen.getByText('最终手数取风险限制与保证金限制中的较小值。')).not.toBeNull()
  })

  it('修改风险金额后实时更新推荐手数', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByLabelText('固定金额'))
    const riskAmount = screen.getByLabelText('固定风险金额（元）')
    await user.clear(riskAmount)
    await user.type(riskAmount, '240')

    expect(screen.getByText('理论最大开仓：2 手')).not.toBeNull()
    expect(screen.getAllByText('¥240.00')[0]).not.toBeNull()
  })

  it('止损方向错误时仅显示计算警告，不显示正常结果明细', async () => {
    const user = userEvent.setup()
    render(<App />)
    const stopLoss = screen.getByLabelText('止损价')

    await user.clear(stopLoss)
    await user.type(stopLoss, '3500')

    expect(screen.getByRole('alert')).not.toBeNull()
    expect(screen.queryByText('理论最大开仓：1 手')).toBeNull()
    expect(screen.queryByText('单笔允许最大亏损')).toBeNull()
  })
})


describe('统一输入校验', () => {
  it.each([
    ['风险比例超过 100%', '风险比例（%）', '101', '风险比例必须大于 0 且不超过 100%。'],
    ['保证金比例超过 1', '保证金比例', '1.01', '保证金比例必须大于 0 且不超过 1。'],
    ['最小变动价位为 0', '最小变动价位', '0', '最小变动价位必须大于 0。'],
    ['开仓滑点为小数', '开仓滑点（跳）', '1.5', '开仓滑点跳数必须是非负整数。'],
    ['平仓滑点为负数', '平仓滑点（跳）', '-1', '平仓滑点跳数必须是非负整数。'],
  ])('%s 时不展示结果且不能保存', async (_name, label, value, error) => {
    const user = userEvent.setup()
    render(<App />)
    const input = screen.getByLabelText(label)
    await user.clear(input)
    await user.type(input, value)

    expect(screen.getAllByText(error).length).toBeGreaterThan(0)
    expect(screen.queryByText('理论最大开仓：1 手')).toBeNull()
    expect(screen.getByRole('button', { name: '保存本次计算' })).toHaveProperty('disabled', true)
  })

  it('价格未对齐最小变动价位时显示统一字段错误并阻断保存', async () => {
    const user = userEvent.setup()
    render(<App />)
    const entryPrice = screen.getByLabelText('开仓价')
    await user.clear(entryPrice)
    await user.type(entryPrice, '3500.1')

    expect(entryPrice).toHaveProperty('ariaInvalid', 'true')
    expect(screen.getAllByText('开仓价必须符合最小变动价位。')[0]).not.toBeNull()
    expect(screen.getByRole('button', { name: '保存本次计算' })).toHaveProperty('disabled', true)
  })

  it('固定手续费品种的止损价小于等于零时，页面提示与计算器都阻断计算', async () => {
    const user = userEvent.setup()
    render(<App />)
    const stopLoss = screen.getByLabelText('止损价')
    await user.clear(stopLoss)
    await user.type(stopLoss, '0')

    expect(screen.getAllByText('止损价必须大于 0。')[0]).not.toBeNull()
    expect(screen.queryByText('理论最大开仓：1 手')).toBeNull()
    expect(screen.getByRole('button', { name: '保存本次计算' })).toHaveProperty('disabled', true)
  })

  it('载入结构合法但业务无效的历史记录时显示统一字段错误并禁止保存', async () => {
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify([{
      id: 'invalid-history', savedAt: '2026-07-17T10:00:00.000Z', contractName: '螺纹钢', contractSymbol: 'RB', direction: 'long', entryPrice: 3500, stopLossPrice: 3490, allowedRiskAmount: 10_100, recommendedLots: 1, lossPerLot: 100,
      input: { accountEquity: 10_000, riskMode: 'percentage', riskPercent: 101, riskAmount: 200, direction: 'long', entryPrice: 3500, stopLossPrice: 3490, openFeeRule: { kind: 'fixed', amountPerLot: 5 }, closeFeeRule: { kind: 'fixed', amountPerLot: 5 }, feeDataStatus: 'manual', slippageTicks: 1, contract: { id: 'shfe-rb', exchange: '上海期货交易所', name: '螺纹钢', symbol: 'RB', multiplier: 10, tickSize: 1, marginRate: 0.07} },
    }]))
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: '载入参数' }))

    expect(screen.getAllByText('风险比例必须大于 0 且不超过 100%。')[0]).not.toBeNull()
    expect(screen.queryByText('理论最大开仓：1 手')).toBeNull()
    expect(screen.getByRole('button', { name: '保存本次计算' })).toHaveProperty('disabled', true)
  })
})

describe('最近计算记录', () => {
  it('无效计算时禁用保存按钮', async () => {
    const user = userEvent.setup()
    render(<App />)

    const stopLoss = screen.getByLabelText('止损价')
    await user.clear(stopLoss)
    await user.type(stopLoss, '3500')

    expect(screen.getByRole('button', { name: '保存本次计算' })).toHaveProperty('disabled', true)
  })

  it('有效计算可保存，并在重新挂载页面后仍显示记录', async () => {
    const user = userEvent.setup()
    const firstView = render(<App />)

    await user.click(screen.getByRole('button', { name: '保存本次计算' }))
    expect(screen.getByText('最近计算记录')).not.toBeNull()
    expect(screen.getByRole('heading', { name: '螺纹钢（RB）', level: 3 })).not.toBeNull()
    const [savedRecord] = JSON.parse(localStorage.getItem(HISTORY_STORAGE_KEY) ?? '[]') as Array<{ calculationModelVersion: number; input: { availableFunds: number; maxMarginUsagePercent: number; entrySlippageTicks: number; exitSlippageTicks: number } }>
    expect(savedRecord.calculationModelVersion).toBe(4)
    expect(savedRecord.input).toMatchObject({ availableFunds: 10_000, maxMarginUsagePercent: 0.6, entrySlippageTicks: 0, exitSlippageTicks: 1 })

    firstView.unmount()
    render(<App />)

    expect(screen.getByRole('heading', { name: '螺纹钢（RB）', level: 3 })).not.toBeNull()
    expect(screen.getByRole('button', { name: '载入参数' })).not.toBeNull()
  })
  it('可载入参数、删除单条记录，并经二次确认清空全部记录', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: '保存本次计算' }))
    const entryPrice = screen.getByLabelText('开仓价')
    await user.clear(entryPrice)
    await user.type(entryPrice, '3600')

    await user.click(screen.getByRole('button', { name: '载入参数' }))
    expect((screen.getByLabelText('开仓价') as HTMLInputElement).value).toBe('3500')

    await user.click(screen.getByRole('button', { name: '删除' }))
    expect(screen.getByText('尚无保存的计算记录。')).not.toBeNull()

    await user.click(screen.getByRole('button', { name: '保存本次计算' }))
    await user.click(screen.getByRole('button', { name: '清空全部历史记录' }))
    expect(screen.getByRole('button', { name: '确认清空全部历史记录' })).not.toBeNull()
    expect(screen.getByRole('heading', { name: '螺纹钢（RB）', level: 3 })).not.toBeNull()

    await user.click(screen.getByRole('button', { name: '确认清空全部历史记录' }))
    expect(screen.getByText('尚无保存的计算记录。')).not.toBeNull()
  })

})


describe('产品说明与演示参数', () => {
  it('通过键盘操作恢复演示参数，并清除输入错误状态', async () => {
    const user = userEvent.setup()
    render(<App />)
    const entryPrice = screen.getByLabelText('开仓价')
    const stopLoss = screen.getByLabelText('止损价')

    await user.clear(entryPrice)
    await user.type(entryPrice, '3600')
    await user.clear(stopLoss)
    await user.type(stopLoss, '3600')
    expect(screen.getByRole('alert')).not.toBeNull()

    const restoreButton = screen.getByRole('button', { name: '恢复演示参数' })
    restoreButton.focus()
    await user.keyboard('{Enter}')

    expect((screen.getByLabelText('开仓价') as HTMLInputElement).value).toBe('3500')
    expect((screen.getByLabelText('止损价') as HTMLInputElement).value).toBe('3490')
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('展示合约、结果和完整风险说明，并提供恢复演示参数操作', () => {
    render(<App />)

    expect(screen.getByText('平仓手续费按资料表的平昨规则自动带入；暂未区分平今仓、合约月份及交易所临时调整。比例手续费按当前输入价格估算，仅供仓位风险测算使用，请以实际交易规则为准。')).not.toBeNull()
    expect(screen.getByText('手续费按开仓与平仓各一次估算；总滑点成本为开仓滑点成本与平仓滑点成本之和，成交价、保证金调整等因素可能使实际结果不同。')).not.toBeNull()
    expect(screen.getByText('本工具仅根据用户输入参数进行数学估算，不提供投资建议，不保证计算结果、行情数据、保证金比例、手续费或实际成交结果的准确性。期货交易具有高风险，实际交易前请以交易所、期货公司及个人交易规则为准。')).not.toBeNull()
    expect(screen.getByRole('button', { name: '恢复演示参数' })).not.toBeNull()
    expect(screen.getByText('01 合约参数')).not.toBeNull()
    expect(screen.getByText('02 账户与风险')).not.toBeNull()
    expect(screen.getByText('03 交易计划')).not.toBeNull()
    expect(screen.getByText('本次风险预算')).not.toBeNull()
  })
})


describe('官方品种选择器', () => {
  it('按交易所展示已核实品种，选择后更新固定参数与自动交易成本', async () => {
    const user = userEvent.setup()
    render(<App />)

    expect(screen.getByRole('option', { name: '工业硅（SI）' })).not.toBeNull()
    expect(screen.getByRole('option', { name: '原油（SC）' })).not.toBeNull()
    expect(screen.getByRole('option', { name: '生猪（LH）' })).not.toBeNull()
    expect(screen.getByRole('option', { name: '红枣（CJ）' })).not.toBeNull()
    expect(screen.getByRole('option', { name: '豆粕（M）' })).not.toBeNull()
    expect(screen.getByRole('option', { name: '尿素（UR）' })).not.toBeNull()

    await user.selectOptions(screen.getByLabelText('品种'), 'gfex-si')

    expect((screen.getByLabelText('合约乘数') as HTMLInputElement).value).toBe('5')
    expect((screen.getByLabelText('最小变动价位') as HTMLInputElement).value).toBe('5')
    expect(screen.getByText('资料表自动带入')).not.toBeNull()
    expect(screen.getByText('每跳价值：25 元/手')).not.toBeNull()
    expect(screen.getByRole('link', { name: '参考目录：工业硅 | 广州期货交易所' })).toHaveProperty('href', 'http://www.gfex.com.cn/gfex/gyeg/sspz.shtml')
    expect(screen.getByText('核对日期：2026-07-16')).not.toBeNull()

    await user.selectOptions(screen.getByLabelText('品种'), 'dce-lh')
    expect((screen.getByLabelText('合约乘数') as HTMLInputElement).value).toBe('16')
    expect((screen.getByLabelText('最小变动价位') as HTMLInputElement).value).toBe('5')
    expect(screen.getByText('每跳价值：80 元/手')).not.toBeNull()
    expect(screen.getByText('来源发布日期：2025-06-24')).not.toBeNull()

    await user.selectOptions(screen.getByLabelText('品种'), 'dce-m')
    expect((screen.getByLabelText('合约乘数') as HTMLInputElement).value).toBe('10')
    expect((screen.getByLabelText('最小变动价位') as HTMLInputElement).value).toBe('1')
    expect(screen.getByText('每跳价值：10 元/手')).not.toBeNull()
    expect(screen.getByText('数据状态：用户确认')).not.toBeNull()
  })
})
