import { estimateFeePerLot } from './fees'
import { validatePositionInput } from './validation'
import type { PositionInput, PositionResult } from '../types/position'

const emptyResult = (warnings: string[]): PositionResult => ({
  allowedRiskAmount: 0,
  priceDistance: 0,
  openFeePerLot: 0,
  closeFeePerLot: 0,
  totalFeesPerLot: 0,
  entrySlippageCostPerLot: 0,
  exitSlippageCostPerLot: 0,
  totalSlippageCostPerLot: 0,
  lossPerLot: 0,
  estimatedMarginPerLot: 0,
  marginBudget: 0,
  marginUsagePercent: 0,
  remainingAvailableFunds: 0,
  riskBudgetPercentOfEquity: 0,
  affordableLotsByRisk: 0,
  affordableLotsByMargin: 0,
  recommendedLots: 0,
  estimatedTotalLoss: 0,
  estimatedTotalMargin: 0,
  plannedLots: null,
  plannedEstimatedTotalLoss: null,
  plannedRiskPercentOfEquity: null,
  plannedEstimatedTotalMargin: null,
  plannedMarginUsagePercent: null,
  plannedRemainingAvailableFunds: null,
  plannedLotsExceedsRiskLimit: false,
  plannedLotsExceedsMarginLimit: false,
  plannedWarnings: [],
  warnings,
})

const isFiniteNumber = (value: number): boolean => Number.isFinite(value)

/** 根据止损、风险、保证金和开平手续费规则估算最多开仓手数。 */
export function calculatePosition(input: PositionInput): PositionResult {
  const validation = validatePositionInput(input)
  if (!validation.isValid) return emptyResult([...Object.values(validation.fieldErrors), ...validation.generalErrors])

  const { contract } = input

  const allowedRiskAmount = input.riskMode === 'percentage' ? (input.accountEquity * input.riskPercent) / 100 : input.riskAmount
  const priceDistance = Math.abs(input.entryPrice - input.stopLossPrice)
  const entrySlippageCostPerLot = input.entrySlippageTicks * contract.tickSize * contract.multiplier
  const exitSlippageCostPerLot = input.exitSlippageTicks * contract.tickSize * contract.multiplier
  const totalSlippageCostPerLot = entrySlippageCostPerLot + exitSlippageCostPerLot
  const priceLossPerLot = priceDistance * contract.multiplier
  const openFeePerLot = estimateFeePerLot(input.openFeeRule, input.entryPrice, contract.multiplier)
  const closeFeePerLot = estimateFeePerLot(input.closeFeeRule, input.stopLossPrice, contract.multiplier)
  const totalFeesPerLot = openFeePerLot + closeFeePerLot
  const lossPerLot = priceLossPerLot + totalSlippageCostPerLot + totalFeesPerLot
  const estimatedMarginPerLot = input.entryPrice * contract.multiplier * contract.marginRate
  const marginBase = Math.min(input.accountEquity, input.availableFunds)
  const marginBudget = marginBase * input.maxMarginUsagePercent

  if (![allowedRiskAmount, priceDistance, entrySlippageCostPerLot, exitSlippageCostPerLot, totalSlippageCostPerLot, priceLossPerLot, openFeePerLot, closeFeePerLot, totalFeesPerLot, lossPerLot, estimatedMarginPerLot, marginBase, marginBudget].every(isFiniteNumber) || lossPerLot <= 0 || estimatedMarginPerLot <= 0) {
    return emptyResult(['输入超出可计算范围，无法生成有效仓位。'])
  }

  const affordableLotsByRisk = Math.floor(allowedRiskAmount / lossPerLot)
  const affordableLotsByMargin = Math.floor(marginBudget / estimatedMarginPerLot)
  if (![affordableLotsByRisk, affordableLotsByMargin].every(isFiniteNumber)) return emptyResult(['计算结果超出可处理范围，无法生成有效仓位。'])

  const recommendedLots = Math.max(0, Math.min(affordableLotsByRisk, affordableLotsByMargin))
  const estimatedTotalLoss = recommendedLots * lossPerLot
  const estimatedTotalMargin = recommendedLots * estimatedMarginPerLot
  const marginUsagePercent = marginBase > 0 ? estimatedTotalMargin / marginBase : 0
  const remainingAvailableFunds = input.availableFunds - estimatedTotalMargin
  const riskBudgetPercentOfEquity = allowedRiskAmount / input.accountEquity
  const plannedLots = input.plannedLots ?? null
  const plannedEstimatedTotalLoss = plannedLots === null ? null : plannedLots * lossPerLot
  const plannedRiskPercentOfEquity = plannedLots === null ? null : (plannedLots * lossPerLot) / input.accountEquity
  const plannedEstimatedTotalMargin = plannedLots === null ? null : plannedLots * estimatedMarginPerLot
  const plannedMarginUsagePercent = plannedLots === null ? null : (plannedLots * estimatedMarginPerLot) / marginBase
  const plannedRemainingAvailableFunds = plannedLots === null ? null : input.availableFunds - (plannedLots * estimatedMarginPerLot)
  const plannedLotsExceedsRiskLimit = plannedLots !== null && plannedLots > affordableLotsByRisk
  const plannedLotsExceedsMarginLimit = plannedLots !== null && plannedLots > affordableLotsByMargin
  const plannedWarnings = plannedLots === null ? [] : plannedLotsExceedsRiskLimit && plannedLotsExceedsMarginLimit
    ? [`计划手数同时超过风险限制和保证金限制：计划 ${plannedLots} 手，风险上限 ${affordableLotsByRisk} 手，保证金上限 ${affordableLotsByMargin} 手。`]
    : plannedLotsExceedsRiskLimit
      ? [`计划手数超过风险限制：计划 ${plannedLots} 手，风险上限 ${affordableLotsByRisk} 手。`]
      : plannedLotsExceedsMarginLimit
        ? [`计划手数超过保证金限制：计划 ${plannedLots} 手，保证金上限 ${affordableLotsByMargin} 手。`]
        : []
  const plannedNumbers = [plannedEstimatedTotalLoss, plannedRiskPercentOfEquity, plannedEstimatedTotalMargin, plannedMarginUsagePercent, plannedRemainingAvailableFunds].filter((value): value is number => value !== null)
  if (![recommendedLots, estimatedTotalLoss, estimatedTotalMargin, marginUsagePercent, remainingAvailableFunds, riskBudgetPercentOfEquity, ...plannedNumbers].every(isFiniteNumber)) return emptyResult(['计算结果超出可处理范围，无法生成有效仓位。'])

  return {
    allowedRiskAmount,
    priceDistance,
    openFeePerLot,
    closeFeePerLot,
    totalFeesPerLot,
    entrySlippageCostPerLot,
    exitSlippageCostPerLot,
    totalSlippageCostPerLot,
    lossPerLot,
    estimatedMarginPerLot,
    marginBudget,
    marginUsagePercent,
    remainingAvailableFunds,
    riskBudgetPercentOfEquity,
    affordableLotsByRisk,
    affordableLotsByMargin,
    recommendedLots,
    estimatedTotalLoss,
    estimatedTotalMargin,
    plannedLots,
    plannedEstimatedTotalLoss,
    plannedRiskPercentOfEquity,
    plannedEstimatedTotalMargin,
    plannedMarginUsagePercent,
    plannedRemainingAvailableFunds,
    plannedLotsExceedsRiskLimit,
    plannedLotsExceedsMarginLimit,
    plannedWarnings,
    warnings: recommendedLots === 0 ? ['推荐手数为 0 手：当前风险额度或账户保证金不足以开立一手合约。'] : [],
  }
}
