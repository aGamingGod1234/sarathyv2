import { useEffect, useMemo, type CSSProperties, type ReactNode } from 'react'
import {
  AbsoluteFill,
  Easing,
  Img,
  Sequence,
  continueRender,
  delayRender,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion'
import {
  AlertCircle,
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
  SendHorizontal,
  ShoppingBag,
  Sparkles,
  Utensils,
  WalletCards,
  Wifi,
  Zap,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { loadFont as loadMontserrat } from '@remotion/google-fonts/Montserrat'
import { ShaderGradient, ShaderGradientCanvas } from '@shadergradient/react'

export type SarathyPromoProps = {
  appName: string
  audience: string
  cta: string
}

const COLORS = {
  bg: '#F7F4EE',
  ink: '#35373B',
  muted: '#7A6E64',
  line: '#E6DED4',
  lineStrong: '#D1C5B8',
  surface: '#FFFFFF',
  surface2: '#FBFAF8',
  dark: '#0E0D10',
  dark2: '#17161A',
  darkLine: '#2B2A30',
  orange: '#F65B28',
  orangeText: '#FFDA24',
  orangeSoft: '#FFF3E8',
  green: '#10B981',
  greenSoft: '#E9F8F0',
  plum: '#1E0A2E',
}

const { fontFamily: MONTSERRAT_FONT } = loadMontserrat('normal', {
  weights: ['700', '800', '900'],
  subsets: ['latin'],
})

const FONT =
  '"SF Pro Display", "SF Pro Text", "San Francisco", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
const FEATURE_FONT = `${MONTSERRAT_FONT}, ${FONT}`
const EASE_OUT = Easing.bezier(0.16, 1, 0.3, 1)
const EASE_IN = Easing.in(Easing.cubic)
const HORIZONTAL_ROLL_EASE = Easing.bezier(0.22, 0.82, 0.24, 1)
const FOCUS_SCENE_SCALE = 1.5
const TRACKER_SCENE_SCALE = FOCUS_SCENE_SCALE * 0.7
const TIMELINE_FPS = 30
const SCATTERED_END_FRAME = 120
const TRACKER_START_FRAME = SCATTERED_END_FRAME
const TRACKER_ZOOM_START_FRAME = 260
const TRACKER_ZOOM_DURATION_FRAMES = 18
const TRACKER_ZOOM_START_LOCAL_FRAME = TRACKER_ZOOM_START_FRAME - TRACKER_START_FRAME
const TRACKER_DURATION_FRAMES = TRACKER_ZOOM_START_LOCAL_FRAME + TRACKER_ZOOM_DURATION_FRAMES + 1
const SEQUENCE_2_END_FRAME = TRACKER_START_FRAME + TRACKER_DURATION_FRAMES
const SEQUENCE_4_END_FRAME = 520
const SEQUENCE_5_END_FRAME = 800
const TOTAL_DURATION_IN_FRAMES = 1040
const clamp = {
  extrapolateLeft: 'clamp' as const,
  extrapolateRight: 'clamp' as const,
}

const sceneDurations = {
  scattered: SCATTERED_END_FRAME,
  tracker: SEQUENCE_2_END_FRAME - TRACKER_START_FRAME,
  intro: 117,
  method: SEQUENCE_4_END_FRAME - SEQUENCE_2_END_FRAME - 117,
  close: SEQUENCE_5_END_FRAME - SEQUENCE_4_END_FRAME,
  chatbot: TOTAL_DURATION_IN_FRAMES - SEQUENCE_5_END_FRAME,
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

function VideoShaderBackground() {
  const shaderHandle = useMemo(() => delayRender('ShaderGradient background warmup'), [])

  useEffect(() => {
    const timeout = setTimeout(() => continueRender(shaderHandle), 800)

    return () => {
      clearTimeout(timeout)
    }
  }, [shaderHandle])

  return (
    <AbsoluteFill style={{ background: '#000000', overflow: 'hidden' }}>
      <ShaderGradientCanvas
        fov={45}
        lazyLoad={false}
        pixelDensity={1}
        pointerEvents="none"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
        }}
      >
        <ShaderGradient
          animate="on"
          brightness={1}
          cAzimuthAngle={180}
          cDistance={2.4}
          cPolarAngle={95}
          cameraZoom={1}
          color1="#ff6a1a"
          color2="#c73c00"
          color3="#FD4912"
          control="props"
          enableCameraUpdate={false}
          enableTransition={false}
          envPreset="city"
          grain="off"
          lightType="3d"
          positionX={0}
          positionY={-2.1}
          positionZ={0}
          range="disabled"
          rangeEnd={40}
          rangeStart={0}
          reflection={0.1}
          rotationX={0}
          rotationY={0}
          rotationZ={225}
          shader="defaults"
          toggleAxis={false}
          type="waterPlane"
          uAmplitude={0}
          uDensity={1.8}
          uFrequency={5.5}
          uSpeed={0.3}
          uStrength={3}
          uTime={0.2}
          wireframe={false}
        />
      </ShaderGradientCanvas>
    </AbsoluteFill>
  )
}

function orangeText(_: number): CSSProperties {
  return {
    color: COLORS.orangeText,
    WebkitTextFillColor: COLORS.orangeText,
    textShadow: '0 3px 14px rgba(60,16,0,0.36)',
  }
}

function darkText(_: number): CSSProperties {
  return {
    color: COLORS.ink,
    WebkitTextFillColor: COLORS.ink,
  }
}

function Canvas({ children, dark = false }: { children: ReactNode; dark?: boolean }) {
  return (
    <AbsoluteFill
      style={{
        ...base,
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

function FocusSceneScale({ children, scale = FOCUS_SCENE_SCALE }: { children: ReactNode; scale?: number }) {
  return (
    <AbsoluteFill
      style={{
        transform: `scale(${scale})`,
        transformOrigin: '50% 50%',
      }}
    >
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
        ...(light ? { color: COLORS.surface } : darkText(frame)),
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
      <div style={{ display: 'inline-block', fontSize: 38, fontWeight: 760, whiteSpace: 'nowrap', ...darkText(frame) }}>
        {label}
      </div>
    </div>
  )
}

function ScatteredTitle({ frame }: { frame: number }) {
  const money = fastFadeUp(frame, 4, 14)
  const is = fastFadeUp(frame, 13, 14)
  const scatteredReveal = ease(frame, 22, 12)
  const scatteredRedProgress = ease(frame, 30, 54)
  const scatteredDarkOpacity = interpolate(scatteredRedProgress, [0, 0.72, 1], [1, 0.44, 0], clamp)
  const scatteredRedOpacity = interpolate(scatteredRedProgress, [0, 0.16, 1], [0, 0.72, 1], clamp)

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
        <span style={{ display: 'inline-block', ...darkText(frame), ...money }}>Money</span>
        <span style={{ display: 'inline-block', width: 22 }} />
        <span style={{ display: 'inline-block', ...darkText(frame), ...is }}>is</span>
        <span style={{ display: 'inline-block', width: 22 }} />
        <span
          style={{
            display: 'inline-grid',
            opacity: scatteredReveal,
            transform: `translateY(${interpolate(scatteredReveal, [0, 1], [14, 0])}px)`,
          }}
        >
          <span
            style={{
              gridArea: '1 / 1',
              color: COLORS.ink,
              WebkitTextFillColor: COLORS.ink,
              opacity: scatteredDarkOpacity,
              textShadow: '0 3px 10px rgba(35,20,10,0.26)',
            }}
          >
            scattered.
          </span>
          <span
            style={{
              gridArea: '1 / 1',
              color: '#FF005C',
              WebkitTextFillColor: '#FF005C',
              WebkitTextStroke: '1px rgba(55,0,18,0.22)',
              opacity: scatteredRedOpacity,
              textShadow:
                '0 0 10px rgba(255,255,255,0.18), 0 0 26px rgba(255,0,92,0.66), 0 4px 14px rgba(55,0,18,0.34)',
            }}
          >
            scattered.
          </span>
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
  const visualStart = 72
  const visualExit = 100
  const enter = ease(frame, visualStart, 14)
  const leave = ease(frame, visualExit, 12, EASE_IN)
  const p = Math.max(0, Math.min(1, enter - leave))
  const drift = Math.sin(frame * 0.055) * 8
  const lineDraw = ease(frame, visualStart + 6, 26)
  const donutDraw = ease(frame, visualStart + 12, 22)
  const pathLength = 650
  const circumference = 2 * Math.PI * 86

  return (
    <AbsoluteFill style={{ opacity: p, pointerEvents: 'none' }}>
      <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{ position: 'absolute', inset: 0 }}>
        <g transform={`translate(140 ${190 + drift}) rotate(-2) scale(0.82)`}>
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
            const point = ease(frame, visualStart + 14 + index * 2, 8)
            return <circle key={`${x}-${y}`} cx={x} cy={y} r={interpolate(point, [0, 1], [0, 9])} fill={COLORS.orange} />
          })}
        </g>

        <g transform={`translate(700 ${710 - drift * 0.5}) scale(0.85)`}>
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
            const bar = ease(frame, visualStart + 10 + index * 3, 16)
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

        <g transform={`translate(1360 ${178 + drift * 0.6}) scale(0.82)`}>
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

function TrackerScene(_: { duration: number }) {
  const frame = useCurrentFrame()
  const zoomProgress = ease(frame, TRACKER_ZOOM_START_LOCAL_FRAME, TRACKER_ZOOM_DURATION_FRAMES, EASE_IN)
  const zoomScale = interpolate(zoomProgress, [0, 1], [1, 6.5])
  const typewriterText = 'Traditional financial trackers use simple and repeated algorithms'
  const visibleChars = Math.max(1, Math.floor(interpolate(frame, [0, 68], [1, typewriterText.length], clamp)))
  const firstLineExit = ease(frame, 84, 16, EASE_IN)
  const firstLineOpacity = 1 - firstLineExit
  const firstLineY = interpolate(firstLineExit, [0, 1], [0, -18])
  const secondWords = ['Nothing', 'is', 'specific', 'and', 'personalized']

  return (
    <AbsoluteFill
      style={{
        overflow: 'hidden',
      }}
    >
      <Canvas>
        <Header frame={frame} />
        <AbsoluteFill
          style={{
            transform: `scale(${zoomScale})`,
            transformOrigin: '50% 50%',
            willChange: 'transform',
          }}
        >
          <FocusSceneScale scale={TRACKER_SCENE_SCALE}>
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
                  fontSize: 62,
                  lineHeight: 1.12,
                  fontWeight: 780,
                  opacity: firstLineOpacity,
                  transform: `translateY(${firstLineY}px)`,
                  ...darkText(frame),
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
                  const wordProgress = ease(frame, 112 + index * 4, 10)
                  return (
                    <span
                      key={word}
                      style={{
                        display: 'inline-block',
                        opacity: wordProgress,
                        transform: `translateX(${interpolate(wordProgress, [0, 1], [78, 0])}px)`,
                        ...darkText(frame),
                      }}
                    >
                      {word}
                    </span>
                  )
                })}
              </div>
            </div>
          </FocusSceneScale>
        </AbsoluteFill>
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
  const { fps } = useVideoConfig()
  const meet = ease(frame, -4, 16)
  const textSettle = ease(frame, 20, 22)
  const visibleLetters = Math.floor(interpolate(frame, [24, 47], [0, appName.length], clamp))
  const logoPop = spring({
    frame: Math.max(0, frame - 52),
    fps,
    config: {
      damping: 9,
      stiffness: 180,
      mass: 0.55,
    },
  })
  const wipe = ease(frame, 88, 28, EASE_IN)
  const groupWidth = 1040
  const groupHeight = 190
  const textTop = 44
  const textSize = 106
  const logoSize = 112
  const logoTop = textTop + (textSize - logoSize) / 2
  const logoStartLeft = 852
  const logoEndLeft = 40
  const logoLeft = interpolate(wipe, [0, 1], [logoStartLeft, logoEndLeft])
  const logoScale = 0.78 + logoPop * 0.22
  const logoY = interpolate(logoPop, [0, 1], [18, 0])
  const logoOpacity = interpolate(logoPop, [0, 0.16], [0, 1], clamp)
  const textLeft = 150 + interpolate(textSettle, [0, 1], [235, 0])
  const textClipWidth = Math.max(0, Math.min(820, logoLeft + logoSize * 0.06 - textLeft))

  return (
    <AbsoluteFill>
      <Canvas>
        <Header frame={frame} />
        <FocusSceneScale>
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
                    ...darkText(frame),
                  }}
                >
                  Meet
                </span>
                <span style={{ display: 'inline-block', minWidth: 410, flexShrink: 0, ...darkText(frame) }}>
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
                transform: `translateY(${logoY}px) scale(${logoScale})`,
              }}
            >
              <SarathyAppIcon size={logoSize} opacityValue={logoOpacity} />
            </div>
          </div>
        </FocusSceneScale>
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

const trackingHeadlineWords = ['Sarathy', 'tracks', 'everything:'] as const
const trackedItems = [
  'Monthly expenditure',
  'Daily spending',
  'Fixed costs',
  'Safe-to-spend',
  'Money mood',
  'Remittances',
  'Receipt imports',
  'Money checks',
]

function DropWord({
  frame,
  index,
  text,
  tone,
  size,
}: {
  frame: number
  index: number
  text: string
  tone: 'ink' | 'orange'
  size: number
}) {
  const p = ease(frame, index * 4, 13)
  const lineHeight = size * 1.22
  const isRevealing = p < 0.999

  return (
    <span
      style={{
        display: 'inline-block',
        height: lineHeight,
        overflow: isRevealing ? 'hidden' : 'visible',
        verticalAlign: 'top',
      }}
    >
      <span
        style={{
          display: 'inline-block',
          fontSize: size,
          lineHeight: `${lineHeight}px`,
          fontWeight: 820,
          whiteSpace: 'nowrap',
          opacity: p,
          transform: `translateY(${interpolate(p, [0, 1], [-lineHeight, 0])}px)`,
          ...(tone === 'orange' ? orangeText(frame) : darkText(frame)),
        }}
      >
        {text}
      </span>
    </span>
  )
}

function RollingTrackedTerm({ frame }: { frame: number }) {
  const start = 34
  const rollSpeed = 1.2
  const slot = 17 / rollSpeed
  const transition = 7 / rollSpeed
  const itemHeight = 112
  const textBoxHeight = 148
  const viewportHeight = 156
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
  const enter = ease(frame, start - 8, 12)
  const currentY = interpolate(slide, [0, 1], [0, -itemHeight])
  const nextY = interpolate(slide, [0, 1], [itemHeight, 0])
  const isSliding = canAdvance && slide > 0.001 && slide < 0.999

  const termStyle: CSSProperties = {
    position: 'absolute',
    left: 0,
    top: 0,
    width: '100%',
    height: textBoxHeight,
    fontFamily: FEATURE_FONT,
    fontSize: 66,
    lineHeight: '1.18',
    fontWeight: 820,
    whiteSpace: 'nowrap',
    ...orangeText(frame),
  }

  return (
    <div
      style={{
        position: 'relative',
        width: 920,
        height: viewportHeight,
        overflow: isSliding ? 'hidden' : 'visible',
        opacity: enter,
      }}
    >
      <div
        style={{
          ...termStyle,
          transform: `translateY(${currentY}px)`,
          opacity: interpolate(slide, [0, 1], [1, 0]),
        }}
      >
        {trackedItems[activeIndex]}
      </div>
      {canAdvance && (
        <div
          style={{
            ...termStyle,
            transform: `translateY(${nextY}px)`,
            opacity: interpolate(slide, [0, 1], [0, 1]),
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
  const sceneExit = ease(frame, duration - 16, 16, EASE_IN)
  let wordIndex = 0

  return (
    <AbsoluteFill style={{ opacity: 1 - sceneExit }}>
      <Canvas>
        <Header frame={frame} />
        <FocusSceneScale>
          <div
            style={{
              position: 'absolute',
              display: 'flex',
              left: 480,
              top: 486,
              alignItems: 'flex-start',
              gap: 46,
            }}
          >
            <div
              style={{
                width: 112,
                height: 112,
              }}
            >
              <SarathyAppIcon size={112} />
            </div>
            <div
              style={{
                width: 1120,
                display: 'grid',
                gap: 6,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  columnGap: 20,
                  rowGap: 8,
                }}
              >
                {trackingHeadlineWords.map((word) => {
                  const currentIndex = wordIndex
                  wordIndex += 1
                  return (
                    <DropWord
                      key={`${word}-${currentIndex}`}
                      frame={frame}
                      index={currentIndex}
                      text={word}
                      tone="ink"
                      size={72}
                    />
                  )
                })}
              </div>
              <RollingTrackedTerm frame={frame} />
            </div>
          </div>
        </FocusSceneScale>
      </Canvas>
    </AbsoluteFill>
  )
}

const aiPhrases = [
  'gives personalized suggestions',
  'plans your finances',
  'predicts upcoming costs',
  'spots spending patterns',
  'finds saving opportunities',
  'builds smarter budgets',
]

function HorizontalRollingPhrase({
  frame,
  start = 54,
  phraseWidth = 1520,
  fontSize = 88,
}: {
  frame: number
  start?: number
  phraseWidth?: number
  fontSize?: number
}) {
  const slot = 40
  const transition = 14
  const relative = Math.max(0, frame - start)
  const activeIndex = Math.min(aiPhrases.length - 1, Math.floor(relative / slot))
  const nextIndex = Math.min(aiPhrases.length - 1, activeIndex + 1)
  const slotFrame = relative - activeIndex * slot
  const canAdvance = activeIndex < aiPhrases.length - 1
  const slide = canAdvance
    ? interpolate(slotFrame, [slot - transition, slot], [0, 1], {
        ...clamp,
        easing: HORIZONTAL_ROLL_EASE,
      })
    : 0
  const enter = ease(frame, start, 14)
  const currentX = interpolate(slide, [0, 1], [0, phraseWidth])
  const nextX = interpolate(slide, [0, 1], [-phraseWidth, 0])
  const currentOpacity = interpolate(slide, [0, 0.82, 1], [1, 0.8, 0], clamp)
  const nextOpacity = interpolate(slide, [0, 0.18, 1], [0, 0.2, 1], clamp)

  const phraseStyle: CSSProperties = {
    position: 'absolute',
    left: 0,
    top: 0,
    width: phraseWidth,
    fontFamily: FEATURE_FONT,
    fontSize,
    lineHeight: '1.16',
    fontWeight: 840,
    whiteSpace: 'nowrap',
    willChange: 'transform, opacity',
    ...orangeText(frame),
  }

  return (
    <div
      style={{
        position: 'relative',
        width: phraseWidth,
        height: 150,
        overflowX: 'hidden',
        overflowY: 'visible',
        opacity: enter,
      }}
    >
      <div
        style={{
          ...phraseStyle,
          transform: `translate3d(${currentX}px, 0, 0)`,
          opacity: currentOpacity,
        }}
      >
        {aiPhrases[activeIndex]}
      </div>
      {canAdvance && (
        <div
          style={{
            ...phraseStyle,
            transform: `translate3d(${nextX}px, 0, 0)`,
            opacity: nextOpacity,
          }}
        >
          {aiPhrases[nextIndex]}
        </div>
      )}
    </div>
  )
}

function CloseScene({ duration }: { duration: number }) {
  const frame = useCurrentFrame()
  const headlineWords = ['Powered', 'by', 'advanced', 'AI']
  const that = ease(frame, 38, 14)

  return (
    <AbsoluteFill>
      <Canvas>
        <Header frame={frame} />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'grid',
            placeItems: 'center',
          }}
        >
          <div
            style={{
              width: 1840,
              display: 'grid',
              gap: 22,
              transform: `translateY(${interpolate(ease(frame, 4, 24), [0, 1], [26, 0])}px)`,
            }}
          >
            <div
              style={{
                fontSize: 97.2,
                lineHeight: 1.04,
                fontWeight: 840,
                letterSpacing: 0,
                display: 'flex',
                justifyContent: 'center',
                gap: 26,
              }}
            >
              {headlineWords.map((word, index) => {
                const wordIn = ease(frame, -6 + index * 10, 14)
                return (
                  <span
                    key={word}
                    style={{
                      opacity: wordIn,
                      transform: `translateY(${interpolate(wordIn, [0, 1], [18, 0])}px)`,
                      display: 'inline-block',
                      ...(index >= 2 ? orangeText(frame) : darkText(frame)),
                    }}
                  >
                    {word}
                  </span>
                )
              })}
            </div>
            <div
              style={{
                height: 150,
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'center',
                gap: 24,
              }}
            >
              <div
                style={{
                  fontSize: 88,
                  lineHeight: 1.16,
                  fontWeight: 840,
                  opacity: that,
                  transform: `translateY(${interpolate(that, [0, 1], [18, 0])}px)`,
                  display: 'inline-block',
                  ...darkText(frame),
                }}
              >
                that
              </div>
              <HorizontalRollingPhrase frame={frame} start={54} phraseWidth={1520} fontSize={88} />
            </div>
          </div>
        </div>
      </Canvas>
    </AbsoluteFill>
  )
}

const chatPrompt = 'Hey, could you give me a summary of my spending for the last seven days?'
const chatResponse =
  "Hey Lucas, here's your spending for the last seven days. You spent S$184.70 total, led by food at S$76, transport at S$32, and subscriptions at S$21. You are still S$58 under your weekly plan."

function ChatSparkBadge({ size = 44, iconSize = 22 }: { size?: number; iconSize?: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: Math.round(size * 0.3),
        background: '#FFF3E8',
        color: '#F97316',
        display: 'grid',
        placeItems: 'center',
        flex: '0 0 auto',
      }}
    >
      <Sparkles size={iconSize} strokeWidth={2.3} />
    </div>
  )
}

function TypingDots({ frame }: { frame: number }) {
  return (
    <div style={{ display: 'flex', gap: 7, alignItems: 'center', height: 28 }}>
      {[0, 1, 2].map((index) => {
        const dot = interpolate(Math.sin((frame + index * 5) * 0.34), [-1, 1], [0.34, 1])
        return (
          <span
            key={index}
            style={{
              width: 9,
              height: 9,
              borderRadius: 999,
              background: '#7A6254',
              opacity: dot,
              transform: `translateY(${interpolate(dot, [0.34, 1], [3, -3])}px)`,
            }}
          />
        )
      })}
    </div>
  )
}

function ProductChatFrame({
  frame,
  promptText = '',
  showUser = false,
  showTyping = false,
  responseText = '',
  responseProgress = 0,
  compact = false,
}: {
  frame: number
  promptText?: string
  showUser?: boolean
  showTyping?: boolean
  responseText?: string
  responseProgress?: number
  compact?: boolean
}) {
  const chips = [
    'Can I afford a purchase today?',
    'What did I spend today?',
    'Check a product price in SGD',
    'What changed my safe-to-spend?',
  ]
  const responseChars = Math.floor(responseText.length * responseProgress)
  const statsIn = ease(responseProgress * 30, 20, 10)
  const surfaceWidth = compact ? 1540 : 1600
  const surfaceHeight = compact ? 900 : 930
  const headerHeight = compact ? 118 : 126
  const signalHeight = compact ? 104 : 108

  return (
    <div
      style={{
        width: surfaceWidth,
        height: surfaceHeight,
        borderRadius: compact ? 42 : 38,
        overflow: 'hidden',
        background: '#F8F4EF',
        border: '1px solid rgba(237,231,223,0.9)',
        boxShadow: compact
          ? '0 60px 140px rgba(30,10,46,0.24)'
          : '0 44px 120px rgba(30,10,46,0.20)',
        color: '#1C0A00',
        fontFamily: FONT,
      }}
    >
      <div
        style={{
          height: headerHeight,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 46px',
          borderBottom: '1px solid #EDE7DF',
          background: '#F8F4EF',
        }}
      >
        <div>
          <div style={{ fontSize: compact ? 42 : 46, fontWeight: 850, lineHeight: 1 }}>Sarathy</div>
          <div style={{ marginTop: 12, fontSize: compact ? 22 : 24, color: '#7A6254' }}>Hype friend for Lucas</div>
        </div>
        <div
          style={{
            display: 'flex',
            gap: 12,
            alignItems: 'center',
            padding: '15px 22px',
            borderRadius: 24,
            color: '#F43F5E',
            background: '#FFF1F4',
            fontSize: compact ? 22 : 24,
            fontWeight: 650,
          }}
        >
          <AlertCircle size={25} strokeWidth={2.3} />
          Ground me
        </div>
      </div>

      <div
        style={{
          height: signalHeight,
          display: 'flex',
          alignItems: 'center',
          gap: 24,
          padding: '0 46px',
          borderBottom: '1px solid #EDE7DF',
          background: '#FFFFFF',
        }}
      >
        <ChatSparkBadge size={compact ? 58 : 62} iconSize={compact ? 28 : 30} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: compact ? 24 : 26, fontWeight: 760 }}>Safe-to-spend today: S$115</div>
          <div style={{ marginTop: 5, fontSize: compact ? 22 : 23, color: '#7A6254' }}>Spent today: S$0 of S$115 allowance</div>
        </div>
        <div
          style={{
            borderRadius: 999,
            background: '#F97316',
            color: '#FFFFFF',
            padding: '17px 28px',
            fontSize: compact ? 22 : 24,
            fontWeight: 760,
          }}
        >
          Review
        </div>
      </div>

      <div
        style={{
          position: 'relative',
          height: surfaceHeight - headerHeight - signalHeight - 180,
          padding: compact ? '34px 58px' : '40px 60px',
        }}
      >
        {showUser && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              opacity: ease(frame, 138, 10),
              transform: `translateY(${interpolate(ease(frame, 138, 10), [0, 1], [20, 0])}px)`,
            }}
          >
            <div
              style={{
                maxWidth: 980,
                borderRadius: '30px 8px 30px 30px',
                background: '#F97316',
                color: '#FFFFFF',
                padding: '24px 30px',
                fontSize: compact ? 25 : 29,
                lineHeight: 1.38,
                fontWeight: 600,
              }}
            >
              {chatPrompt}
            </div>
          </div>
        )}

        {showTyping && (
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 18,
              marginTop: showUser ? 36 : 0,
              opacity: ease(frame, 152, 8),
            }}
          >
            <ChatSparkBadge size={42} iconSize={20} />
            <div
              style={{
                borderRadius: '8px 28px 28px 28px',
                background: '#FFF3E8',
                padding: '20px 24px',
              }}
            >
              <TypingDots frame={frame} />
            </div>
          </div>
        )}

        {responseProgress > 0 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 18,
              marginTop: showUser ? 36 : 0,
              opacity: ease(frame, 174, 8),
            }}
          >
            <ChatSparkBadge size={42} iconSize={20} />
            <div
              style={{
                maxWidth: 1180,
                borderRadius: '8px 28px 28px 28px',
                background: '#FFF3E8',
                padding: '24px 30px',
                fontSize: compact ? 25 : 29,
                lineHeight: 1.42,
                color: '#1C0A00',
              }}
            >
              <div>{responseText.slice(0, responseChars)}</div>
              <div
                style={{
                  display: 'flex',
                  gap: 14,
                  marginTop: 22,
                  opacity: statsIn,
                  transform: `translateY(${interpolate(statsIn, [0, 1], [12, 0])}px)`,
                }}
              >
                {[
                  ['Total', 'S$184.70'],
                  ['Top category', 'Food S$76'],
                  ['Plan', 'S$58 under'],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    style={{
                      borderRadius: 18,
                      border: '1px solid rgba(249,115,22,0.18)',
                      background: '#FFFFFF',
                      padding: '16px 18px',
                      minWidth: 168,
                    }}
                  >
                    <div style={{ fontSize: 16, color: '#7A6254', fontWeight: 700 }}>{label}</div>
                    <div style={{ marginTop: 5, fontSize: 24, fontWeight: 840 }}>{value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <div
        style={{
          height: 180,
          padding: '24px 30px 28px',
          background: '#F8F4EF',
          borderTop: '1px solid #EDE7DF',
        }}
      >
        <div style={{ display: 'flex', gap: 14, marginBottom: 20, overflow: 'hidden' }}>
          {chips.map((chip) => (
            <div
              key={chip}
              style={{
                borderRadius: 999,
                border: '1px solid rgba(249,115,22,0.24)',
                color: '#F97316',
                background: '#FFF3E8',
                padding: '12px 20px',
                fontSize: compact ? 19 : 21,
                fontWeight: 650,
                whiteSpace: 'nowrap',
              }}
            >
              {chip}
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <div
            style={{
              flex: 1,
              height: 72,
              borderRadius: 24,
              border: '1px solid #EDE7DF',
              background: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              padding: '0 28px',
              fontSize: compact ? 24 : 27,
              color: promptText ? '#1C0A00' : '#9CA3AF',
              boxShadow: '0 4px 16px rgba(30,10,46,0.05)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
            }}
          >
            {promptText || 'Ask Sarathy anything...'}
          </div>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 22,
              background: promptText ? '#F97316' : '#FDE8D0',
              color: promptText ? '#FFFFFF' : '#F97316',
              display: 'grid',
              placeItems: 'center',
              flex: '0 0 auto',
            }}
          >
            <SendHorizontal size={34} strokeWidth={2.4} />
          </div>
        </div>
      </div>
    </div>
  )
}

function ChatbotScene() {
  const frame = useCurrentFrame()
  const move = ease(frame, 0, 58)
  const overviewY = interpolate(move, [0, 1], [130, -310])
  const overviewScale = interpolate(move, [0, 1], [1.03, 0.78])
  const overviewTilt = interpolate(move, [0, 1], [12, 45])
  const overviewOpacity = 1 - ease(frame, 58, 8, EASE_IN)
  const frontStart = 66
  const frontIn = ease(frame, frontStart, 12)
  const typedChars = Math.floor(interpolate(frame, [84, 138], [0, chatPrompt.length], clamp))
  const typedPrompt = chatPrompt.slice(0, typedChars)
  const hasSent = frame >= 142
  const showTyping = frame >= 154 && frame < 174
  const responseProgress = interpolate(frame, [174, 232], [0, 1], clamp)

  return (
    <AbsoluteFill style={{ ...base, overflow: 'hidden' }}>
      {frame < frontStart && (
        <AbsoluteFill
          style={{
            display: 'grid',
            placeItems: 'center',
            perspective: 1600,
            opacity: overviewOpacity,
          }}
        >
          <div
            style={{
              transform: `translateY(${overviewY}px) rotateX(${overviewTilt}deg) scale(${overviewScale})`,
              transformOrigin: '50% 100%',
              transformStyle: 'preserve-3d',
            }}
          >
            <ProductChatFrame frame={frame} compact />
          </div>
        </AbsoluteFill>
      )}

      {frame >= frontStart && (
        <AbsoluteFill
          style={{
            display: 'grid',
            placeItems: 'center',
            opacity: frontIn,
            transform: `translateY(${interpolate(frontIn, [0, 1], [34, 0])}px)`,
          }}
        >
          <ProductChatFrame
            frame={frame}
            promptText={hasSent ? '' : typedPrompt}
            showUser={hasSent}
            showTyping={showTyping}
            responseText={chatResponse}
            responseProgress={responseProgress}
          />
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  )
}

export const SarathyPromo = ({ appName }: SarathyPromoProps) => {
  const { fps } = useVideoConfig()
  const premount = fps
  const starts = {
    scattered: 0,
    tracker: TRACKER_START_FRAME,
    intro: SEQUENCE_2_END_FRAME,
    method: SEQUENCE_2_END_FRAME + sceneDurations.intro,
    close: SEQUENCE_4_END_FRAME,
    chatbot: SEQUENCE_5_END_FRAME,
  }

  return (
    <AbsoluteFill style={{ ...base, background: '#000000' }}>
      <VideoShaderBackground />
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
        <CloseScene duration={sceneDurations.close} />
      </Sequence>
      <Sequence from={starts.chatbot} durationInFrames={sceneDurations.chatbot} premountFor={premount}>
        <ChatbotScene />
      </Sequence>
    </AbsoluteFill>
  )
}
