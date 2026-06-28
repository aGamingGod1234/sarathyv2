'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import {
  ArrowRight,
  Brain,
  CalendarClock,
  Check,
  CreditCard,
  FileText,
  HeartPulse,
  Import,
  LockKeyhole,
  MessageCircle,
  ReceiptText,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Target,
  WalletCards,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { PLAN_DEFINITIONS } from '@/lib/plans'
import BrandLogo, { BrandMark } from '@/components/ui/BrandLogo'

const navItems = [
  { label: 'Problem', href: '#problem' },
  { label: 'How it helps', href: '#how-it-helps' },
  { label: 'Features', href: '#features' },
  { label: 'Pricing', href: '#pricing' },
]

const financeProblems: Array<{ title: string; body: string; icon: LucideIcon }> = [
  {
    title: 'Money is scattered',
    body: 'Cards, PayNow, cash, subscriptions, campus food.',
    icon: CreditCard,
  },
  {
    title: 'Today is unclear',
    body: "The real question is simple: what can I safely spend?",
    icon: Brain,
  },
  {
    title: 'Advice needs context',
    body: 'Bills, goals, family support, and stress change the answer.',
    icon: HeartPulse,
  },
]

const helpFlows: Array<{ problem: string; solution: string; feature: string; icon: LucideIcon }> = [
  {
    problem: 'Collect the mess',
    solution: 'Import, scan, or log spending into one place.',
    feature: 'Inputs',
    icon: Import,
  },
  {
    problem: 'Protect commitments',
    solution: 'Separate rent, transport, bills, and subscriptions.',
    feature: 'Fixed costs',
    icon: CalendarClock,
  },
  {
    problem: 'Get one number',
    solution: 'See what is safe after essentials and goals.',
    feature: 'Safe-to-spend',
    icon: ShieldCheck,
  },
  {
    problem: 'Ask what changed',
    solution: 'Use chat for plain-language answers from your data.',
    feature: 'Sarathy chat',
    icon: MessageCircle,
  },
]

const personalizationInputs: Array<{ title: string; body: string; status: string; icon: LucideIcon }> = [
  {
    title: 'Income',
    body: 'Allowance, work, family support.',
    status: 'Budget',
    icon: WalletCards,
  },
  {
    title: 'Fixed costs',
    body: 'Rent, transport, bills, subscriptions.',
    status: 'Protected',
    icon: LockKeyhole,
  },
  {
    title: 'Spending',
    body: 'Food, social, health, school, shopping.',
    status: 'Sorted',
    icon: ReceiptText,
  },
  {
    title: 'Goals',
    body: 'Tuition, travel home, emergency fund.',
    status: 'Planned',
    icon: Target,
  },
  {
    title: 'Mindset',
    body: 'Stress, habits, spending patterns.',
    status: 'Personal',
    icon: HeartPulse,
  },
]

const featureList: Array<{ title: string; body: string; icon: LucideIcon }> = [
  {
    title: 'Safe-to-spend',
    body: "Know today's number.",
    icon: ShieldCheck,
  },
  {
    title: 'Imports and scans',
    body: 'Bring expenses in fast.',
    icon: Import,
  },
  {
    title: 'Fixed costs',
    body: 'Keep commitments protected.',
    icon: FileText,
  },
  {
    title: 'Sarathy chat',
    body: 'Ask what changed.',
    icon: MessageCircle,
  },
  {
    title: 'Future scenarios',
    body: 'Test decisions first.',
    icon: CalendarClock,
  },
  {
    title: 'Personal reports',
    body: 'See the month clearly.',
    icon: SlidersHorizontal,
  },
]

const planOptions = [PLAN_DEFINITIONS.free, PLAN_DEFINITIONS.plus]

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

function CtaLink({ className = '' }: { className?: string }) {
  return (
    <Link
      href="/app/signup"
      className={`motion-cta inline-flex min-h-12 items-center justify-center gap-3 rounded-lg bg-saffron px-6 py-3 text-base font-semibold text-[#11131d] shadow-[0_16px_38px_rgba(249,115,22,0.32)] transition hover:bg-saffron-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-saffron ${className}`}
    >
      Sign up now
      <ArrowRight className="h-5 w-5" aria-hidden="true" />
    </Link>
  )
}

function SectionHeading({
  eyebrow,
  title,
  body,
  align = 'left',
}: {
  eyebrow?: string
  title: string
  body?: string
  align?: 'left' | 'center'
}) {
  return (
    <div className={`section-heading ${align === 'center' ? 'mx-auto max-w-2xl text-center' : 'max-w-2xl'}`}>
      {eyebrow && <p className="reveal-item mb-4 text-sm font-semibold text-saffron">{eyebrow}</p>}
      <h2 className="font-fraunces text-4xl font-semibold leading-tight text-plum md:text-6xl">
        <AnimatedWords text={title} />
      </h2>
      {body && <p className="reveal-copy mt-5 text-lg leading-8 text-ink-3">{body}</p>}
    </div>
  )
}

export default function LandingPage() {
  const rootRef = useRef<HTMLElement>(null)

  useEffect(() => {
    let media:
      | {
          add: (query: string, setup: () => void | (() => void)) => void
          revert: () => void
        }
      | undefined

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
            '.motion-word, .reveal-copy, .reveal-item, .motion-logo, .motion-nav, .hero-subcopy, .hero-cta-button, .hero-video-placeholder, .hero-meter, .motion-icon, .motion-chip, .motion-price, .motion-check, .motion-cta',
            {
              autoAlpha: 1,
              clearProps: 'transform',
            },
          )
          gsap.set('.hero-meter-fill', { scaleX: 1, transformOrigin: 'left center' })
        }, rootRef)

        return () => context.revert()
      })

      media.add('(prefers-reduced-motion: no-preference)', () => {
        const context = gsap.context(() => {
          installHeaderColor()

          gsap.set('.motion-logo, .motion-nav', { autoAlpha: 0, y: -10 })
          gsap.set('.hero-copy .motion-word, .hero-subcopy, .hero-cta-button', { autoAlpha: 0, y: 24 })
          gsap.set('.hero-video-placeholder, .hero-meter', { autoAlpha: 0, y: 18 })
          gsap.set('.hero-video-line', { autoAlpha: 0, scaleX: 0, transformOrigin: 'left center' })
          gsap.set('.hero-meter-fill', { scaleX: 0, transformOrigin: 'left center' })

          gsap.timeline({ defaults: { ease: 'power3.out' } })
            .to('.motion-logo', { autoAlpha: 1, y: 0, duration: 0.48 })
            .to('.motion-nav', { autoAlpha: 1, y: 0, duration: 0.42, stagger: 0.045 }, '<0.05')
            .to('.hero-copy .motion-word', { autoAlpha: 1, y: 0, duration: 0.52, stagger: 0.028 }, '<0.08')
            .to('.hero-subcopy', { autoAlpha: 1, y: 0, duration: 0.5 }, '-=0.24')
            .to('.hero-video-line', { autoAlpha: 0.24, scaleX: 1, duration: 0.72, stagger: 0.035 }, '-=0.2')
            .to('.hero-video-placeholder', { autoAlpha: 1, y: 0, duration: 0.52 }, '-=0.52')
            .to('.hero-meter', { autoAlpha: 1, y: 0, duration: 0.42 }, '-=0.32')
            .to('.hero-meter-fill', { scaleX: 1, duration: 0.9, ease: 'power2.out' }, '<0.08')
            .to('.hero-cta-button', { autoAlpha: 1, y: 0, duration: 0.46 }, '-=0.2')

          gsap.to('.shader-gradient-bg', {
            yPercent: 7,
            scale: 1.08,
            ease: 'none',
            scrollTrigger: {
              trigger: '.landing-hero',
              start: 'top top',
              end: 'bottom top',
              scrub: true,
            },
          })

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

          gsap.utils.toArray<HTMLElement>('.scroll-section').forEach(section => {
            const isFooter = section.tagName.toLowerCase() === 'footer'
            const words = section.querySelectorAll('.section-heading .motion-word')
            const copy = section.querySelectorAll('.reveal-copy')
            const items = section.querySelectorAll('.reveal-item')
            const icons = section.querySelectorAll('.motion-icon')
            const chips = section.querySelectorAll('.motion-chip, .motion-price, .motion-check, .motion-cta')

            const timeline = gsap.timeline({
              scrollTrigger: {
                trigger: section,
                start: isFooter ? 'top 90%' : 'top 70%',
                toggleActions: 'play none none none',
                once: true,
              },
              defaults: { ease: 'power3.out' },
            })

            if (words.length) {
              timeline.fromTo(
                words,
                { autoAlpha: 0, y: 18 },
                { autoAlpha: 1, y: 0, duration: 0.5, stagger: 0.022 },
              )
            }

            if (copy.length) {
              timeline.fromTo(copy, { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.42 }, '-=0.2')
            }

            if (items.length) {
              timeline.fromTo(
                items,
                { autoAlpha: 0, y: 26 },
                { autoAlpha: 1, y: 0, duration: 0.52, stagger: 0.075 },
                '-=0.12',
              )
            }

            if (icons.length) {
              timeline.fromTo(
                icons,
                { autoAlpha: 0, scale: 0.86 },
                { autoAlpha: 1, scale: 1, duration: 0.34, stagger: 0.045 },
                '<0.05',
              )
            }

            if (chips.length) {
              timeline.fromTo(
                chips,
                { autoAlpha: 0, y: 8 },
                { autoAlpha: 1, y: 0, duration: 0.32, stagger: 0.035 },
                '<0.05',
              )
            }
          })
        }, rootRef)

        return () => context.revert()
      })
    })

    return () => media?.revert()
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
              values="1.6 0 0 0 -0.22 0 1.35 0 0 -0.16 0 0 1.55 0 -0.2 0 0 0 1 0"
              result="warpedNoise"
            />
            <feGaussianBlur in="warpedNoise" stdDeviation="0.65" result="softNoise" />
            <feDisplacementMap in="SourceGraphic" in2="softNoise" scale="132" xChannelSelector="R" yChannelSelector="G" />
          </filter>
          <filter id="liquid-glass-surface" x="-20%" y="-20%" width="140%" height="140%" colorInterpolationFilters="sRGB">
            <feTurbulence type="fractalNoise" baseFrequency="0.018 0.09" numOctaves="2" seed="13" result="surfaceNoise" />
            <feDisplacementMap in="SourceGraphic" in2="surfaceNoise" scale="68" xChannelSelector="R" yChannelSelector="B" />
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
          <div className="order-3 col-span-2 flex items-center justify-center gap-5 text-[12px] font-semibold text-current md:order-none md:col-span-1 md:gap-10 md:text-sm">
            {navItems.map(item => (
              <Link key={item.href} href={item.href} className="motion-nav transition hover:opacity-70">
                {item.label}
              </Link>
            ))}
          </div>
          <Link href="/app/login" className="motion-nav justify-self-end text-sm font-semibold text-current transition hover:opacity-70">
            Sign in
          </Link>
        </nav>
      </header>

      <section className="landing-hero relative isolate min-h-screen overflow-hidden bg-[#080b12] text-white">
        <div className="absolute inset-0" aria-hidden="true">
          <div className="shader-gradient-bg" />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(0deg,rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[size:88px_88px] opacity-[0.16]" />
          <div className="absolute inset-x-6 top-28 space-y-5 opacity-60 md:inset-x-16 md:top-32">
            {Array.from({ length: 15 }).map((_, index) => (
              <div key={index} className="flex items-center gap-4">
                <span className="w-5 text-xs text-white/25">{index + 1}</span>
                <span className="hero-video-line h-px flex-1 bg-white/28" />
              </div>
            ))}
          </div>
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_48%,transparent_0%,rgba(8,11,18,0.08)_42%,rgba(8,11,18,0.86)_100%)]" />
        </div>

        <div className="hero-copy absolute left-5 top-32 z-10 max-w-md md:left-10 md:top-36 lg:left-16">
          <h1 className="font-fraunces text-4xl font-semibold leading-[1.05] text-white md:text-5xl">
            <AnimatedWords text="We organize the chaos of finance" />
          </h1>
          <p className="hero-subcopy mt-5 max-w-md text-sm leading-7 text-white/74 md:text-base">
            Sarathy organizes and makes it clear to you where your money is going in a clean and intuitive way.
          </p>
        </div>

        <div className="absolute inset-0 z-0 flex items-center justify-center px-5" aria-hidden="true">
          <div className="hero-video-placeholder text-center">
            <p className="font-mono text-6xl font-semibold text-mint/85 md:text-8xl">&lt; Video /&gt;</p>
            <div className="hero-meter mx-auto mt-8 h-1.5 w-64 rounded-full bg-white/16 md:w-96">
              <div className="hero-meter-fill h-full w-full rounded-full bg-mint" />
            </div>
          </div>
        </div>

        <div className="absolute inset-x-0 bottom-8 z-10 flex justify-center px-5 md:bottom-10">
          <div className="hero-cta-button">
            <CtaLink />
          </div>
        </div>
      </section>

      <section id="problem" className="scroll-section scroll-mt-32 border-y border-line bg-[#fbfaf8]">
        <div className="mx-auto max-w-7xl px-5 py-16 md:px-8 md:py-20">
          <SectionHeading
            eyebrow="The problem"
            title="Student money gets messy fast"
            body="Sarathy turns scattered spending into a clear daily answer."
          />
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {financeProblems.map(({ title, body, icon: Icon }) => (
              <article key={title} className="reveal-item rounded-lg border border-line bg-white p-6">
                <Icon className="motion-icon mb-5 h-7 w-7 text-saffron" />
                <h3 className="text-xl font-semibold text-plum">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-ink-3">{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-helps" className="scroll-section scroll-mt-32 bg-mint/45">
        <div className="mx-auto max-w-7xl px-5 py-16 md:px-8 md:py-20">
          <SectionHeading
            eyebrow="How Sarathy helps"
            title="A short loop for daily clarity"
            body="Bring money in, protect essentials, then ask for the answer."
          />
          <div className="mt-10 overflow-hidden rounded-lg border border-line bg-white">
            {helpFlows.map(({ problem, solution, feature, icon: Icon }, index) => (
              <div key={feature} className="reveal-item grid gap-5 border-b border-line p-6 last:border-b-0 md:grid-cols-[220px_1fr_190px] md:items-center">
                <div className="flex items-center gap-3">
                  <div className="motion-icon flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-mint text-plum">
                    <Icon className="h-5 w-5" />
                  </div>
                  <p className="text-xs font-semibold uppercase text-ink-3">{String(index + 1).padStart(2, '0')}</p>
                </div>
                <div>
                  <p className="font-semibold text-plum">{problem}</p>
                  <p className="mt-2 text-sm leading-6 text-ink-3">{solution}</p>
                </div>
                <div className="motion-chip rounded-lg border border-line bg-[#fbfaf8] px-4 py-3 text-sm font-semibold text-saffron">
                  {feature}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="scroll-section scroll-mt-32 bg-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-16 md:px-8 md:py-20 lg:grid-cols-[0.95fr_1.05fr]">
          <div>
            <SectionHeading
              eyebrow="Personalization"
              title="Personal inputs, practical answers"
              body="The app keeps the context that changes each recommendation."
            />
            <div className="mt-8 overflow-hidden rounded-lg border border-line bg-white">
              {personalizationInputs.map(({ title, body, status, icon: Icon }) => (
                <div key={title} className="reveal-item grid gap-4 border-b border-line p-4 last:border-b-0 sm:grid-cols-[44px_1fr_auto] sm:items-center md:p-5">
                  <div className="motion-icon flex h-11 w-11 items-center justify-center rounded-lg bg-saffron-soft text-saffron">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-plum">{title}</h3>
                    <p className="mt-1 text-sm leading-6 text-ink-3">{body}</p>
                  </div>
                  <span className="motion-chip w-fit rounded-md bg-mint px-3 py-1 text-sm font-semibold text-[#0f6a4d]">
                    {status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="reveal-item text-2xl font-semibold text-plum">Core app features</h3>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {featureList.map(({ title, body, icon: Icon }) => (
                <article key={title} className="reveal-item rounded-lg border border-line bg-[#fbfaf8] p-5">
                  <Icon className="motion-icon mb-4 h-6 w-6 text-plum" />
                  <h4 className="font-semibold text-plum">{title}</h4>
                  <p className="mt-2 text-sm leading-6 text-ink-3">{body}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="pricing" className="scroll-section scroll-mt-32 border-t border-line bg-[#fbfaf8]">
        <div className="mx-auto max-w-7xl px-5 py-16 md:px-8 md:py-20">
          <SectionHeading
            align="center"
            eyebrow="Pricing"
            title="Simple plans"
            body="Start free. Upgrade when you want deeper memory, imports, reports, and planning."
          />

          <div className="mt-10 grid gap-8 md:grid-cols-2">
            {planOptions.map(plan => (
              <article key={plan.tier} className="pricing-card reveal-item flex min-h-[560px] flex-col rounded-lg border border-line bg-white px-7 py-8 md:px-10 md:py-10">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-3xl font-semibold text-plum md:text-4xl">{plan.name}</h3>
                    <p className="mt-3 max-w-xl text-base leading-7 text-ink-3">{plan.description}</p>
                  </div>
                  {plan.tier === 'plus' && <Sparkles className="motion-icon h-6 w-6 shrink-0 text-saffron" />}
                </div>
                <div className="mt-8 flex flex-wrap items-end gap-x-3 gap-y-1">
                  <span className="motion-price font-fraunces text-6xl font-semibold text-plum md:text-7xl">{plan.price}</span>
                  <span className="motion-chip pb-2 text-base text-ink-3 md:text-lg">{plan.cadence}</span>
                </div>
                <div className="my-8 h-px bg-line" />
                <ul className="grid flex-1 content-start gap-5 pb-10">
                  {plan.highlights.map(highlight => (
                    <li key={highlight} className="plan-highlight reveal-item flex gap-4 text-base leading-7 text-ink">
                      <Check className="motion-check mt-0.5 h-6 w-6 shrink-0 rounded-md bg-safe p-1 text-white" />
                      <span>{highlight}</span>
                    </li>
                  ))}
                </ul>
                <div className="pricing-cta pt-3 md:pt-5">
                  <CtaLink className="min-h-[64px] w-full text-lg" />
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <footer className="scroll-section bg-[#080b12] text-white">
        <div className="mx-auto max-w-7xl px-5 py-12 md:px-8 md:py-16">
          <div className="grid gap-10 md:grid-cols-[1.2fr_0.8fr_0.8fr_auto] md:items-start">
            <div className="reveal-item max-w-sm">
              <span className="inline-flex items-center gap-3">
                <span className="inline-flex rounded-2xl bg-white/95 p-1.5 shadow-[0_16px_36px_rgba(0,0,0,0.34)] ring-1 ring-white/70">
                  <BrandMark decorative size={48} className="h-12 w-12 shrink-0" />
                </span>
                <span className="font-brand text-4xl font-semibold text-white">Sarathy</span>
              </span>
              <p className="mt-4 text-sm leading-6 text-white/68">
                Personalized money clarity for university students in Singapore.
              </p>
            </div>

            <div className="reveal-item">
              <h2 className="text-sm font-semibold text-white">Explore</h2>
              <div className="mt-4 grid gap-3 text-sm text-white/66">
                {navItems.map(item => (
                  <Link key={item.href} href={item.href} className="transition hover:text-saffron">
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>

            <div className="reveal-item">
              <h2 className="text-sm font-semibold text-white">App</h2>
              <div className="mt-4 grid gap-3 text-sm text-white/66">
                <Link href="/app/login" className="transition hover:text-saffron">
                  Sign in
                </Link>
                <Link href="/app/signup" className="transition hover:text-saffron">
                  Sign up
                </Link>
                <Link href="/app/pricing" className="transition hover:text-saffron">
                  App pricing
                </Link>
              </div>
            </div>

            <div className="reveal-item md:min-w-52">
              <CtaLink className="w-full" />
            </div>
          </div>

          <div className="reveal-item mt-12 flex flex-col gap-3 border-t border-white/12 pt-6 text-xs text-white/46 md:flex-row md:items-center md:justify-between">
            <p>© 2026 Sarathy. All rights reserved.</p>
            <p>Built for cleaner student money decisions.</p>
          </div>
        </div>
      </footer>
    </main>
  )
}
