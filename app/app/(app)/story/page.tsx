'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  BarChart3,
  Brain,
  CalendarClock,
  ChevronRight,
  Crown,
  FileText,
  Import,
  LockKeyhole,
  Send,
  Sparkles,
  Target,
  Trophy,
  WalletCards,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { Profile, Goal } from '@/types'
import { formatCurrency, getLevelName } from '@/lib/calculations'
import { getStoryIntro } from '@/lib/personalization'
import TabBar from '@/components/ui/TabBar'

type ToolItem = {
  href: string
  title: string
  body: string
  icon: LucideIcon
  tier: 'free' | 'plus'
}

const starterTools: ToolItem[] = [
  {
    href: '/app/check',
    title: 'Money check',
    body: 'Ask if a purchase fits today before you spend.',
    icon: Target,
    tier: 'free',
  },
  {
    href: '/app/upload',
    title: 'Import transactions',
    body: 'Bring in statements or receipts so the plan uses real spending.',
    icon: Import,
    tier: 'free',
  },
  {
    href: '/app/fixed',
    title: 'Fixed costs',
    body: 'Keep rent, bills, and subscriptions visible before daily spending.',
    icon: FileText,
    tier: 'free',
  },
  {
    href: '/app/mydata',
    title: 'My data',
    body: 'See the profile, logs, and benchmarks Sarathy uses.',
    icon: BarChart3,
    tier: 'free',
  },
]

const plusTools: ToolItem[] = [
  {
    href: '/app/future',
    title: 'Future you',
    body: 'See how today changes the next few months.',
    icon: CalendarClock,
    tier: 'plus',
  },
  {
    href: '/app/biases',
    title: 'Money psychology',
    body: 'Find patterns behind overspending, avoidance, and anxiety.',
    icon: Brain,
    tier: 'plus',
  },
  {
    href: '/app/insights',
    title: 'Financial DNA',
    body: 'Turn your real transaction history into a clearer money profile.',
    icon: Sparkles,
    tier: 'plus',
  },
  {
    href: '/app/remittance',
    title: 'Send money home',
    body: 'Plan support transfers with rate checks and family guardrails.',
    icon: Send,
    tier: 'plus',
  },
  {
    href: '/app/marketplace',
    title: 'Built for you',
    body: 'Offers and recommendations filtered for your setup.',
    icon: WalletCards,
    tier: 'plus',
  },
]

function ToolLink({ tool, locked }: { tool: ToolItem; locked: boolean }) {
  const Icon = tool.icon

  return (
    <Link
      href={locked ? '/app/profile/plus' : tool.href}
      className={`flex items-center justify-between gap-4 rounded-2xl border bg-white px-4 py-4 shadow-[0_8px_24px_rgba(30,10,46,0.04)] transition-colors hover:bg-cream/70 ${
        locked ? 'border-saffron/25' : 'border-line'
      }`}
    >
      <div className="flex min-w-0 items-center gap-3">
        <div className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl ${
          locked ? 'bg-saffron-soft text-saffron' : 'bg-cream text-plum'
        }`}>
          {locked ? <LockKeyhole className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-semibold text-ink">{tool.title}</p>
            {tool.tier === 'plus' && (
              <span className="inline-flex items-center gap-1 rounded-full bg-saffron-soft px-2 py-0.5 text-[10px] font-bold text-saffron">
                <Crown className="h-3 w-3" />
                Plus
              </span>
            )}
          </div>
          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-ink-3">{tool.body}</p>
        </div>
      </div>
      <ChevronRight className="h-4 w-4 flex-shrink-0 text-ink-3" />
    </Link>
  )
}

export default function StoryPage() {
  const router = useRouter()
  const supabase = createClient()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace('/app/login'); return }
      const [profileRes, goalsRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('goals').select('*').eq('user_id', user.id),
      ])
      if (profileRes.data) setProfile(profileRes.data as Profile)
      setGoals((goalsRes.data || []) as Goal[])
      setLoading(false)
    }
    load()
  }, [])

  if (loading || !profile) {
    return (
      <div className="min-h-dvh bg-cream flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-saffron border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const currency = profile.primary_currency || 'SGD'
  const intro = getStoryIntro(profile)
  const hasPlus = profile.plan_tier === 'plus'

  return (
    <div className="min-h-dvh bg-cream px-5 pb-24 pt-12 md:pb-12 md:pl-32 md:pr-8 lg:pl-36">
      <main className="mx-auto w-full max-w-5xl">
      <div className="mb-6">
        <h1 className="font-fraunces text-2xl font-semibold text-ink capitalize">{intro.title}</h1>
        <p className="text-ink-3 text-sm mt-1">{intro.subtitle}</p>
      </div>

      {/* Persona card */}
      <div className="bg-gradient-to-br from-saffron to-orange-600 rounded-2xl p-5 text-white mb-4">
        <div className="mb-3 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15">
            <Trophy className="h-5 w-5" />
          </div>
          <p className="text-xs font-medium uppercase tracking-wide opacity-75">Your financial persona</p>
        </div>
        <p className="font-fraunces text-xl font-semibold mb-1">The {getLevelName(profile.total_xp)}</p>
        <p className="text-xs opacity-75">{profile.total_xp} XP, Level {profile.level}</p>
      </div>

      <section className="mb-5">
        <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-saffron">Money tools</p>
            <h2 className="font-fraunces text-2xl font-semibold text-ink">Your tool suite</h2>
          </div>
          <p className="text-sm text-ink-3">
            Starter tools handle daily tracking. Plus tools handle deeper planning.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-3xl border border-line bg-white p-4 shadow-[0_10px_28px_rgba(30,10,46,0.04)]">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-bold text-plum">Starter tools</h3>
              <span className="rounded-full bg-mint px-2.5 py-1 text-xs font-bold text-safe">Included</span>
            </div>
            <div className="grid gap-2">
              {starterTools.map(tool => (
                <ToolLink key={tool.href} tool={tool} locked={false} />
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-saffron/25 bg-white p-4 shadow-[0_10px_28px_rgba(30,10,46,0.04)]">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-bold text-plum">Plus planning tools</h3>
              <span className="inline-flex items-center gap-1 rounded-full bg-saffron-soft px-2.5 py-1 text-xs font-bold text-saffron">
                <Crown className="h-3.5 w-3.5" />
                Plus
              </span>
            </div>
            <div className="grid gap-2">
              {plusTools.map(tool => (
                <ToolLink key={tool.href} tool={tool} locked={!hasPlus} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Goals */}
      <div className="mb-4">
        <p className="font-semibold text-ink text-sm mb-3">Your goals</p>
        <div className="flex flex-col gap-3">
          {goals.length === 0 ? (
            <div className="card text-center text-ink-3 text-sm py-6">
              <Target className="mx-auto mb-3 h-8 w-8 text-saffron" />
              No goals yet. Ask Sarathy to help you set one that fits your real month.
            </div>
          ) : (
            goals.map(goal => {
              const progress = goal.target_amount > 0
                ? Math.min(100, Math.round((goal.current_amount / goal.target_amount) * 100))
                : 0
              return (
                <div key={goal.id} className="card">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{goal.emoji}</span>
                      <p className="font-medium text-ink text-sm">{goal.name}</p>
                    </div>
                    <span className="text-xs font-semibold text-saffron">{progress}%</span>
                  </div>
                  <div className="meter-bar mb-2">
                    <div
                      className="meter-fill"
                      style={{ width: `${progress}%`, background: '#F97316' }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-ink-3">
                    <span>{formatCurrency(goal.current_amount, currency)}</span>
                    <span>{formatCurrency(goal.target_amount, currency)}</span>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Letter placeholder */}
      <div className="card border-2 border-dashed border-saffron/30">
        <div className="mb-2 flex items-center gap-2 text-saffron">
          <FileText className="h-4 w-4" />
          <p className="text-xs font-medium">Monthly letter</p>
        </div>
        <p className="text-ink-3 text-sm">
          Sarathy will write you a personal letter at the end of your first month.
          Come back then.
        </p>
      </div>
      </main>

      <TabBar active="story" />
    </div>
  )
}
