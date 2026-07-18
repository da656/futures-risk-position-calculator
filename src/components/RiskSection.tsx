import { NumberField } from './NumberField'
import type { PositionInput } from '../types/position'

type Props = {
  position: PositionInput
  fieldError: (field: string) => string | undefined
  valueFor: (field: string, value: number) => number | ''
  onNumericChange: (field: 'accountEquity' | 'availableFunds' | 'riskPercent' | 'riskAmount', value: string) => void
  onMarginUsageChange: (value: string) => void
  onRiskModeChange: (mode: PositionInput['riskMode']) => void
}

export function RiskSection({ position, fieldError, valueFor, onNumericChange, onMarginUsageChange, onRiskModeChange }: Props) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white px-5 py-5 shadow-sm" aria-label="账户与风险">
      <div className="flex items-start gap-3"><span className="mt-0.5 rounded-md bg-blue-50 px-2 py-1 text-xs font-bold text-blue-700">02</span><div><h3 className="text-base font-semibold text-slate-800">账户与风险</h3><p className="mt-1 text-xs text-slate-500">定义本次交易的风险预算。</p></div></div>
      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <NumberField id="equity" label="账户权益" suffix="元" value={valueFor('accountEquity', position.accountEquity)} error={fieldError('accountEquity')} onChange={(value) => onNumericChange('accountEquity', value)} />
        <NumberField id="available-funds" label="可用资金（元）" suffix="元" hint="用于本次开仓保证金的可动用资金。" value={valueFor('availableFunds', position.availableFunds)} error={fieldError('availableFunds')} onChange={(value) => onNumericChange('availableFunds', value)} />
        <NumberField id="max-margin-usage" label="最大保证金占用比例（%）" suffix="%" hint="默认 60%，用于限制本次开仓的保证金预算。" value={valueFor('maxMarginUsagePercent', position.maxMarginUsagePercent * 100)} error={fieldError('maxMarginUsagePercent')} onChange={onMarginUsageChange} />
        <fieldset>
          <legend className="text-sm font-medium text-slate-700">风险模式</legend>
          <div className="mt-2 flex min-h-11 rounded-lg border border-slate-300 p-1">
            <label className="flex flex-1 cursor-pointer items-center justify-center rounded-md px-2 text-sm has-[:checked]:bg-blue-50 has-[:checked]:font-medium has-[:checked]:text-blue-700"><input className="sr-only" type="radio" name="riskMode" checked={position.riskMode === 'percentage'} onChange={() => onRiskModeChange('percentage')} />按账户比例</label>
            <label className="flex flex-1 cursor-pointer items-center justify-center rounded-md px-2 text-sm has-[:checked]:bg-blue-50 has-[:checked]:font-medium has-[:checked]:text-blue-700"><input className="sr-only" type="radio" name="riskMode" checked={position.riskMode === 'amount'} onChange={() => onRiskModeChange('amount')} />固定金额</label>
          </div>
        </fieldset>
        {position.riskMode === 'percentage' ? <NumberField id="risk-percent" label="风险比例（%）" value={valueFor('riskPercent', position.riskPercent)} error={fieldError('riskPercent')} onChange={(value) => onNumericChange('riskPercent', value)} /> : <NumberField id="risk-amount" label="固定风险金额（元）" value={valueFor('riskAmount', position.riskAmount)} error={fieldError('riskAmount')} onChange={(value) => onNumericChange('riskAmount', value)} />}
      </div>
    </section>
  )
}
