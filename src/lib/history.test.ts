// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { calculatePosition } from './calculator'
import {
  clearCalculationHistory,
  HISTORY_STORAGE_KEY,
  loadCalculationHistory,
  saveCalculationHistory,
  type CalculationHistoryRecord,
} from './history'

const createRecord = (id: string): CalculationHistoryRecord => ({
  id,
  savedAt: '2026-07-16T10:00:00.000Z',
  contractName: '螺纹钢',
  contractSymbol: 'RB',
  direction: 'long',
  entryPrice: 3500,
  stopLossPrice: 3490,
  allowedRiskAmount: 200,
  recommendedLots: 1,
  lossPerLot: 120,
  calculationModelVersion: 4,
  input: {
    accountEquity: 10000,
    availableFunds: 10000,
    maxMarginUsagePercent: 0.6,
    riskMode: 'percentage',
    riskPercent: 2,
    riskAmount: 200,
    direction: 'long',
    entryPrice: 3500,
    stopLossPrice: 3490,
    openFeeRule: { kind: 'fixed', amountPerLot: 5 },
    closeFeeRule: { kind: 'fixed', amountPerLot: 5 },
    feeDataStatus: 'manual',
    entrySlippageTicks: 0,
    exitSlippageTicks: 1,
    contract: {
      id: 'shfe-rb', exchange: '上海期货交易所', name: '螺纹钢', symbol: 'RB', multiplier: 10, tickSize: 1, marginRate: 0.12,
    },
  },
})

afterEach(() => {
  localStorage.clear()
  vi.restoreAllMocks()
})

describe('本地计算历史记录', () => {
  it('保存记录时置顶并最多保留十条', () => {
    for (let index = 0; index < 11; index += 1) {
      saveCalculationHistory(createRecord(`record-${index}`))
    }

    const history = loadCalculationHistory()
    expect(history).toHaveLength(10)
    expect(history[0].id).toBe('record-10')
    expect(history[9].id).toBe('record-1')
  })

  it('保存时拒绝业务校验不通过的记录', () => {
    const invalidRecord = createRecord('invalid-risk')
    invalidRecord.input.riskPercent = 101

    expect(saveCalculationHistory(invalidRecord)).toBe(false)
    expect(loadCalculationHistory()).toEqual([])
  })

  it('业务无效但结构完整的旧记录仍可解析供页面载入后提示错误', () => {
    const invalidRecord = createRecord('invalid-history')
    invalidRecord.input.riskPercent = 101
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify([invalidRecord]))

    expect(loadCalculationHistory()).toHaveLength(1)
    expect(loadCalculationHistory()[0].input.riskPercent).toBe(101)
  })

  it('遇到损坏的存储数据时返回空列表而不抛出异常', () => {
    localStorage.setItem(HISTORY_STORAGE_KEY, '{not-valid-json')

    expect(loadCalculationHistory()).toEqual([])
  })

  it('本地存储不可用时安全失败', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('storage blocked') })

    expect(loadCalculationHistory()).toEqual([])
  })


  it('加载缺少资金模型字段的旧记录时使用安全默认值和旧模型版本', () => {
    const legacyRecord = createRecord('legacy-margin') as unknown as { input: Record<string, unknown> }
    delete legacyRecord.input.availableFunds
    delete legacyRecord.input.maxMarginUsagePercent
    delete (legacyRecord as unknown as Record<string, unknown>).calculationModelVersion
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify([legacyRecord]))

    const [record] = loadCalculationHistory()
    const input = record.input as unknown as Record<string, number>
    expect(input.availableFunds).toBe(10_000)
    expect(input.maxMarginUsagePercent).toBe(0.6)
    expect((record as unknown as { calculationModelVersion: number }).calculationModelVersion).toBe(1)
  })

  it('加载仅含旧滑点字段的记录时，将旧值迁移为平仓滑点', () => {
    const legacyRecord = createRecord('legacy-slippage') as unknown as { input: Record<string, unknown> }
    legacyRecord.input.slippageTicks = 3
    delete legacyRecord.input.entrySlippageTicks
    delete legacyRecord.input.exitSlippageTicks
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify([legacyRecord]))

    const [record] = loadCalculationHistory()
    expect(record.input.entrySlippageTicks).toBe(0)
    expect(record.input.exitSlippageTicks).toBe(3)
    expect(calculatePosition(record.input).totalSlippageCostPerLot).toBe(30)
  })

  it('加载旧版单边手续费记录时将其准确映射为开平两边费用', () => {
    const legacy = createRecord('legacy-1') as unknown as { input: Record<string, unknown> }
    legacy.input = {
      ...legacy.input,
      feePerLot: 5,
    }
    delete legacy.input.openFeeRule
    delete legacy.input.closeFeeRule
    delete legacy.input.feeDataStatus
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify([legacy]))

    const [record] = loadCalculationHistory()
    expect(record.input.openFeeRule).toEqual({ kind: 'fixed', amountPerLot: 5 })
    expect(record.input.closeFeeRule).toEqual({ kind: 'fixed', amountPerLot: 5 })
    expect(record.input.feeDataStatus).toBe('legacy-single-side')
  })

  it('加载带废弃默认手续费字段的旧记录时剥离该字段', () => {
    const legacy = createRecord('legacy-default-fee') as unknown as { input: { contract: Record<string, unknown> } }
    legacy.input.contract.defaultFeePerLot = 5
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify([legacy]))

    const [record] = loadCalculationHistory()
    expect(record.input.contract).not.toHaveProperty('defaultFeePerLot')
  })

  it('清空历史记录后不再保留存储值', () => {
    saveCalculationHistory(createRecord('record-1'))

    expect(clearCalculationHistory()).toBe(true)
    expect(localStorage.getItem(HISTORY_STORAGE_KEY)).toBeNull()
  })
})
