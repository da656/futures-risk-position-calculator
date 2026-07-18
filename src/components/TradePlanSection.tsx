import { NumberField } from './NumberField'
import type { PositionInput } from '../types/position'

type Props = {
  position: PositionInput
  plannedLotsValue: number | ''
  fieldError: (field: string) => string | undefined
  valueFor: (field: string, value: number) => number | ''
  onDirectionChange: (direction: PositionInput['direction']) => void
  onNumericChange: (field: 'entryPrice' | 'stopLossPrice' | 'entrySlippageTicks' | 'exitSlippageTicks', value: string) => void
  onPlannedLotsChange: (value: string) => void
}

export function TradePlanSection({ position, plannedLotsValue, fieldError, valueFor, onDirectionChange, onNumericChange, onPlannedLotsChange }: Props) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white px-5 py-5 shadow-sm" aria-label="交易计划">
      <div className="flex items-start gap-3"><span className="mt-0.5 rounded-md bg-blue-50 px-2 py-1 text-xs font-bold text-blue-700">03</span><div><h3 className="text-base font-semibold text-slate-800">交易计划</h3><p className="mt-1 text-xs text-slate-500">填写方向、进场位置与风险退出点。</p></div></div>
      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <fieldset>
          <legend className="text-sm font-medium text-slate-700">方向</legend>
          <div className="mt-2 flex min-h-11 rounded-lg border border-slate-300 p-1">
            <label className="flex flex-1 cursor-pointer items-center justify-center rounded-md px-2 text-sm has-[:checked]:bg-blue-50 has-[:checked]:font-medium has-[:checked]:text-blue-700"><input className="sr-only" type="radio" name="direction" checked={position.direction === 'long'} onChange={() => onDirectionChange('long')} />做多</label>
            <label className="flex flex-1 cursor-pointer items-center justify-center rounded-md px-2 text-sm has-[:checked]:bg-blue-50 has-[:checked]:font-medium has-[:checked]:text-blue-700"><input className="sr-only" type="radio" name="direction" checked={position.direction === 'short'} onChange={() => onDirectionChange('short')} />做空</label>
          </div>
        </fieldset>
        <NumberField id="entry-slippage" label="开仓滑点（跳）" hint="开仓成交相对计划开仓价的不利跳数。" value={valueFor('entrySlippageTicks', position.entrySlippageTicks)} error={fieldError('entrySlippageTicks')} onChange={(value) => onNumericChange('entrySlippageTicks', value)} />
        <NumberField id="exit-slippage" label="平仓滑点（跳）" hint="平仓成交相对计划止损价的不利跳数。" value={valueFor('exitSlippageTicks', position.exitSlippageTicks)} error={fieldError('exitSlippageTicks')} onChange={(value) => onNumericChange('exitSlippageTicks', value)} />
        <p className="sm:col-span-2 text-xs leading-5 text-slate-500">总滑点成本 =（开仓滑点跳数 + 平仓滑点跳数）× 最小变动价位 × 合约乘数。</p>
        <NumberField id="planned-lots" label="计划开仓手数（可选）" hint="留空时仅展示理论最大手数；填写后会评估实际计划的风险和保证金占用。" value={plannedLotsValue} error={fieldError('plannedLots')} onChange={onPlannedLotsChange} />
        <NumberField id="entry" label="开仓价" value={valueFor('entryPrice', position.entryPrice)} error={fieldError('entryPrice')} onChange={(value) => onNumericChange('entryPrice', value)} />
        <NumberField id="stop-loss" label="止损价" value={valueFor('stopLossPrice', position.stopLossPrice)} error={fieldError('stopLossPrice')} onChange={(value) => onNumericChange('stopLossPrice', value)} />
      </div>
    </section>
  )
}
