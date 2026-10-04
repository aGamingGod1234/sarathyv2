'use client'

import { useMemo, useState } from 'react'
import { CarFront, Check, Coffee, RotateCcw, Ticket, UtensilsCrossed } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { exampleMonth, formatSgd, leftThisMonth, safeToday } from './example'
import { useTweenedNumber } from './hooks'
import Line from './Line'

type Purchase = { id: string; label: string; amount: number; icon: LucideIcon }

const purchases: Purchase[] = [
  { id: 'kopi', label: 'Kopi O', amount: 1.8, icon: Coffee },
  { id: 'rice', label: 'Chicken rice', amount: 4.5, icon: UtensilsCrossed },
  { id: 'grab', label: 'Grab home', amount: 14.2, icon: CarFront },
  { id: 'concert', label: 'Concert ticket', amount: 88, icon: Ticket },
]

type Verdict = 'idle' | 'fits' | 'tight' | 'over'

function verdictFor(total: number, left: number): Verdict {
  if (total === 0) return 'idle'
  if (left < 0) return 'over'
  if (left < safeToday * 0.3) return 'tight'
  return 'fits'
}

function replyFor(verdict: Verdict, left: number, total: number) {
  switch (verdict) {
    case 'idle':
      return 'Pick something to check it against today.'
    case 'fits':
      return `That fits. You would still have ${formatSgd(left)} for the rest of today.`
    case 'tight': {
      return `It fits, just. Only ${formatSgd(left)} would be left today, so dinner may come out of tomorrow.`
    }
    case 'over': {
      const remainingDays = exampleMonth.daysLeft - 1
      const perDay = (leftThisMonth - total) / remainingDays
      return perDay > 0
        ? `That is ${formatSgd(-left)} over today. If you still go, the next ${remainingDays} days drop to ${formatSgd(perDay)} each.`
        : 'That would use up the rest of this month, including what is protected. Worth waiting for next month.'
    }
  }
}

const verdictLabel: Record<Verdict, string> = {
  idle: 'Today',
  fits: 'Fits today',
  tight: 'Tight',
  over: 'Over today',
}

export default function MoneyCheck() {
  const [selected, setSelected] = useState<string[]>([])

  const total = useMemo(
    () => purchases.filter(item => selected.includes(item.id)).reduce((sum, item) => sum + item.amount, 0),
    [selected],
  )
  const left = Math.round((safeToday - total) * 100) / 100
  const verdict = verdictFor(total, left)
  const shown = useTweenedNumber(left)
  const meter = Math.max(0, Math.min(1, left / safeToday))

  const toggle = (id: string) => {
    setSelected(current => (current.includes(id) ? current.filter(item => item !== id) : [...current, id]))
  }

  return (
    <section id="how-it-helps" className="lp-check" aria-labelledby="money-check-title" data-nav-theme="light" data-day="9">
      <div className="lp-check-glow" aria-hidden="true" />
      <div className="lp-container lp-check-grid">
        <div className="lp-check-copy" data-reveal-group>
          <p className="lp-chapter" data-reveal="tag">
            <span>Day 9</span> Can I afford this?
          </p>
          <h2 id="money-check-title" className="lp-h2" data-reveal="lines">
            <Line>Ask before</Line>
            <Line>
              <em>you tap.</em>
            </Line>
          </h2>
          <p className="lp-lead" data-reveal="text">
            Pick what Mei is about to buy. Sarathy checks it against today.
          </p>
        </div>

        <div className="lp-check-device" data-verdict={verdict} data-reveal-group data-reveal="visual">
          <div className="lp-check-head">
            <span className="lp-check-status">{verdictLabel[verdict]}</span>
            {selected.length > 0 && (
              <button type="button" className="lp-check-reset" onClick={() => setSelected([])}>
                <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                Reset
              </button>
            )}
          </div>

          <p className="lp-check-label">{shown < 0 ? 'Over today by' : 'Safe to spend today'}</p>
          <p className="lp-check-value" aria-hidden="true">
            <span className="lp-check-currency">S$</span>
            {Math.abs(shown).toFixed(2)}
          </p>
          <span className="lp-check-meter" aria-hidden="true" data-reveal-signature="meter">
            <span className="lp-check-meter-fill" style={{ transform: `scaleX(${meter})` }} />
          </span>

          <div className="lp-check-options" role="group" aria-label="Purchases to check" data-reveal="items">
            {purchases.map(({ id, label, amount, icon: Icon }) => {
              const isOn = selected.includes(id)
              return (
                <button
                  key={id}
                  type="button"
                  className="lp-check-option"
                  aria-pressed={isOn}
                  onClick={() => toggle(id)}
                >
                  <span className="lp-check-option-icon">
                    {isOn ? (
                      <Check className="h-4 w-4" aria-hidden="true" />
                    ) : (
                      <Icon className="h-4 w-4" aria-hidden="true" />
                    )}
                  </span>
                  <span className="lp-check-option-text">
                    <span className="lp-check-option-label">{label}</span>
                  </span>
                  <span className="lp-check-option-amount">{formatSgd(amount)}</span>
                </button>
              )
            })}
          </div>

          <div className="lp-check-reply" aria-live="polite" data-check-result>
            <span className="lp-check-avatar" aria-hidden="true">
              S
            </span>
            <p key={`${verdict}-${total}`} className="lp-check-reply-text">
              <span className="sr-only">
                {verdict === 'idle' ? '' : left < 0 ? `Over today by ${formatSgd(-left)}. ` : `${formatSgd(left)} left today. `}
              </span>
              {replyFor(verdict, left, total)}
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
