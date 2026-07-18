import { useState } from 'react'
import { CURRENT_CALCULATION_MODEL_VERSION, clearCalculationHistory, deleteCalculationHistory, loadCalculationHistory, saveCalculationHistory, type CalculationHistoryRecord } from '../lib/history'
import type { PositionInput, PositionResult } from '../types/position'

const createHistoryId = () => globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`

export function useCalculationHistory(setPosition: React.Dispatch<React.SetStateAction<PositionInput>>, setEmptyFields: React.Dispatch<React.SetStateAction<Set<string>>>) {
  const [history, setHistory] = useState<CalculationHistoryRecord[]>(loadCalculationHistory)
  const [historyStatus, setHistoryStatus] = useState('')
  const [isClearConfirmationVisible, setIsClearConfirmationVisible] = useState(false)

  const save = (position: PositionInput, result: PositionResult, allowed: boolean) => {
    if (!allowed) return
    const record: CalculationHistoryRecord = {
      id: createHistoryId(), savedAt: new Date().toISOString(), contractName: position.contract.name,
      contractSymbol: position.contract.symbol, direction: position.direction, entryPrice: position.entryPrice,
      stopLossPrice: position.stopLossPrice, allowedRiskAmount: result.allowedRiskAmount,
      recommendedLots: result.recommendedLots, lossPerLot: result.lossPerLot,
      calculationModelVersion: CURRENT_CALCULATION_MODEL_VERSION,
      input: { ...position, contract: { ...position.contract } },
    }
    if (saveCalculationHistory(record)) {
      setHistory(loadCalculationHistory())
      setHistoryStatus('本次计算已保存到本机浏览器。')
    } else setHistoryStatus('浏览器本地存储不可用，未能保存本次计算。')
  }

  const load = (record: CalculationHistoryRecord) => {
    setPosition({ ...record.input, contract: { ...record.input.contract } })
    setEmptyFields(new Set())
    setHistoryStatus(record.input.feeDataStatus === 'legacy-single-side' ? '已载入旧版单边手续费记录；开仓与平仓均沿用原单边金额。' : '已载入该条记录的全部输入参数。')
  }

  const remove = (id: string) => {
    if (deleteCalculationHistory(id)) {
      setHistory(loadCalculationHistory())
      setHistoryStatus('该条历史记录已删除。')
    } else setHistoryStatus('浏览器本地存储不可用，未能删除记录。')
  }

  const confirmClear = () => {
    if (clearCalculationHistory()) {
      setHistory([])
      setHistoryStatus('全部历史记录已清空。')
    } else setHistoryStatus('浏览器本地存储不可用，未能清空记录。')
    setIsClearConfirmationVisible(false)
  }

  return { history, historyStatus, isClearConfirmationVisible, setIsClearConfirmationVisible, save, load, remove, confirmClear }
}
