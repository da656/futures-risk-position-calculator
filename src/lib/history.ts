import type { FeeRule, PositionInput } from '../types/position'
import { validatePositionInput } from './validation'

export const HISTORY_STORAGE_KEY = 'futures-risk-position-calculator:history'
const HISTORY_LIMIT = 10
export const CURRENT_CALCULATION_MODEL_VERSION = 4

export interface CalculationHistoryRecord {
  id: string
  savedAt: string
  contractName: string
  contractSymbol: string
  direction: PositionInput['direction']
  entryPrice: number
  stopLossPrice: number
  allowedRiskAmount: number
  recommendedLots: number
  lossPerLot: number
  calculationModelVersion: number
  input: PositionInput
}

function getStorage(): Storage | null {
  if (typeof window === 'undefined') return null
  try { return window.localStorage } catch { return null }
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function isFeeRule(value: unknown): value is FeeRule {
  if (!value || typeof value !== 'object') return false
  const rule = value as FeeRule
  return rule.kind === 'fixed'
    ? isFiniteNumber(rule.amountPerLot) && rule.amountPerLot >= 0
    : rule.kind === 'rate' && isFiniteNumber(rule.rate) && rule.rate >= 0
}

function normalizePositionInput(value: unknown): PositionInput | null {
  if (!value || typeof value !== 'object') return null
  const input = value as Record<string, unknown>
  const numericFields = ['accountEquity', 'riskPercent', 'riskAmount', 'entryPrice', 'stopLossPrice']
  if (!numericFields.every((field) => isFiniteNumber(input[field]))) return null
  const hasTwoSidedSlippage = isFiniteNumber(input.entrySlippageTicks) && isFiniteNumber(input.exitSlippageTicks)
  const hasLegacySlippage = isFiniteNumber(input.slippageTicks)
  if (!hasTwoSidedSlippage && !hasLegacySlippage) return null
  if (input.riskMode !== 'percentage' && input.riskMode !== 'amount') return null
  if (input.direction !== 'long' && input.direction !== 'short') return null
  const contract = input.contract as Record<string, unknown> | undefined
  if (!contract || !['id', 'exchange', 'name', 'symbol'].every((field) => typeof contract[field] === 'string')) return null
  if (!['multiplier', 'tickSize', 'marginRate'].every((field) => isFiniteNumber(contract[field]))) return null
  const availableFunds = isFiniteNumber(input.availableFunds) ? input.availableFunds : input.accountEquity as number
  const maxMarginUsagePercent = isFiniteNumber(input.maxMarginUsagePercent) ? input.maxMarginUsagePercent : 0.6
  // 旧版单一 slippageTicks 曾全部计入止损端；迁移为 0 开仓跳数 + 原值平仓跳数，保持原损失估算。
  const entrySlippageTicks = hasTwoSidedSlippage ? input.entrySlippageTicks as number : 0
  const exitSlippageTicks = hasTwoSidedSlippage ? input.exitSlippageTicks as number : input.slippageTicks as number
  const { defaultFeePerLot: _legacyDefaultFeePerLot, ...baseInput } = input
  const { defaultFeePerLot: _legacyContractFee, ...normalizedContract } = contract
  const base = { ...baseInput, contract: normalizedContract } as unknown as Omit<PositionInput, 'availableFunds' | 'maxMarginUsagePercent' | 'entrySlippageTicks' | 'exitSlippageTicks' | 'openFeeRule' | 'closeFeeRule' | 'feeDataStatus'>
  if (isFeeRule(input.openFeeRule) && isFeeRule(input.closeFeeRule) && ['table-auto', 'manual', 'legacy-single-side'].includes(String(input.feeDataStatus))) {
    return { ...base, availableFunds, maxMarginUsagePercent, entrySlippageTicks, exitSlippageTicks, openFeeRule: input.openFeeRule, closeFeeRule: input.closeFeeRule, feeDataStatus: input.feeDataStatus as PositionInput['feeDataStatus'] }
  }
  if (isFiniteNumber(input.feePerLot) && input.feePerLot >= 0) {
    const legacyRule: FeeRule = { kind: 'fixed', amountPerLot: input.feePerLot }
    return { ...base, availableFunds, maxMarginUsagePercent, entrySlippageTicks, exitSlippageTicks, openFeeRule: legacyRule, closeFeeRule: legacyRule, feeDataStatus: 'legacy-single-side' }
  }
  return null
}

function normalizeCalculationHistoryRecord(value: unknown): CalculationHistoryRecord | null {
  if (!value || typeof value !== 'object') return null
  const record = value as Omit<CalculationHistoryRecord, 'input'> & { input: unknown }
  if (
    typeof record.id !== 'string' || typeof record.savedAt !== 'string' || typeof record.contractName !== 'string' || typeof record.contractSymbol !== 'string' ||
    (record.direction !== 'long' && record.direction !== 'short') ||
    ![record.entryPrice, record.stopLossPrice, record.allowedRiskAmount, record.recommendedLots, record.lossPerLot].every(isFiniteNumber)
  ) return null
  const input = normalizePositionInput(record.input)
  const calculationModelVersion = isFiniteNumber((record as { calculationModelVersion?: unknown }).calculationModelVersion)
    ? (record as { calculationModelVersion: number }).calculationModelVersion
    : 1
  return input ? { ...record, calculationModelVersion, input } : null
}

export function loadCalculationHistory(): CalculationHistoryRecord[] {
  const storage = getStorage()
  if (!storage) return []
  try {
    const rawHistory = storage.getItem(HISTORY_STORAGE_KEY)
    if (!rawHistory) return []
    const parsedHistory: unknown = JSON.parse(rawHistory)
    return Array.isArray(parsedHistory) ? parsedHistory.map(normalizeCalculationHistoryRecord).filter((item): item is CalculationHistoryRecord => item !== null).slice(0, HISTORY_LIMIT) : []
  } catch { return [] }
}

export function saveCalculationHistory(record: CalculationHistoryRecord): boolean {
  const normalizedRecord = normalizeCalculationHistoryRecord(record)
  if (!normalizedRecord || !validatePositionInput(normalizedRecord.input).isValid) return false
  const storage = getStorage()
  if (!storage) return false
  try {
    storage.setItem(HISTORY_STORAGE_KEY, JSON.stringify([normalizedRecord, ...loadCalculationHistory()].slice(0, HISTORY_LIMIT)))
    return true
  } catch { return false }
}

export function deleteCalculationHistory(recordId: string): boolean {
  const storage = getStorage()
  if (!storage) return false
  try { storage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(loadCalculationHistory().filter((record) => record.id !== recordId))); return true } catch { return false }
}

export function clearCalculationHistory(): boolean {
  const storage = getStorage()
  if (!storage) return false
  try { storage.removeItem(HISTORY_STORAGE_KEY); return true } catch { return false }
}
