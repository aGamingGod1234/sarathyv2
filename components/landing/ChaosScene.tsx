'use client'

import { useEffect, useRef, type MutableRefObject, type RefObject } from 'react'
import { mountScene, type SceneController } from './chaos/scene'
import { defaultPalette, type ChaosPalette } from './chaos/palette'

export type { ChaosPalette } from './chaos/palette'

export type ChaosSceneProps = {
  progressRef: MutableRefObject<number>
  stageRef: RefObject<HTMLElement>
  reducedMotion: boolean
  quality?: 'high' | 'low'
  onReady?: () => void
  onUnavailable?: () => void
  className?: string
  palette?: Partial<ChaosPalette>
}

export default function ChaosScene({ progressRef, stageRef, reducedMotion, quality = 'high', onReady, onUnavailable, className, palette }: ChaosSceneProps): JSX.Element {
  const hostRef = useRef<HTMLDivElement>(null)
  const callbacks = useRef({ onReady, onUnavailable })
  callbacks.current = { onReady, onUnavailable }
  const controller = useRef<SceneController | null>(null)
  const paletteRef = useRef(palette)
  paletteRef.current = palette
  useEffect(() => {
    if (!hostRef.current || !stageRef.current) return
    const scene = mountScene({ host: hostRef.current, stage: stageRef.current, progress: progressRef, reducedMotion, quality, palette: { ...defaultPalette, ...paletteRef.current }, ready: () => callbacks.current.onReady?.(), unavailable: () => callbacks.current.onUnavailable?.() })
    controller.current = scene
    return () => { controller.current = null; scene.dispose() }
  }, [progressRef, stageRef, reducedMotion, quality])
  useEffect(() => { controller.current?.setPalette({ ...defaultPalette, ...palette }) }, [palette])
  return <div ref={hostRef} aria-hidden="true" className={className} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} />
}
