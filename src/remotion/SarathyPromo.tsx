import { Fragment, useEffect, useMemo, type CSSProperties, type ReactNode } from 'react'
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
  Brain,
  Bus,
  CalendarClock,
  CheckCircle2,
  Coffee,
  CreditCard,
  Database,
  Download,
  Dumbbell,
  FileText,
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
  ShieldCheck,
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
const BRAND_FONT = "Georgia, 'Times New Roman', serif"
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
const TRACKER_ZOOM_FRAMES_BEFORE_CUT = 18
const TRACKER_TO_INTRO_OVERLAP_FRAMES = 11
const TRACKER_ZOOM_TOTAL_FRAMES = 20
const TRACKER_ZOOM_START_LOCAL_FRAME = TRACKER_ZOOM_START_FRAME - TRACKER_START_FRAME
const TRACKER_DURATION_FRAMES = TRACKER_ZOOM_START_LOCAL_FRAME + TRACKER_ZOOM_FRAMES_BEFORE_CUT + 1
const SEQUENCE_2_END_FRAME = TRACKER_START_FRAME + TRACKER_DURATION_FRAMES
const SEQUENCE_4_END_FRAME = 520
const SEQUENCE_5_END_FRAME = 800
const CHATBOT_END_FRAME = 1040
const TOOLS_SCENE_DURATION_FRAMES = 170
const TOOLS_SCENE_END_FRAME = CHATBOT_END_FRAME + TOOLS_SCENE_DURATION_FRAMES
const CTA_SCENE_DURATION_FRAMES = 90
const CTA_SCENE_END_FRAME = TOOLS_SCENE_END_FRAME + CTA_SCENE_DURATION_FRAMES
const LOGO_END_DURATION_FRAMES = 110
const TOTAL_DURATION_IN_FRAMES = CTA_SCENE_END_FRAME + LOGO_END_DURATION_FRAMES
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
  chatbot: CHATBOT_END_FRAME - SEQUENCE_5_END_FRAME,
  tools: TOOLS_SCENE_DURATION_FRAMES,
  cta: CTA_SCENE_DURATION_FRAMES,
  logoEnd: LOGO_END_DURATION_FRAMES,
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
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const shaderHandle = useMemo(() => delayRender('ShaderGradient background warmup'), [])
  const shaderTime = 0.2 + (frame / fps) * 0.3

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
          animate="off"
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
          uSpeed={1}
          uStrength={3}
          uTime={shaderTime}
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

function aiAccentText(_: number): CSSProperties {
  return {
    color: '#6FF7FF',
    WebkitTextFillColor: '#6FF7FF',
    textShadow: '0 4px 18px rgba(0,34,45,0.42)',
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
  const money = fastFadeUp(frame, 0, 14)
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
  const enter = interpolate(frame, [0, 16], [0.74, 1], clamp)
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
  const zoomScaleAt = (atFrame: number) =>
    interpolate(ease(atFrame, TRACKER_ZOOM_START_LOCAL_FRAME, TRACKER_ZOOM_TOTAL_FRAMES, EASE_IN), [0, 1], [1, 12])
  const zoomScale = zoomScaleAt(frame)
  const previousZoomScale = zoomScaleAt(Math.max(0, frame - 1))
  const zoomVelocity = Math.max(0, zoomScale - previousZoomScale)
  const zoomTrail = interpolate(zoomVelocity, [0, 0.55], [0, 1], clamp)
  const scaleLag = Math.min(0.92, zoomVelocity * 2.4)
  const carryFade = 1 - ease(frame, TRACKER_DURATION_FRAMES - 1, TRACKER_TO_INTRO_OVERLAP_FRAMES, EASE_OUT)
  const typewriterText = 'Traditional financial trackers use simple and repeated algorithms'
  const visibleChars = Math.floor(interpolate(frame, [0, 68], [0, typewriterText.length], clamp))
  const firstLineExit = ease(frame, 84, 16, EASE_IN)
  const firstLineOpacity = 1 - firstLineExit
  const firstLineY = interpolate(firstLineExit, [0, 1], [0, -18])
  const secondWords = ['Nothing', 'is', 'specific', 'and', 'personalized']
  const renderTrackerLayer = (scale: number, opacityValue = 1, blur = 0) => (
    <AbsoluteFill
      style={{
        opacity: carryFade * opacityValue,
        transform: `scale(${scale})`,
        transformOrigin: '50% 50%',
        filter: blur > 0 ? `blur(${blur}px)` : undefined,
        willChange: 'transform, opacity, filter',
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
  )

  return (
    <AbsoluteFill
      style={{
        overflow: 'hidden',
      }}
    >
      <Canvas>
        <Header frame={frame} />
        {zoomTrail > 0.02 && (
          <>
            {renderTrackerLayer(Math.max(1, zoomScale - scaleLag * 1.2), 0.11 * zoomTrail, 2.4)}
            {renderTrackerLayer(Math.max(1, zoomScale - scaleLag * 0.56), 0.18 * zoomTrail, 1.2)}
          </>
        )}
        {renderTrackerLayer(zoomScale)}
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
  const introSettle = ease(frame, 0, TRACKER_TO_INTRO_OVERLAP_FRAMES)
  const previousIntroSettle = ease(Math.max(0, frame - 1), 0, TRACKER_TO_INTRO_OVERLAP_FRAMES)
  const introScale = interpolate(introSettle, [0, 1], [1.18, 1])
  const previousIntroScale = interpolate(previousIntroSettle, [0, 1], [1.18, 1])
  const introVelocity = Math.max(0, previousIntroScale - introScale)
  const introTrail = interpolate(introVelocity, [0, 0.022], [0, 1], clamp)
  const introScaleLag = Math.min(0.12, introVelocity * 4.8)
  const introOpacity = ease(frame, 4, 12)
  const renderIntroLayer = (scale: number, opacityValue = 1, blur = 0) => (
    <AbsoluteFill
      style={{
        opacity: introOpacity * opacityValue,
        transform: `scale(${scale})`,
        transformOrigin: '50% 50%',
        filter: blur > 0 ? `blur(${blur}px)` : undefined,
        willChange: 'transform, opacity, filter',
      }}
    >
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
              <span
                style={{
                  display: 'inline-block',
                  minWidth: 410,
                  flexShrink: 0,
                  fontFamily: BRAND_FONT,
                  fontStyle: 'italic',
                  fontWeight: 700,
                  letterSpacing: '-0.07em',
                  ...darkText(frame),
                }}
              >
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
    </AbsoluteFill>
  )

  return (
    <AbsoluteFill>
      <Canvas>
        {introTrail > 0.02 && (
          <>
            {renderIntroLayer(introScale + introScaleLag * 1.2, 0.1 * introTrail, 2.2)}
            {renderIntroLayer(introScale + introScaleLag * 0.55, 0.16 * introTrail, 1.1)}
          </>
        )}
        {renderIntroLayer(introScale)}
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
  const isBrand = text === 'Sarathy'

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
          fontFamily: isBrand ? BRAND_FONT : undefined,
          fontStyle: isBrand ? 'italic' : undefined,
          fontWeight: isBrand ? 700 : 820,
          letterSpacing: isBrand ? '-0.07em' : undefined,
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
  phraseWidth = 1840,
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
  const phraseIn = ease(frame, start, 14)
  const currentX = interpolate(slide, [0, 1], [0, phraseWidth])
  const nextX = interpolate(slide, [0, 1], [-phraseWidth, 0])
  const currentOpacity = interpolate(slide, [0, 0.82, 1], [1, 0.8, 0], clamp)
  const nextOpacity = interpolate(slide, [0, 0.18, 1], [0, 0.2, 1], clamp)

  const rowStyle: CSSProperties = {
    position: 'absolute',
    left: 0,
    top: 0,
    width: phraseWidth,
    display: 'flex',
    justifyContent: 'center',
    gap: 24,
    fontFamily: FEATURE_FONT,
    fontSize,
    lineHeight: '1.16',
    fontWeight: 840,
    whiteSpace: 'nowrap',
    willChange: 'transform, opacity',
  }

  return (
    <div
      style={{
        position: 'relative',
        width: phraseWidth,
        height: 150,
        overflowX: 'hidden',
        overflowY: 'visible',
      }}
    >
      <div
        style={{
          ...rowStyle,
          transform: `translate3d(${currentX}px, 0, 0)`,
          opacity: currentOpacity,
        }}
      >
        <span style={{ opacity: phraseIn, display: 'inline-block', ...orangeText(frame) }}>{aiPhrases[activeIndex]}</span>
      </div>
      {canAdvance && (
        <div
          style={{
            ...rowStyle,
            transform: `translate3d(${nextX}px, 0, 0)`,
            opacity: nextOpacity,
          }}
        >
          <span style={{ opacity: phraseIn, display: 'inline-block', ...orangeText(frame) }}>{aiPhrases[nextIndex]}</span>
        </div>
      )}
    </div>
  )
}

function CloseScene({ duration }: { duration: number }) {
  const frame = useCurrentFrame()
  const headlineWords = ['Powered', 'by', 'advanced', 'AI', 'that']

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
                      ...(index === 2 || index === 3 ? aiAccentText(frame) : darkText(frame)),
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
                display: 'grid',
                justifyItems: 'center',
              }}
            >
              <HorizontalRollingPhrase frame={frame} start={54} phraseWidth={1840} fontSize={88} />
            </div>
          </div>
        </div>
      </Canvas>
    </AbsoluteFill>
  )
}

const chatPrompt = 'Hey, could you give me a summary of my spending for the last seven days?'
const chatResponse =
  "Hey Lucas, here's your last seven days. You spent S$184.70 total: groceries S$58.40, dining S$43.80, transport S$32.50, shopping S$29.00, and subscriptions S$21.00. Your S$243.00 weekly plan has S$58.30 left."
const PRODUCT_CHAT_WIDTH = 1600
const PRODUCT_CHAT_HEIGHT = 1094
const PRODUCT_CHAT_INPUT_FOCUS_Y = PRODUCT_CHAT_HEIGHT - 74

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

function BrandWord({
  children = 'Sarathy',
  style,
}: {
  children?: ReactNode
  style?: CSSProperties
}) {
  return (
    <span
      style={{
        fontFamily: BRAND_FONT,
        fontStyle: 'italic',
        fontWeight: 700,
        letterSpacing: '-0.07em',
        ...style,
      }}
    >
      {children}
    </span>
  )
}

function BrandInlineText({ text }: { text: string }) {
  const parts = text.split('Sarathy')

  if (parts.length === 1) {
    return <>{text}</>
  }

  return (
    <>
      {parts.map((part, index) => (
        <Fragment key={`${part}-${index}`}>
          {part}
          {index < parts.length - 1 && (
            <BrandWord
              style={{
                letterSpacing: '-0.045em',
              }}
            />
          )}
        </Fragment>
      ))}
    </>
  )
}

function ProductChatFrame({
  frame,
  promptText = '',
  promptPanX = 0,
  showPromptCaret = false,
  showUser = false,
  showTyping = false,
  responseText = '',
  responseProgress = 0,
  sendPulse = 0,
  compact = false,
}: {
  frame: number
  promptText?: string
  promptPanX?: number
  showPromptCaret?: boolean
  showUser?: boolean
  showTyping?: boolean
  responseText?: string
  responseProgress?: number
  sendPulse?: number
  compact?: boolean
}) {
  const chips = [
    'Can I afford a purchase today?',
    'What did I spend today?',
    'Check a product price in SGD',
    'What changed my safe-to-spend?',
  ]
  const responseChars = Math.floor(responseText.length * responseProgress)
  const surfaceWidth = compact ? 1540 : PRODUCT_CHAT_WIDTH
  const surfaceHeight = compact ? 1054 : PRODUCT_CHAT_HEIGHT
  const headerHeight = compact ? 118 : 126
  const signalHeight = compact ? 104 : 108
  const inputPanelHeight = 204

  return (
    <div
      style={{
        width: surfaceWidth,
        height: surfaceHeight,
        position: 'relative',
        borderRadius: compact ? 42 : 38,
        overflow: 'hidden',
        background: '#F8F4EF',
        border: '1px solid rgba(237,231,223,0.9)',
        boxShadow: compact
          ? '-34px 46px 118px rgba(36,10,0,0.17), -10px 16px 42px rgba(36,10,0,0.09), inset 1px 1px 0 rgba(255,255,255,0.72)'
          : '-30px 40px 108px rgba(36,10,0,0.15), -8px 14px 36px rgba(36,10,0,0.08), inset 1px 1px 0 rgba(255,255,255,0.72)',
        color: '#1C0A00',
        fontFamily: FONT,
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: -130,
          right: -150,
          width: 620,
          height: 360,
          borderRadius: '50%',
          background: 'radial-gradient(ellipse at center, rgba(255,255,255,0.46) 0%, rgba(255,244,225,0.18) 42%, rgba(255,244,225,0) 72%)',
          pointerEvents: 'none',
          zIndex: 4,
        }}
      />
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
          <div style={{ fontSize: compact ? 42 : 46, lineHeight: 1 }}>
            <BrandWord />
          </div>
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
          height: surfaceHeight - headerHeight - signalHeight - inputPanelHeight,
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
            </div>
          </div>
        )}
      </div>

      <div
        style={{
          height: inputPanelHeight,
          padding: compact ? '24px 30px 34px' : '24px 30px 38px',
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
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                transform: promptText ? `translateX(${promptPanX}px)` : undefined,
                willChange: promptText ? 'transform' : undefined,
              }}
            >
              {promptText || <BrandInlineText text="Ask Sarathy anything..." />}
              {showPromptCaret && promptText && (
                <span
                  style={{
                    width: 4,
                    height: compact ? 27 : 31,
                    marginLeft: 8,
                    borderRadius: 999,
                    background: '#111111',
                    opacity: interpolate(Math.sin(frame * 0.42), [-1, 1], [0.34, 1]),
                  }}
                />
              )}
            </span>
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
              transform: `scale(${1 + sendPulse * 0.22})`,
              boxShadow: sendPulse > 0 ? '0 18px 48px rgba(249,115,22,0.32)' : undefined,
              willChange: 'transform',
            }}
          >
            <SendHorizontal size={34} strokeWidth={2.4} />
          </div>
        </div>
      </div>
    </div>
  )
}

function ProductChatLayer({
  showCursor,
  cursorClickStart,
  ...frameProps
}: Parameters<typeof ProductChatFrame>[0] & {
  showCursor?: boolean
  cursorClickStart?: number
}) {
  return (
    <div
      style={{
        position: 'relative',
        width: PRODUCT_CHAT_WIDTH,
        height: PRODUCT_CHAT_HEIGHT,
        overflow: 'visible',
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: -110,
          right: 70,
          bottom: -126,
          height: 240,
          borderRadius: '50%',
          background: 'radial-gradient(ellipse at center, rgba(50,14,0,0.32) 0%, rgba(50,14,0,0.16) 48%, rgba(50,14,0,0) 76%)',
          filter: 'blur(30px)',
          transform: 'translate3d(-56px, 42px, -140px)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: -4,
          right: 78,
          bottom: -70,
          height: 112,
          borderRadius: '0 0 72px 72px',
          background: 'linear-gradient(180deg, rgba(168,70,20,0.34), rgba(66,20,2,0.34))',
          boxShadow: '-48px 54px 132px rgba(42,12,0,0.22)',
          filter: 'blur(14px)',
          transform: 'translate3d(-34px, 20px, -74px) rotateX(-14deg)',
          transformOrigin: '50% 0%',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: -48,
          top: 46,
          bottom: 8,
          width: 70,
          borderRadius: '48px 0 0 48px',
          background: 'linear-gradient(90deg, rgba(54,16,0,0.28), rgba(136,50,12,0.12), rgba(136,50,12,0))',
          filter: 'blur(13px)',
          transform: 'translate3d(-22px, 18px, -58px) rotateY(16deg)',
          transformOrigin: '100% 50%',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          right: -34,
          top: 46,
          bottom: 18,
          width: 52,
          borderRadius: '0 44px 44px 0',
          background: 'linear-gradient(90deg, rgba(255,185,100,0.06), rgba(70,22,4,0.12))',
          filter: 'blur(14px)',
          transform: 'translate3d(12px, 10px, -54px) rotateY(-12deg)',
          transformOrigin: '0% 50%',
          pointerEvents: 'none',
        }}
      />
      <ProductChatFrame {...frameProps} />
      {showCursor && <ProductTriangleCursor frame={frameProps.frame} clickStart={cursorClickStart ?? 158} />}
    </div>
  )
}

function ProductTriangleCursor({ frame, clickStart }: { frame: number; clickStart: number }) {
  const move = ease(frame, 146, 12)
  const press = ease(frame, clickStart, 5, EASE_IN)
  const release = ease(frame, clickStart + 5, 8)
  const x = interpolate(move, [0, 1], [1220, 1522])
  const y = interpolate(move, [0, 1], [880, PRODUCT_CHAT_INPUT_FOCUS_Y - 18])
  const cursorScale = 1 - press * 0.16 + release * 0.16

  return (
    <svg
      width="82"
      height="82"
      viewBox="0 0 82 82"
      style={{
        position: 'absolute',
        left: x,
        top: y,
        zIndex: 20,
        transform: `scale(${cursorScale})`,
        transformOrigin: '12px 12px',
        filter: 'drop-shadow(0 10px 14px rgba(0,0,0,0.26))',
        pointerEvents: 'none',
      }}
    >
      <path d="M12 6 L72 47 L43 52 L32 76 Z" fill="#111111" stroke="#FFFFFF" strokeWidth="4" strokeLinejoin="round" />
    </svg>
  )
}

function PromptTypingCloseup({
  frame,
  promptText,
  typedChars,
}: {
  frame: number
  promptText: string
  typedChars: number
}) {
  const enter = ease(frame, 64, 10)
  const typedPrompt = promptText.slice(0, typedChars)
  const followY = interpolate(typedChars, [0, 34, promptText.length], [0, 0, -86], clamp)
  const caretOpacity = interpolate(Math.sin(frame * 0.42), [-1, 1], [0.35, 1])

  return (
    <AbsoluteFill
      style={{
        display: 'grid',
        placeItems: 'center',
        opacity: enter,
        transform: `scale(${interpolate(enter, [0, 1], [1.08, 1])})`,
      }}
    >
      <div
        style={{
          width: 1580,
          height: 760,
          borderRadius: 42,
          background: '#F8F4EF',
          border: '1px solid rgba(237,231,223,0.92)',
          boxShadow: '0 48px 130px rgba(30,10,46,0.20)',
          padding: 34,
          display: 'grid',
          gridTemplateRows: '1fr 104px',
          gap: 26,
          color: '#1C0A00',
          fontFamily: FONT,
        }}
      >
        <div
          style={{
            borderRadius: 34,
            border: '1px solid #EDE7DF',
            background: '#FFFFFF',
            padding: '62px 72px',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <div
            style={{
              transform: `translateY(${followY}px)`,
              fontSize: 86,
              lineHeight: 1.12,
              fontWeight: 760,
              letterSpacing: 0,
              maxWidth: 1320,
              whiteSpace: 'normal',
              overflowWrap: 'break-word',
            }}
          >
            {typedPrompt}
            <span
              style={{
                display: 'inline-block',
                width: 7,
                height: 86,
                marginLeft: 10,
                transform: 'translateY(10px)',
                borderRadius: 999,
                background: '#111111',
                opacity: caretOpacity,
              }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
          <div
            style={{
              flex: 1,
              height: 104,
              borderRadius: 30,
              border: '1px solid #EDE7DF',
              background: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              padding: '0 34px',
              fontSize: 32,
              color: typedPrompt ? '#1C0A00' : '#9CA3AF',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              boxShadow: '0 5px 20px rgba(30,10,46,0.06)',
            }}
          >
            {typedPrompt || <BrandInlineText text="Ask Sarathy anything..." />}
          </div>
          <div
            style={{
              width: 104,
              height: 104,
              borderRadius: 30,
              background: typedPrompt ? '#F97316' : '#FDE8D0',
              color: typedPrompt ? '#FFFFFF' : '#F97316',
              display: 'grid',
              placeItems: 'center',
            }}
          >
            <SendHorizontal size={48} strokeWidth={2.4} />
          </div>
        </div>
      </div>
    </AbsoluteFill>
  )
}

function TriangleCursor({ frame, clickStart }: { frame: number; clickStart: number }) {
  const move = ease(frame, 146, 16)
  const press = ease(frame, clickStart, 5, EASE_IN)
  const release = ease(frame, clickStart + 5, 8)
  const cursorX = interpolate(move, [0, 1], [-330, 18])
  const cursorY = interpolate(move, [0, 1], [-170, -8])
  const cursorScale = 1 - press * 0.14 + release * 0.14

  return (
    <svg
      width="118"
      height="118"
      viewBox="0 0 118 118"
      style={{
        position: 'absolute',
        left: '50%',
        top: '50%',
        transform: `translate(${cursorX}px, ${cursorY}px) scale(${cursorScale})`,
        transformOrigin: '18px 18px',
        filter: 'drop-shadow(0 12px 18px rgba(0,0,0,0.22))',
      }}
    >
      <path d="M18 8 L96 64 L61 69 L47 105 Z" fill="#111111" stroke="#FFFFFF" strokeWidth="5" strokeLinejoin="round" />
    </svg>
  )
}

function SendButtonCloseup({
  frame,
  clickStart,
}: {
  frame: number
  clickStart: number
}) {
  const enter = ease(frame, 142, 7)
  const press = ease(frame, clickStart, 5, EASE_IN)
  const release = ease(frame, clickStart + 5, 8)
  const buttonScale = 1 + press * 0.18 - release * 0.18
  const iconShift = interpolate(press - release, [0, 1], [0, -7], clamp)

  return (
    <AbsoluteFill
      style={{
        display: 'grid',
        placeItems: 'center',
        opacity: enter,
      }}
    >
      <div
        style={{
          width: 1180,
          height: 360,
          borderRadius: 48,
          background: '#F8F4EF',
          border: '1px solid rgba(237,231,223,0.92)',
          boxShadow: '0 48px 130px rgba(30,10,46,0.22)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          padding: 42,
          position: 'relative',
          overflow: 'visible',
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: 42,
            right: 230,
            height: 132,
            borderRadius: 38,
            border: '1px solid #EDE7DF',
            background: '#FFFFFF',
            boxShadow: '0 5px 20px rgba(30,10,46,0.06)',
          }}
        />
        <div
          style={{
            width: 170,
            height: 170,
            borderRadius: 44,
            background: '#F97316',
            color: '#FFFFFF',
            display: 'grid',
            placeItems: 'center',
            transform: `scale(${buttonScale})`,
            boxShadow: '0 28px 70px rgba(249,115,22,0.34)',
            willChange: 'transform',
          }}
        >
          <SendHorizontal
            size={74}
            strokeWidth={2.5}
            style={{ transform: `translate(${iconShift}px, ${iconShift}px)` }}
          />
        </div>
        <TriangleCursor frame={frame} clickStart={clickStart} />
      </div>
    </AbsoluteFill>
  )
}

function ResponseCloseup({
  frame,
  responseText,
  responseProgress,
}: {
  frame: number
  responseText: string
  responseProgress: number
}) {
  const enter = ease(frame, 174, 10)
  const responseChars = Math.floor(responseText.length * responseProgress)
  const statsIn = ease(responseProgress * 30, 20, 10)

  return (
    <AbsoluteFill
      style={{
        display: 'grid',
        placeItems: 'center',
        opacity: enter,
        transform: `translateY(${interpolate(enter, [0, 1], [28, 0])}px) scale(${interpolate(enter, [0, 1], [1.04, 1])})`,
      }}
    >
      <div
        style={{
          width: 1560,
          minHeight: 690,
          borderRadius: 46,
          background: '#F8F4EF',
          border: '1px solid rgba(237,231,223,0.92)',
          boxShadow: '0 48px 130px rgba(30,10,46,0.22)',
          padding: 56,
          display: 'flex',
          gap: 28,
          alignItems: 'flex-start',
          color: '#1C0A00',
          fontFamily: FONT,
        }}
      >
        <ChatSparkBadge size={76} iconSize={36} />
        <div
          style={{
            flex: 1,
            borderRadius: '14px 42px 42px 42px',
            background: '#FFF3E8',
            padding: '44px 50px',
            fontSize: 48,
            lineHeight: 1.28,
            fontWeight: 600,
          }}
        >
          <div>{responseText.slice(0, responseChars)}</div>
          <div
            style={{
              display: 'flex',
              gap: 20,
              marginTop: 34,
              opacity: statsIn,
              transform: `translateY(${interpolate(statsIn, [0, 1], [16, 0])}px)`,
            }}
          >
            {[
              ['Total', 'S$184.70'],
              ['Top category', 'Groceries S$58.40'],
              ['Plan', 'S$58.30 left'],
            ].map(([label, value]) => (
              <div
                key={label}
                style={{
                  borderRadius: 22,
                  border: '1px solid rgba(249,115,22,0.18)',
                  background: '#FFFFFF',
                  padding: '22px 24px',
                  minWidth: 220,
                }}
              >
                <div style={{ fontSize: 22, color: '#7A6254', fontWeight: 760 }}>{label}</div>
                <div style={{ marginTop: 7, fontSize: 34, fontWeight: 850 }}>{value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  )
}

function ChatbotScene() {
  const frame = useCurrentFrame()
  const overviewEnd = 64
  const typeStart = 74
  const typeEnd = 140
  const sendFocusStart = 142
  const clickStart = 158
  const responseStart = 174
  const fullWidth = PRODUCT_CHAT_WIDTH
  const fullHeight = PRODUCT_CHAT_HEIGHT
  const centerX = fullWidth / 2
  const centerY = fullHeight / 2
  const cameraFor = (focusX: number, focusY: number, scale: number) => ({
    scale,
    x: -(focusX - centerX) * scale,
    y: -(focusY - centerY) * scale,
  })
  const snapAmountFor = (atFrame: number, start: number, duration: number) => {
    const progress = interpolate(atFrame, [start, start + duration], [0, 1], clamp)
    return Math.sin(progress * Math.PI)
  }
  const typedProgressAt = (atFrame: number) =>
    interpolate(atFrame, [typeStart, typeEnd], [0, 1], clamp)
  const typingFocusAt = (atFrame: number) =>
    interpolate(typedProgressAt(atFrame), [0, 1], [300, 690], clamp)
  const typedChars = Math.floor(typedProgressAt(frame) * chatPrompt.length)
  const typedPrompt = chatPrompt.slice(0, typedChars)
  const promptPanX = 0
  const getCameraAt = (atFrame: number) => {
    const move = ease(atFrame, 0, overviewEnd)
    const focusX = typingFocusAt(atFrame)
    const overviewCamera = {
      x: 0,
      y: interpolate(move, [0, 1], [930, -18]),
      scale: interpolate(move, [0, 1], [0.92, 0.94]),
    }
    const overviewPitch = 30
    const inputCamera = cameraFor(focusX, PRODUCT_CHAT_INPUT_FOCUS_Y, 2.35)
    const sendCamera = cameraFor(PRODUCT_CHAT_WIDTH - 68, PRODUCT_CHAT_INPUT_FOCUS_Y, 2.65)
    const responseCamera = cameraFor(665, 575, 1.55)
    const inputSnap = ease(atFrame, overviewEnd, 12)
    const sendSnap = ease(atFrame, sendFocusStart, 10)
    const responseSnap = ease(atFrame, responseStart - 2, 12)
    const cameraAfterInput = {
      x: interpolate(inputSnap, [0, 1], [overviewCamera.x, inputCamera.x]),
      y: interpolate(inputSnap, [0, 1], [overviewCamera.y, inputCamera.y]),
      scale: interpolate(inputSnap, [0, 1], [overviewCamera.scale, inputCamera.scale]),
    }
    const cameraAfterSend = {
      x: interpolate(sendSnap, [0, 1], [cameraAfterInput.x, sendCamera.x]),
      y: interpolate(sendSnap, [0, 1], [cameraAfterInput.y, sendCamera.y]),
      scale: interpolate(sendSnap, [0, 1], [cameraAfterInput.scale, sendCamera.scale]),
    }
    const camera = {
      x: interpolate(responseSnap, [0, 1], [cameraAfterSend.x, responseCamera.x]),
      y: interpolate(responseSnap, [0, 1], [cameraAfterSend.y, responseCamera.y]),
      scale: interpolate(responseSnap, [0, 1], [cameraAfterSend.scale, responseCamera.scale]),
    }

    return {
      ...camera,
      rotateX: interpolate(inputSnap, [0, 1], [overviewPitch, 0]),
      rotateY: 0,
      originY: interpolate(inputSnap, [0, 1], [100, 50]),
    }
  }
  const camera = getCameraAt(frame)
  const previousCamera = getCameraAt(Math.max(0, frame - 1))
  const velocityX = camera.x - previousCamera.x
  const velocityY = camera.y - previousCamera.y
  const velocityLength = Math.max(1, Math.hypot(velocityX, velocityY))
  const directionX = velocityX / velocityLength
  const directionY = velocityY / velocityLength
  const snapTrail = Math.max(
    snapAmountFor(frame, 0, overviewEnd) * 0.25,
    snapAmountFor(frame, overviewEnd, 12),
    snapAmountFor(frame, sendFocusStart, 10),
    snapAmountFor(frame, responseStart - 2, 12),
  )
  const trailDistance = Math.min(52, velocityLength * 0.2) * snapTrail
  const press = ease(frame, clickStart, 5, EASE_IN)
  const release = ease(frame, clickStart + 5, 8)
  const sendPulse = Math.max(0, press - release)
  const hasSent = frame >= clickStart + 8
  const showTyping = frame >= clickStart + 10 && frame < responseStart + 6
  const responseProgress = interpolate(frame, [responseStart + 6, 236], [0, 1], clamp)
  const showCursor = frame >= sendFocusStart - 4 && frame < clickStart + 10
  const frameProps = {
    frame,
    promptText: hasSent ? '' : typedPrompt,
    promptPanX,
    showPromptCaret: !hasSent && frame >= overviewEnd,
    showUser: hasSent,
    showTyping,
    responseText: chatResponse,
    responseProgress,
    sendPulse,
  }
  const layerProps = {
    ...frameProps,
    showCursor,
    cursorClickStart: clickStart,
  }
  const cameraOuterStyle = (x: number, y: number, blur = 0, opacity = 1): CSSProperties => ({
    gridArea: '1 / 1',
    opacity,
    transform: `translate(${x}px, ${y}px)`,
    filter: blur > 0 ? `blur(${blur}px)` : undefined,
    willChange: 'transform, filter, opacity',
  })
  const tiltAspectCompensation = interpolate(camera.rotateX, [0, 30], [1, 1.155], clamp)
  const cameraInnerStyle: CSSProperties = {
    transform: `rotateX(${camera.rotateX}deg) rotateY(${camera.rotateY}deg) scale(${camera.scale}) scaleY(${tiltAspectCompensation})`,
    transformOrigin: `50% ${camera.originY}%`,
    transformStyle: 'preserve-3d',
    willChange: 'transform',
  }
  const renderCameraLayer = (x: number, y: number, opacity = 1, blur = 0) => (
    <div style={cameraOuterStyle(x, y, blur, opacity)}>
      <div style={cameraInnerStyle}>
        <ProductChatLayer {...layerProps} />
      </div>
    </div>
  )

  return (
    <AbsoluteFill style={{ ...base, overflow: 'hidden' }}>
      <AbsoluteFill
        style={{
          display: 'grid',
          placeItems: 'center',
          perspective: 1450,
          perspectiveOrigin: '50% 56%',
        }}
      >
        {trailDistance > 0.4 && (
          <>
            <div
              style={cameraOuterStyle(
                camera.x - directionX * trailDistance * 1.05,
                camera.y - directionY * trailDistance * 1.05,
                2.2,
                0.12 * snapTrail,
              )}
            >
              <div style={cameraInnerStyle}>
                <ProductChatFrame {...frameProps} />
              </div>
            </div>
            <div
              style={cameraOuterStyle(
                camera.x - directionX * trailDistance * 0.48,
                camera.y - directionY * trailDistance * 0.48,
                1.1,
                0.18 * snapTrail,
              )}
            >
              <div style={cameraInnerStyle}>
                <ProductChatFrame {...frameProps} />
              </div>
            </div>
          </>
        )}
        {renderCameraLayer(camera.x, camera.y)}
      </AbsoluteFill>
    </AbsoluteFill>
  )
}

const moneyToolCards: Array<{
  title: string
  description: string
  icon: LucideIcon
  side: 'left' | 'right'
  row: number
}> = [
  {
    title: 'Money check',
    description: 'Ask if a purchase fits today before it changes the plan.',
    icon: ShieldCheck,
    side: 'left',
    row: 0,
  },
  {
    title: 'Import transactions',
    description: 'Bring statements or receipts into the app without rebuilding your budget by hand.',
    icon: Download,
    side: 'right',
    row: 0,
  },
  {
    title: 'Fixed costs',
    description: 'Keep rent, transport, bills, and subscriptions protected before daily spending.',
    icon: FileText,
    side: 'left',
    row: 1,
  },
  {
    title: 'My data',
    description: 'See the profile, logs, and context Sarathy uses for answers.',
    icon: Database,
    side: 'right',
    row: 1,
  },
  {
    title: 'Future you',
    description: 'Test how today changes the next few months before committing.',
    icon: CalendarClock,
    side: 'left',
    row: 2,
  },
  {
    title: 'Money psychology',
    description: 'Spot patterns behind overspending, avoidance, and running out early.',
    icon: Brain,
    side: 'right',
    row: 2,
  },
]

function MoneyToolCard({
  card,
  frame,
  index,
}: {
  card: (typeof moneyToolCards)[number]
  frame: number
  index: number
}) {
  const { width } = useVideoConfig()
  const Icon = card.icon
  const cardWidth = 520
  const cardHeight = 174
  const leftX = 108
  const rightX = width - cardWidth - 108
  const finalX = card.side === 'left' ? leftX : rightX
  const offscreenX = card.side === 'left' ? -cardWidth - 80 : width + 80
  const finalY = 158 + card.row * 292
  const start = 78 + index * 12
  const p = ease(frame, start, 34, EASE_OUT)
  const x = interpolate(p, [0, 1], [offscreenX, finalX], clamp)
  const y = interpolate(p, [0, 1], [finalY + 82, finalY], clamp)
  const opacityValue = interpolate(p, [0, 0.12, 1], [0, 1, 1], clamp)

  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: cardWidth,
        height: cardHeight,
        borderRadius: 18,
        background: 'rgba(255, 255, 255, 0.9)',
        border: '1px solid rgba(255, 255, 255, 0.56)',
        boxShadow: '0 24px 70px rgba(66, 24, 0, 0.18)',
        opacity: opacityValue,
        padding: '26px 30px',
        display: 'grid',
        gridTemplateColumns: '72px 1fr',
        columnGap: 22,
        alignItems: 'start',
        transform: `scale(${interpolate(p, [0, 1], [0.96, 1], clamp)})`,
        transformOrigin: card.side === 'left' ? '0% 50%' : '100% 50%',
        willChange: 'left, top, transform, opacity',
      }}
    >
      <div
        style={{
          width: 58,
          height: 58,
          borderRadius: 14,
          background: 'rgba(255, 243, 232, 0.9)',
          display: 'grid',
          placeItems: 'center',
          color: COLORS.orange,
          marginTop: 2,
        }}
      >
        <Icon size={30} strokeWidth={2.35} />
      </div>
      <div>
        <div
          style={{
            fontFamily: FEATURE_FONT,
            fontSize: 29,
            fontWeight: 780,
            lineHeight: 1.08,
            color: COLORS.plum,
            letterSpacing: 0,
            whiteSpace: 'nowrap',
          }}
        >
          {card.title}
        </div>
        <div
          style={{
            marginTop: 16,
            fontFamily: FONT,
            fontSize: 21,
            fontWeight: 560,
            lineHeight: 1.4,
            color: '#806F63',
            letterSpacing: 0,
          }}
        >
          <BrandInlineText text={card.description} />
        </div>
      </div>
    </div>
  )
}

function MoneyToolsScene() {
  const frame = useCurrentFrame()
  const firstLine = 'Packed with multiple money managing tools.'
  const secondLine = 'To easily manage all your finances.'
  const typedChars = Math.floor(interpolate(frame, [0, 54], [0, firstLine.length], clamp))
  const shrink = ease(frame, 58, 28, EASE_OUT)
  const firstTextLeave = ease(frame, 82, 8, EASE_IN)
  const secondTextEnter = ease(frame, 88, 12, EASE_OUT)
  const textWidth = interpolate(shrink, [0, 1], [1260, 620], clamp)
  const fontSize = interpolate(shrink, [0, 1], [82, 48], clamp)
  const firstText = firstLine.slice(0, typedChars)
  const centerY = interpolate(shrink, [0, 1], [500, 512], clamp)

  return (
    <AbsoluteFill
      style={{
        ...base,
        overflow: 'hidden',
      }}
    >
          {moneyToolCards.map((card, index) => (
        <MoneyToolCard key={card.title} card={card} frame={frame} index={index} />
      ))}

      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: centerY,
          width: textWidth,
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
          fontFamily: FONT,
          fontSize,
          fontWeight: 900,
          lineHeight: 1.06,
          letterSpacing: 0,
          color: COLORS.ink,
          textShadow: '0 8px 26px rgba(45, 12, 0, 0.16)',
          willChange: 'top, width, font-size',
        }}
      >
        <div
          style={{
            opacity: 1 - firstTextLeave,
            transform: `translateY(${interpolate(firstTextLeave, [0, 1], [0, -22], clamp)}px)`,
            willChange: 'transform, opacity',
          }}
        >
          {firstText}
        </div>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'grid',
            placeItems: 'center',
            opacity: secondTextEnter,
            transform: `translateY(${interpolate(secondTextEnter, [0, 1], [24, 0], clamp)}px)`,
            color: COLORS.orangeText,
            textShadow: '0 6px 22px rgba(60, 16, 0, 0.32)',
            willChange: 'transform, opacity',
          }}
        >
          {secondLine}
        </div>
      </div>
    </AbsoluteFill>
  )
}

function CtaScene() {
  const frame = useCurrentFrame()
  const url = 'https://sarathyv2-web-production.up.railway.app/'
  const titleEnter = ease(frame, 0, 20, EASE_OUT)
  const urlChars = Math.floor(interpolate(frame, [18, 66], [0, url.length], clamp))
  const urlReveal = ease(frame, 16, 20, EASE_OUT)
  const glow = Math.sin(interpolate(frame, [0, CTA_SCENE_DURATION_FRAMES], [0, Math.PI], clamp))

  return (
    <AbsoluteFill
      style={{
        ...base,
        display: 'grid',
        placeItems: 'center',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          width: 1380,
          maxWidth: '86%',
          textAlign: 'center',
          transform: `translateY(${interpolate(titleEnter, [0, 1], [18, 0], clamp)}px) scale(${interpolate(titleEnter, [0, 1], [0.985, 1], clamp)})`,
          opacity: interpolate(titleEnter, [0, 1], [0.8, 1], clamp),
          willChange: 'transform, opacity',
        }}
      >
        <div
          style={{
            fontFamily: FONT,
            fontSize: 86,
            fontWeight: 900,
            lineHeight: 1.04,
            letterSpacing: 0,
            color: COLORS.ink,
            textShadow: '0 9px 28px rgba(45, 12, 0, 0.18)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'baseline',
            gap: 18,
            whiteSpace: 'nowrap',
          }}
        >
          <span>Try</span>
          <BrandWord style={{ fontSize: 92, lineHeight: 0.9 }} />
          <span>now at</span>
        </div>
        <div
          style={{
            margin: '38px auto 0',
            width: 'fit-content',
            maxWidth: '100%',
            borderRadius: 30,
            padding: '22px 34px',
            background: 'rgba(255, 255, 255, 0.9)',
            border: '1px solid rgba(255, 255, 255, 0.58)',
            boxShadow: `0 24px ${interpolate(glow, [0, 1], [64, 82], clamp)}px rgba(45, 12, 0, 0.22)`,
            opacity: urlReveal,
            transform: `translateY(${interpolate(urlReveal, [0, 1], [16, 0], clamp)}px)`,
            willChange: 'transform, opacity',
          }}
        >
          <div
            style={{
              fontFamily: FEATURE_FONT,
              fontSize: 38,
              fontWeight: 820,
              lineHeight: 1.1,
              letterSpacing: 0,
              color: COLORS.orange,
              textShadow: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            {url.slice(0, urlChars)}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  )
}

function LogoFinalScene({ duration, appName }: { duration: number; appName: string }) {
  const frame = useCurrentFrame()
  const smoothInOut = Easing.bezier(0.45, 0, 0.2, 1)
  const wordIn = ease(frame, 0, 18, EASE_OUT)
  const gather = ease(frame, 22, 42, smoothInOut)
  const sMorph = ease(frame, 58, 34, smoothInOut)
  const backgroundReveal = ease(frame, 92, 16, EASE_OUT)
  const iconSettle = spring({
    frame: Math.max(0, frame - 92),
    fps: TIMELINE_FPS,
    config: { damping: 18, stiffness: 88, mass: 0.82 },
  })
  const finalBreath = Math.sin(interpolate(frame, [0, duration], [0, Math.PI], clamp))
  const tailLetters = appName.slice(1).split('')
  const baseFontSize = 198
  const serifTailStartX = [-204, -72, 42, 160, 276, 394]
  const markSize = interpolate(sMorph, [0, 1], [238, 254], clamp) * interpolate(iconSettle, [0, 1], [0.985, 1], clamp)
  const markX = interpolate(gather, [0, 1], [-330, 0], clamp)
  const markY = interpolate(wordIn, [0, 1], [28, 0], clamp)
  const markScale = interpolate(gather, [0, 1], [0.96, 1], clamp) * interpolate(sMorph, [0, 1], [1, 1.03], clamp)
  const markRed = Math.round(interpolate(sMorph, [0, 1], [0x35, 0xff], clamp))
  const markGreen = Math.round(interpolate(sMorph, [0, 1], [0x37, 0xf7], clamp))
  const markBlue = Math.round(interpolate(sMorph, [0, 1], [0x3b, 0xea], clamp))
  const markColor = `rgb(${markRed}, ${markGreen}, ${markBlue})`
  const backgroundOpacity = backgroundReveal
  const accentOpacity = interpolate(backgroundReveal, [0.28, 1], [0, 1], clamp)

  return (
    <AbsoluteFill
      style={{
        ...base,
        display: 'grid',
        placeItems: 'center',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'relative',
          width: 1120,
          height: 420,
          opacity: wordIn,
        }}
      >
        <svg
          width={markSize}
          height={markSize}
          viewBox="0 0 512 512"
          role="img"
          aria-label="Sarathy"
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            display: 'block',
            overflow: 'visible',
            transform: `translate(-50%, -50%) translate(${markX}px, ${markY}px) scale(${markScale})`,
            transformOrigin: '50% 50%',
            filter: `drop-shadow(-22px 34px ${interpolate(finalBreath, [0, 1], [58, 72], clamp)}px rgba(45, 12, 0, ${0.24 * backgroundOpacity}))`,
            willChange: 'transform, filter',
            zIndex: 3,
          }}
        >
          <defs>
            <linearGradient id="finalSarathySAccent" x1="128" x2="386" y1="410" y2="284" gradientUnits="userSpaceOnUse">
              <stop offset="0" stopColor="#FFF7EA" />
              <stop offset="0.2" stopColor="#FFE4C1" />
              <stop offset="0.5" stopColor="#FF9C2E" />
              <stop offset="1" stopColor="#F97316" />
            </linearGradient>
            <clipPath id="finalSarathySAccentClip">
              <path d="M98 286C147 318 192 345 246 361C304 378 354 349 396 292L395 430H92Z" />
            </clipPath>
          </defs>
          <rect width="512" height="512" rx="112" fill="#1E0A2E" opacity={backgroundOpacity} />
          <text
            x="107"
            y="402"
            fill={markColor}
            fontFamily={BRAND_FONT}
            fontSize="412"
            fontStyle="italic"
            fontWeight="700"
            letterSpacing="-24"
          >
            S
          </text>
          <g clipPath="url(#finalSarathySAccentClip)" opacity={accentOpacity}>
            <text
              x="107"
              y="402"
              fill="url(#finalSarathySAccent)"
              fontFamily={BRAND_FONT}
              fontSize="412"
              fontStyle="italic"
              fontWeight="700"
              letterSpacing="-24"
            >
              S
            </text>
          </g>
          <path
            d="M140 336C194 374 292 391 360 313"
            fill="none"
            stroke="#FFB15B"
            strokeWidth="14"
            strokeLinecap="round"
            strokeDasharray="250"
            strokeDashoffset={0}
            opacity={0.24 * accentOpacity}
          />
        </svg>

        {tailLetters.map((letter, index) => {
          const letterGather = ease(frame, 24 + index * 3, 28, smoothInOut)
          const startX = serifTailStartX[index] ?? -184 + index * 116
          const x = interpolate(letterGather, [0, 1], [startX, -4 + index * 6], clamp)
          const y = interpolate(letterGather, [0, 1], [interpolate(wordIn, [0, 1], [28, 12], clamp), index % 2 === 0 ? -12 : 14], clamp)
          const opacityValue = wordIn * (1 - interpolate(letterGather, [0.18, 0.82], [0, 1], clamp))
          const scale = interpolate(letterGather, [0, 1], [1, 0.44], clamp)

          return (
            <div
              key={`${letter}-${index}`}
              style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                color: COLORS.ink,
                fontFamily: BRAND_FONT,
                fontSize: baseFontSize,
                fontStyle: 'italic',
                fontWeight: 700,
                lineHeight: 0.94,
                letterSpacing: '-0.07em',
                opacity: opacityValue,
                transform: `translate(-50%, -50%) translate(${x}px, ${y}px) scale(${scale})`,
                transformOrigin: '50% 50%',
                textShadow: '0 9px 28px rgba(35, 12, 0, 0.18)',
                willChange: 'transform, opacity',
                zIndex: 2,
              }}
            >
              {letter}
            </div>
          )
        })}
      </div>
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
    tools: CHATBOT_END_FRAME,
    cta: TOOLS_SCENE_END_FRAME,
    logoEnd: CTA_SCENE_END_FRAME,
  }

  return (
    <AbsoluteFill style={{ ...base, background: '#000000' }}>
      <VideoShaderBackground />
      <Sequence from={starts.scattered} durationInFrames={sceneDurations.scattered} premountFor={premount}>
        <ScatteredScene duration={sceneDurations.scattered} />
      </Sequence>
      <Sequence
        from={starts.tracker}
        durationInFrames={sceneDurations.tracker + TRACKER_TO_INTRO_OVERLAP_FRAMES}
        premountFor={premount}
        style={{ zIndex: 2 }}
      >
        <TrackerScene duration={sceneDurations.tracker} />
      </Sequence>
      <Sequence from={starts.intro} durationInFrames={sceneDurations.intro} premountFor={premount} style={{ zIndex: 1 }}>
        <IntroScene duration={sceneDurations.intro} appName={appName} />
      </Sequence>
      <Sequence from={starts.method} durationInFrames={sceneDurations.method} premountFor={premount}>
        <MethodScene duration={sceneDurations.method} />
      </Sequence>
      <Sequence from={starts.close} durationInFrames={sceneDurations.close} premountFor={premount}>
        <CloseScene duration={sceneDurations.close} />
      </Sequence>
      <Sequence
        from={starts.chatbot}
        durationInFrames={sceneDurations.chatbot}
        premountFor={premount}
        style={{
          scale: 1.009
      }}>
        <ChatbotScene />
      </Sequence>
      <Sequence from={starts.tools} durationInFrames={sceneDurations.tools} premountFor={premount}>
        <MoneyToolsScene />
      </Sequence>
      <Sequence from={starts.cta} durationInFrames={sceneDurations.cta} premountFor={premount}>
        <CtaScene />
      </Sequence>
      <Sequence from={starts.logoEnd} durationInFrames={sceneDurations.logoEnd} premountFor={premount}>
        <LogoFinalScene duration={sceneDurations.logoEnd} appName={appName} />
      </Sequence>
    </AbsoluteFill>
  );
}
