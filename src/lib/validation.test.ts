import { describe, expect, it } from 'vitest'
import type { PositionInput } from '../types/position'
import { validatePositionInput } from './validation'

const validInput: PositionInput = {
  accountEquity: 10_000,
  availableFunds: 10_000,
  maxMarginUsagePercent: 0.6,
  riskMode: 'percentage',
  riskPercent: 2,
  riskAmount: 200,
  direction: 'long',
  entryPrice: 100,
  stopLossPrice: 95,
  openFeeRule: { kind: 'fixed', amountPerLot: 2 },
  closeFeeRule: { kind: 'fixed', amountPerLot: 2 },
  feeDataStatus: 'manual',
  entrySlippageTicks: 0,
  exitSlippageTicks: 1,
  contract: { id: 'demo', exchange: '演示交易所', name: '演示合约', symbol: 'DEMO', multiplier: 10, tickSize: 0.5, marginRate: 0.1},
}

describe('validatePositionInput', () => {
  it('接受符合统一规则的输入', () => {
    expect(validatePositionInput(validInput)).toEqual({ isValid: true, fieldErrors: {}, generalErrors: [] })
  })

  it.each([
    ['账户权益', { accountEquity: 0 }, 'accountEquity'],
    ['可用资金', { availableFunds: -1 }, 'availableFunds'],
    ['最大保证金占用比例', { maxMarginUsagePercent: 1.01 }, 'maxMarginUsagePercent'],
    ['风险比例', { riskPercent: 100.01 }, 'riskPercent'],
    ['固定风险金额', { riskMode: 'amount', riskAmount: 0 }, 'riskAmount'],
    ['超过权益的固定风险金额', { riskMode: 'amount', riskAmount: 10_001 }, 'riskAmount'],
    ['开仓价', { entryPrice: 0 }, 'entryPrice'],
    ['止损价', { stopLossPrice: 0 }, 'stopLossPrice'],
    ['做多错误止损方向', { stopLossPrice: 100 }, 'stopLossPrice'],
    ['合约乘数', { contract: { ...validInput.contract, multiplier: 0 } }, 'contract.multiplier'],
    ['最小变动价位', { contract: { ...validInput.contract, tickSize: 0 } }, 'contract.tickSize'],
    ['保证金比例', { contract: { ...validInput.contract, marginRate: 1.01 } }, 'contract.marginRate'],
    ['非整数开仓滑点', { entrySlippageTicks: 1.5 }, 'entrySlippageTicks'],
    ['负数平仓滑点', { exitSlippageTicks: -1 }, 'exitSlippageTicks'],
    ['非整数计划手数', { plannedLots: 1.5 }, 'plannedLots'],
    ['零计划手数', { plannedLots: 0 }, 'plannedLots'],
    ['负固定手续费', { openFeeRule: { kind: 'fixed', amountPerLot: -1 } }, 'openFeeRule'],
    ['负比例手续费', { closeFeeRule: { kind: 'rate', rate: -0.001 } }, 'closeFeeRule'],
    ['未按最小变动价位对齐的价格', { entryPrice: 100.1 }, 'entryPrice'],
  ] as const)('拒绝%s', (_name, patch, field) => {
    const input = { ...validInput, ...patch } as PositionInput
    const result = validatePositionInput(input)
    expect(result.isValid).toBe(false)
    expect(result.fieldErrors[field]).toBeTruthy()
  })

  it('用容差接受浮点数表示导致的合法最小变动价位价格', () => {
    const result = validatePositionInput({ ...validInput, entryPrice: 0.1 + 0.2, stopLossPrice: 0.1, contract: { ...validInput.contract, tickSize: 0.1 } })
    expect(result.fieldErrors.entryPrice).toBeUndefined()
  })
})
