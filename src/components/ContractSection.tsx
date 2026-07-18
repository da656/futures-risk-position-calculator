import { NumberField } from './NumberField'
import type { OfficialContract } from '../data/officialContracts'
import type { PositionInput } from '../types/position'

type Props = {
  position: PositionInput
  selectedContract?: OfficialContract
  contractsByExchange: Record<string, OfficialContract[]>
  hasAutomaticFeeMargin: boolean
  openFeeValue: number | ''
  closeFeeValue: number | ''
  fieldError: (field: string) => string | undefined
  valueFor: (field: string, value: number) => number | ''
  onSelectContract: (id: string) => void
  onContractFieldChange: (field: 'multiplier' | 'tickSize' | 'marginRate', value: string) => void
  onFeeChange: (side: 'open' | 'close', value: string) => void
}

const inputClass = 'mt-2 block min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100'

export function ContractSection({ position, selectedContract, contractsByExchange, hasAutomaticFeeMargin, openFeeValue, closeFeeValue, fieldError, valueFor, onSelectContract, onContractFieldChange, onFeeChange }: Props) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white px-5 py-5 shadow-sm" aria-label="合约参数">
      <div className="flex items-start gap-3"><span className="mt-0.5 rounded-md bg-blue-50 px-2 py-1 text-xs font-bold text-blue-700">01</span><div><h3 className="text-base font-semibold text-slate-800">合约参数</h3><p className="mt-1 text-xs text-slate-500">选择品种，确认固定规格与交易成本。</p></div></div>
      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="contract" className="text-sm font-medium text-slate-700">品种</label>
          <select id="contract" className={inputClass} value={position.contract.id} onChange={(event) => onSelectContract(event.target.value)}>
            {!selectedContract ? <option value={position.contract.id}>自定义或历史品种（{position.contract.symbol}）</option> : null}
            {Object.entries(contractsByExchange).map(([exchange, contracts]) => <optgroup key={exchange} label={exchange}>{contracts.map((contract) => <option key={contract.id} value={contract.id}>{contract.name}（{contract.symbol}）</option>)}</optgroup>)}
          </select>
          {selectedContract ? <div className="mt-2 rounded-lg bg-slate-50 px-3 py-2 text-xs leading-5 text-slate-600"><p className="flex flex-wrap gap-x-2"><span>交易单位：{selectedContract.tradingUnit}</span><span>报价单位：{selectedContract.quoteUnit}</span><span>每跳价值：{selectedContract.tickValue} 元/手</span></p><p className="flex flex-wrap gap-x-2"><span>核对日期：{selectedContract.verifiedAt}</span><span>数据状态：{selectedContract.verificationStatus === 'official-static' ? '官方静态核验' : '用户确认'}</span>{selectedContract.sourcePublishedAt ? <span>来源发布日期：{selectedContract.sourcePublishedAt}</span> : null}<a className="font-medium text-blue-700 underline underline-offset-2" href={selectedContract.sourceUrl} target="_blank" rel="noreferrer">参考目录：{selectedContract.sourceTitle}</a></p></div> : <p className="mt-2 text-xs leading-5 text-amber-700">该历史或自定义品种不在当前已核实数据集中，请手动核对参数。</p>}
          <p className="mt-2 text-xs leading-5 text-slate-500">合约乘数和最小变动价位来自已核验固定参数；保证金与手续费快照会随品种自动带入，仍可手动修改。</p>
        </div>
        <NumberField id="multiplier" label="合约乘数" value={valueFor('contract.multiplier', position.contract.multiplier)} error={fieldError('contract.multiplier')} onChange={(value) => onContractFieldChange('multiplier', value)} />
        <NumberField id="tick-size" label="最小变动价位" value={valueFor('contract.tickSize', position.contract.tickSize)} error={fieldError('contract.tickSize')} onChange={(value) => onContractFieldChange('tickSize', value)} />
        <NumberField id="margin-rate" label="保证金比例" hint="小数，例如 0.12 表示 12%" value={valueFor('contract.marginRate', position.contract.marginRate)} error={fieldError('contract.marginRate')} onChange={(value) => onContractFieldChange('marginRate', value)} />
        <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4 sm:col-span-2">
          <div className="flex flex-wrap items-baseline justify-between gap-2"><h4 className="text-sm font-semibold text-slate-800">交易成本</h4><span className="text-xs font-medium text-blue-700">{!hasAutomaticFeeMargin ? '未提供自动参数，请手动填写' : position.feeDataStatus === 'table-auto' ? '资料表自动带入' : position.feeDataStatus === 'legacy-single-side' ? '旧版单边手续费记录' : '已手动调整'}</span></div>
          <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <NumberField id="open-fee" label="开仓手续费" suffix="元/手" hint={position.openFeeRule.kind === 'rate' ? `按成交额 ${(position.openFeeRule.rate * 10_000).toLocaleString('zh-CN')}/10000，按开仓价估算` : '固定金额，按每手计入'} value={openFeeValue} error={fieldError('openFeeRule')} onChange={(value) => onFeeChange('open', value)} />
            <NumberField id="close-fee" label="平仓手续费（平昨）" suffix="元/手" hint={position.closeFeeRule.kind === 'rate' ? `按成交额 ${(position.closeFeeRule.rate * 10_000).toLocaleString('zh-CN')}/10000，按止损价估算` : '固定金额，按每手计入'} value={closeFeeValue} error={fieldError('closeFeeRule')} onChange={(value) => onFeeChange('close', value)} />
          </div>
          <p className="mt-3 text-xs leading-5 text-slate-600">平仓手续费按资料表的平昨规则自动带入；暂未区分平今仓、合约月份及交易所临时调整。比例手续费按当前输入价格估算，仅供仓位风险测算使用，请以实际交易规则为准。</p>
        </div>
      </div>
    </section>
  )
}
