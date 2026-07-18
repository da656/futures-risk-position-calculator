import type { FeeRule, PositionInput } from '../types/position'

export interface PositionValidationResult {
  isValid: boolean
  fieldErrors: Record<string, string>
  generalErrors: string[]
}

const priceAlignmentTolerance = 1e-8

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function isTickAligned(price: number, tickSize: number): boolean {
  const tickCount = price / tickSize
  return Math.abs(tickCount - Math.round(tickCount)) <= priceAlignmentTolerance * Math.max(1, Math.abs(tickCount))
}

function validateFeeRule(rule: FeeRule, field: 'openFeeRule' | 'closeFeeRule', fieldErrors: Record<string, string>): void {
  if (!rule || typeof rule !== 'object') {
    fieldErrors[field] = '手续费规则无效。'
    return
  }
  const amount = rule.kind === 'fixed' ? rule.amountPerLot : rule.kind === 'rate' ? rule.rate : Number.NaN
  if (!isFiniteNumber(amount) || amount < 0) fieldErrors[field] = rule.kind === 'rate' ? '比例手续费必须是非负有限数。' : '固定手续费必须是非负有限数。'
}

/**
 * 唯一的仓位输入业务校验入口。
 * 页面字段错误、计算阻断、保存资格和历史记录有效性均须使用本函数。
 */
export function validatePositionInput(input: PositionInput): PositionValidationResult {
  const fieldErrors: Record<string, string> = {}
  const generalErrors: string[] = []
  const addNumberError = (field: string, label: string) => {
    if (!isFiniteNumber(field === 'contract.multiplier' ? input.contract?.multiplier : field === 'contract.tickSize' ? input.contract?.tickSize : field === 'contract.marginRate' ? input.contract?.marginRate : input[field as keyof PositionInput])) fieldErrors[field] = `${label}必须是有限数字。`
  }

  addNumberError('accountEquity', '账户权益')
  addNumberError('availableFunds', '可用资金')
  addNumberError('maxMarginUsagePercent', '最大保证金占用比例')
  addNumberError('riskPercent', '风险比例')
  addNumberError('riskAmount', '固定风险金额')
  addNumberError('entryPrice', '开仓价')
  addNumberError('stopLossPrice', '止损价')
  addNumberError('entrySlippageTicks', '开仓滑点跳数')
  addNumberError('exitSlippageTicks', '平仓滑点跳数')
  if (input.plannedLots !== undefined) addNumberError('plannedLots', '计划手数')
  addNumberError('contract.multiplier', '合约乘数')
  addNumberError('contract.tickSize', '最小变动价位')
  addNumberError('contract.marginRate', '保证金比例')

  if (isFiniteNumber(input.accountEquity) && input.accountEquity <= 0) fieldErrors.accountEquity = '账户权益必须大于 0。'
  if (isFiniteNumber(input.availableFunds) && input.availableFunds < 0) fieldErrors.availableFunds = '可用资金不能为负数。'
  if (isFiniteNumber(input.maxMarginUsagePercent) && (input.maxMarginUsagePercent <= 0 || input.maxMarginUsagePercent > 1)) fieldErrors.maxMarginUsagePercent = '最大保证金占用比例必须大于 0 且不超过 1。'
  if (input.riskMode !== 'percentage' && input.riskMode !== 'amount') generalErrors.push('风险模式无效。')
  if (input.direction !== 'long' && input.direction !== 'short') generalErrors.push('交易方向无效。')

  if (input.riskMode === 'percentage' && isFiniteNumber(input.riskPercent) && (input.riskPercent <= 0 || input.riskPercent > 100)) fieldErrors.riskPercent = '风险比例必须大于 0 且不超过 100%。'
  if (input.riskMode === 'amount' && isFiniteNumber(input.riskAmount)) {
    if (input.riskAmount <= 0) fieldErrors.riskAmount = '固定风险金额必须大于 0。'
    else if (isFiniteNumber(input.accountEquity) && input.riskAmount > input.accountEquity) fieldErrors.riskAmount = '固定风险金额不能超过账户权益。'
  }

  if (isFiniteNumber(input.entryPrice) && input.entryPrice <= 0) fieldErrors.entryPrice = '开仓价必须大于 0。'
  if (isFiniteNumber(input.stopLossPrice) && input.stopLossPrice <= 0) fieldErrors.stopLossPrice = '止损价必须大于 0。'
  if (isFiniteNumber(input.contract?.multiplier) && input.contract.multiplier <= 0) fieldErrors['contract.multiplier'] = '合约乘数必须大于 0。'
  if (isFiniteNumber(input.contract?.tickSize) && input.contract.tickSize <= 0) fieldErrors['contract.tickSize'] = '最小变动价位必须大于 0。'
  if (isFiniteNumber(input.contract?.marginRate) && (input.contract.marginRate <= 0 || input.contract.marginRate > 1)) fieldErrors['contract.marginRate'] = '保证金比例必须大于 0 且不超过 1。'
  if (isFiniteNumber(input.entrySlippageTicks) && (input.entrySlippageTicks < 0 || !Number.isInteger(input.entrySlippageTicks))) fieldErrors.entrySlippageTicks = '开仓滑点跳数必须是非负整数。'
  if (isFiniteNumber(input.exitSlippageTicks) && (input.exitSlippageTicks < 0 || !Number.isInteger(input.exitSlippageTicks))) fieldErrors.exitSlippageTicks = '平仓滑点跳数必须是非负整数。'
  if (input.plannedLots !== undefined && isFiniteNumber(input.plannedLots) && (input.plannedLots <= 0 || !Number.isInteger(input.plannedLots))) fieldErrors.plannedLots = '计划手数必须是正整数。'

  validateFeeRule(input.openFeeRule, 'openFeeRule', fieldErrors)
  validateFeeRule(input.closeFeeRule, 'closeFeeRule', fieldErrors)

  const pricesArePositive = isFiniteNumber(input.entryPrice) && input.entryPrice > 0 && isFiniteNumber(input.stopLossPrice) && input.stopLossPrice > 0
  if (pricesArePositive && input.direction === 'long' && input.stopLossPrice >= input.entryPrice) fieldErrors.stopLossPrice = '做多时，止损价必须低于开仓价。'
  if (pricesArePositive && input.direction === 'short' && input.stopLossPrice <= input.entryPrice) fieldErrors.stopLossPrice = '做空时，止损价必须高于开仓价。'

  if (isFiniteNumber(input.contract?.tickSize) && input.contract.tickSize > 0) {
    if (isFiniteNumber(input.entryPrice) && input.entryPrice > 0 && !isTickAligned(input.entryPrice, input.contract.tickSize)) fieldErrors.entryPrice = '开仓价必须符合最小变动价位。'
    if (isFiniteNumber(input.stopLossPrice) && input.stopLossPrice > 0 && !isTickAligned(input.stopLossPrice, input.contract.tickSize)) fieldErrors.stopLossPrice = '止损价必须符合最小变动价位。'
  }

  return { isValid: Object.keys(fieldErrors).length === 0 && generalErrors.length === 0, fieldErrors, generalErrors }
}
