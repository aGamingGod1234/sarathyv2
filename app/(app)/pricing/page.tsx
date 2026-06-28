'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Check,
  ChevronRight,
  Crown,
  Gem,
  Lock,
  MessageCircleHeart,
  ReceiptText,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { PLAN_DEFINITIONS, PLAN_FEATURES, getPlanDefinition } from '@/lib/plans'
import { getFirstName } from '@/lib/personalization'
import type { Profile } from '@/types'
import TabBar from '@/components/ui/TabBar'

const featureIcons = [MessageCircleHeart, ReceiptText, Sparkles, Gem, ShieldCheck]

export default function PricingPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [upgradeOpen, setUpgradeOpen] = useState(false)

  useEffect(() => {
    const supabase = createClient()

    const load = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.replace('/login')
          return
        }

        const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
        if (data) setProfile(data as Profile)
        setLoading(false)
      } catch (err) {
        console.error('Failed to load pricing profile:', err)
        router.replace('/login')
      }
    }

    load()
  }, [router])

  const currentPlan = getPlanDefinition(profile?.plan_tier)
  const first = getFirstName(profile)
  const planOptions = useMemo(() => [PLAN_DEFINITIONS.free, PLAN_DEFINITIONS.plus], [])

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-cream">
        <div className="h-8 w-8 rounded-full border-2 border-saffron border-t-transparent animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-cream pb-24">
      <div className="px-5 pt-12">
        <Link href="/profile" className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-ink-3">
          <ArrowLeft className="h-4 w-4" />
          Profile
        </Link>

        <div className="rounded-[1.75rem] bg-plum p-5 text-white">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-saffron">
              <Crown className="h-6 w-6 text-white" />
            </div>
            <div className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/75">
              Current: {currentPlan.shortName}
            </div>
          </div>
          <h1 className="font-fraunces text-3xl font-semibold leading-tight">
            Make Sarathy feel even more like it is built for {first}.
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-white/70">
            Starter keeps the daily loop simple. Plus is the paid layer for deeper memory, richer imports, future planning, and family-aware guardrails.
          </p>
        </div>
      </div>

      <div className="mt-5 px-5">
        <div className="grid gap-3">
          {planOptions.map(plan => {
            const isPlus = plan.tier === 'plus'
            const isCurrent = currentPlan.tier === plan.tier

            return (
              <div
                key={plan.tier}
                className={`rounded-[1.5rem] border p-4 shadow-sm ${
                  isPlus ? 'border-plum bg-white' : 'border-line bg-white'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      {isPlus ? <Crown className="h-5 w-5 text-plum" /> : <Gem className="h-5 w-5 text-saffron" />}
                      <p className="font-semibold text-ink">{plan.name}</p>
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-ink-3">{plan.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-fraunces text-2xl font-semibold text-ink">{plan.price}</p>
                    <p className="text-xs text-ink-3">{plan.cadence}</p>
                  </div>
                </div>

                <div className="mt-4 grid gap-2">
                  {plan.highlights.map(item => (
                    <div key={item} className="flex items-center gap-2 text-xs text-ink-3">
                      <Check className="h-3.5 w-3.5 text-safe" />
                      {item}
                    </div>
                  ))}
                </div>

                {isPlus ? (
                  <button
                    type="button"
                    onClick={() => setUpgradeOpen(true)}
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-plum px-4 py-3 text-sm font-semibold text-white"
                  >
                    {isCurrent ? 'Manage Plus' : 'Prepare Plus upgrade'}
                    <ChevronRight className="h-4 w-4" />
                  </button>
                ) : (
                  <Link
                    href="/home"
                    className="mt-4 flex w-full items-center justify-center rounded-2xl border border-line bg-cream px-4 py-3 text-sm font-semibold text-ink"
                  >
                    {isCurrent ? 'Your current plan' : 'Use Starter'}
                  </Link>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div className="mt-6 px-5">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="font-fraunces text-xl font-semibold text-ink">What becomes paid</p>
            <p className="mt-1 text-xs text-ink-3">Clear limits now, server-side enforcement later.</p>
          </div>
          <Lock className="h-5 w-5 text-ink-3" />
        </div>

        <div className="grid gap-3">
          {PLAN_FEATURES.map((feature, index) => {
            const Icon = featureIcons[index] || Sparkles
            return (
              <div key={feature.id} className="card">
                <div className="mb-3 flex items-start gap-3">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-saffron-soft text-saffron">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-ink">{feature.title}</p>
                    <p className="mt-1 text-xs leading-relaxed text-ink-3">{feature.description}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-xl bg-cream p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-3">Starter</p>
                    <p className="mt-1 text-xs leading-relaxed text-ink">{feature.free}</p>
                  </div>
                  <div className="rounded-xl bg-plum p-3 text-white">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-white/50">Plus</p>
                    <p className="mt-1 text-xs leading-relaxed text-white/80">{feature.plus}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="mt-6 px-5">
        <div className="rounded-2xl border border-line bg-white p-4">
          <p className="text-sm font-semibold text-ink">Billing note</p>
          <p className="mt-1 text-xs leading-relaxed text-ink-3">
            This screen defines the paid tier and upgrade path. Real payment should be connected through a server-verified billing provider before Plus unlocks features.
          </p>
        </div>
      </div>

      {upgradeOpen && (
        <>
          <div className="overlay" onClick={() => setUpgradeOpen(false)} />
          <div className="bottom-sheet">
            <div className="sheet-handle" />
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-plum text-white">
                <Crown className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-ink">Plus is ready for billing integration</p>
                <p className="text-xs text-ink-3">No charge happens in this build.</p>
              </div>
            </div>
            <p className="text-sm leading-relaxed text-ink-3">
              The next implementation step is Stripe or another billing provider. After checkout succeeds, store a server-trusted plan status and gate Plus features from the server.
            </p>
            <button
              type="button"
              onClick={() => setUpgradeOpen(false)}
              className="btn-primary mt-5"
            >
              Got it
            </button>
          </div>
        </>
      )}

      <TabBar active="profile" />
    </div>
  )
}
