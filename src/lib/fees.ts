import type { FeeRule } from '../types/position'

/** 按当前价格和合约乘数估算每手手续费；比例费用以成交额为基数。 */
export function estimateFeePerLot(rule: FeeRule, price: number, multiplier: number): number {
  if (!Number.isFinite(price) || !Number.isFinite(multiplier) || price <= 0 || multiplier <= 0) return Number.NaN
  if (rule.kind === 'fixed') return rule.amountPerLot
  return price * multiplier * rule.rate
}

export function isValidFeeRule(rule: FeeRule): boolean {
  const amount = rule.kind === 'fixed' ? rule.amountPerLot : rule.rate
  return Number.isFinite(amount) && amount >= 0
}
