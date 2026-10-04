import type { gsap as GsapInstance } from 'gsap'
import type { ScrollTrigger as ScrollTriggerClass } from 'gsap/ScrollTrigger'

type Gsap = typeof GsapInstance
type ScrollTriggerApi = typeof ScrollTriggerClass

/*
 * Scroll reveals for everything below the hero.
 *
 * A reveal group ([data-reveal-group]) plays once, as one choreographed move, when its top reaches
 * the lower quarter of the screen, so the motion happens where the reader is looking rather than at
 * the bottom edge. Inside a group, roles set the order:
 *   tag     chapter label, fades up first
 *   lines   heading made of <Line>s, each slides up out of a mask
 *   text    lead copy, stats and controls, follows the heading
 *   visual  the section's main card or chart, settles in last
 *   items   container whose children step in after the visual
 * [data-reveal="batch"] elements (cards in a grid) reveal in staggered rows as they arrive.
 * [data-reveal-signature] adds the one detail a section is allowed: a meter fill, a line draw or
 * a calendar ripple. Everything else stays still, so the page reads calm rather than busy.
 */

const ease = 'expo.out'
const start = 'top 76%'

function roleIn(group: HTMLElement, role: string) {
  const found = Array.from(group.querySelectorAll<HTMLElement>(`[data-reveal="${role}"]`)).filter(
    element => element.closest('[data-reveal-group]') === group,
  )
  return group.matches(`[data-reveal="${role}"]`) ? [group, ...found] : found
}

function addSignature(gsap: Gsap, timeline: GSAPTimeline, element: HTMLElement) {
  switch (element.dataset.revealSignature) {
    // The safe-to-spend meter fills from empty. Clipped rather than scaled so React keeps owning the fill's transform.
    case 'meter':
      gsap.set(element, { clipPath: 'inset(0 100% 0 0)' })
      timeline.to(element, { clipPath: 'inset(0 0% 0 0)', duration: 1.1, ease: 'power3.inOut', clearProps: 'clipPath' }, 0.55)
      break
    // The savings line draws itself, then the shaded area and points settle under it.
    case 'draw': {
      const line = element.querySelector<SVGPathElement>('.lp-chart-line')
      if (!line) break
      const length = line.getTotalLength()
      const settle = element.querySelectorAll('.lp-chart-area, .lp-chart-point')
      gsap.set(line, { strokeDasharray: length, strokeDashoffset: length })
      gsap.set(settle, { opacity: 0 })
      timeline
        .to(
          line,
          { strokeDashoffset: 0, duration: 1.5, ease: 'power2.inOut', clearProps: 'strokeDasharray,strokeDashoffset' },
          0.45,
        )
        .to(settle, { opacity: 1, duration: 0.8, ease: 'power2.out', clearProps: 'opacity' }, 1.2)
      break
    }
    // Calendar days ripple in from the first of the month.
    case 'ripple': {
      const days = element.querySelectorAll('.lp-cal-day')
      gsap.set(days, { opacity: 0, scale: 0.88 })
      timeline.to(
        days,
        {
          opacity: 1,
          scale: 1,
          duration: 0.6,
          ease: 'power3.out',
          stagger: { amount: 0.55, grid: 'auto', from: 'start' },
          clearProps: 'opacity,transform',
        },
        0.4,
      )
      break
    }
  }
}

/** Builds every reveal under root. Call inside a gsap.matchMedia context so it all reverts together. */
export function setupReveals(root: HTMLElement, gsap: Gsap, ScrollTrigger: ScrollTriggerApi) {
  const timelines = new Map<HTMLElement, GSAPTimeline>()

  for (const group of gsap.utils.toArray<HTMLElement>('[data-reveal-group]', root)) {
    const tags = roleIn(group, 'tag')
    const lines = roleIn(group, 'lines').flatMap(heading => Array.from(heading.querySelectorAll<HTMLElement>('.lp-line-inner')))
    const texts = roleIn(group, 'text')
    const visuals = roleIn(group, 'visual')
    const items = roleIn(group, 'items').flatMap(container => Array.from(container.children) as HTMLElement[])
    const hasCopy = lines.length > 0 || texts.length > 0

    // Start states are set up front: tweens inside a paused timeline do not apply their from values until played.
    // Offsets are relative and cleared at the end, so elements centred with a CSS transform (the closing number)
    // return to their own position. Opacity only (never visibility), so unrevealed controls stay in the Tab order.
    gsap.set([...tags, ...texts, ...items], { opacity: 0, y: '+=14' })
    gsap.set(lines, { yPercent: 110 })
    gsap.set(visuals, { opacity: 0, y: '+=32', scale: 0.985 })

    const timeline = gsap.timeline({ paused: true, defaults: { ease, clearProps: 'opacity,transform' } })
    if (tags.length) timeline.to(tags, { opacity: 1, y: '-=14', duration: 0.8 }, 0)
    if (lines.length) timeline.to(lines, { yPercent: 0, duration: 1.15, stagger: 0.09 }, 0.04)
    if (texts.length) {
      timeline.to(texts, { opacity: 1, y: '-=14', duration: 0.9, stagger: 0.08, ease: 'power3.out' }, lines.length ? 0.32 : 0.06)
    }
    if (visuals.length) {
      timeline.to(visuals, { opacity: 1, y: '-=32', scale: 1, duration: 1.25, stagger: 0.1 }, hasCopy ? 0.24 : 0.1)
    }
    if (items.length) {
      timeline.to(items, { opacity: 1, y: '-=14', duration: 0.8, stagger: 0.06, ease: 'power3.out' }, visuals.length ? 0.42 : 0.12)
    }
    const signatures = Array.from(group.querySelectorAll<HTMLElement>('[data-reveal-signature]'))
    if (group.dataset.revealSignature) signatures.unshift(group)
    signatures.forEach(element => addSignature(gsap, timeline, element))

    timelines.set(group, timeline)
    ScrollTrigger.create({ trigger: group, start, once: true, onEnter: () => timeline.play() })
  }

  const batched = gsap.utils.toArray<HTMLElement>('[data-reveal="batch"]', root)
  gsap.set(batched, { opacity: 0, y: 28 })
  ScrollTrigger.batch(batched, {
    start,
    once: true,
    onEnter: batch =>
      gsap.to(batch, { opacity: 1, y: 0, duration: 1.1, stagger: 0.09, ease, overwrite: true, clearProps: 'opacity,transform' }),
  })

  // Keyboard users can Tab to a control before it scrolls into view; finish its reveal at once.
  const onFocusIn = (event: FocusEvent) => {
    const target = event.target as HTMLElement | null
    const group = target?.closest<HTMLElement>('[data-reveal-group]')
    const timeline = group && timelines.get(group)
    if (timeline && timeline.progress() < 1) timeline.progress(1)
    const card = target?.closest<HTMLElement>('[data-reveal="batch"]')
    if (card && Number(getComputedStyle(card).opacity) < 1) {
      gsap.killTweensOf(card)
      gsap.set(card, { clearProps: 'opacity,transform' })
    }
  }
  root.addEventListener('focusin', onFocusIn)
  return () => root.removeEventListener('focusin', onFocusIn)
}
