import { describe, expect, it } from 'vitest'
import { calculatePosition } from './calculator'
import type { PositionInput } from '../types/position'

const baseInput: PositionInput = {
  accountEquity: 10_000,
  availableFunds: 10_000,
  maxMarginUsagePercent: 0.6,
  riskMode: 'percentage',
  riskPercent: 1,
  riskAmount: 0,
  direction: 'long',
  entryPrice: 100,
  stopLossPrice: 95,
  openFeeRule: { kind: 'fixed', amountPerLot: 2 },
  closeFeeRule: { kind: 'fixed', amountPerLot: 2 },
  feeDataStatus: 'manual',
  entrySlippageTicks: 0,
  exitSlippageTicks: 1,
  contract: {
    id: 'demo',
    exchange: '演示交易所',
    name: '演示合约',
    symbol: 'DEMO',
    multiplier: 10,
    tickSize: 1,
    marginRate: 0.1,
  },
}

describe('calculatePosition', () => {
  it('按百分比风险计算正常做多仓位', () => {
    const result = calculatePosition(baseInput)

    expect(result).toMatchObject({
      allowedRiskAmount: 100,
      priceDistance: 5,
      lossPerLot: 64,
      estimatedMarginPerLot: 100,
      affordableLotsByRisk: 1,
      affordableLotsByMargin: 60,
      recommendedLots: 1,
      estimatedTotalLoss: 64,
      estimatedTotalMargin: 100,
      warnings: [],
    })
  })


  it('分别计入开仓和平仓滑点成本', () => {
    const result = calculatePosition({
      ...baseInput,
      entrySlippageTicks: 2,
      exitSlippageTicks: 3,
    } as PositionInput) as unknown as Record<string, number>

    expect(result.entrySlippageCostPerLot).toBe(20)
    expect(result.exitSlippageCostPerLot).toBe(30)
    expect(result.totalSlippageCostPerLot).toBe(50)
    expect(result.lossPerLot).toBe(104)
  })

  it('分别计入开仓与平仓手续费', () => {
    const result = calculatePosition({
      ...baseInput,
      openFeeRule: { kind: 'fixed', amountPerLot: 2 },
      closeFeeRule: { kind: 'fixed', amountPerLot: 3 },
    })

    expect(result).toMatchObject({
      openFeePerLot: 2,
      closeFeePerLot: 3,
      totalFeesPerLot: 5,
      lossPerLot: 65,
    })
  })

  it('比例手续费分别按开仓价和止损价估算', () => {
    const result = calculatePosition({
      ...baseInput,
      entryPrice: 100,
      stopLossPrice: 95,
      openFeeRule: { kind: 'rate', rate: 0.01 },
      closeFeeRule: { kind: 'rate', rate: 0.01 },
    })

    expect(result.openFeePerLot).toBe(10)
    expect(result.closeFeePerLot).toBe(9.5)
    expect(result.totalFeesPerLot).toBe(19.5)
  })

  it('止损价高于开仓价时按做空方向计算', () => {
    const result = calculatePosition({
      ...baseInput,
      direction: 'short',
      stopLossPrice: 105,
    })

    expect(result.priceDistance).toBe(5)
    expect(result.recommendedLots).toBe(1)
    expect(result.warnings).toEqual([])
  })

  it('固定金额风险不依赖风险百分比', () => {
    const result = calculatePosition({
      ...baseInput,
      riskMode: 'amount',
      riskPercent: 99,
      riskAmount: 128,
    })

    expect(result.allowedRiskAmount).toBe(128)
    expect(result.affordableLotsByRisk).toBe(2)
    expect(result.recommendedLots).toBe(2)
  })

  it('以可用资金和最大占用比例共同限制保证金手数', () => {
    const result = calculatePosition({
      ...baseInput,
      riskPercent: 100,
      availableFunds: 500,
      maxMarginUsagePercent: 0.6,
    } as PositionInput) as unknown as Record<string, number>

    expect(result.marginBudget).toBe(300)
    expect(result.affordableLotsByMargin).toBe(3)
    expect(result.recommendedLots).toBe(3)
    expect(result.marginUsagePercent).toBe(0.6)
    expect(result.remainingAvailableFunds).toBe(200)
    expect(result.riskBudgetPercentOfEquity).toBe(1)
  })

  it('保留超限计划手数并分别报告风险与保证金超限', () => {
    const result = calculatePosition({
      ...baseInput,
      riskPercent: 100,
      plannedLots: 200,
    } as PositionInput) as unknown as Record<string, unknown>

    expect(result.plannedLots).toBe(200)
    expect(result.plannedEstimatedTotalLoss).toBe(12_800)
    expect(result.plannedRiskPercentOfEquity).toBe(1.28)
    expect(result.plannedEstimatedTotalMargin).toBe(20_000)
    expect(result.plannedMarginUsagePercent).toBe(2)
    expect(result.plannedRemainingAvailableFunds).toBe(-10_000)
    expect(result.plannedLotsExceedsRiskLimit).toBe(true)
    expect(result.plannedLotsExceedsMarginLimit).toBe(true)
    expect(result.plannedWarnings).toEqual(['计划手数同时超过风险限制和保证金限制：计划 200 手，风险上限 156 手，保证金上限 60 手。'])
  })

  it.each([
    ['仅超过风险限制', { plannedLots: 2 }, '计划手数超过风险限制：计划 2 手，风险上限 1 手。'],
    ['仅超过保证金限制', { riskPercent: 100, plannedLots: 61 }, '计划手数超过保证金限制：计划 61 手，保证金上限 60 手。'],
  ])('%s 时明确说明对应超限原因', (_name, patch, warning) => {
    const result = calculatePosition({ ...baseInput, ...patch })

    expect(result.plannedWarnings).toEqual([warning])
  })

  it('保证金限制比风险限制更严格时采用保证金手数', () => {
    const result = calculatePosition({
      ...baseInput,
      accountEquity: 500,
      riskPercent: 100,
    })

    expect(result.affordableLotsByRisk).toBe(7)
    expect(result.affordableLotsByMargin).toBe(3)
    expect(result.recommendedLots).toBe(3)
  })

  it('做多止损方向错误时返回零手数和清晰警告', () => {
    const result = calculatePosition({
      ...baseInput,
      stopLossPrice: 100,
    })

    expect(result.recommendedLots).toBe(0)
    expect(result.warnings.join(' ')).toContain('做多')
    expect(Object.values(result).filter((value) => typeof value === 'number').every(Number.isFinite)).toBe(true)
  })

  it('统一校验拒绝的输入不会生成计算结果', () => {
    const result = calculatePosition({ ...baseInput, riskPercent: 101 })

    expect(result.recommendedLots).toBe(0)
    expect(result.warnings.join(' ')).toContain('风险比例')
  })

  it('资金不足一手时返回零手数和警告', () => {
    const result = calculatePosition({
      ...baseInput,
      accountEquity: 50,
      riskPercent: 1,
    })

    expect(result.affordableLotsByMargin).toBe(0)
    expect(result.recommendedLots).toBe(0)
    expect(result.warnings.join(' ')).toContain('0 手')
  })
})
