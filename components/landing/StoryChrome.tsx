'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

const chapterDays = [1, 9, 16, 23, 30]

/**
 * Story progress for Mei's month plus the selling CTA that follows the reader.
 * One rAF-throttled scroll handler maps the reading position onto a day of the
 * month by interpolating between chapter tops ([data-day] sections).
 */
export default function StoryChrome({ isSignedIn }: { isSignedIn: boolean }) {
  const [day, setDay] = useState(1)
  const [inStory, setInStory] = useState(false)
  const [showCta, setShowCta] = useState(false)
  const [dark, setDark] = useState(false)

  useEffect(() => {
    let frame = 0

    const update = () => {
      frame = 0
      const probe = window.scrollY + window.innerHeight * 0.5
      const chapters = Array.from(document.querySelectorAll<HTMLElement>('[data-day]')).map(element => ({
        day: Number(element.dataset.day),
        top: element.getBoundingClientRect().top + window.scrollY,
        bottom: element.getBoundingClientRect().bottom + window.scrollY,
      }))
      if (!chapters.length) return

      const first = chapters[0]
      const last = chapters[chapters.length - 1]
      let next = first.day
      for (let index = 0; index < chapters.length; index++) {
        const chapter = chapters[index]
        const following = chapters[index + 1]
        if (probe < chapter.top) break
        if (!following) {
          next = chapter.day
          break
        }
        const t = Math.min(1, Math.max(0, (probe - chapter.top) / Math.max(1, following.top - chapter.top)))
        // Hold the chapter's own day while it is being read, then count up into the next one.
        const advance = Math.min(1, Math.max(0, (t - 0.7) / 0.3))
        next = chapter.day + (following.day - chapter.day) * advance * advance * (3 - 2 * advance)
      }
      setDay(Math.round(next))
      setInStory(probe >= first.top && probe <= last.bottom)

      // The CTA appears once the hero video is behind the reader and steps aside for pricing and the close.
      const hero = document.querySelector<HTMLElement>('.landing-hero')
      const pricing = document.getElementById('pricing')
      const pastHero = hero ? hero.getBoundingClientRect().bottom < window.innerHeight * 0.4 : true
      const atPricing = pricing ? pricing.getBoundingClientRect().top < window.innerHeight * 0.85 : false
      setShowCta(pastHero && !atPricing)

      // Keep the rail and the original header legible over dark chapters.
      const railY = window.innerHeight * 0.5
      const headerY = 40
      const themed = Array.from(document.querySelectorAll<HTMLElement>('[data-nav-theme]'))
      const themeAt = (y: number) =>
        themed.find(element => {
          const rect = element.getBoundingClientRect()
          return rect.top <= y && rect.bottom > y
        })?.dataset.navTheme
      setDark(themeAt(railY) === 'dark')
      const header = document.querySelector<HTMLElement>('.site-header')
      if (header) {
        // Over the hero the header keeps the original plum set by LandingPageClient.
        const overHero = hero ? hero.getBoundingClientRect().bottom >= headerY : false
        const darkHeader = !overHero && themeAt(headerY) === 'dark'
        header.style.color = darkHeader ? '#f9fafe' : '#1E0A2E'
        // Below the hero the glass nav drops its refraction for plain frosted glass (globals.css).
        header.toggleAttribute('data-past-hero', !overHero)
        header.toggleAttribute('data-dark', darkHeader)
      }
    }

    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }

    update()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
    }
  }, [])

  return (
    <>
      <div
        className="lp-rail"
        data-visible={inStory || undefined}
        data-dark={dark || undefined}
        aria-hidden="true"
      >
        <p className="lp-rail-label">Mei&apos;s month</p>
        <div className="lp-rail-track">
          {Array.from({ length: 30 }, (_, index) => {
            const tick = index + 1
            return (
              <span
                key={tick}
                className="lp-rail-tick"
                data-filled={tick <= day || undefined}
                data-chapter={chapterDays.includes(tick) || undefined}
              />
            )
          })}
          <span className="lp-rail-marker" style={{ transform: `translateY(${(day - 1) * 10}px)` }}>
            Day {day}
          </span>
        </div>
      </div>

      <div className="lp-float" data-visible={showCta || undefined}>
        <Link
          href={isSignedIn ? '/app/home' : '/app/signup'}
          className="lp-float-cta"
          tabIndex={showCta ? undefined : -1}
        >
          {isSignedIn ? 'Open app' : 'Start free'}
          <span className="lp-float-price">{isSignedIn ? '' : 'S$0'}</span>
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </>
  )
}
