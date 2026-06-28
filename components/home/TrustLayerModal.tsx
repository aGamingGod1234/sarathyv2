'use client'
import { AlertCircle, Calculator, CheckCircle2, X } from 'lucide-react'
import { SafeToSpendData } from '@/types'
import { formatCurrency } from '@/lib/calculations'

interface Props {
  safeData: SafeToSpendData
  onClose: () => void
}

export default function TrustLayerModal({ safeData, onClose }: Props) {
  const daysAfterToday = Math.max(0, safeData.daysLeft - 1)
  const dailyStartingPool = safeData.planAmount - safeData.fixedLeft - safeData.spentBeforeToday - safeData.buffer
  const todayBalance = safeData.safeToSpend
  const monthlyPoolAfterToday = safeData.freeToUse
  const todayStatusLabel = todayBalance < 0 ? "Today's safe amount exceeded" : "Today's remaining safe amount"
  const StatusIcon = todayBalance < 0 ? AlertCircle : CheckCircle2
  const monthlyRows = [
    { label: 'Monthly plan', value: safeData.planAmount, sign: '+', color: 'text-safe' },
    { label: 'Bills still due this month', value: safeData.fixedLeft, sign: '-', color: 'text-danger' },
    { label: 'Spent before today', value: safeData.spentBeforeToday, sign: '-', color: 'text-danger' },
    { label: 'Safety buffer kept aside', value: safeData.buffer, sign: '-', color: 'text-warning' },
    { label: 'Pool to split from today onward', value: dailyStartingPool, sign: '=', color: 'text-ink font-semibold' },
  ]
  const todayRows = [
    { label: `Daily allowance across ${safeData.daysLeft} day${safeData.daysLeft === 1 ? '' : 's'}`, value: safeData.dailyAllowance, sign: '+', color: 'text-safe' },
    { label: 'Spent today', value: safeData.todaySpent, sign: '-', color: 'text-danger' },
    { label: "Today's safe balance", value: todayBalance, sign: '=', color: todayBalance < 0 ? 'text-danger font-semibold' : 'text-safe font-semibold' },
  ]

  return (
    <>
      <div className="overlay" onClick={onClose} />
      <div className="bottom-sheet">
        <div className="sheet-handle" />
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-saffron-soft text-saffron">
              <Calculator className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-fraunces text-xl font-semibold text-ink">How this was calculated</h3>
              <p className="text-xs text-ink-3">Only your own budget data is used.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-line text-ink-3"
            aria-label="Close calculation details"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-4">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-3">Monthly pool</p>
            <p className="text-xs text-ink-3">Before today's split</p>
          </div>
          <div className="flex flex-col overflow-hidden rounded-2xl border border-line">
            {monthlyRows.map((row, i) => (
              <div key={row.label} className={`flex items-center justify-between gap-3 px-4 py-3 ${i < monthlyRows.length - 1 ? 'border-b border-cream' : 'bg-cream/60'}`}>
                <div className="flex min-w-0 items-center gap-3">
                  <span className={`w-4 text-center font-mono text-sm ${row.color}`}>{row.sign}</span>
                  <span className="truncate text-sm text-ink">{row.label}</span>
                </div>
                <span className={`text-sm font-semibold ${row.color}`}>
                  {formatCurrency(row.value, safeData.currency)}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-5">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-3">Today</p>
            <p className="text-xs text-ink-3">Daily allowance minus today's spending</p>
          </div>
          <div className="flex flex-col overflow-hidden rounded-2xl border border-line">
            {todayRows.map((row, i) => (
              <div key={row.label} className={`flex items-center justify-between gap-3 px-4 py-3 ${i < todayRows.length - 1 ? 'border-b border-cream' : 'bg-cream/60'}`}>
                <div className="flex min-w-0 items-center gap-3">
                  <span className={`w-4 text-center font-mono text-sm ${row.color}`}>{row.sign}</span>
                  <span className="truncate text-sm text-ink">{row.label}</span>
                </div>
                <span className={`text-sm font-semibold ${row.color}`}>
                  {formatCurrency(row.value, safeData.currency)}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className={`rounded-2xl border p-4 ${todayBalance < 0 ? 'border-danger/20 bg-rose-50' : 'border-safe/20 bg-mint'}`}>
          <div className={`mb-2 flex items-center gap-2 ${todayBalance < 0 ? 'text-danger' : 'text-safe'}`}>
            <StatusIcon className="h-4 w-4" />
            <p className="text-xs font-semibold uppercase tracking-wide">
              {todayStatusLabel}
            </p>
          </div>
          <p className={`font-fraunces text-3xl font-semibold ${todayBalance < 0 ? 'text-danger' : 'text-safe'}`}>
            {formatCurrency(todayBalance, safeData.currency)}
          </p>
          <p className="mt-1 text-xs text-ink-3">
            {todayBalance < 0
              ? `You spent ${formatCurrency(Math.abs(todayBalance), safeData.currency)} more than today's allowance.`
              : `You can still spend ${formatCurrency(todayBalance, safeData.currency)} today before crossing the daily allowance.`}
          </p>
          <div className="mt-3 rounded-xl bg-white/70 px-3 py-2">
            <p className="text-xs leading-relaxed text-ink-3">
              Month pool after today: <span className={monthlyPoolAfterToday < 0 ? 'font-semibold text-danger' : 'font-semibold text-ink'}>{formatCurrency(monthlyPoolAfterToday, safeData.currency)}</span>
              {daysAfterToday > 0
                ? ` for the next ${daysAfterToday} day${daysAfterToday === 1 ? '' : 's'}. This is monthly context, not today's safe amount.`
                : `. This is monthly context, not today's safe amount.`}
            </p>
          </div>
        </div>

        <button type="button" className="btn-primary mt-4" onClick={onClose}>Got it</button>
      </div>
    </>
  )
}
