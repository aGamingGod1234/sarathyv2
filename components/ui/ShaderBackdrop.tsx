'use client'

import type { ComponentProps } from 'react'
import { ShaderGradient, ShaderGradientCanvas } from '@shadergradient/react'

type ShaderGradientProps = ComponentProps<typeof ShaderGradient>

export type ShaderBackdropVariant = 'hero' | 'problem' | 'loop' | 'features' | 'pricing' | 'footer'

const baseGradient: ShaderGradientProps = {
  control: 'props',
  animate: 'on',
  brightness: 1.12,
  cAzimuthAngle: 180,
  cDistance: 3.6,
  cPolarAngle: 90,
  cameraZoom: 1,
  envPreset: 'city',
  grain: 'off',
  lightType: '3d',
  range: 'disabled',
  rangeEnd: 40,
  rangeStart: 0,
  reflection: 0.1,
  shader: 'defaults',
  toggleAxis: false,
  uAmplitude: 1,
  uDensity: 1.3,
  uFrequency: 5.5,
  uSpeed: 0.28,
  uStrength: 4,
  uTime: 0,
  wireframe: false,
}

const gradients: Record<ShaderBackdropVariant, ShaderGradientProps> = {
  hero: {
    ...baseGradient,
    type: 'plane',
    color1: '#F97316',
    color2: '#1E0A2E',
    color3: '#E9F8F0',
    grain: 'on',
    positionX: -1.4,
    positionY: 0,
    positionZ: 0,
    rotationX: 0,
    rotationY: 10,
    rotationZ: 50,
  },
  problem: {
    ...baseGradient,
    type: 'waterPlane',
    brightness: 1.05,
    cDistance: 2.9,
    cPolarAngle: 120,
    color1: '#FFF3E8',
    color2: '#F97316',
    color3: '#E9F8F0',
    positionX: 0,
    positionY: 1.8,
    positionZ: 0,
    rotationX: 0,
    rotationY: 0,
    rotationZ: -90,
    uAmplitude: 0,
    uDensity: 1,
    uSpeed: 0.2,
    uStrength: 2.4,
    uTime: 0.2,
  },
  loop: {
    ...baseGradient,
    type: 'waterPlane',
    brightness: 1.08,
    color1: '#E9F8F0',
    color2: '#F97316',
    color3: '#1E0A2E',
    positionX: 0,
    positionY: -1.3,
    positionZ: 0,
    rotationX: 0,
    rotationY: 0,
    rotationZ: 225,
    uDensity: 1.5,
    uSpeed: 0.18,
    uStrength: 3,
  },
  features: {
    ...baseGradient,
    type: 'sphere',
    brightness: 1.1,
    cDistance: 4,
    cPolarAngle: 100,
    color1: '#F97316',
    color2: '#E9F8F0',
    color3: '#1E0A2E',
    positionX: 0,
    positionY: -0.15,
    positionZ: 0,
    rotationX: 0,
    rotationY: 0,
    rotationZ: 0,
    uAmplitude: 0.6,
    uDensity: 1.1,
    uSpeed: 0.12,
    uStrength: 0.8,
  },
  pricing: {
    ...baseGradient,
    type: 'waterPlane',
    brightness: 1.08,
    color1: '#FFF3E8',
    color2: '#F97316',
    color3: '#2D1147',
    positionX: 0,
    positionY: -2.1,
    positionZ: 0,
    rotationX: 0,
    rotationY: 0,
    rotationZ: 225,
    uDensity: 1.8,
    uSpeed: 0.16,
    uStrength: 3,
  },
  footer: {
    ...baseGradient,
    type: 'plane',
    brightness: 1,
    color1: '#1E0A2E',
    color2: '#F97316',
    color3: '#E9F8F0',
    grain: 'on',
    positionX: -0.5,
    positionY: 0.1,
    positionZ: 0,
    rotationX: 0,
    rotationY: 0,
    rotationZ: 235,
    uDensity: 1.1,
    uSpeed: 0.22,
    uStrength: 3.4,
  },
}

export default function ShaderBackdrop({
  variant,
  className = '',
}: {
  variant: ShaderBackdropVariant
  className?: string
}) {
  return (
    <div className={`shader-backdrop shader-backdrop-${variant} ${className}`} aria-hidden="true">
      <ShaderGradientCanvas
        className="shader-backdrop-canvas"
        fov={45}
        lazyLoad
        pixelDensity={0.75}
        pointerEvents="none"
        powerPreference="low-power"
        rootMargin="240px"
        threshold={0.05}
      >
        <ShaderGradient {...gradients[variant]} />
      </ShaderGradientCanvas>
      <div className="shader-backdrop-scrim" />
    </div>
  )
}
