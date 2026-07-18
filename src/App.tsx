import { ContractSection } from './components/ContractSection'
import { HistoryList } from './components/HistoryList'
import { PositionResult } from './components/PositionResult'
import { RiskSection } from './components/RiskSection'
import { TradePlanSection } from './components/TradePlanSection'
import { officialContracts } from './data/officialContracts'
import { findExchangeFeeMargin } from './data/exchangeFeeMargins'
import { useCalculationHistory } from './hooks/useCalculationHistory'
import { usePositionForm } from './hooks/usePositionForm'
import { calculatePosition } from './lib/calculator'
import { estimateFeePerLot } from './lib/fees'
import { validatePositionInput } from './lib/validation'
import type { FeeRule } from './types/position'

function displayedFee(rule: FeeRule, price: number, multiplier: number): number {
  if (rule.kind === 'fixed') return Number.isFinite(rule.amountPerLot) ? rule.amountPerLot : 0
  const estimated = estimateFeePerLot(rule, price, multiplier)
  return Number.isFinite(estimated) ? estimated : 0
}

function App() {
  const form = usePositionForm()
  const history = useCalculationHistory(form.setPosition, form.setEmptyFields)
  const validation = validatePositionInput(form.position)
  const result = calculatePosition(form.position)
  const canUseResult = validation.isValid && result.warnings.length === 0
  const fieldError = (field: string) => validation.fieldErrors[field]
  const valueFor = (field: string, value: number) => form.emptyFields.has(field) ? '' : value
  const plannedLotsValue = form.position.plannedLots === undefined || form.emptyFields.has('plannedLots') ? '' : form.position.plannedLots
  const hasAutomaticFeeMargin = Boolean(form.selectedOfficialContract && findExchangeFeeMargin(form.selectedOfficialContract.exchangeCode, form.selectedOfficialContract.symbol))

  const selectContractById = (id: string) => {
    const contract = officialContracts.find((item) => item.id === id)
    if (contract) form.selectContract(contract)
  }
  const useRecommendedLots = () => {
    form.setPosition((current) => ({ ...current, plannedLots: result.recommendedLots }))
    form.setEmptyFields((current) => { const next = new Set(current); next.delete('plannedLots'); return next })
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-5 px-5 py-7 sm:px-8 sm:py-8 lg:flex-row lg:items-end lg:justify-between">
          <div><p className="mb-2 text-xs font-semibold tracking-[0.16em] text-blue-700">期货交易风险管理</p><h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">以损定仓计算器</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">根据止损距离与单笔风险，估算可开仓手数</p></div>
          <p className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-800">先设定风险，再填写交易计划</p>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-5 py-7 sm:px-8 sm:py-9">
        <section aria-label="计算步骤" className="mb-7 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[
            ['01', '合约参数', '选择品种并确认固定规格'],
            ['02', '账户与风险', '设定本次可承受亏损'],
            ['03', '交易计划', '填写方向、开仓与止损价'],
          ].map(([step, title, description]) => <div key={step} className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm"><p className="text-xs font-semibold tracking-wide text-blue-700">{step} {title}</p><p className="mt-1 text-xs leading-5 text-slate-500">{description}</p></div>)}
        </section>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.08fr)_minmax(22rem,0.92fr)] lg:gap-8">
          <section aria-labelledby="input-title">
            <div className="mb-5 flex flex-col gap-3 rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"><div><h2 id="input-title" className="text-lg font-semibold text-slate-900">交易工作台</h2><span className="mt-1 block text-sm text-slate-500">依次完成三个步骤，即可获得仓位建议。</span></div><button type="button" className="min-h-11 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-200" onClick={form.restoreDemoParameters}>恢复演示参数</button></div>
            <form className="space-y-4" onSubmit={(event) => event.preventDefault()}>
              <ContractSection
                position={form.position}
                selectedContract={form.selectedOfficialContract}
                contractsByExchange={form.contractsByExchange}
                hasAutomaticFeeMargin={hasAutomaticFeeMargin}
                openFeeValue={valueFor('openFee', displayedFee(form.position.openFeeRule, form.position.entryPrice, form.position.contract.multiplier))}
                closeFeeValue={valueFor('closeFee', displayedFee(form.position.closeFeeRule, form.position.stopLossPrice, form.position.contract.multiplier))}
                fieldError={fieldError}
                valueFor={valueFor}
                onSelectContract={selectContractById}
                onContractFieldChange={form.setContractField}
                onFeeChange={form.setFeeAmount}
              />
              <RiskSection
                position={form.position}
                fieldError={fieldError}
                valueFor={valueFor}
                onNumericChange={form.setNumericField}
                onMarginUsageChange={form.setMaxMarginUsagePercent}
                onRiskModeChange={(riskMode) => form.setPosition((current) => ({ ...current, riskMode }))}
              />
              <TradePlanSection
                position={form.position}
                plannedLotsValue={plannedLotsValue}
                fieldError={fieldError}
                valueFor={valueFor}
                onDirectionChange={(direction) => form.setPosition((current) => ({ ...current, direction }))}
                onNumericChange={form.setNumericField}
                onPlannedLotsChange={form.setPlannedLots}
              />
            </form>
          </section>

          <PositionResult result={result} canShow={canUseResult} canSave={canUseResult} onUseRecommendedLots={useRecommendedLots} onSave={() => history.save(form.position, result, canUseResult)} />
        </div>

        <HistoryList
          history={history.history}
          status={history.historyStatus}
          isClearConfirmationVisible={history.isClearConfirmationVisible}
          onShowClearConfirmation={() => history.setIsClearConfirmationVisible(true)}
          onHideClearConfirmation={() => history.setIsClearConfirmationVisible(false)}
          onConfirmClear={history.confirmClear}
          onLoad={history.load}
          onDelete={history.remove}
        />
      </main>

      <footer className="mt-10 border-t border-slate-200 bg-white"><div className="mx-auto max-w-6xl px-5 py-6 sm:px-8"><p className="max-w-5xl text-sm leading-6 text-slate-500">本工具仅根据用户输入参数进行数学估算，不提供投资建议，不保证计算结果、行情数据、保证金比例、手续费或实际成交结果的准确性。期货交易具有高风险，实际交易前请以交易所、期货公司及个人交易规则为准。</p></div></footer>
    </div>
  )
}

export default App
