'use client'

import { useEffect, useRef } from 'react'
import { loadGsap } from './hooks'
import Line from './Line'

// A chariot wheel: the visual thread for the name. It turns with the page scroll,
// the way a charioteer keeps the wheels moving steadily underneath the rider.
function Wheel() {
  const spokes = Array.from({ length: 12 }, (_, index) => index * 30)
  return (
    <svg className="lp-wheel" viewBox="0 0 200 200" aria-hidden="true">
      <circle cx="100" cy="100" r="92" className="lp-wheel-rim" />
      <circle cx="100" cy="100" r="84" className="lp-wheel-rim-inner" />
      {spokes.map(angle => (
        <line key={angle} x1="100" y1="100" x2="100" y2="18" transform={`rotate(${angle} 100 100)`} />
      ))}
      <circle cx="100" cy="100" r="16" className="lp-wheel-hub" />
      <circle cx="100" cy="100" r="5" className="lp-wheel-axle" />
    </svg>
  )
}

export default function Prologue() {
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const section = sectionRef.current
    if (!section) return
    let revert: (() => void) | undefined
    let cancelled = false

    loadGsap().then(({ gsap }) => {
      if (cancelled) return
      const media = gsap.matchMedia()
      media.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.to(section.querySelector('.lp-wheel'), {
          rotate: 140,
          ease: 'none',
          scrollTrigger: { trigger: section, start: 'top bottom', end: 'bottom top', scrub: 0.8 },
        })
      })
      revert = () => media.revert()
    })

    return () => {
      cancelled = true
      revert?.()
    }
  }, [])

  return (
    <section ref={sectionRef} id="problem" className="lp-prologue" aria-labelledby="prologue-title" data-nav-theme="light">
      <div className="lp-container lp-prologue-grid">
        <div data-reveal-group>
          <p className="lp-eyebrow" data-reveal="tag">
            Why Sarathy
          </p>
          <h2 id="prologue-title" className="lp-h2" data-reveal="lines">
            <Line>Uni life is a lot.</Line>
            <Line>
              <em>Money shouldn&apos;t be the loudest part.</em>
            </Line>
          </h2>
          <p className="lp-lead" data-reveal="text">
            Allowance, shifts, hall fees, a late Grab. Most students keep it all in their head.
          </p>
        </div>

        <div className="lp-definition" data-reveal-group data-reveal="visual">
          <Wheel />
          <div className="lp-definition-card">
            <p className="lp-definition-word">
              sa·ra·thi <span>the charioteer</span>
            </p>
            <p className="lp-definition-text">
              Sarathy keeps your money steady while you live uni life.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
