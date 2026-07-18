import { useMemo, useState } from 'react'
import { findExchangeFeeMargin } from '../data/exchangeFeeMargins'
import { officialContracts, toContractSpec, type OfficialContract } from '../data/officialContracts'
import type { PositionInput } from '../types/position'

const defaultOfficialContract = officialContracts.find((contract) => contract.id === 'shfe-rb')
if (!defaultOfficialContract) throw new Error('缺少螺纹钢官方合约数据。')
const defaultFeeMargin = findExchangeFeeMargin(defaultOfficialContract.exchangeCode, defaultOfficialContract.symbol)
if (!defaultFeeMargin) throw new Error('缺少螺纹钢保证金与手续费快照数据。')

const initialPosition: PositionInput = {
  accountEquity: 10_000,
  availableFunds: 10_000,
  maxMarginUsagePercent: 0.6,
  riskMode: 'percentage',
  riskPercent: 2,
  riskAmount: 200,
  direction: 'long',
  entryPrice: 3_500,
  stopLossPrice: 3_490,
  openFeeRule: defaultFeeMargin.openFee,
  closeFeeRule: defaultFeeMargin.closeFee,
  feeDataStatus: 'table-auto',
  entrySlippageTicks: 0,
  exitSlippageTicks: 1,
  contract: toContractSpec(defaultOfficialContract, { marginRate: defaultFeeMargin.marginRate }),
}

const createInitialPosition = (): PositionInput => ({ ...initialPosition, contract: { ...initialPosition.contract } })
type NumericField = 'accountEquity' | 'availableFunds' | 'riskPercent' | 'riskAmount' | 'entryPrice' | 'stopLossPrice' | 'entrySlippageTicks' | 'exitSlippageTicks'
type ContractNumericField = 'multiplier' | 'tickSize' | 'marginRate'

export function usePositionForm() {
  const [position, setPosition] = useState<PositionInput>(createInitialPosition)
  const [emptyFields, setEmptyFields] = useState<Set<string>>(new Set())

  const setEmpty = (key: string, empty: boolean) => setEmptyFields((current) => {
    const next = new Set(current)
    if (empty) next.add(key)
    else next.delete(key)
    return next
  })

  const setNumericField = (field: NumericField, rawValue: string) => {
    const empty = rawValue.trim() === ''
    const value = Number(rawValue)
    setPosition((current) => ({ ...current, [field]: empty || !Number.isFinite(value) ? 0 : value }))
    setEmpty(field, empty || !Number.isFinite(value))
  }

  const setPlannedLots = (rawValue: string) => {
    const empty = rawValue.trim() === ''
    const value = Number(rawValue)
    setPosition((current) => ({ ...current, plannedLots: empty ? undefined : !Number.isFinite(value) ? 0 : value }))
    setEmpty('plannedLots', empty || !Number.isFinite(value))
  }

  const setMaxMarginUsagePercent = (rawValue: string) => {
    const empty = rawValue.trim() === ''
    const value = Number(rawValue)
    setPosition((current) => ({ ...current, maxMarginUsagePercent: empty || !Number.isFinite(value) ? 0 : value / 100 }))
    setEmpty('maxMarginUsagePercent', empty || !Number.isFinite(value))
  }

  const setFeeAmount = (side: 'open' | 'close', rawValue: string) => {
    const empty = rawValue.trim() === ''
    const value = Number(rawValue)
    const key = side === 'open' ? 'openFee' : 'closeFee'
    setPosition((current) => ({
      ...current,
      [side === 'open' ? 'openFeeRule' : 'closeFeeRule']: { kind: 'fixed', amountPerLot: empty || !Number.isFinite(value) ? 0 : value },
      feeDataStatus: 'manual',
    }))
    setEmpty(key, empty || !Number.isFinite(value))
  }

  const setContractField = (field: ContractNumericField, rawValue: string) => {
    const empty = rawValue.trim() === ''
    const value = Number(rawValue)
    setPosition((current) => ({ ...current, contract: { ...current.contract, [field]: empty || !Number.isFinite(value) ? 0 : value } }))
    setEmpty(`contract.${field}`, empty || !Number.isFinite(value))
  }

  const selectContract = (contract: OfficialContract) => {
    const feeMargin = findExchangeFeeMargin(contract.exchangeCode, contract.symbol)
    setPosition((current) => ({
      ...current,
      contract: toContractSpec(contract, { marginRate: feeMargin?.marginRate ?? 0 }),
      openFeeRule: feeMargin?.openFee ?? { kind: 'fixed', amountPerLot: 0 },
      closeFeeRule: feeMargin?.closeFee ?? { kind: 'fixed', amountPerLot: 0 },
      feeDataStatus: feeMargin ? 'table-auto' : 'manual',
    }))
    setEmptyFields((current) => {
      const next = new Set(current)
      ;['contract.multiplier', 'contract.tickSize', 'contract.marginRate', 'openFee', 'closeFee'].forEach((key) => next.delete(key))
      return next
    })
  }

  const restoreDemoParameters = () => {
    setPosition(createInitialPosition())
    setEmptyFields(new Set())
  }
  const contractsByExchange = useMemo(() => officialContracts.reduce<Record<string, OfficialContract[]>>((groups, contract) => {
    ;(groups[contract.exchange] ??= []).push(contract)
    return groups
  }, {}), [])
  const selectedOfficialContract = useMemo(() => officialContracts.find((contract) => contract.id === position.contract.id), [position.contract.id])

  return { position, setPosition, emptyFields, setEmptyFields, setNumericField, setPlannedLots, setMaxMarginUsagePercent, setFeeAmount, setContractField, selectContract, restoreDemoParameters, contractsByExchange, selectedOfficialContract }
}
