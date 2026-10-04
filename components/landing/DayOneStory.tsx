'use client'

import { useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import type { ChaosPalette } from './ChaosScene'
import { exampleMonth, formatSgd, safeToday } from './example'
import { loadGsap, usePrefersReducedMotion } from './hooks'
import Line from './Line'

const ChaosScene = dynamic(() => import('./ChaosScene'), { ssr: false, loading: () => null })

// 3D objects follow the landing tokens (components/landing/tokens.css). WebGL needs literal colours,
// so these mirror the primitives; keep them in step if the token scales are regenerated.
// Module-level so the scene does not rebuild its textures on every render.
const scenePalette: Partial<ChaosPalette> = {
  debitFace: '#1b1939', // ink-950
  creditFace: '#fa720d', // orange-500
  cardInk: '#f9fafe', // slate-50
  receiptPaper: '#fcfcff', // slate-25
  ink: '#1b1939', // ink-950
  mutedInk: '#6c6c74', // slate-700
  receiptRule: '#d1d2d9', // slate-300
  pillSurface: '#ffffff',
  pillIcon: '#1b1939', // ink-950
  positiveIcon: '#09b7b3', // teal-500
  positiveAmount: '#0a7d7b', // teal-700
  negativeAmount: '#1b1939', // ink-950
  shadowColor: '#100a2f', // ink-975
  shadowOpacity: 0.14,
  shadowRadius: 2, // tighter contact shadows read as harder, more precise objects
  floatingShadowRadius: 8,
  keyLightColor: '#ffffff',
  hemisphereSky: '#f9fafe', // slate-50
  hemisphereGround: '#e4e4eb', // slate-200
}

const steps = [
  { index: '01', text: 'Five sources, three apps, one tired brain.' },
  { index: '02', text: 'Sarathy sorts it. Hall fees and transport are protected first.' },
  { index: '03', text: 'What is left becomes one number for today.' },
]

const lanes = [
  {
    id: 'fixed',
    label: 'Protected',
    hint: 'Hall fees, transport, plans',
    total: `${formatSgd(exampleMonth.protected)} set aside`,
  },
  {
    id: 'spending',
    label: 'Day to day',
    hint: 'Food, rides, small buys',
    total: `${formatSgd(exampleMonth.spent)} spent so far`,
  },
  {
    id: 'goals',
    label: 'In and saving',
    hint: 'Allowance, pay, goals',
    total: `${formatSgd(exampleMonth.income, { decimals: 0 })} in, ${formatSgd(exampleMonth.toGoal, { decimals: 0 })} to ${exampleMonth.goalName}`,
  },
] as const

// 2D stand-ins for the 3D objects when WebGL is unavailable, so the sorted state still reads.
const fallbackChips: Record<(typeof lanes)[number]['id'], string[]> = {
  fixed: ['Hall fees  S$560.00', 'MRT concession  S$64.00', 'Phone plan  S$15.00', 'Spotify  S$5.99'],
  spending: ['Kopi O  S$1.80', 'Chicken rice  S$4.50', 'Grab  S$14.20', 'Shopee  S$23.90'],
  goals: ['PayNow from Mum  +S$600', 'Part-time pay  +S$420', 'Trip home  38% saved'],
}

function pickQuality(): 'high' | 'low' {
  const narrow = window.matchMedia('(max-width: 767px)').matches
  const nav = navigator as Navigator & { deviceMemory?: number }
  const weak = (nav.hardwareConcurrency ?? 8) <= 4 || (nav.deviceMemory ?? 8) <= 4
  return narrow || weak ? 'low' : 'high'
}

export default function DayOneStory() {
  const sectionRef = useRef<HTMLElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const progressRef = useRef(0)
  const reducedMotion = usePrefersReducedMotion()
  const [quality, setQuality] = useState<'high' | 'low' | null>(null)
  const [sceneState, setSceneState] = useState<'loading' | 'ready' | 'unavailable'>('loading')

  useEffect(() => {
    setQuality(pickQuality())
  }, [])

  useEffect(() => {
    const section = sectionRef.current
    const stage = stageRef.current
    if (!section || !stage) return

    let revert: (() => void) | undefined
    let cancelled = false

    loadGsap().then(({ gsap, ScrollTrigger }) => {
      if (cancelled) return
      const media = gsap.matchMedia()

      media.add(
        {
          motion: '(prefers-reduced-motion: no-preference)',
          reduce: '(prefers-reduced-motion: reduce)',
          mobile: '(max-width: 767px)',
        },
        context => {
          const { reduce, mobile } = context.conditions as { reduce: boolean; mobile: boolean }

          if (reduce) {
            // No pinned travel: the hero stays a calm still life and the sorted
            // result is carried by the Money check section that follows.
            progressRef.current = 0
            window.dispatchEvent(new Event('chaos:progress'))
            return
          }

          const q = gsap.utils.selector(stage)
          const counter = { value: 0 }
          const numberEl = q('[data-hero-number]')[0] as HTMLElement | undefined

          const timeline = gsap.timeline({
            defaults: { ease: 'none' },
            scrollTrigger: {
              trigger: section,
              start: 'top top',
              end: () => `+=${window.innerHeight * (mobile ? 1.9 : 2.5)}`,
              pin: stage,
              scrub: 0.6,
              anticipatePin: 1,
              invalidateOnRefresh: true,
              onUpdate: self => {
                progressRef.current = self.progress
                stage.style.setProperty('--hero-p', self.progress.toFixed(4))
              },
              onRefresh: () => window.dispatchEvent(new Event('chaos:remeasure')),
            },
          })

          timeline
            .to(q('.lp-hero-copy'), { autoAlpha: 0, y: -56, duration: 0.1, ease: 'power1.in' }, 0.06)
            .fromTo(
              q('.lp-lane-head'),
              { autoAlpha: 0, y: 16 },
              { autoAlpha: 1, y: 0, duration: 0.08, stagger: 0.025, ease: 'power2.out' },
              0.15,
            )
            .fromTo(q('.lp-lane-rule'), { scaleY: 0 }, { scaleY: 1, duration: 0.2, stagger: 0.03 }, 0.16)
            .to(q('.lp-step-0'), { autoAlpha: 0, y: -10, duration: 0.03 }, 0.12)
            .fromTo(q('.lp-step-1'), { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.04 }, 0.15)
            .to(q('.lp-step-1'), { autoAlpha: 0, y: -10, duration: 0.03 }, 0.5)
            .fromTo(q('.lp-step-2'), { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.04 }, 0.53)
            .to(q('.lp-lane-hint'), { autoAlpha: 0, duration: 0.05 }, 0.55)
            .to(q('.lp-lane-rule'), { autoAlpha: 0, duration: 0.08 }, 0.55)
            .fromTo(
              q('.lp-lane-total'),
              { autoAlpha: 0, y: 10 },
              { autoAlpha: 1, y: 0, duration: 0.08, stagger: 0.03, ease: 'power2.out' },
              0.62,
            )
            .fromTo(
              q('.lp-hero-number'),
              { autoAlpha: 0, y: 40, scale: 0.94 },
              { autoAlpha: 1, y: 0, scale: 1, duration: 0.14, ease: 'power2.out' },
              0.62,
            )
            .to(
              counter,
              {
                value: safeToday,
                duration: 0.16,
                ease: 'power1.out',
                onUpdate: () => {
                  if (numberEl) numberEl.textContent = counter.value.toFixed(2)
                },
              },
              0.66,
            )
            .fromTo(q('.lp-hero-meter-fill'), { scaleX: 0 }, { scaleX: 0.72, duration: 0.14, ease: 'power2.out' }, 0.7)
            .to({}, { duration: 0.001 }, 0.999)

          return () => {
            progressRef.current = 0
          }
        },
      )

      // Fonts change text metrics; re-measure pin + anchors once they settle.
      document.fonts?.ready.then(() => ScrollTrigger.refresh())
      revert = () => media.revert()
    })

    return () => {
      cancelled = true
      revert?.()
    }
  }, [])

  return (
    <section ref={sectionRef} id="day-1" className="lp-hero" aria-labelledby="day-1-title" data-nav-theme="light" data-day="1">
      <div ref={stageRef} className="lp-hero-stage" data-scene={sceneState}>
        <div className="lp-hero-ledger" aria-hidden="true" />
        {/* Keeps floating objects out from under the fixed nav. */}
        <div className="lp-hero-nav-zone" data-chaos-exclusion aria-hidden="true" />

        {quality && (
          <ChaosScene
            progressRef={progressRef}
            stageRef={stageRef}
            reducedMotion={reducedMotion}
            quality={quality}
            onReady={() => setSceneState('ready')}
            onUnavailable={() => setSceneState('unavailable')}
            className="lp-hero-canvas"
            palette={scenePalette}
          />
        )}

        <div className="lp-hero-copy-wrap">
          <div className="lp-hero-copy" data-chaos-exclusion data-reveal-group>
            <p className="lp-chapter" data-reveal="tag">
              <span>Day 1</span> Payday
            </p>
            <h2 id="day-1-title" className="lp-hero-title" data-reveal="lines">
              <Line>Money arrives</Line>
              <Line>
                <em>from everywhere.</em>
              </Line>
            </h2>
            <p className="lp-hero-sub" data-reveal="text">
              Meet Mei, Year 2. Money lands from five places at once. Scroll and watch Sarathy sort it.
            </p>
          </div>
        </div>

        <div className="lp-lanes" aria-hidden={reducedMotion || undefined}>
          {lanes.map(lane => (
            <div key={lane.id} className={`lp-lane lp-lane-${lane.id}`}>
              <div className="lp-lane-head">
                <span className="lp-lane-dot" />
                <span className="lp-lane-label">{lane.label}</span>
                <span className="lp-lane-hint">{lane.hint}</span>
              </div>
              <div className="lp-lane-area" data-chaos-lane={lane.id}>
                <span className="lp-lane-rule" />
                <div className="lp-lane-stack" data-chaos-stack={lane.id} />
                <p className="lp-lane-total">{lane.total}</p>
                {sceneState === 'unavailable' && (
                  <ul className="lp-lane-fallback">
                    {fallbackChips[lane.id].map(chip => (
                      <li key={chip}>{chip}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ))}

          <div
            className="lp-hero-number"
            role="group"
            aria-label={`Example: ${formatSgd(safeToday)} safe to spend today`}
          >
            <p className="lp-hero-number-label">Safe to spend today</p>
            <p className="lp-hero-number-value">
              <span className="lp-hero-number-currency">S$</span>
              <span data-hero-number>{safeToday.toFixed(2)}</span>
            </p>
            <span className="lp-hero-meter" aria-hidden="true">
              <span className="lp-hero-meter-fill" />
            </span>
            <p className="lp-hero-number-note">
              {formatSgd(exampleMonth.income - exampleMonth.protected - exampleMonth.toGoal - exampleMonth.spent)} left,{' '}
              {exampleMonth.daysLeft} days to go
            </p>
          </div>
        </div>

        <ol className="lp-steps" aria-label="How Sarathy works" data-chaos-exclusion>
          {steps.map((step, index) => (
            <li key={step.index} className={`lp-step lp-step-${index}`}>
              <span className="lp-step-index">{step.index}</span>
              <span>{step.text}</span>
            </li>
          ))}
        </ol>

      </div>
    </section>
  )
}
