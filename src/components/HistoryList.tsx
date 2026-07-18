import type { CalculationHistoryRecord } from '../lib/history'

type Props = {
  history: CalculationHistoryRecord[]
  status: string
  isClearConfirmationVisible: boolean
  onShowClearConfirmation: () => void
  onHideClearConfirmation: () => void
  onConfirmClear: () => void
  onLoad: (record: CalculationHistoryRecord) => void
  onDelete: (id: string) => void
}

const formatCurrency = (amount: number) => new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount)
const formatSavedAt = (savedAt: string) => { const timestamp = Date.parse(savedAt); return Number.isFinite(timestamp) ? new Intl.DateTimeFormat('zh-CN', { dateStyle: 'medium', timeStyle: 'short' }).format(timestamp) : '保存时间未知' }

export function HistoryList({ history, status, isClearConfirmationVisible, onShowClearConfirmation, onHideClearConfirmation, onConfirmClear, onLoad, onDelete }: Props) {
  return (
    <section className="mt-10 rounded-2xl border border-slate-200 bg-slate-100/60 px-5 py-7 sm:px-6" aria-labelledby="history-title">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h2 id="history-title" className="text-lg font-semibold text-slate-900">最近计算记录</h2><p className="mt-1 text-sm text-slate-500">仅保存在当前浏览器中，最多保留 10 条记录。</p></div>{history.length > 0 ? <button type="button" className="min-h-11 rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-200" onClick={onShowClearConfirmation}>清空全部历史记录</button> : null}</div>
      {status ? <p className="mt-4 text-sm text-slate-600" role="status">{status}</p> : null}
      {isClearConfirmationVisible ? <div className="mt-4 flex flex-wrap items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900" role="alert"><p>确认清空全部历史记录？此操作无法恢复。</p><button type="button" className="min-h-9 rounded-md bg-red-700 px-3 py-1.5 font-semibold text-white" onClick={onConfirmClear}>确认清空全部历史记录</button><button type="button" className="min-h-9 rounded-md border border-amber-300 bg-white px-3 py-1.5 font-semibold" onClick={onHideClearConfirmation}>取消</button></div> : null}
      {history.length === 0 ? <p className="mt-5 rounded-xl border border-dashed border-slate-300 bg-white px-5 py-6 text-sm text-slate-500">尚无保存的计算记录。</p> : <ol className="mt-5 space-y-3">{history.map((record) => <li key={record.id} className="rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm"><div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"><div><div className="flex flex-wrap items-baseline gap-x-3 gap-y-1"><h3 className="font-semibold text-slate-900">{record.contractName}（{record.contractSymbol}）</h3><span className="text-sm text-slate-600">{record.direction === 'long' ? '做多' : '做空'}</span><span className="text-xs text-slate-500">{formatSavedAt(record.savedAt)}</span></div><p className="mt-2 text-sm leading-6 text-slate-600">开仓 {record.entryPrice} · 止损 {record.stopLossPrice} · 允许亏损 {formatCurrency(record.allowedRiskAmount)} · 建议 {record.recommendedLots} 手 · 每手止损损失 {formatCurrency(record.lossPerLot)}</p></div><div className="flex shrink-0 gap-2"><button type="button" className="min-h-10 rounded-lg border border-blue-300 bg-white px-3 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-50" onClick={() => onLoad(record)}>载入参数</button><button type="button" className="min-h-10 rounded-lg border border-red-300 bg-white px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50" onClick={() => onDelete(record.id)}>删除</button></div></div></li>)}</ol>}
    </section>
  )
}
