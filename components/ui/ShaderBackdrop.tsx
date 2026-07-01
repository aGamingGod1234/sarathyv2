'use client'

export type ShaderBackdropVariant = 'hero' | 'problem' | 'loop' | 'features' | 'tools' | 'pricing' | 'footer'

export default function ShaderBackdrop({
  variant,
  className = '',
}: {
  variant: ShaderBackdropVariant
  className?: string
}) {
  return (
    <div className={`shader-backdrop shader-backdrop-${variant} ${className}`} aria-hidden="true">
      <div className="shader-backdrop-canvas" />
      <div className="shader-backdrop-scrim" />
    </div>
  )
}
