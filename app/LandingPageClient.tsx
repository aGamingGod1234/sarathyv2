'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { getSession } from 'next-auth/react'
import { ArrowRight, UserRound, Volume2, VolumeX } from 'lucide-react'
import BrandLogo from '@/components/ui/BrandLogo'
import BelowHero from '@/components/landing/BelowHero'

const navItems = [
  { label: 'Problem', href: '#problem' },
  { label: 'How it helps', href: '#how-it-helps' },
  { label: 'Features', href: '#features' },
  { label: 'Plan ahead', href: '#tools' },
  { label: 'Pricing', href: '#pricing' },
]

const heroVideo = {
  desktop: '/assets/hero/sarathy-hero-desktop-v4.mp4',
  mobile: '/assets/hero/sarathy-hero-mobile-v4.mp4',
  poster: '/assets/hero/sarathy-hero-poster-v4.webp',
}

const HERO_VIDEO_VOLUME = 0.72

export type LandingUser = {
  name?: string | null
  email?: string | null
  image?: string | null
}

function toLandingUser(user: LandingUser | null | undefined): LandingUser | null {
  if (!user) return null
  return {
    name: user.name || null,
    email: user.email || null,
    image: user.image || null,
  }
}

function AnimatedWords({ text, className = '' }: { text: string; className?: string }) {
  return (
    <span className={className} aria-label={text}>
      {text.split(' ').map((word, index, words) => (
        <span key={`${word}-${index}`} className="motion-word inline-block will-change-transform">
          {word}
          {index < words.length - 1 ? '\u00a0' : ''}
        </span>
      ))}
    </span>
  )
}

function CtaLink({ className = '', isSignedIn = false }: { className?: string; isSignedIn?: boolean }) {
  return (
    <Link
      href={isSignedIn ? '/app/home' : '/app/signup'}
      className={`motion-cta inline-flex min-h-12 items-center justify-center gap-3 rounded-lg bg-saffron px-6 py-3 text-base font-semibold text-[#11131d] shadow-[0_16px_38px_rgba(249,115,22,0.32)] transition hover:bg-saffron-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-saffron ${className}`}
    >
      {isSignedIn ? 'Open app' : 'Sign up now'}
      <ArrowRight className="h-5 w-5" aria-hidden="true" />
    </Link>
  )
}

function AccountLink({ user }: { user: LandingUser | null }) {
  if (!user) {
    return (
      <Link href="/app/login" className="motion-nav justify-self-end text-sm font-semibold text-current transition hover:opacity-70">
        Sign in
      </Link>
    )
  }

  const label = user.name ? `Open ${user.name}'s app home` : 'Open app home'

  return (
    <Link
      href="/app/home"
      className="motion-nav inline-flex h-10 w-10 items-center justify-center justify-self-end overflow-hidden rounded-full border border-current/20 bg-white/70 text-current shadow-sm transition hover:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-saffron"
      aria-label={label}
      title={label}
    >
      {user.image ? (
        <img src={user.image} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
      ) : (
        <UserRound className="h-5 w-5" aria-hidden="true" />
      )}
    </Link>
  )
}

export default function LandingPage({ initialUser = null, authConfigured = true }: {
  initialUser?: LandingUser | null
  authConfigured?: boolean
}) {
  const rootRef = useRef<HTMLElement>(null)
  const heroVideoRef = useRef<HTMLVideoElement>(null)
  const heroAudioFrameRef = useRef<number | null>(null)
  const heroAudioInHeroRef = useRef(true)
  const heroSoundEnabledRef = useRef(true)
  const [user, setUser] = useState<LandingUser | null>(initialUser)
  const [heroVideoMuted, setHeroVideoMuted] = useState(false)
  const isSignedIn = Boolean(user)

  useEffect(() => {
    if (!authConfigured) return
    let active = true

    const refreshSession = async () => {
      const session = await getSession()
      if (active) {
        setUser(toLandingUser(session?.user))
      }
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void refreshSession()
      }
    }

    void refreshSession()
    window.addEventListener('pageshow', refreshSession)
    window.addEventListener('focus', refreshSession)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      active = false
      window.removeEventListener('pageshow', refreshSession)
      window.removeEventListener('focus', refreshSession)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [authConfigured])

  const cancelHeroAudioFade = useCallback(() => {
    if (heroAudioFrameRef.current === null) return

    window.cancelAnimationFrame(heroAudioFrameRef.current)
    heroAudioFrameRef.current = null
  }, [])

  const fadeHeroAudio = useCallback(
    (
      targetVolume: number,
      options: { duration?: number; muteAtEnd?: boolean; unmuteOnStart?: boolean } = {},
    ) => {
      const video = heroVideoRef.current
      if (!video) return

      const duration = options.duration ?? 420
      const safeTargetVolume = Math.max(0, Math.min(HERO_VIDEO_VOLUME, targetVolume))
      const shouldMuteAtEnd = options.muteAtEnd ?? safeTargetVolume === 0

      cancelHeroAudioFade()

      if (options.unmuteOnStart) {
        video.muted = false
        setHeroVideoMuted(false)
        void video.play().catch(() => {
          video.muted = true
          heroSoundEnabledRef.current = false
          setHeroVideoMuted(true)
        })
      }

      const startVolume = video.muted && safeTargetVolume > 0 ? 0 : video.volume
      const startedAt = window.performance.now()

      const step = (now: number) => {
        const progress = duration <= 0 ? 1 : Math.min(1, (now - startedAt) / duration)
        const easedProgress = 1 - Math.pow(1 - progress, 3)

        video.volume = Math.max(
          0,
          Math.min(HERO_VIDEO_VOLUME, startVolume + (safeTargetVolume - startVolume) * easedProgress),
        )

        if (progress < 1) {
          heroAudioFrameRef.current = window.requestAnimationFrame(step)
          return
        }

        heroAudioFrameRef.current = null
        video.volume = safeTargetVolume

        if (shouldMuteAtEnd) {
          video.muted = true
          setHeroVideoMuted(true)
          return
        }

        if (safeTargetVolume > 0) {
          video.muted = false
          setHeroVideoMuted(false)
        }
      }

      heroAudioFrameRef.current = window.requestAnimationFrame(step)
    },
    [cancelHeroAudioFade],
  )

  useEffect(() => {
    const video = heroVideoRef.current
    if (!video) return

    video.volume = HERO_VIDEO_VOLUME

    const startHeroVideo = async () => {
      try {
        video.muted = false
        heroSoundEnabledRef.current = true
        setHeroVideoMuted(false)
        await video.play()
      } catch {
        video.muted = true
        heroSoundEnabledRef.current = false
        setHeroVideoMuted(true)
        await video.play().catch(() => undefined)
      }
    }

    void startHeroVideo()
  }, [])

  useEffect(() => {
    const hero = rootRef.current?.querySelector<HTMLElement>('.landing-hero')
    if (!hero || !('IntersectionObserver' in window)) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        const isHeroActive = entry.isIntersecting && entry.intersectionRatio >= 0.35
        if (isHeroActive === heroAudioInHeroRef.current) return

        heroAudioInHeroRef.current = isHeroActive

        if (isHeroActive) {
          if (heroSoundEnabledRef.current) {
            fadeHeroAudio(HERO_VIDEO_VOLUME, { duration: 520, muteAtEnd: false, unmuteOnStart: true })
          }
          return
        }

        fadeHeroAudio(0, { duration: 480, muteAtEnd: true })
      },
      {
        rootMargin: '-12% 0px -32% 0px',
        threshold: [0, 0.2, 0.35, 0.5, 0.75, 1],
      },
    )

    observer.observe(hero)

    return () => {
      observer.disconnect()
      cancelHeroAudioFade()
    }
  }, [cancelHeroAudioFade, fadeHeroAudio])

  const toggleHeroVideoSound = async () => {
    const video = heroVideoRef.current
    if (!video) return

    if (video.muted) {
      heroSoundEnabledRef.current = true

      if (!heroAudioInHeroRef.current) {
        cancelHeroAudioFade()
        video.volume = 0
        setHeroVideoMuted(true)
        return
      }

      video.volume = 0
      video.muted = false
      try {
        await video.play()
        setHeroVideoMuted(false)
        fadeHeroAudio(HERO_VIDEO_VOLUME, { duration: 420, muteAtEnd: false })
      } catch {
        video.muted = true
        heroSoundEnabledRef.current = false
        setHeroVideoMuted(true)
      }
      return
    }

    heroSoundEnabledRef.current = false
    setHeroVideoMuted(true)
    fadeHeroAudio(0, { duration: 280, muteAtEnd: true })
  }

  useEffect(() => {
    let media:
      | {
          add: (query: string, setup: () => void | (() => void)) => void
          revert: () => void
        }
      | undefined
    const root = rootRef.current
    const glassNav = root?.querySelector<HTMLElement>('.liquid-glass-nav')
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let glassFrame = 0
    let settleTimer: number | undefined

    const setGlassReaction = (x: number, y: number, opacity: number) => {
      if (!glassNav || prefersReducedMotion) return

      window.cancelAnimationFrame(glassFrame)
      glassFrame = window.requestAnimationFrame(() => {
        glassNav.style.setProperty('--glass-x', `${x.toFixed(2)}px`)
        glassNav.style.setProperty('--glass-y', `${y.toFixed(2)}px`)
        glassNav.style.setProperty('--glass-opacity', opacity.toFixed(2))
      })

      if (settleTimer) {
        window.clearTimeout(settleTimer)
      }

      settleTimer = window.setTimeout(() => {
        glassNav.style.setProperty('--glass-x', '0px')
        glassNav.style.setProperty('--glass-y', '0px')
        glassNav.style.setProperty('--glass-opacity', '0.15')
      }, 380)
    }

    const handlePointerMove = (event: PointerEvent) => {
      if (!glassNav) return

      const rect = glassNav.getBoundingClientRect()
      const xRatio = (event.clientX - rect.left) / rect.width - 0.5
      const yRatio = (event.clientY - rect.top) / rect.height - 0.5

      setGlassReaction(xRatio * 16, yRatio * 8, 0.24)
    }

    const handlePointerLeave = () => {
      setGlassReaction(0, 0, 0.15)
    }

    let previousScrollY = window.scrollY
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      const scrollDelta = Math.max(-18, Math.min(18, currentScrollY - previousScrollY))
      previousScrollY = currentScrollY

      setGlassReaction(scrollDelta * 0.35, scrollDelta * 0.18, 0.21)
    }

    if (glassNav && !prefersReducedMotion) {
      glassNav.addEventListener('pointermove', handlePointerMove)
      glassNav.addEventListener('pointerleave', handlePointerLeave)
      window.addEventListener('scroll', handleScroll, { passive: true })
    }

    Promise.all([import('gsap'), import('gsap/ScrollTrigger')]).then(([gsapModule, scrollModule]) => {
      const gsap = gsapModule.gsap
      const { ScrollTrigger } = scrollModule

      gsap.registerPlugin(ScrollTrigger)

      const installHeaderColor = () => {
        gsap.set('.site-header', { color: '#1E0A2E' })
      }

      media = gsap.matchMedia(rootRef)
      media.add('(prefers-reduced-motion: reduce)', () => {
        const context = gsap.context(() => {
          installHeaderColor()
          gsap.set(
            '.motion-word, .reveal-copy, .reveal-item, .motion-logo, .motion-nav, .hero-subcopy, .hero-cta-button, .hero-sound-button, .motion-icon, .motion-chip, .motion-price, .motion-check, .motion-cta',
            {
              autoAlpha: 1,
              clearProps: 'transform',
            },
          )
        }, rootRef)

        return () => context.revert()
      })

      media.add('(prefers-reduced-motion: no-preference)', () => {
        const context = gsap.context(() => {
          installHeaderColor()

          gsap.set('.motion-logo, .motion-nav', { autoAlpha: 0, y: -10 })
          gsap.set('.hero-copy .motion-word, .hero-subcopy, .hero-cta-button, .hero-sound-button', { autoAlpha: 0, y: 24 })

          gsap.timeline({ defaults: { ease: 'power3.out' } })
            .to('.motion-logo', { autoAlpha: 1, y: 0, duration: 0.48 })
            .to('.motion-nav', { autoAlpha: 1, y: 0, duration: 0.42, stagger: 0.045 }, '<0.05')
            .to('.hero-copy .motion-word', { autoAlpha: 1, y: 0, duration: 0.52, stagger: 0.028 }, '<0.08')
            .to('.hero-subcopy', { autoAlpha: 1, y: 0, duration: 0.5 }, '-=0.24')
            .to('.hero-cta-button', { autoAlpha: 1, y: 0, duration: 0.46 }, '-=0.2')
            .to('.hero-sound-button', { autoAlpha: 1, y: 0, duration: 0.36 }, '-=0.26')

          gsap.to('.hero-copy', {
            yPercent: -10,
            autoAlpha: 0.78,
            ease: 'none',
            scrollTrigger: {
              trigger: '.landing-hero',
              start: '20% top',
              end: 'bottom top',
              scrub: true,
            },
          })

        }, rootRef)

        return () => context.revert()
      })
    })

    return () => {
      if (glassNav) {
        glassNav.removeEventListener('pointermove', handlePointerMove)
        glassNav.removeEventListener('pointerleave', handlePointerLeave)
      }
      window.removeEventListener('scroll', handleScroll)
      window.cancelAnimationFrame(glassFrame)
      if (settleTimer) {
        window.clearTimeout(settleTimer)
      }
      media?.revert()
    }
  }, [])

  return (
    <main ref={rootRef} className="min-h-dvh bg-white text-ink">
      <svg
        className="pointer-events-none absolute h-0 w-0"
        width="0"
        height="0"
        aria-hidden="true"
        focusable="false"
        style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }}
      >
        <defs>
          <filter id="liquid-glass-refraction" x="-35%" y="-160%" width="170%" height="420%" colorInterpolationFilters="sRGB">
            <feTurbulence type="fractalNoise" baseFrequency="0.011 0.052" numOctaves="3" seed="8" result="noise" />
            <feColorMatrix
              in="noise"
              type="matrix"
              values="1.3 0 0 0 -0.11 0 1.18 0 0 -0.08 0 0 1.28 0 -0.1 0 0 0 1 0"
              result="warpedNoise"
            />
            <feGaussianBlur in="warpedNoise" stdDeviation="0.33" result="softNoise" />
            <feDisplacementMap in="SourceGraphic" in2="softNoise" scale="66" xChannelSelector="R" yChannelSelector="G" />
          </filter>
          <filter id="liquid-glass-surface" x="-20%" y="-20%" width="140%" height="140%" colorInterpolationFilters="sRGB">
            <feTurbulence type="fractalNoise" baseFrequency="0.018 0.09" numOctaves="2" seed="13" result="surfaceNoise" />
            <feDisplacementMap in="SourceGraphic" in2="surfaceNoise" scale="34" xChannelSelector="R" yChannelSelector="B" />
          </filter>
        </defs>
      </svg>
      <header className="site-header fixed inset-x-0 top-0 z-50 text-plum">
        <nav
          className="liquid-glass-nav mx-auto mt-3 grid w-[calc(100%-24px)] max-w-7xl grid-cols-[1fr_auto] items-center gap-x-4 gap-y-3 px-5 py-3 md:grid-cols-[1fr_auto_1fr] md:px-7"
          aria-label="Landing page navigation"
        >
          <Link href="/" className="motion-logo inline-flex items-center text-current transition hover:opacity-80" aria-label="Sarathy home">
            <BrandLogo
              gapClassName="gap-2"
              markClassName="h-[26px] w-[26px] md:h-[29px] md:w-[29px]"
              markSize={29}
              wordmarkClassName="font-brand text-[20px] font-semibold leading-none text-current md:text-[24px]"
            />
          </Link>
          <div className="order-3 col-span-2 flex items-center justify-center gap-2 whitespace-nowrap text-[11px] font-semibold text-current md:order-none md:col-span-1 md:gap-10 md:whitespace-normal md:text-sm">
            {navItems.map(item => (
              <Link key={item.href} href={item.href} className="motion-nav transition hover:opacity-70">
                {item.label}
              </Link>
            ))}
          </div>
          <AccountLink user={user} />
        </nav>
      </header>

      <section className="landing-hero relative isolate min-h-screen overflow-hidden bg-[#c65a17] text-white">
        <video
          ref={heroVideoRef}
          className="absolute inset-0 h-full w-full object-cover object-center portrait:object-contain"
          autoPlay
          loop
          playsInline
          preload="auto"
          poster={heroVideo.poster}
          aria-label="Sarathy landing page video"
        >
          <source src={heroVideo.mobile} type="video/mp4" media="(max-width: 767px), (orientation: portrait)" />
          <source src={heroVideo.desktop} type="video/mp4" />
        </video>

        <div className="hero-copy absolute bottom-24 left-5 z-10 max-w-[min(34rem,calc(100vw-2.5rem))] md:left-10 lg:left-16">
          <h1 className="font-fraunces text-4xl font-semibold leading-[1.05] text-plum [text-shadow:0_2px_18px_rgba(255,255,255,0.58)] md:text-5xl">
            <AnimatedWords text="We organize the chaos of finance" />
          </h1>
          <p className="hero-subcopy mt-5 max-w-md text-sm leading-7 text-[#2f1730] [text-shadow:0_2px_14px_rgba(255,255,255,0.54)] md:text-base">
            Sarathy organizes and makes it clear to you where your money is going in a clean and intuitive way.
          </p>
        </div>

        <div className="absolute inset-x-0 bottom-8 z-10 flex justify-center px-5 md:bottom-10">
          <div className="hero-cta-button">
            <CtaLink isSignedIn={isSignedIn} />
          </div>
        </div>

        <button
          type="button"
          className="hero-sound-button absolute bottom-8 right-5 z-20 inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/35 bg-black/25 text-white shadow-[0_12px_32px_rgba(0,0,0,0.22)] backdrop-blur-md transition hover:bg-black/35 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white md:bottom-10 md:right-10"
          onClick={toggleHeroVideoSound}
          aria-label={heroVideoMuted ? 'Turn hero video sound on' : 'Mute hero video'}
          aria-pressed={!heroVideoMuted}
          title={heroVideoMuted ? 'Turn sound on' : 'Mute video'}
        >
          {heroVideoMuted ? <VolumeX className="h-5 w-5" aria-hidden="true" /> : <Volume2 className="h-5 w-5" aria-hidden="true" />}
        </button>
      </section>

      <BelowHero isSignedIn={isSignedIn} />
    </main>
  )
}
