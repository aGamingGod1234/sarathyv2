'use client'

import { useEffect, useRef } from 'react'
import Prologue from './Prologue'
import DayOneStory from './DayOneStory'
import MoneyCheck from './MoneyCheck'
import ToolsBento from './ToolsBento'
import FutureYou from './FutureYou'
import MonthRecap from './MonthRecap'
import PricingPlans from './PricingPlans'
import ClosingFooter from './ClosingFooter'
import StoryChrome from './StoryChrome'
import { fraunces, mono } from './fonts'
import { loadGsap } from './hooks'
import { setupReveals } from './reveal'
import './tokens.css'
import './landing.css'
import './story.css'

/** Everything after the hero video: the story of one student's month, then the offer. */
export default function BelowHero({ isSignedIn }: { isSignedIn: boolean }) {
  const rootRef = useRef<HTMLDivElement>(null)

  // Section entrances (reveal.ts): each block plays once as one move. Reduced motion skips them entirely.
  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    let revert: (() => void) | undefined
    let cancelled = false

    loadGsap().then(({ gsap, ScrollTrigger }) => {
      if (cancelled) return
      const media = gsap.matchMedia()
      media.add('(prefers-reduced-motion: no-preference)', () => setupReveals(root, gsap, ScrollTrigger))
      revert = () => media.revert()
    })

    return () => {
      cancelled = true
      revert?.()
    }
  }, [])

  return (
    <div ref={rootRef} className={`lp-root ${fraunces.variable} ${mono.variable}`}>
      <Prologue />
      <DayOneStory />
      <MoneyCheck />
      <ToolsBento />
      <FutureYou />
      <MonthRecap />
      <PricingPlans isSignedIn={isSignedIn} />
      <ClosingFooter isSignedIn={isSignedIn} />
      <StoryChrome isSignedIn={isSignedIn} />
    </div>
  )
}
