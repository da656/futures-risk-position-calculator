import type { PositionResult as PositionResultData } from '../types/position'

type Props = {
  result: PositionResultData
  canShow: boolean
  canSave: boolean
  onUseRecommendedLots: () => void
  onSave: () => void
}

const formatCurrency = (amount: number) => new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount)
const formatPercent = (ratio: number) => new Intl.NumberFormat('zh-CN', { style: 'percent', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(ratio)

function ResultRow({ label, value }: { label: string; value: string }) {
  return <div className="flex items-center justify-between gap-4 py-3 text-sm"><dt className="text-slate-600">{label}</dt><dd className="font-semibold tabular-nums text-slate-900">{value}</dd></div>
}

function Warnings({ title, warnings, danger = false }: { title: string; warnings: string[]; danger?: boolean }) {
  return <div className={`mt-4 rounded-lg border px-3 py-3 text-sm leading-6 ${danger ? 'border-red-200 bg-red-50 text-red-900' : 'border-amber-200 bg-amber-50 text-amber-900'}`} role="alert"><p className="font-medium">{title}</p><ul className="mt-1 list-disc pl-5">{warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul></div>
}

export function PositionResult({ result, canShow, canSave, onUseRecommendedLots, onSave }: Props) {
  return (
    <aside aria-labelledby="result-title" className="lg:sticky lg:top-6 lg:self-start">
      <div className="mb-5 rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm"><p className="text-xs font-semibold tracking-wide text-blue-700">决策摘要</p><h2 id="result-title" className="mt-1 text-lg font-semibold text-slate-900">计算结果</h2><p className="mt-2 text-sm leading-6 text-slate-600">手续费按开仓与平仓各一次估算；总滑点成本为开仓滑点成本与平仓滑点成本之和，成交价、保证金调整等因素可能使实际结果不同。</p></div>
      <div className="space-y-4">
        <section className="rounded-xl border border-blue-200 bg-blue-50 px-5 py-5 shadow-sm">
          <h3 className="text-base font-semibold text-slate-800">理论最大手数</h3>
          {canShow ? <><div className="mt-4 grid grid-cols-2 gap-3"><div className="rounded-lg border border-blue-100 bg-white px-3 py-3"><p className="text-xs text-slate-600">本次风险预算</p><p className="mt-1 text-lg font-bold tabular-nums text-slate-950">{formatCurrency(result.allowedRiskAmount)}</p></div><div className="rounded-lg border border-blue-100 bg-white px-3 py-3"><p className="text-xs text-slate-600">每手止损损失</p><p className="mt-1 text-lg font-bold tabular-nums text-slate-950">{formatCurrency(result.lossPerLot)}</p></div></div><p className="mt-4 text-2xl font-bold tracking-tight text-blue-700">理论最大开仓：{result.recommendedLots} 手</p><p className="mt-2 text-sm leading-6 text-slate-600">最终手数取风险限制与保证金限制中的较小值。</p></> : <Warnings title="无法生成仓位结果" warnings={result.warnings} />}
          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {canShow ? <button type="button" className="flex min-h-11 w-full items-center justify-center rounded-lg border border-blue-300 bg-white px-4 py-2.5 text-sm font-semibold text-blue-700 shadow-sm transition hover:border-blue-400 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-300" onClick={onUseRecommendedLots}>使用建议手数</button> : null}
            <button type="button" className={`flex min-h-11 w-full items-center justify-center rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none ${canShow ? '' : 'sm:col-span-2'}`} onClick={onSave} disabled={!canSave}>保存本次计算</button>
          </div>
        </section>

        {canShow && result.plannedLots !== null ? <section className="rounded-xl border border-slate-200 bg-white px-5 py-5 shadow-sm"><h3 className="text-base font-semibold text-slate-800">实际计划仓位评估</h3><dl className="mt-4 divide-y divide-slate-100"><ResultRow label="实际计划手数" value={`${result.plannedLots} 手`} /><ResultRow label="实际预计止损亏损" value={formatCurrency(result.plannedEstimatedTotalLoss ?? 0)} /><ResultRow label="实际风险占账户权益比例" value={formatPercent(result.plannedRiskPercentOfEquity ?? 0)} /><ResultRow label="实际保证金占用" value={formatCurrency(result.plannedEstimatedTotalMargin ?? 0)} /><ResultRow label="保证金占用比例" value={formatPercent(result.plannedMarginUsagePercent ?? 0)} /><ResultRow label="开仓后剩余可用资金" value={formatCurrency(result.plannedRemainingAvailableFunds ?? 0)} /></dl>{result.plannedWarnings.length > 0 ? <Warnings title="计划手数超限" warnings={result.plannedWarnings} danger /> : <p className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-3 text-sm leading-6 text-emerald-900">计划手数未超过风险和保证金限制。</p>}</section> : null}

        <section className="rounded-xl border border-slate-200 bg-white px-5 py-5 shadow-sm"><h3 className="text-base font-semibold text-slate-800">风险与保证金明细</h3>{canShow ? <dl className="mt-4 divide-y divide-slate-100"><ResultRow label="单笔允许最大亏损" value={formatCurrency(result.allowedRiskAmount)} /><ResultRow label="开仓 + 平仓费用" value={formatCurrency(result.totalFeesPerLot)} /><ResultRow label="开仓滑点成本" value={formatCurrency(result.entrySlippageCostPerLot)} /><ResultRow label="平仓滑点成本" value={formatCurrency(result.exitSlippageCostPerLot)} /><ResultRow label="总滑点成本" value={formatCurrency(result.totalSlippageCostPerLot)} /><ResultRow label="每手预计止损损失" value={formatCurrency(result.lossPerLot)} /><ResultRow label="每手估算保证金" value={formatCurrency(result.estimatedMarginPerLot)} /><ResultRow label="保证金预算" value={formatCurrency(result.marginBudget)} /><ResultRow label="风险预算占账户权益比例" value={formatPercent(result.riskBudgetPercentOfEquity)} /><ResultRow label="风险限制下最多手数" value={`${result.affordableLotsByRisk} 手`} /><ResultRow label="保证金限制下最多手数" value={`${result.affordableLotsByMargin} 手`} /><ResultRow label="最终预计总止损亏损" value={formatCurrency(result.estimatedTotalLoss)} /><ResultRow label="最终预计总保证金占用" value={formatCurrency(result.estimatedTotalMargin)} /><ResultRow label="保证金占用比例" value={formatPercent(result.marginUsagePercent)} /><ResultRow label="开仓后剩余可用资金" value={formatCurrency(result.remainingAvailableFunds)} /></dl> : <p className="mt-4 text-sm leading-6 text-slate-600">请先根据提示调整输入参数。</p>}</section>
      </div>
    </aside>
  )
}
