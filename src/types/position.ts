/** 期货合约的基础规格。 */
export interface ContractSpec {
  id: string
  exchange: string
  name: string
  symbol: string
  multiplier: number
  tickSize: number
  marginRate: number
}

/** 每手手续费规则：固定金额或按成交额比例。 */
export type FeeRule =
  | { kind: 'fixed'; amountPerLot: number }
  | { kind: 'rate'; rate: number }

export type FeeDataStatus = 'table-auto' | 'manual' | 'legacy-single-side'

export interface PositionInput {
  accountEquity: number
  /** 本次实际可用于开仓保证金的资金，不得超过账户权益参与预算。 */
  availableFunds: number
  /** 允许使用保证金基数的最高比例，例如 0.6 表示 60%。 */
  maxMarginUsagePercent: number
  riskMode: 'percentage' | 'amount'
  riskPercent: number
  riskAmount: number
  direction: 'long' | 'short'
  entryPrice: number
  stopLossPrice: number
  openFeeRule: FeeRule
  closeFeeRule: FeeRule
  feeDataStatus: FeeDataStatus
  /** 开仓成交相对计划开仓价的不利滑点跳数。 */
  entrySlippageTicks: number
  /** 平仓成交相对计划止损价的不利滑点跳数。 */
  exitSlippageTicks: number
  /** 可选的实际计划开仓手数；为空时仅展示理论上限。 */
  plannedLots?: number
  contract: ContractSpec
}

export interface PositionResult {
  allowedRiskAmount: number
  priceDistance: number
  openFeePerLot: number
  closeFeePerLot: number
  totalFeesPerLot: number
  entrySlippageCostPerLot: number
  exitSlippageCostPerLot: number
  totalSlippageCostPerLot: number
  lossPerLot: number
  estimatedMarginPerLot: number
  marginBudget: number
  /** 已用保证金相对 min(账户权益, 可用资金) 的比例。 */
  marginUsagePercent: number
  remainingAvailableFunds: number
  riskBudgetPercentOfEquity: number
  affordableLotsByRisk: number
  affordableLotsByMargin: number
  recommendedLots: number
  estimatedTotalLoss: number
  estimatedTotalMargin: number
  plannedLots: number | null
  plannedEstimatedTotalLoss: number | null
  plannedRiskPercentOfEquity: number | null
  plannedEstimatedTotalMargin: number | null
  plannedMarginUsagePercent: number | null
  plannedRemainingAvailableFunds: number | null
  plannedLotsExceedsRiskLimit: boolean
  plannedLotsExceedsMarginLimit: boolean
  plannedWarnings: string[]
  warnings: string[]
}
