const inputClass = 'mt-2 block min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100'

export type NumberFieldProps = {
  id: string
  label: string
  value: number | ''
  error?: string
  hint?: string
  suffix?: string
  onChange: (value: string) => void
}

export function NumberField({ id, label, value, error, hint, suffix, onChange }: NumberFieldProps) {
  const errorId = `${id}-error`
  return (
    <div>
      <label htmlFor={id} className="text-sm font-medium text-slate-700">{label}</label>
      <div className="relative">
        <input id={id} type="number" inputMode="decimal" step="any" className={`${inputClass} ${error ? 'border-red-400 focus:border-red-500 focus:ring-red-100' : ''}`} value={value} onChange={(event) => onChange(event.target.value)} aria-invalid={Boolean(error)} aria-describedby={error ? errorId : undefined} />
        {suffix ? <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500">{suffix}</span> : null}
      </div>
      {hint ? <p className="mt-1.5 text-xs text-slate-500">{hint}</p> : null}
      {error ? <p id={errorId} className="mt-1.5 text-sm leading-5 text-red-700" role="status">{error}</p> : null}
    </div>
  )
}
