'use client'

import { useEffect, useRef, useState } from 'react'

export function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReduced(query.matches)
    update()
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])

  return reduced
}

/** True while the element is near the viewport. Used to run looping visuals only when they can be seen. */
export function useInView<T extends Element>(rootMargin = '0px 0px -10% 0px') {
  const ref = useRef<T>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const element = ref.current
    if (!element) return
    if (!('IntersectionObserver' in window)) {
      setInView(true)
      return
    }

    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { rootMargin })
    observer.observe(element)
    return () => observer.disconnect()
  }, [rootMargin])

  return [ref, inView] as const
}

/** Eases a displayed number toward a target so counters roll instead of jumping. */
export function useTweenedNumber(target: number, duration = 520) {
  const [value, setValue] = useState(target)
  const fromRef = useRef(target)
  const valueRef = useRef(target)

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) {
      valueRef.current = target
      setValue(target)
      return
    }

    fromRef.current = valueRef.current
    const startedAt = performance.now()
    let frame = 0

    const step = (now: number) => {
      const t = Math.min(1, (now - startedAt) / duration)
      const eased = 1 - Math.pow(1 - t, 4)
      const next = fromRef.current + (target - fromRef.current) * eased
      valueRef.current = next
      setValue(next)
      if (t < 1) frame = requestAnimationFrame(step)
    }

    frame = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frame)
  }, [target, duration])

  return value
}

export async function loadGsap() {
  const [gsapModule, scrollModule] = await Promise.all([import('gsap'), import('gsap/ScrollTrigger')])
  const gsap = gsapModule.gsap
  gsap.registerPlugin(scrollModule.ScrollTrigger)
  return { gsap, ScrollTrigger: scrollModule.ScrollTrigger }
}
