import { useId, type SVGProps } from 'react'

type BrandMarkProps = SVGProps<SVGSVGElement> & {
  decorative?: boolean
  size?: number
  title?: string
}

type BrandLogoProps = {
  className?: string
  gapClassName?: string
  markClassName?: string
  markSize?: number
  wordmarkClassName?: string
  showWordmark?: boolean
}

export function BrandMark({
  className = 'h-10 w-10',
  decorative = false,
  size = 40,
  title = 'Sarathy',
  width,
  height,
  ...props
}: BrandMarkProps) {
  const rawId = useId()
  const accentId = `${rawId.replace(/:/g, '')}-sarathy-accent`
  const accentClipId = `${rawId.replace(/:/g, '')}-sarathy-accent-clip`

  return (
    <svg
      viewBox="0 0 512 512"
      width={width ?? size}
      height={height ?? size}
      className={className}
      role={decorative ? undefined : 'img'}
      aria-hidden={decorative || undefined}
      aria-label={decorative ? undefined : title}
      focusable="false"
      {...props}
    >
      {!decorative && <title>{title}</title>}
      <defs>
        <linearGradient id={accentId} x1="128" x2="386" y1="410" y2="284" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#FFF7EA" />
          <stop offset="0.2" stopColor="#FFE4C1" />
          <stop offset="0.5" stopColor="#FF9C2E" />
          <stop offset="1" stopColor="#F97316" />
        </linearGradient>
        <clipPath id={accentClipId}>
          <path d="M98 286C147 318 192 345 246 361C304 378 354 349 396 292L395 430H92Z" />
        </clipPath>
      </defs>
      <rect width="512" height="512" rx="112" fill="#1E0A2E" />
      <text
        x="107"
        y="402"
        fill="#FFF7EA"
        fontFamily="Georgia, 'Times New Roman', serif"
        fontSize="412"
        fontStyle="italic"
        fontWeight="700"
        letterSpacing="-24"
      >
        S
      </text>
      <g clipPath={`url(#${accentClipId})`}>
        <text
          x="107"
          y="402"
          fill={`url(#${accentId})`}
          fontFamily="Georgia, 'Times New Roman', serif"
          fontSize="412"
          fontStyle="italic"
          fontWeight="700"
          letterSpacing="-24"
        >
          S
        </text>
      </g>
      <path d="M140 336C194 374 292 391 360 313" fill="none" stroke="#FFB15B" strokeLinecap="round" strokeWidth="14" opacity="0.24" />
    </svg>
  )
}

export default function BrandLogo({
  className = '',
  gapClassName = 'gap-3',
  markClassName = 'h-10 w-10',
  markSize = 40,
  wordmarkClassName = 'font-fraunces text-3xl font-semibold text-plum',
  showWordmark = true,
}: BrandLogoProps) {
  return (
    <span className={`inline-flex items-center ${showWordmark ? gapClassName : ''} ${className}`}>
      <BrandMark decorative size={markSize} className={`shrink-0 ${markClassName}`} />
      {showWordmark && <span className={wordmarkClassName}>Sarathy</span>}
    </span>
  )
}
