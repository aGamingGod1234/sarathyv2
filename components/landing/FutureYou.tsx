'use client'

import { useId, useMemo, useState } from 'react'
import { exampleMonth, formatSgd } from './example'
import { useTweenedNumber } from './hooks'
import Line from './Line'

const months = ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar']
const chart = { width: 640, height: 280, padX: 28, padTop: 24, padBottom: 40, max: 1200 }

function monthsToGoal(perMonth: number) {
  const remaining = exampleMonth.goalTarget - exampleMonth.goalSaved
  return Math.ceil(remaining / perMonth)
}

function pathFor(perMonth: number) {
  const innerW = chart.width - chart.padX * 2
  const innerH = chart.height - chart.padTop - chart.padBottom
  const points = months.map((_, index) => {
    const saved = Math.min(chart.max, exampleMonth.goalSaved + perMonth * index)
    const x = chart.padX + (innerW * index) / (months.length - 1)
    const y = chart.padTop + innerH * (1 - saved / chart.max)
    return [x, y] as const
  })
  const line = points.map(([x, y], index) => `${index === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ')
  const area = `${line} L${points[points.length - 1][0].toFixed(1)} ${chart.height - chart.padBottom} L${chart.padX} ${chart.height - chart.padBottom} Z`
  return { line, area, points }
}

export default function FutureYou() {
  const sliderId = useId()
  const [weekly, setWeekly] = useState(20)
  const extraPerMonth = (weekly * 52) / 12
  const basePerMonth = exampleMonth.toGoal
  const animatedExtra = useTweenedNumber(extraPerMonth, 380)

  const base = useMemo(() => pathFor(basePerMonth), [basePerMonth])
  const scenario = pathFor(basePerMonth + animatedExtra)

  const baseMonths = monthsToGoal(basePerMonth)
  const scenarioMonths = monthsToGoal(basePerMonth + extraPerMonth)
  const sooner = baseMonths - scenarioMonths
  const goalMonth = months[Math.min(months.length - 1, scenarioMonths)]
  const goalY =
    chart.padTop + (chart.height - chart.padTop - chart.padBottom) * (1 - exampleMonth.goalTarget / chart.max)

  return (
    <section id="tools" className="lp-future" aria-labelledby="future-title" data-nav-theme="light" data-day="23">
      <div className="lp-container lp-future-grid">
        <div data-reveal-group>
          <p className="lp-chapter" data-reveal="tag">
            <span>Day 23</span> Thinking about December <span className="lp-tier lp-tier-plus">Plus</span>
          </p>
          <h2 id="future-title" className="lp-h2" data-reveal="lines">
            <Line>See next term</Line>
            <Line>
              <em>before it happens.</em>
            </Line>
          </h2>
          <p className="lp-lead" data-reveal="text">
            Move one habit and watch Mei's trip home move with it.
          </p>

          <div className="lp-future-control" data-reveal="text">
            <label htmlFor={sliderId} className="lp-future-label">
              Spend less on food delivery
              <output htmlFor={sliderId}>{formatSgd(weekly, { decimals: 0 })} a week</output>
            </label>
            <input
              id={sliderId}
              type="range"
              min={0}
              max={40}
              step={5}
              value={weekly}
              onChange={event => setWeekly(Number(event.target.value))}
              className="lp-range"
              style={{ '--fill': `${(weekly / 40) * 100}%` } as React.CSSProperties}
              data-future-slider
            />
            <div className="lp-range-scale" aria-hidden="true">
              <span>S$0</span>
              <span>S$40</span>
            </div>
          </div>
        </div>

        <figure className="lp-future-chart" data-reveal-group data-reveal="visual" data-reveal-signature="draw">
          <figcaption className="lp-future-result" aria-live="polite">
            <span className="lp-future-goal-when">
              Funded by <strong>{goalMonth}</strong>
            </span>
            <span className="lp-future-goal-delta">
              {sooner > 0 ? `${sooner} month${sooner === 1 ? '' : 's'} sooner` : 'Current pace'}
            </span>
          </figcaption>

          <svg
            viewBox={`0 0 ${chart.width} ${chart.height}`}
            role="img"
            aria-label={`Savings projection reaching ${exampleMonth.goalName} by ${goalMonth}`}
          >
            <defs>
              <linearGradient id="future-area" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0" style={{ stopColor: 'var(--text)' }} stopOpacity="0.22" />
                <stop offset="1" style={{ stopColor: 'var(--text)' }} stopOpacity="0" />
              </linearGradient>
            </defs>
            {[0, 300, 600, 900, 1200].map(value => {
              const y = chart.padTop + (chart.height - chart.padTop - chart.padBottom) * (1 - value / chart.max)
              return (
                <line
                  key={value}
                  x1={chart.padX}
                  x2={chart.width - chart.padX}
                  y1={y}
                  y2={y}
                  className="lp-chart-grid"
                />
              )
            })}
            <line x1={chart.padX} x2={chart.width - chart.padX} y1={goalY} y2={goalY} className="lp-chart-goal" />
            <text x={chart.width - chart.padX} y={goalY - 8} textAnchor="end" className="lp-chart-goal-label">
              Goal {formatSgd(exampleMonth.goalTarget, { decimals: 0 })}
            </text>
            <path d={base.line} className="lp-chart-base" />
            <path d={scenario.area} fill="url(#future-area)" className="lp-chart-area" />
            <path d={scenario.line} className="lp-chart-line" />
            {scenario.points.map(([x, y], index) => (
              <circle key={months[index]} cx={x} cy={y} r={index === 0 ? 5 : 3.5} className="lp-chart-point" />
            ))}
            {months.map((month, index) => (
              <text
                key={month}
                x={chart.padX + ((chart.width - chart.padX * 2) * index) / (months.length - 1)}
                y={chart.height - 12}
                textAnchor="middle"
                className="lp-chart-month"
              >
                {month}
              </text>
            ))}
          </svg>
        </figure>
      </div>
    </section>
  )
}
