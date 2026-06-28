import type { CSSProperties, ReactNode } from 'react'
import {
  AbsoluteFill,
  Easing,
  Img,
  Sequence,
  interpolate,
  interpolateColors,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion'
import {
  ArrowRight,
  BarChart3,
  Bus,
  CalendarClock,
  CheckCircle2,
  Coffee,
  CreditCard,
  Dumbbell,
  Gift,
  GraduationCap,
  HeartPulse,
  Home,
  LockKeyhole,
  Phone,
  PiggyBank,
  Plane,
  ReceiptText,
  ShieldCheck,
  ShoppingBag,
  Utensils,
  WalletCards,
  Wifi,
  Zap,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export type SarathyPromoProps = {
  appName: string
  audience: string
  cta: string
}

const COLORS = {
  bg: '#F7F4EE',
  ink: '#17110C',
  muted: '#7A6E64',
  line: '#E6DED4',
  lineStrong: '#D1C5B8',
  surface: '#FFFFFF',
  surface2: '#FBFAF8',
  dark: '#0E0D10',
  dark2: '#17161A',
  darkLine: '#2B2A30',
  orange: '#F97316',
  orangeSoft: '#FFF3E8',
  green: '#10B981',
  greenSoft: '#E9F8F0',
  plum: '#1E0A2E',
}

const FONT =
  '"Plus Jakarta Sans", Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
const EASE_OUT = Easing.bezier(0.16, 1, 0.3, 1)
const EASE_IN = Easing.in(Easing.cubic)
const clamp = {
  extrapolateLeft: 'clamp' as const,
  extrapolateRight: 'clamp' as const,
}

const sceneDurations = {
  scattered: 135,
  tracker: 6 * 30,
  intro: 4 * 30,
  method: 7 * 30,
  close: 5 * 30,
}

function ease(frame: number, start: number, duration: number, easing = EASE_OUT) {
  return interpolate(frame, [start, start + duration], [0, 1], {
    ...clamp,
    easing,
  })
}

function opacity(frame: number, duration: number, exit = true) {
  const enter = ease(frame, 0, 16)
  if (!exit) return enter
  const leave = ease(frame, duration - 16, 16, EASE_IN)
  return Math.max(0, Math.min(1, enter - leave))
}

function fadeUp(frame: number, start: number, y = 18): CSSProperties {
  const p = ease(frame, start, 22)
  return {
    opacity: p,
    transform: `translateY(${interpolate(p, [0, 1], [y, 0])}px)`,
  }
}

function fastFadeUp(frame: number, start: number, y = 14): CSSProperties {
  const p = ease(frame, start, 11)
  return {
    opacity: p,
    transform: `translateY(${interpolate(p, [0, 1], [y, 0])}px)`,
  }
}

const base: CSSProperties = {
  fontFamily: FONT,
  letterSpacing: 0,
}

function Canvas({ children, dark = false }: { children: ReactNode; dark?: boolean }) {
  return (
    <AbsoluteFill
      style={{
        ...base,
        background: dark ? COLORS.dark : COLORS.bg,
        color: dark ? COLORS.surface : COLORS.ink,
      }}
    >
      <AbsoluteFill
        style={{
          backgroundImage: dark
            ? 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.10) 1px, transparent 0)'
            : 'radial-gradient(circle at 1px 1px, rgba(23,17,12,0.10) 1px, transparent 0)',
          backgroundSize: '28px 28px',
          opacity: 0.32,
        }}
      />
      {children}
    </AbsoluteFill>
  )
}

function Header(_: { frame: number; light?: boolean }) {
  return null
}

function Title({
  children,
  frame,
  start,
  light = false,
  size = 84,
  width = 780,
}: {
  children: ReactNode
  frame: number
  start: number
  light?: boolean
  size?: number
  width?: number
}) {
  return (
    <h1
      style={{
        margin: 0,
        width,
        color: light ? COLORS.surface : COLORS.ink,
        fontSize: size,
        lineHeight: 1,
        fontWeight: 780,
        ...fadeUp(frame, start),
      }}
    >
      {children}
    </h1>
  )
}

const expenseTokens: Array<{ label: string; icon: LucideIcon }> = [
  { label: 'Food', icon: Utensils },
  { label: 'Transport', icon: Bus },
  { label: 'Rent', icon: Home },
  { label: 'Subscriptions', icon: CalendarClock },
  { label: 'Savings', icon: PiggyBank },
  { label: 'Tuition', icon: GraduationCap },
  { label: 'Health', icon: HeartPulse },
  { label: 'Shopping', icon: ShoppingBag },
  { label: 'Phone', icon: Phone },
  { label: 'Internet', icon: Wifi },
  { label: 'Utilities', icon: Zap },
  { label: 'Travel', icon: Plane },
  { label: 'Gifts', icon: Gift },
  { label: 'Coffee', icon: Coffee },
  { label: 'Fitness', icon: Dumbbell },
  { label: 'Cards', icon: CreditCard },
]

function ExpenseToken({
  frame,
  index,
  total,
  icon: Icon,
  label,
}: {
  frame: number
  index: number
  total: number
  icon: LucideIcon
  label: string
}) {
  const start = 28 + index * 2.4
  const p = ease(frame, start, 10.4)
  const angle = -Math.PI / 2 + (index / total) * Math.PI * 2
  const centerX = 960
  const centerY = 540
  const radiusX = 560
  const radiusY = 310
  const targetX = centerX + Math.cos(angle) * radiusX
  const targetY = centerY + Math.sin(angle) * radiusY
  const phase = index * 1.87
  const direction = phase * 2.17
  const speed = 1.15 + (index % 5) * 0.23
  const activeFrame = Math.max(0, frame - start)
  const driftX = Math.cos(direction) * activeFrame * speed
  const driftY = Math.sin(direction) * activeFrame * speed
  const x = targetX + driftX - 250
  const y = targetY + driftY - 80
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: 500,
        height: 160,
        borderRadius: 40,
        border: `1px solid ${COLORS.line}`,
        background: COLORS.surface,
        display: 'flex',
        alignItems: 'center',
        gap: 28,
        padding: '0 35px',
        boxShadow: '0 34px 100px rgba(30,10,46,0.12)',
        opacity: p,
        transform: `scale(${interpolate(p, [0, 1], [0.72, 1])})`,
      }}
    >
      <div
        style={{
          width: 85,
          height: 85,
          borderRadius: 25,
          background: COLORS.orangeSoft,
          color: COLORS.orange,
          display: 'grid',
          placeItems: 'center',
        }}
      >
        <Icon size={45} strokeWidth={2.4} />
      </div>
      <div style={{ fontSize: 38, fontWeight: 760, whiteSpace: 'nowrap' }}>{label}</div>
    </div>
  )
}

function ScatteredTitle({ frame }: { frame: number }) {
  const money = fastFadeUp(frame, 4, 14)
  const is = fastFadeUp(frame, 13, 14)
  const scatteredReveal = ease(frame, 22, 12)
  const scatteredColorProgress = interpolate(frame, [28, 124], [0, 1], clamp)
  const scatteredColor = interpolateColors(scatteredColorProgress, [0, 1], [COLORS.ink, '#EF4444'])

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        pointerEvents: 'none',
      }}
    >
      <h1
        style={{
          margin: 0,
          color: COLORS.ink,
          fontSize: 88,
          lineHeight: 1,
          fontWeight: 800,
        }}
      >
        <span style={{ display: 'inline-block', ...money }}>Money</span>
        <span style={{ display: 'inline-block', width: 22 }} />
        <span style={{ display: 'inline-block', ...is }}>is</span>
        <span style={{ display: 'inline-block', width: 22 }} />
        <span
          style={{
            display: 'inline-block',
            color: scatteredColor,
            opacity: scatteredReveal,
            transform: `translateY(${interpolate(scatteredReveal, [0, 1], [14, 0])}px)`,
          }}
        >
          scattered.
        </span>
      </h1>
    </div>
  )
}

function ScatteredScene({ duration }: { duration: number }) {
  const frame = useCurrentFrame()
  const enter = ease(frame, 0, 16)
  const exit = interpolate(frame, [120, 135], [1, 0], clamp)
  return (
    <AbsoluteFill style={{ opacity: enter * exit }}>
      <Canvas>
        <Header frame={frame} />
        <ScatteredTitle frame={frame} />
        {expenseTokens.map((token, index) => (
          <ExpenseToken
            key={token.label}
            frame={frame}
            index={index}
            total={expenseTokens.length}
            icon={token.icon}
            label={token.label}
          />
        ))}
      </Canvas>
    </AbsoluteFill>
  )
}

function MiniChart({ frame }: { frame: number }) {
  const bars = [0.72, 0.38, 0.56, 0.29]
  return (
    <div style={{ display: 'flex', alignItems: 'end', gap: 18, height: 210 }}>
      {bars.map((height, index) => {
        const p = ease(frame, 36 + index * 8, 30)
        return (
          <div
            key={index}
            style={{
              width: 58,
              height: `${interpolate(p, [0, 1], [8, height * 210])}px`,
              borderRadius: 10,
              background: index === 0 ? COLORS.orange : COLORS.line,
            }}
          />
        )
      })}
    </div>
  )
}

const lineChartPath = 'M0 178 L70 134 L142 150 L214 88 L286 116 L358 54 L430 82 L502 22'
const barHeights = [0.46, 0.78, 0.58, 0.9, 0.38, 0.66]

function TrackerVisuals({ frame }: { frame: number }) {
  const enter = ease(frame, 82, 14)
  const leave = ease(frame, 122, 12, EASE_IN)
  const p = Math.max(0, Math.min(1, enter - leave))
  const drift = Math.sin(frame * 0.055) * 8
  const lineDraw = ease(frame, 88, 26)
  const donutDraw = ease(frame, 94, 22)
  const pathLength = 650
  const circumference = 2 * Math.PI * 86

  return (
    <AbsoluteFill style={{ opacity: p, pointerEvents: 'none' }}>
      <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{ position: 'absolute', inset: 0 }}>
        <g transform={`translate(260 ${334 + drift}) rotate(-2)`}>
          <rect x={-42} y={-48} width={620} height={310} rx={28} fill="none" stroke={COLORS.lineStrong} strokeWidth={3} />
          {[0, 1, 2, 3].map((row) => (
            <line
              key={`line-row-${row}`}
              x1={0}
              y1={row * 58 + 26}
              x2={505}
              y2={row * 58 + 26}
              stroke={COLORS.line}
              strokeWidth={2}
            />
          ))}
          {[0, 1, 2, 3, 4].map((col) => (
            <line
              key={`line-col-${col}`}
              x1={col * 126}
              y1={18}
              x2={col * 126}
              y2={210}
              stroke={COLORS.line}
              strokeWidth={2}
            />
          ))}
          <path
            d={lineChartPath}
            fill="none"
            stroke={COLORS.plum}
            strokeWidth={9}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={pathLength}
            strokeDashoffset={interpolate(lineDraw, [0, 1], [pathLength, 0])}
          />
          <path
            d={lineChartPath}
            fill="none"
            stroke={COLORS.orange}
            strokeWidth={4}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={pathLength}
            strokeDashoffset={interpolate(lineDraw, [0, 1], [pathLength, 0])}
          />
          {[
            [0, 178],
            [70, 134],
            [142, 150],
            [214, 88],
            [286, 116],
            [358, 54],
            [430, 82],
            [502, 22],
          ].map(([x, y], index) => {
            const point = ease(frame, 96 + index * 2, 8)
            return <circle key={`${x}-${y}`} cx={x} cy={y} r={interpolate(point, [0, 1], [0, 9])} fill={COLORS.orange} />
          })}
        </g>

        <g transform={`translate(730 ${570 - drift * 0.5})`}>
          <rect x={-48} y={-56} width={520} height={320} rx={28} fill="none" stroke={COLORS.lineStrong} strokeWidth={3} />
          {[0, 1, 2].map((row) => (
            <line
              key={`bar-row-${row}`}
              x1={0}
              y1={row * 70 + 20}
              x2={410}
              y2={row * 70 + 20}
              stroke={COLORS.line}
              strokeWidth={2}
            />
          ))}
          {barHeights.map((value, index) => {
            const bar = ease(frame, 92 + index * 3, 16)
            const height = interpolate(bar, [0, 1], [6, value * 216])
            return (
              <rect
                key={index}
                x={index * 67}
                y={220 - height}
                width={42}
                height={height}
                rx={13}
                fill={index === 3 ? COLORS.orange : COLORS.plum}
                opacity={index === 3 ? 0.95 : 0.78}
              />
            )
          })}
          <line x1={-6} y1={220} x2={420} y2={220} stroke={COLORS.plum} strokeWidth={4} strokeLinecap="round" />
        </g>

        <g transform={`translate(1278 ${314 + drift * 0.6})`}>
          <rect x={-74} y={-64} width={430} height={330} rx={28} fill="none" stroke={COLORS.lineStrong} strokeWidth={3} />
          <circle cx={88} cy={88} r={86} fill="none" stroke={COLORS.line} strokeWidth={28} />
          <circle
            cx={88}
            cy={88}
            r={86}
            fill="none"
            stroke={COLORS.orange}
            strokeWidth={28}
            strokeLinecap="round"
            strokeDasharray={`${circumference * 0.68} ${circumference}`}
            strokeDashoffset={interpolate(donutDraw, [0, 1], [circumference * 0.68, 0])}
            transform="rotate(-90 88 88)"
          />
          <circle
            cx={88}
            cy={88}
            r={50}
            fill="none"
            stroke={COLORS.plum}
            strokeWidth={16}
            strokeDasharray={`${circumference * 0.22} ${circumference}`}
            strokeDashoffset={interpolate(donutDraw, [0, 1], [circumference * 0.22, 0])}
            transform="rotate(154 88 88)"
            opacity={0.82}
          />
          <text x={214} y={70} fill={COLORS.ink} fontSize={54} fontWeight={820}>
            68%
          </text>
          <text x={214} y={132} fill={COLORS.orange} fontSize={46} fontWeight={800}>
            +12
          </text>
          <text x={214} y={190} fill={COLORS.muted} fontSize={38} fontWeight={760}>
            4.8x
          </text>
        </g>
      </svg>
    </AbsoluteFill>
  )
}

function TrackerScene({ duration }: { duration: number }) {
  const frame = useCurrentFrame()
  const typewriterText = 'Traditional financial trackers use simple and repeated algorithms'
  const visibleChars = Math.floor(interpolate(frame, [8, 76], [0, typewriterText.length], clamp))
  const firstLineExit = ease(frame, 84, 16, EASE_IN)
  const firstLineOpacity = 1 - firstLineExit
  const firstLineY = interpolate(firstLineExit, [0, 1], [0, -18])
  const secondWords = ['Nothing', 'is', 'specific', 'and', 'personalized']

  return (
    <AbsoluteFill style={{ opacity: opacity(frame, duration) }}>
      <Canvas>
        <Header frame={frame} />
        <TrackerVisuals frame={frame} />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            padding: '0 180px',
          }}
        >
          <div
            style={{
              position: 'absolute',
              width: 1180,
              color: COLORS.ink,
              fontSize: 62,
              lineHeight: 1.12,
              fontWeight: 780,
              opacity: firstLineOpacity,
              transform: `translateY(${firstLineY}px)`,
            }}
          >
            {typewriterText.slice(0, visibleChars)}
          </div>

          <div
            style={{
              position: 'absolute',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0 20px',
              width: 1120,
              color: COLORS.ink,
              fontSize: 78,
              lineHeight: 1.05,
              fontWeight: 800,
            }}
          >
            {secondWords.map((word, index) => {
              const wordProgress = ease(frame, 126 + index * 5, 14)
              return (
                <span
                  key={word}
                  style={{
                    display: 'inline-block',
                    opacity: wordProgress,
                    transform: `translateX(${interpolate(wordProgress, [0, 1], [78, 0])}px)`,
                  }}
                >
                  {word}
                </span>
              )
            })}
          </div>
        </div>
      </Canvas>
    </AbsoluteFill>
  )
}

function ConvergingLine({ frame }: { frame: number }) {
  const p = ease(frame, 36, 58)
  return (
    <svg
      width={900}
      height={280}
      viewBox="0 0 900 280"
      style={{ position: 'absolute', left: 520, top: 430, opacity: ease(frame, 22, 18) }}
    >
      {[
        'M40 50 C280 50 390 138 530 138',
        'M40 138 H530',
        'M40 226 C280 226 390 138 530 138',
      ].map((d) => (
        <path
          key={d}
          d={d}
          fill="none"
          stroke={COLORS.lineStrong}
          strokeWidth={6}
          strokeLinecap="round"
          strokeDasharray={560}
          strokeDashoffset={interpolate(p, [0, 1], [560, 0])}
        />
      ))}
      <circle cx={530} cy={138} r={18} fill={COLORS.orange} opacity={p} />
    </svg>
  )
}

function SarathyAppIcon({ size, opacityValue = 1 }: { size: number; opacityValue?: number }) {
  return (
    <Img
      alt="Sarathy"
      src={staticFile('icon.svg')}
      style={{
        width: size,
        height: size,
        display: 'block',
        objectFit: 'contain',
        filter: 'drop-shadow(0 24px 34px rgba(30,10,46,0.18))',
        opacity: opacityValue,
      }}
    />
  )
}

function IntroScene({ duration, appName }: { duration: number; appName: string }) {
  const frame = useCurrentFrame()
  const meet = ease(frame, 4, 16)
  const textSettle = ease(frame, 20, 22)
  const visibleLetters = Math.floor(interpolate(frame, [24, 47], [0, appName.length], clamp))
  const logoIn = ease(frame, 52, 16)
  const wipe = ease(frame, 74, 28, EASE_IN)
  const groupWidth = 1040
  const groupHeight = 190
  const textTop = 44
  const textSize = 106
  const logoSize = 112
  const logoTop = textTop + (textSize - logoSize) / 2
  const logoStartLeft = 852
  const logoEndLeft = 40
  const logoLeft = interpolate(wipe, [0, 1], [logoStartLeft, logoEndLeft])
  const logoScale = interpolate(logoIn, [0, 1], [0.82, 1])
  const textLeft = 150 + interpolate(textSettle, [0, 1], [235, 0])
  const textClipWidth = Math.max(0, Math.min(820, logoLeft + logoSize * 0.06 - textLeft))

  return (
    <AbsoluteFill style={{ opacity: opacity(frame, duration) }}>
      <Canvas>
        <Header frame={frame} />
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: groupWidth,
            height: groupHeight,
            transform: 'translate(-50%, -50%)',
          }}
        >
          <div
            style={{
              position: 'absolute',
              left: textLeft,
              top: textTop,
              zIndex: 1,
              width: textClipWidth,
              height: textSize * 1.14,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                width: 820,
                height: textSize * 1.14,
                display: 'flex',
                alignItems: 'baseline',
                gap: 28,
                color: COLORS.ink,
                fontSize: textSize,
                lineHeight: 1,
                fontWeight: 820,
                whiteSpace: 'nowrap',
              }}
            >
              <span
                style={{
                  display: 'inline-block',
                  opacity: meet,
                  flexShrink: 0,
                  transform: `translateY(${interpolate(meet, [0, 1], [16, 0])}px)`,
                }}
              >
                Meet
              </span>
              <span style={{ display: 'inline-block', minWidth: 410, flexShrink: 0 }}>
                {appName.slice(0, visibleLetters)}
              </span>
            </div>
          </div>

          <div
            style={{
              position: 'absolute',
              left: logoLeft,
              top: logoTop,
              zIndex: 3,
              width: logoSize,
              height: logoSize,
              transform: `scale(${logoScale})`,
            }}
          >
            <SarathyAppIcon size={logoSize} opacityValue={logoIn} />
          </div>
        </div>
      </Canvas>
    </AbsoluteFill>
  )
}

function Step({
  frame,
  start,
  icon: Icon,
  text,
}: {
  frame: number
  start: number
  icon: LucideIcon
  text: string
}) {
  return (
    <div
      style={{
        height: 86,
        borderRadius: 18,
        background: COLORS.surface,
        border: `1px solid ${COLORS.line}`,
        display: 'flex',
        alignItems: 'center',
        gap: 18,
        padding: '0 24px',
        fontSize: 27,
        fontWeight: 760,
        boxShadow: '0 22px 70px rgba(30,10,46,0.08)',
        ...fadeUp(frame, start, 14),
      }}
    >
      <Icon size={29} color={COLORS.orange} strokeWidth={2.4} />
      {text}
    </div>
  )
}

function SafePanel({ frame }: { frame: number }) {
  const fill = ease(frame, 98, 54)
  return (
    <div
      style={{
        position: 'absolute',
        right: 150,
        top: 220,
        width: 610,
        height: 560,
        borderRadius: 34,
        background: COLORS.dark,
        color: COLORS.surface,
        padding: 42,
        boxShadow: '0 40px 130px rgba(0,0,0,0.24)',
        ...fadeUp(frame, 62),
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 28, fontWeight: 760 }}>Today</div>
        <div
          style={{
            borderRadius: 999,
            background: 'rgba(16,185,129,0.14)',
            color: COLORS.green,
            padding: '9px 14px',
            fontSize: 18,
            fontWeight: 780,
          }}
        >
          safe
        </div>
      </div>
      <div style={{ marginTop: 80, color: 'rgba(255,255,255,0.56)', fontSize: 24, fontWeight: 680 }}>
        Safe to spend
      </div>
      <div style={{ marginTop: 10, fontSize: 82, fontWeight: 820, lineHeight: 1 }}>SGD 42</div>
      <div
        style={{
          marginTop: 44,
          height: 14,
          borderRadius: 999,
          background: COLORS.darkLine,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${interpolate(fill, [0, 1], [12, 76])}%`,
            height: '100%',
            background: COLORS.green,
            borderRadius: 999,
          }}
        />
      </div>
      <div style={{ marginTop: 54, display: 'grid', gap: 16 }}>
        {['Bills', 'Goals', 'Buffer'].map((label, index) => (
          <div
            key={label}
            style={{
              height: 54,
              borderRadius: 15,
              background: COLORS.dark2,
              border: `1px solid ${COLORS.darkLine}`,
              display: 'flex',
              alignItems: 'center',
              gap: 13,
              padding: '0 17px',
              fontSize: 20,
              fontWeight: 710,
              ...fadeUp(frame, 122 + index * 8, 10),
            }}
          >
            <CheckCircle2 size={22} color={COLORS.green} />
            {label}
          </div>
        ))}
      </div>
    </div>
  )
}

const trackedItems = [
  'Monthly expenditure',
  'Daily spending',
  'Spending categories',
  'Fixed costs',
  'Income',
  'Safe-to-spend',
  'Money mood',
  'Remittances',
  'Receipt imports',
  'Money checks',
]

function ScrollingTrackedTerm({ frame }: { frame: number }) {
  const start = 32
  const slot = 18
  const transition = 8
  const itemHeight = 94
  const relative = Math.max(0, frame - start)
  const activeIndex = Math.min(trackedItems.length - 1, Math.floor(relative / slot))
  const nextIndex = Math.min(trackedItems.length - 1, activeIndex + 1)
  const slotFrame = relative - activeIndex * slot
  const canAdvance = activeIndex < trackedItems.length - 1
  const slide = canAdvance
    ? interpolate(slotFrame, [slot - transition, slot], [0, 1], {
        ...clamp,
        easing: EASE_OUT,
      })
    : 0
  const termEnter = ease(frame, start - 12, 16)
  const currentY = interpolate(slide, [0, 1], [0, -itemHeight])
  const nextY = interpolate(slide, [0, 1], [itemHeight, 0])

  return (
    <div
      style={{
        position: 'relative',
        width: 790,
        height: itemHeight,
        overflow: 'hidden',
        opacity: termEnter,
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: '100%',
          height: itemHeight,
          color: COLORS.orange,
          fontSize: 66,
          lineHeight: `${itemHeight}px`,
          fontWeight: 820,
          whiteSpace: 'nowrap',
          transform: `translateY(${currentY}px)`,
          opacity: interpolate(slide, [0, 1], [1, 0.12]),
        }}
      >
        {trackedItems[activeIndex]}
      </div>
      {canAdvance && (
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: '100%',
            height: itemHeight,
            color: COLORS.orange,
            fontSize: 66,
            lineHeight: `${itemHeight}px`,
            fontWeight: 820,
            whiteSpace: 'nowrap',
            transform: `translateY(${nextY}px)`,
            opacity: interpolate(slide, [0, 1], [0.12, 1]),
          }}
        >
          {trackedItems[nextIndex]}
        </div>
      )}
    </div>
  )
}

function MethodScene({ duration }: { duration: number }) {
  const frame = useCurrentFrame()
  const enter = ease(frame, 0, 18)
  return (
    <AbsoluteFill style={{ opacity: opacity(frame, duration) }}>
      <Canvas>
        <Header frame={frame} />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transform: `translateY(${interpolate(enter, [0, 1], [18, 0])}px)`,
            opacity: enter,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 24,
              width: 1700,
              color: COLORS.ink,
              fontSize: 66,
              lineHeight: 1,
              fontWeight: 820,
              whiteSpace: 'nowrap',
            }}
          >
            <span>Sarathy tracks everything:</span>
            <ScrollingTrackedTerm frame={frame} />
          </div>
        </div>
      </Canvas>
    </AbsoluteFill>
  )
}

function CloseScene({ duration, appName, cta }: { duration: number; appName: string; cta: string }) {
  const frame = useCurrentFrame()
  return (
    <AbsoluteFill style={{ opacity: opacity(frame, duration, false) }}>
      <Canvas dark>
        <Header frame={frame} light />
        <div style={{ position: 'absolute', left: 112, top: 315 }}>
          <Title frame={frame} start={8} light size={94} width={850}>
            SGD 42 safe.
          </Title>
          <div
            style={{
              marginTop: 58,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 15,
              borderRadius: 16,
              background: COLORS.surface,
              color: COLORS.dark,
              padding: '20px 26px',
              fontSize: 25,
              fontWeight: 780,
              ...fadeUp(frame, 34),
            }}
          >
            {cta}
            <ArrowRight size={27} />
          </div>
        </div>
        <div
          style={{
            position: 'absolute',
            right: 200,
            top: 266,
            width: 470,
            height: 470,
            borderRadius: 42,
            background: COLORS.greenSoft,
            color: COLORS.green,
            display: 'grid',
            placeItems: 'center',
            boxShadow: '0 40px 140px rgba(0,0,0,0.34)',
            ...fadeUp(frame, 34),
          }}
        >
          <ShieldCheck size={150} strokeWidth={1.75} />
          <div
            style={{
              position: 'absolute',
              bottom: 92,
              color: COLORS.dark,
              fontSize: 36,
              fontWeight: 800,
            }}
          >
            {appName}
          </div>
        </div>
      </Canvas>
    </AbsoluteFill>
  )
}

export const SarathyPromo = ({ appName, cta }: SarathyPromoProps) => {
  const { fps } = useVideoConfig()
  const premount = fps
  const starts = {
    scattered: 0,
    tracker: sceneDurations.scattered,
    intro: sceneDurations.scattered + sceneDurations.tracker,
    method: sceneDurations.scattered + sceneDurations.tracker + sceneDurations.intro,
    close:
      sceneDurations.scattered +
      sceneDurations.tracker +
      sceneDurations.intro +
      sceneDurations.method,
  }

  return (
    <AbsoluteFill style={{ ...base, background: COLORS.bg }}>
      <Sequence from={starts.scattered} durationInFrames={sceneDurations.scattered} premountFor={premount}>
        <ScatteredScene duration={sceneDurations.scattered} />
      </Sequence>
      <Sequence from={starts.tracker} durationInFrames={sceneDurations.tracker} premountFor={premount}>
        <TrackerScene duration={sceneDurations.tracker} />
      </Sequence>
      <Sequence from={starts.intro} durationInFrames={sceneDurations.intro} premountFor={premount}>
        <IntroScene duration={sceneDurations.intro} appName={appName} />
      </Sequence>
      <Sequence from={starts.method} durationInFrames={sceneDurations.method} premountFor={premount}>
        <MethodScene duration={sceneDurations.method} />
      </Sequence>
      <Sequence from={starts.close} durationInFrames={sceneDurations.close} premountFor={premount}>
        <CloseScene duration={sceneDurations.close} appName={appName} cta={cta} />
      </Sequence>
    </AbsoluteFill>
  )
}
