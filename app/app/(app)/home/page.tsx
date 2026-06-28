'use client'
import { useState, useEffect, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  BarChart3,
  AlertTriangle,
  Bell,
  BellRing,
  Brain,
  Bus,
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  Clapperboard,
  CheckCircle2,
  Clock3,
  Crown,
  FileText,
  Gauge,
  GraduationCap,
  HeartHandshake,
  Home as HomeIcon,
  Import,
  LockKeyhole,
  MessageCircle,
  MoreHorizontal,
  Pill,
  Plus,
  Send,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Target,
  TrendingUp,
  Utensils,
  WalletCards,
  X,
  UsersRound,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import {
  calculateSafeToSpend,
  groupEntriesByCategory,
  formatCurrency,
  getMonthEntries,
} from '@/lib/calculations'
import { Profile, BudgetEntry, FixedSpending, SafeToSpendData, PLCategory, SafetyStatus } from '@/types'
import {
  getFirstName,
  getHomePersonalization,
  getPersonalActionHelpers,
  getSarathyInbox,
} from '@/lib/personalization'
import { formatDateKey, getLocalDateKey, isDateKeyInCurrentMonth, normalizeDateKey } from '@/lib/dates'
import type { SarathyInboxItem } from '@/lib/personalization'
import TabBar from '@/components/ui/TabBar'
import BrandLogo from '@/components/ui/BrandLogo'
import MoodCheckIn from '@/components/home/MoodCheckIn'
import LogExpenseSheet from '@/components/home/LogExpenseSheet'
import TrustLayerModal from '@/components/home/TrustLayerModal'

const categoryIcons: Record<string, LucideIcon> = {
  Food: Utensils,
  Transport: Bus,
  Social: UsersRound,
  Home: HomeIcon,
  Family: HeartHandshake,
  Shopping: ShoppingBag,
  Health: Pill,
  Education: GraduationCap,
  Entertainment: Clapperboard,
  Other: MoreHorizontal,
}

const statusTone: Record<SafetyStatus, { text: string; bg: string; border: string; accent: string; label: string }> = {
  safe: {
    text: 'text-safe',
    bg: 'bg-mint',
    border: 'border-safe/25',
    accent: '#10B981',
    label: 'On track',
  },
  tight: {
    text: 'text-warning',
    bg: 'bg-amber-50',
    border: 'border-warning/25',
    accent: '#F59E0B',
    label: 'Tight',
  },
  danger: {
    text: 'text-danger',
    bg: 'bg-rose-50',
    border: 'border-danger/25',
    accent: '#F43F5E',
    label: 'At risk',
  },
}

type PersonalActionKey = keyof ReturnType<typeof getPersonalActionHelpers>
type ToolTier = 'free' | 'plus'

const primaryActions: Array<{ key: PersonalActionKey; href: string; label: string; icon: LucideIcon; tier: ToolTier }> = [
  { key: 'check', href: '/app/check', label: 'Money check', icon: Target, tier: 'free' },
  { key: 'upload', href: '/app/upload', label: 'Import transactions', icon: Import, tier: 'free' },
  { key: 'fixed', href: '/app/fixed', label: 'Fixed costs', icon: FileText, tier: 'free' },
]

const secondaryActions: Array<{ key: PersonalActionKey; href: string; label: string; icon: LucideIcon; tier: ToolTier }> = [
  { key: 'future', href: '/app/future', label: 'Future you', icon: CalendarClock, tier: 'plus' },
  { key: 'biases', href: '/app/biases', label: 'Money psychology', icon: Brain, tier: 'plus' },
  { key: 'insights', href: '/app/insights', label: 'Financial DNA', icon: Sparkles, tier: 'plus' },
  { key: 'remittance', href: '/app/remittance', label: 'Send money home', icon: Send, tier: 'plus' },
  { key: 'marketplace', href: '/app/marketplace', label: 'Built for you', icon: WalletCards, tier: 'plus' },
  { key: 'mydata', href: '/app/mydata', label: 'My data', icon: BarChart3, tier: 'free' },
]

function CategoryIcon({ category }: { category: string }) {
  const Icon = categoryIcons[category] || MoreHorizontal
  return <Icon className="h-4 w-4" />
}

const inboxIcons: Record<SarathyInboxItem['icon'], LucideIcon> = {
  alert: AlertTriangle,
  check: CheckCircle2,
  clock: Clock3,
  home: HomeIcon,
  message: MessageCircle,
  sparkles: Sparkles,
  target: Target,
  wallet: WalletCards,
}

const inboxTones: Record<SarathyInboxItem['tone'], { icon: string; dot: string; bg: string; border: string }> = {
  danger: { icon: 'text-danger', dot: 'bg-danger', bg: 'bg-rose-50', border: 'border-danger/20' },
  warning: { icon: 'text-warning', dot: 'bg-warning', bg: 'bg-amber-50', border: 'border-warning/20' },
  safe: { icon: 'text-safe', dot: 'bg-safe', bg: 'bg-green-50', border: 'border-safe/20' },
  plum: { icon: 'text-plum', dot: 'bg-plum', bg: 'bg-cream', border: 'border-plum/10' },
  saffron: { icon: 'text-saffron', dot: 'bg-saffron', bg: 'bg-saffron-soft', border: 'border-saffron/20' },
}

function InboxRow({
  item,
  onAction,
  onOpenHref,
  onNavigate,
  onDismiss,
  compact = false,
}: {
  item: SarathyInboxItem
  onAction: (item: SarathyInboxItem) => void
  onOpenHref?: (href: string) => void
  onNavigate?: () => void
  onDismiss?: (item: SarathyInboxItem) => void
  compact?: boolean
}) {
  const Icon = inboxIcons[item.icon]
  const tone = inboxTones[item.tone]
  const handleOpen = () => {
    if (item.href) {
      onNavigate?.()
      onOpenHref?.(item.href)
      return
    }
    onAction(item)
  }
  const content = (
    <>
      <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border ${tone.border} ${tone.bg} ${tone.icon}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${tone.dot}`} />
          <p className="truncate text-sm font-semibold text-ink">{item.title}</p>
        </div>
        <p className={`${compact ? 'line-clamp-1' : ''} text-xs leading-relaxed text-ink-3`}>{item.body}</p>
        {!compact && (
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <span className="text-xs font-semibold text-saffron">{item.actionLabel}</span>
            {onDismiss && (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation()
                  onDismiss(item)
                }}
                className="text-xs font-semibold text-ink-3 underline underline-offset-2"
              >
                Mark read
              </button>
            )}
          </div>
        )}
      </div>
      <ChevronRight className="h-4 w-4 flex-shrink-0 text-ink-3" />
    </>
  )
  const className = `flex w-full cursor-pointer items-center gap-3 rounded-2xl border border-line bg-white px-4 ${compact ? 'py-3' : 'py-4'} text-left transition-colors hover:bg-cream/70`

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleOpen}
      onKeyDown={event => {
        if (event.key === 'Enter' || event.key === ' ') handleOpen()
      }}
      className={className}
    >
      {content}
    </div>
  )
}

type DashboardPeriod = 'today' | 'week' | 'month'
type NormalizedEntry = BudgetEntry & { dateKey: string; amount: number }

const spendTone = {
  safe: {
    fill: '#10B981',
    border: 'border-safe/25',
    soft: 'bg-green-50',
    text: 'text-safe',
    panel: 'from-green-50 to-white',
  },
  warning: {
    fill: '#F59E0B',
    border: 'border-warning/25',
    soft: 'bg-amber-50',
    text: 'text-warning',
    panel: 'from-amber-50 to-white',
  },
  danger: {
    fill: '#F43F5E',
    border: 'border-danger/25',
    soft: 'bg-rose-50',
    text: 'text-danger',
    panel: 'from-rose-50 to-white',
  },
}

const categoryBarColors = ['#F97316', '#1E0A2E', '#10B981', '#F59E0B', '#F43F5E', '#7A6254']

function getDateFromKey(dateKey: string) {
  return new Date(Number(dateKey.slice(0, 4)), Number(dateKey.slice(5, 7)) - 1, Number(dateKey.slice(8, 10)))
}

function isDateInSelectedMonth(dateKey: string, monthOffset: number) {
  const now = new Date()
  const selected = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1)
  const date = getDateFromKey(dateKey)
  return date.getFullYear() === selected.getFullYear() && date.getMonth() === selected.getMonth()
}

function getMonthLabel(monthOffset: number) {
  const now = new Date()
  const selected = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1)
  return selected.toLocaleDateString('en-SG', { month: 'long', year: 'numeric' })
}

function isDateWithinLastSevenDays(dateKey: string) {
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const entryStart = getDateFromKey(dateKey)
  const diffDays = Math.round((todayStart.getTime() - entryStart.getTime()) / (1000 * 60 * 60 * 24))
  return diffDays >= 0 && diffDays <= 6
}

function getDashboardTone(percent: number) {
  if (percent > 100) return spendTone.danger
  if (percent >= 80) return spendTone.warning
  return spendTone.safe
}

function UncappedSpendBar({ percent, color }: { percent: number; color: string }) {
  const used = Number.isFinite(percent) ? Math.max(0, Math.round(percent)) : 0
  const scale = Math.max(100, Math.ceil(Math.max(used, 1) / 25) * 25)
  const fillWidth = Math.min(100, (used / scale) * 100)
  const budgetLine = Math.min(100, (100 / scale) * 100)

  return (
    <div>
      <div className="relative h-3 overflow-hidden rounded-md bg-cream-3">
        <div
          className="absolute inset-y-0 left-0 rounded-md transition-[width] duration-500"
          style={{ width: `${fillWidth}%`, background: color }}
        />
        <div
          className="absolute inset-y-0 w-0.5 bg-ink/45"
          style={{ left: `calc(${budgetLine}% - 1px)` }}
          aria-hidden="true"
        />
      </div>
      <div className="mt-1 flex items-center justify-between text-[11px] text-ink-3">
        <span>100% budget line</span>
        <span className={used > 100 ? 'font-semibold text-danger' : ''}>{used}% used</span>
      </div>
    </div>
  )
}

function SpendingDashboard({
  entries,
  safeData,
  currency,
}: {
  entries: BudgetEntry[]
  safeData: SafeToSpendData
  currency: string
}) {
  const [period, setPeriod] = useState<DashboardPeriod>('today')
  const [monthOffset, setMonthOffset] = useState(0)
  const [category, setCategory] = useState('All')
  const todayKey = getLocalDateKey()

  const normalizedEntries = useMemo<NormalizedEntry[]>(
    () => entries
      .map(entry => {
        const dateKey = normalizeDateKey(entry.entry_date)
        const amount = Number(entry.amount)
        return dateKey && Number.isFinite(amount)
          ? { ...entry, dateKey, amount }
          : null
      })
      .filter((entry): entry is NormalizedEntry => Boolean(entry)),
    [entries],
  )

  const periodEntries = useMemo(() => normalizedEntries.filter(entry => {
    if (period === 'today') return entry.dateKey === todayKey
    if (period === 'week') return isDateWithinLastSevenDays(entry.dateKey)
    return isDateInSelectedMonth(entry.dateKey, monthOffset)
  }), [normalizedEntries, monthOffset, period, todayKey])

  const categoryOptions = useMemo(() => {
    const options = Array.from(new Set(periodEntries.map(entry => entry.category))).sort()
    return ['All', ...options]
  }, [periodEntries])

  const activeCategory = categoryOptions.includes(category) ? category : 'All'
  const filteredEntries = activeCategory === 'All'
    ? periodEntries
    : periodEntries.filter(entry => entry.category === activeCategory)
  const spent = filteredEntries.reduce((sum, entry) => sum + entry.amount, 0)
  const periodSpent = periodEntries.reduce((sum, entry) => sum + entry.amount, 0)
  const monthSpendLimit = Math.max(0, safeData.planAmount - safeData.fixedLeft - safeData.buffer)
  const periodBudget = period === 'today'
    ? safeData.dailyAllowance
    : period === 'week'
    ? safeData.dailyAllowance * 7
    : monthSpendLimit
  const percent = periodBudget > 0 ? Math.round((spent / periodBudget) * 100) : spent > 0 ? 999 : 0
  const overBy = Math.max(0, spent - periodBudget)
  const left = Math.max(0, periodBudget - spent)
  const tone = getDashboardTone(percent)
  const periodLabel = period === 'today' ? 'Today' : period === 'week' ? 'Last 7 days' : getMonthLabel(monthOffset)
  const budgetLabel = period === 'today'
    ? 'Daily allowance'
    : period === 'week'
    ? '7-day allowance'
    : 'Monthly spendable plan'

  const categoryBreakdown = useMemo(() => {
    const grouped = new Map<string, number>()
    periodEntries.forEach(entry => grouped.set(entry.category, (grouped.get(entry.category) || 0) + entry.amount))
    return Array.from(grouped.entries())
      .map(([label, total], index) => ({
        label,
        total,
        color: categoryBarColors[index % categoryBarColors.length],
        percentage: periodSpent > 0 ? Math.round((total / periodSpent) * 100) : 0,
      }))
      .sort((a, b) => b.total - a.total)
  }, [periodEntries, periodSpent])

  const dailyBreakdown = useMemo(() => {
    const grouped = new Map<string, number>()
    filteredEntries.forEach(entry => grouped.set(entry.dateKey, (grouped.get(entry.dateKey) || 0) + entry.amount))
    if (period === 'today' && !grouped.has(todayKey)) grouped.set(todayKey, 0)
    return Array.from(grouped.entries())
      .map(([dateKey, total]) => {
        const dayPercent = safeData.dailyAllowance > 0
          ? Math.round((total / safeData.dailyAllowance) * 100)
          : total > 0 ? 999 : 0
        return {
          dateKey,
          total,
          percent: dayPercent,
          overBy: Math.max(0, total - safeData.dailyAllowance),
        }
      })
      .sort((a, b) => b.dateKey.localeCompare(a.dateKey))
  }, [filteredEntries, period, safeData.dailyAllowance, todayKey])

  const daysOver = dailyBreakdown.filter(day => day.overBy > 0).length

  return (
    <section className="px-5 pt-4 md:px-8">
      <div className={`overflow-hidden rounded-3xl border ${tone.border} bg-white shadow-[0_16px_44px_rgba(30,10,46,0.07)]`}>
        <div className={`border-b border-line bg-gradient-to-br ${tone.panel} px-4 py-4 md:px-5`}>
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold text-plum shadow-sm">
                <Gauge className="h-3.5 w-3.5" />
                Spending dashboard
              </div>
              <h2 className="font-fraunces text-2xl font-semibold leading-tight text-ink">
                {overBy > 0 ? 'You are over this budget.' : 'You are inside this budget.'}
              </h2>
              <p className="mt-1 text-sm text-ink-3">
                {periodLabel} using {activeCategory === 'All' ? 'all expenditure types' : activeCategory}.
              </p>
            </div>
            <div className={`rounded-2xl ${tone.soft} px-4 py-3 text-right`}>
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-3">Status</p>
              <p className={`mt-1 text-lg font-bold ${tone.text}`}>
                {overBy > 0 ? `Over by ${formatCurrency(overBy, currency)}` : `${formatCurrency(left, currency)} left`}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {(['today', 'week', 'month'] as const).map(option => (
              <button
                key={option}
                type="button"
                onClick={() => setPeriod(option)}
                className={`rounded-2xl px-3 py-2 text-sm font-semibold transition-colors ${
                  period === option
                    ? 'bg-plum text-white'
                    : 'bg-white text-ink-3 shadow-sm'
                }`}
              >
                {option === 'today' ? 'Today' : option === 'week' ? '7 days' : 'Month'}
              </button>
            ))}
          </div>

          {period === 'month' && (
            <div className="mt-3 flex items-center justify-between rounded-2xl bg-white px-3 py-2 shadow-sm">
              <button
                type="button"
                onClick={() => setMonthOffset(value => value - 1)}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-ink-3 hover:bg-cream"
                aria-label="Previous month"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <p className="text-sm font-semibold text-ink">{getMonthLabel(monthOffset)}</p>
              <button
                type="button"
                onClick={() => setMonthOffset(value => Math.min(0, value + 1))}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-ink-3 hover:bg-cream disabled:opacity-35"
                aria-label="Next month"
                disabled={monthOffset === 0}
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}

          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {categoryOptions.map(option => (
              <button
                key={option}
                type="button"
                onClick={() => setCategory(option)}
                className={`flex-shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                  activeCategory === option
                    ? 'border-saffron bg-saffron text-white'
                    : 'border-line bg-white text-ink-3'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-3 px-4 py-4 md:grid-cols-4 md:px-5">
          {[
            { label: 'Spent', value: formatCurrency(spent, currency), tone: 'text-ink' },
            { label: budgetLabel, value: formatCurrency(periodBudget, currency), tone: 'text-ink' },
            { label: overBy > 0 ? 'Over budget' : 'Left', value: formatCurrency(overBy > 0 ? overBy : left, currency), tone: overBy > 0 ? 'text-danger' : 'text-safe' },
            { label: 'Budget used', value: `${percent}%`, tone: percent > 100 ? 'text-danger' : percent >= 80 ? 'text-warning' : 'text-safe' },
          ].map(item => (
            <div key={item.label} className="rounded-2xl border border-line bg-cream/50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-3">{item.label}</p>
              <p className={`mt-1 text-xl font-bold ${item.tone}`}>{item.value}</p>
            </div>
          ))}
        </div>

        <div className="px-4 pb-4 md:px-5">
          <UncappedSpendBar percent={percent} color={tone.fill} />
        </div>

        <div className="grid gap-4 border-t border-line px-4 py-4 md:grid-cols-[1fr_1.1fr] md:px-5">
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-bold text-plum">Expenditure types</h3>
              <span className="text-xs text-ink-3">{categoryBreakdown.length} types</span>
            </div>
            {categoryBreakdown.length === 0 ? (
              <div className="rounded-2xl border border-line bg-cream px-4 py-5 text-sm text-ink-3">
                No spending logged for this period.
              </div>
            ) : (
              <div className="grid gap-3">
                {categoryBreakdown.map(categoryItem => (
                  <button
                    key={categoryItem.label}
                    type="button"
                    onClick={() => setCategory(categoryItem.label)}
                    className="rounded-2xl border border-line bg-white px-4 py-3 text-left transition-colors hover:bg-cream/70"
                  >
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-2">
                        <span className="h-2.5 w-2.5 flex-shrink-0 rounded-full" style={{ background: categoryItem.color }} />
                        <span className="truncate text-sm font-semibold text-ink">{categoryItem.label}</span>
                      </div>
                      <span className="text-sm font-semibold text-ink">{formatCurrency(categoryItem.total, currency)}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-cream-3">
                      <div
                        className="h-2 rounded-full"
                        style={{ width: `${Math.min(100, Math.max(4, categoryItem.percentage))}%`, background: categoryItem.color }}
                      />
                    </div>
                    <p className="mt-1 text-[11px] text-ink-3">{categoryItem.percentage}% of period spending</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-bold text-plum">Daily budget crossings</h3>
              <span className={daysOver > 0 ? 'text-xs font-semibold text-danger' : 'text-xs text-ink-3'}>
                {daysOver > 0 ? `${daysOver} over` : 'None over'}
              </span>
            </div>
            <div className="grid gap-3">
              {dailyBreakdown.map(day => {
                const dayTone = getDashboardTone(day.percent)
                return (
                  <div key={day.dateKey} className={`rounded-2xl border ${day.overBy > 0 ? 'border-danger/25 bg-rose-50' : 'border-line bg-white'} px-4 py-3`}>
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-ink">
                          {formatDateKey(day.dateKey, 'en-SG', { weekday: 'short', day: 'numeric', month: 'short' })}
                        </p>
                        <p className="text-xs text-ink-3">
                          Daily allowance {formatCurrency(safeData.dailyAllowance, currency)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-bold ${day.overBy > 0 ? 'text-danger' : 'text-ink'}`}>
                          {formatCurrency(day.total, currency)}
                        </p>
                        <p className={`text-xs ${day.overBy > 0 ? 'font-semibold text-danger' : 'text-ink-3'}`}>
                          {day.overBy > 0 ? `Over by ${formatCurrency(day.overBy, currency)}` : `${day.percent}% used`}
                        </p>
                      </div>
                    </div>
                    <UncappedSpendBar percent={day.percent} color={dayTone.fill} />
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default function HomePage() {
  const router = useRouter()
  const supabase = createClient()

  const [profile, setProfile] = useState<Profile | null>(null)
  const [entries, setEntries] = useState<BudgetEntry[]>([])
  const [fixedSpending, setFixedSpending] = useState<FixedSpending[]>([])
  const [safeData, setSafeData] = useState<SafeToSpendData | null>(null)
  const [categories, setCategories] = useState<PLCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [showLog, setShowLog] = useState(false)
  const [showTrust, setShowTrust] = useState(false)
  const [showInbox, setShowInbox] = useState(false)
  const [dismissedInboxIds, setDismissedInboxIds] = useState<string[]>([])
  const [selectedCategory, setSelectedCategory] = useState<PLCategory | null>(null)
  const [xpFloat, setXpFloat] = useState<{ show: boolean; x: number; y: number }>({ show: false, x: 0, y: 0 })

  const loadData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.replace('/app/login'); return }

    const [profileRes, entriesRes, fixedRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('budget_entries').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('fixed_spending').select('*').eq('user_id', user.id).eq('is_active', true),
    ])

    if (profileRes.data) {
      const p = profileRes.data as Profile
      if (!p.onboarding_complete) { router.replace('/app/onboarding'); return }
      setProfile(p)

      const e = (entriesRes.data || []) as BudgetEntry[]
      const f = (fixedRes.data || []) as FixedSpending[]
      setEntries(e)
      setFixedSpending(f)

      const safe = calculateSafeToSpend(p, e, f)
      setSafeData(safe)

      const monthEntries = getMonthEntries(e)
      setCategories(groupEntriesByCategory(monthEntries))
    }
    setLoading(false)
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const handleExpenseLogged = async (_xp: number, eventX: number, eventY: number) => {
    setXpFloat({ show: true, x: eventX, y: eventY })
    setTimeout(() => setXpFloat({ show: false, x: 0, y: 0 }), 1200)
    await loadData()
  }

  const todayKey = getLocalDateKey()
  const inboxStorageKey = profile ? `sarathy:readInbox:${profile.id}:${todayKey}` : ''

  useEffect(() => {
    if (!inboxStorageKey) return
    try {
      const stored = window.localStorage.getItem(inboxStorageKey)
      const parsed = stored ? JSON.parse(stored) : []
      setDismissedInboxIds(Array.isArray(parsed) ? parsed : [])
    } catch {
      setDismissedInboxIds([])
    }
  }, [inboxStorageKey])
  const todaySpent = entries
    .filter(e => e.entry_date === todayKey)
    .reduce((sum, e) => sum + e.amount, 0)

  const monthTotal = entries
    .filter(e => isDateKeyInCurrentMonth(e.entry_date))
    .reduce((sum, e) => sum + e.amount, 0)

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-white">
        <div className="h-8 w-8 rounded-full border-2 border-saffron border-t-transparent animate-spin" />
      </div>
    )
  }

  if (!profile || !safeData) return null

  const currency = profile.primary_currency || 'SGD'
  const tone = statusTone[safeData.status]
  const firstName = getFirstName(profile)
  const todaySpendPercent = safeData.dailyAllowance <= 0
    ? todaySpent > 0 ? 999 : 0
    : Math.round((todaySpent / safeData.dailyAllowance) * 100)
  const todayOverBy = Math.max(0, todaySpent - safeData.dailyAllowance)
  const monthBalance = (profile.planning_amount || 0) - monthTotal
  const monthlyRows = categories
  const personalNote = getHomePersonalization(profile, safeData, categories[0])
  const actionHelpers = getPersonalActionHelpers(profile, safeData, categories[0])
  const rawInbox = getSarathyInbox(profile, safeData, entries, fixedSpending, categories)
  const inbox = {
    ...rawInbox,
    items: rawInbox.items.filter(item => !dismissedInboxIds.includes(item.id)),
    subtitle: rawInbox.items.filter(item => !dismissedInboxIds.includes(item.id)).length
      ? rawInbox.subtitle
      : 'No important notes right now.',
  }
  const inboxPreview = inbox.items.slice(0, 2)
  const hasPlus = profile.plan_tier === 'plus'

  const handleInboxAction = (item: SarathyInboxItem) => {
    setShowInbox(false)
    if (item.action === 'log-expense') setShowLog(true)
    if (item.action === 'open-safety') setShowTrust(true)
  }

  const handleInboxDismiss = (item: SarathyInboxItem) => {
    setDismissedInboxIds(current => {
      const next = current.includes(item.id) ? current : [...current, item.id]
      if (inboxStorageKey) {
        window.localStorage.setItem(inboxStorageKey, JSON.stringify(next))
      }
      return next
    })
  }

  return (
    <div className="min-h-dvh bg-white md:bg-cream md:pl-28">
      <main className="mx-auto min-h-dvh w-full max-w-[480px] bg-white pb-36 md:max-w-5xl md:bg-cream md:pb-16">
        {xpFloat.show && (
          <div className="xp-float" style={{ left: xpFloat.x, top: xpFloat.y }}>
            +10 XP
          </div>
        )}

        <header className="px-5 pt-10 md:px-8 md:pt-12">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <BrandLogo
                markClassName="h-12 w-12"
                wordmarkClassName="font-fraunces text-4xl font-semibold text-plum"
              />
              <p className="mt-3 text-xl font-semibold text-plum">Good morning, {firstName}</p>
              <p className="mt-1 text-sm text-ink-3">{safeData.safetyLine}</p>
            </div>
            <button
              type="button"
              onClick={() => setShowInbox(true)}
              className="relative mt-2 flex h-11 w-11 items-center justify-center rounded-xl border border-line text-plum"
              aria-label={`Open Sarathy inbox with ${inbox.items.length} notes`}
            >
              <Bell className="h-5 w-5" />
              {inbox.items.length > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-saffron px-1 text-[10px] font-bold text-white shadow-sm">
                  {inbox.items.length}
                </span>
              )}
            </button>
          </div>

          <button
            type="button"
            onClick={() => setShowTrust(true)}
            className={`w-full rounded-2xl border ${tone.border} bg-white p-5 text-left shadow-[0_12px_40px_rgba(30,10,46,0.06)] transition-transform active:scale-[0.99]`}
          >
            <div className="mb-5 flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${tone.bg} ${tone.text}`}>
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-lg font-semibold text-ink">Safe to spend today</p>
                  <p className="text-xs font-medium text-ink-3">{tone.label}</p>
                </div>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-saffron-soft text-saffron">
                <WalletCards className="h-5 w-5" />
              </div>
            </div>
            <p className={`safe-number ${tone.text}`}>
              {formatCurrency(safeData.safeToSpend, currency)}
            </p>
            <div className={`mt-5 flex items-center gap-2 ${tone.text}`}>
              <ShieldCheck className="h-4 w-4" />
              <p className="text-sm font-semibold">
                {todayOverBy > 0 ? `Over today's safe amount by ${formatCurrency(todayOverBy, currency)}` : safeData.safetyLine}
              </p>
            </div>
          </button>
        </header>

        <SpendingDashboard
          entries={entries}
          safeData={safeData}
          currency={currency}
        />

        <section className="px-5 pt-4 md:px-8">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <BellRing className="h-4 w-4 text-saffron" />
                <h2 className="text-sm font-bold text-plum">{inbox.title}</h2>
              </div>
              <p className="mt-1 text-xs text-ink-3">{inbox.subtitle}</p>
            </div>
            <button
              type="button"
              onClick={() => setShowInbox(true)}
              className="flex-shrink-0 text-xs font-semibold text-saffron"
            >
              View all
            </button>
          </div>
          {inboxPreview.length > 0 && (
            <div className="grid gap-2">
              {inboxPreview.map(item => (
                <InboxRow
                  key={item.id}
                  item={item}
                  onAction={handleInboxAction}
                  onOpenHref={(href) => router.push(href)}
                  onNavigate={() => setShowInbox(false)}
                  compact
                />
              ))}
            </div>
          )}
        </section>

        <section className="px-5 pt-4 md:px-8">
          <div className="card">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-lg font-semibold text-plum">Today's spending</p>
                <p className="mt-1 text-2xl font-semibold text-plum">
                  {formatCurrency(todaySpent, currency)}
                  <span className="ml-1 text-base font-medium text-ink-3">
                    of {formatCurrency(safeData.dailyAllowance, currency)}
                  </span>
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full border border-line text-ink-3">
                <BarChart3 className="h-5 w-5" />
              </div>
            </div>
            <UncappedSpendBar percent={todaySpendPercent} color={todayOverBy > 0 ? spendTone.danger.fill : tone.accent} />
            <p className={`mt-2 text-xs font-semibold ${todayOverBy > 0 ? 'text-danger' : 'text-ink-3'}`}>
              {todayOverBy > 0
                ? `You crossed today's allowance by ${formatCurrency(todayOverBy, currency)}.`
                : `${formatCurrency(Math.max(0, safeData.dailyAllowance - todaySpent), currency)} left for today.`}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowLog(true)}
            className="btn-primary mt-3 shadow-[0_12px_30px_rgba(249,115,22,0.24)]"
          >
            <Plus className="h-5 w-5" />
            Log expense
          </button>
        </section>

        <section className="px-5 pt-4 md:px-8">
          <div className="rounded-2xl border border-plum/10 bg-plum px-4 py-4 text-white shadow-[0_12px_34px_rgba(30,10,46,0.12)]">
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-white/60">{personalNote.eyebrow}</p>
              <Sparkles className="h-4 w-4 text-white/70" />
            </div>
            <p className="text-lg font-semibold">{personalNote.title}</p>
            <p className="mt-2 text-sm leading-relaxed text-white/80">{personalNote.body}</p>
            <p className="mt-3 border-t border-white/15 pt-3 text-xs leading-relaxed text-white/65">{personalNote.detail}</p>
          </div>
        </section>

        <section className="px-5 pt-4 md:px-8">
          <div className="card overflow-hidden p-0">
            <div className="border-b border-line px-4 py-4">
              <p className="text-lg font-semibold text-plum">This month</p>
            </div>

            {!!profile.planning_amount && (
              <div className="flex items-center justify-between gap-3 border-b border-cream px-4 py-4">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-mint text-safe">
                    <WalletCards className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-ink">Income / Budget</p>
                    <p className="text-xs text-ink-3">Available plan</p>
                  </div>
                </div>
                <p className="text-sm font-bold text-safe">+{formatCurrency(profile.planning_amount, currency)}</p>
              </div>
            )}

            {monthlyRows.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <p className="text-sm font-semibold text-ink">No expenses this month yet</p>
                <p className="mt-1 text-xs text-ink-3">Log your first one to build the monthly picture.</p>
              </div>
            ) : (
              monthlyRows.map(cat => (
                <button
                  key={cat.category}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className="flex w-full items-center justify-between gap-3 border-b border-cream px-4 py-4 text-left transition-colors last:border-0 hover:bg-cream/70"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-saffron-soft text-saffron">
                      <CategoryIcon category={cat.category} />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-ink">{cat.category}</p>
                      <p className="text-xs text-ink-3">{cat.percentage}% of spending</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-ink">{formatCurrency(cat.total, currency)}</span>
                    <ChevronRight className="h-4 w-4 text-ink-3" />
                  </div>
                </button>
              ))
            )}

            {!!profile.planning_amount && (
              <div className="flex items-center justify-between bg-cream/70 px-4 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-mint text-safe">
                    <TrendingUp className="h-5 w-5" />
                  </div>
                  <span className="text-sm font-semibold text-ink">Balance</span>
                </div>
                <span className={`text-base font-bold ${monthBalance >= 0 ? 'text-safe' : 'text-danger'}`}>
                  {formatCurrency(monthBalance, currency)}
                </span>
              </div>
            )}
          </div>
        </section>

        {selectedCategory && (
          <>
            <div className="overlay" onClick={() => setSelectedCategory(null)} />
            <div className="bottom-sheet">
              <div className="sheet-handle" />
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-saffron-soft text-saffron">
                    <CategoryIcon category={selectedCategory.category} />
                  </div>
                  <div>
                    <h3 className="font-fraunces text-xl font-semibold text-ink">{selectedCategory.category}</h3>
                    <p className="text-xs text-ink-3">{formatCurrency(selectedCategory.total, currency)} total</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedCategory(null)}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-line text-ink-3"
                  aria-label="Close category details"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="flex max-h-72 flex-col overflow-y-auto">
                {selectedCategory.entries.map(entry => (
                  <div key={entry.id} className="flex items-center justify-between gap-3 border-b border-cream py-3 last:border-0">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-ink">{entry.description || entry.category}</p>
                      <p className="text-xs text-ink-3">{formatDateKey(entry.entry_date)}</p>
                    </div>
                    <span className="text-sm font-semibold text-ink">{formatCurrency(entry.amount, currency)}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {showInbox && (
          <>
            <div className="overlay" onClick={() => setShowInbox(false)} />
            <div className="bottom-sheet max-h-[82dvh] overflow-y-auto">
              <div className="sheet-handle" />
              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-fraunces text-xl font-semibold text-ink">{inbox.title}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-ink-3">{inbox.subtitle}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowInbox(false)}
                  className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-line text-ink-3"
                  aria-label="Close Sarathy inbox"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="grid gap-2">
                {inbox.items.map(item => (
                  <InboxRow
                    key={item.id}
                    item={item}
                    onAction={handleInboxAction}
                    onOpenHref={(href) => router.push(href)}
                    onNavigate={() => setShowInbox(false)}
                    onDismiss={handleInboxDismiss}
                  />
                ))}
                {inbox.items.length === 0 && (
                  <div className="rounded-2xl border border-line bg-white px-4 py-6 text-center text-sm text-ink-3">
                    No important notes right now.
                  </div>
                )}
              </div>
              <div className="mt-4 rounded-2xl bg-cream px-4 py-3">
                <p className="text-xs leading-relaxed text-ink-3">
                  Sarathy does not need to interrupt you to be useful. The inbox refreshes when you open the app and stays quiet otherwise.
                </p>
              </div>
            </div>
          </>
        )}

        <section className="px-5 pt-4 md:px-8">
          <MoodCheckIn userId={profile.id} />
        </section>

        <section className="px-5 pt-4 md:px-8">
          <div className="grid grid-cols-3 gap-3">
            {primaryActions.map(action => {
              const Icon = action.icon
              const locked = action.tier === 'plus' && !hasPlus

              return (
                <Link
                  key={action.href}
                  href={locked ? '/app/profile/plus' : action.href}
                  className="flex min-h-[104px] flex-col justify-between rounded-2xl border border-line bg-white p-3 shadow-[0_8px_24px_rgba(30,10,46,0.04)]"
                >
                  <div className="flex items-center justify-between gap-2">
                    <Icon className="h-5 w-5 text-plum" />
                    {locked ? <LockKeyhole className="h-4 w-4 text-saffron" /> : <ChevronRight className="h-4 w-4 text-ink-3" />}
                  </div>
                  <div>
                    <p className="text-xs font-bold leading-snug text-ink">{action.label}</p>
                    <p className="mt-1 text-[11px] leading-snug text-ink-3">{actionHelpers[action.key]}</p>
                    {locked && (
                      <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-saffron-soft px-2 py-0.5 text-[10px] font-bold text-saffron">
                        <Crown className="h-3 w-3" />
                        Plus
                      </span>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        </section>

        <section className="px-5 pt-5 md:px-8">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-plum">Money tool suite</h2>
              <p className="mt-1 text-xs text-ink-3">Starter tools stay open. Deeper planning is Plus.</p>
            </div>
            <Link href="/app/story" className="text-xs font-semibold text-saffron">View all</Link>
          </div>
          <div className="grid grid-cols-1 gap-2">
            {secondaryActions.map(action => {
              const Icon = action.icon
              const locked = action.tier === 'plus' && !hasPlus

              return (
                <Link
                  key={action.href}
                  href={locked ? '/app/profile/plus' : action.href}
                  className={`flex items-center justify-between rounded-2xl border bg-white px-4 py-3 ${locked ? 'border-saffron/20' : 'border-line'}`}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${locked ? 'bg-saffron-soft text-saffron' : 'bg-cream text-plum'}`}>
                      {locked ? <LockKeyhole className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-semibold text-ink">{action.label}</p>
                        {locked && (
                          <span className="rounded-full bg-saffron-soft px-2 py-0.5 text-[10px] font-bold text-saffron">Plus</span>
                        )}
                      </div>
                      <p className="truncate text-xs text-ink-3">{actionHelpers[action.key]}</p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 flex-shrink-0 text-ink-3" />
                </Link>
              )
            })}
          </div>
        </section>

        {showLog && (
          <LogExpenseSheet
            profile={profile}
            onClose={() => setShowLog(false)}
            onLogged={handleExpenseLogged}
          />
        )}

        {showTrust && (
          <TrustLayerModal
            safeData={safeData}
            onClose={() => setShowTrust(false)}
          />
        )}
      </main>

      <TabBar active="home" />
    </div>
  )
}
