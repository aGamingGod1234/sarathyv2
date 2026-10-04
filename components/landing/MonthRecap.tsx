'use client'

import { useState } from 'react'
import { exampleMonth, formatSgd } from './example'
import Line from './Line'

type DayState = 'safe' | 'tight' | 'over'

// Day 1 is a Tuesday, so Fridays are 4, 11, 18, 25 and the concert Saturday is 12.
// These match the earlier chapters: late Friday spending, the Day 9 money check, the concert.
const firstWeekday = 1 // Monday = 0
const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const notes: Record<number, { state: DayState; note: string }> = {
  1: { state: 'safe', note: 'Payday. PayNow from home and part-time pay land; hall fees and transport are set aside first.' },
  4: { state: 'tight', note: 'Friday supper run after 9pm. Tight, but still inside today.' },
  9: { state: 'safe', note: 'Checked the concert ticket before buying. Decided it was worth it.' },
  11: { state: 'tight', note: 'Another late Friday. Sarathy flags the pattern.' },
  12: {
    state: 'over',
    note: `Concert. ${formatSgd(64.83)} over today, spread across the next six days instead of becoming a surprise.`,
  },
  16: { state: 'safe', note: 'Scanned a week of receipts in one go. Nothing typed by hand.' },
  18: { state: 'tight', note: 'Friday again, a little lighter this time.' },
  23: { state: 'safe', note: `Moved ${formatSgd(20, { decimals: 0 })} a week from food delivery to the trip home.` },
  25: { state: 'tight', note: 'Last Friday of the month. Still inside the number.' },
  30: {
    state: 'safe',
    note: `Month closed. Every bill paid, trip home at ${formatSgd(exampleMonth.goalSaved + exampleMonth.toGoal, { decimals: 0 })}.`,
  },
}

const days = Array.from({ length: 30 }, (_, index) => {
  const day = index + 1
  return { day, weekday: weekdays[(firstWeekday + index) % 7], ...(notes[day] ?? { state: 'safe' as DayState, note: '' }) }
})

const stateLabel: Record<DayState, string> = { safe: 'Inside today', tight: 'Tight', over: 'Over' }

export default function MonthRecap() {
  const [selected, setSelected] = useState(12)
  const current = days[selected - 1]

  return (
    <section id="day-30" className="lp-recap" aria-labelledby="recap-title" data-nav-theme="light" data-day="30">
      <div className="lp-container lp-recap-grid">
        <div data-reveal-group>
          <p className="lp-chapter" data-reveal="tag">
            <span>Day 30</span> The month, readable
          </p>
          <h2 id="recap-title" className="lp-h2" data-reveal="lines">
            <Line>A month you can</Line>
            <Line>
              <em>actually read.</em>
            </Line>
          </h2>
          <p className="lp-lead" data-reveal="text">
            Where it was easy, where it got tight, and the night Mei chose to go over.
          </p>
        </div>

        <div className="lp-recap-card" data-reveal-group data-reveal="visual" data-reveal-signature="ripple">
          <div className="lp-recap-legend" aria-hidden="true">
            <span data-state="safe">Inside today</span>
            <span data-state="tight">Tight</span>
            <span data-state="over">Over</span>
          </div>
          <div className="lp-cal" role="group" aria-label="Mei's month, one button per day">
            {weekdays.map(weekday => (
              <span key={weekday} className="lp-cal-weekday" aria-hidden="true">
                {weekday[0]}
              </span>
            ))}
            {Array.from({ length: firstWeekday }, (_, index) => (
              <span key={`pad-${index}`} aria-hidden="true" />
            ))}
            {days.map(day => (
              <button
                key={day.day}
                type="button"
                className="lp-cal-day"
                data-state={day.state}
                data-note={day.note ? true : undefined}
                aria-pressed={selected === day.day}
                aria-label={`${day.weekday} ${day.day}: ${stateLabel[day.state]}`}
                onClick={() => setSelected(day.day)}
                onPointerEnter={() => setSelected(day.day)}
                style={{ '--i': day.day } as React.CSSProperties}
              >
                {day.day}
              </button>
            ))}
          </div>
          <div className="lp-recap-note" aria-live="polite">
            <p className="lp-recap-note-head">
              <span>
                {current.weekday} {current.day}
              </span>
              <span className="lp-recap-pill" data-state={current.state}>
                {stateLabel[current.state]}
              </span>
            </p>
            <p key={current.day} className="lp-recap-note-text">
              {current.note || 'An ordinary day, comfortably inside the number.'}
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
