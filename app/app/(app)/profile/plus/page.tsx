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
} from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { PLAN_DEFINITIONS, PLAN_FEATURES, getPlanDefinition } from '@/lib/plans'
import { getFirstName } from '@/lib/personalization'
import type { Profile } from '@/types'
import TabBar from '@/components/ui/TabBar'

export default function ProfilePlusPage() {
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
          router.replace('/app/login')
          return
        }

        const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
        if (data) setProfile(data as Profile)
        setLoading(false)
      } catch (err) {
        console.error('Failed to load Plus profile:', err)
        router.replace('/app/login')
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
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-saffron border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-cream pb-28 px-5 pt-12 md:pb-12 md:pl-32 md:pr-8 lg:pl-36">
      <main className="mx-auto w-full max-w-6xl">
        <Link href="/app/profile" className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-ink-3">
          <ArrowLeft className="h-4 w-4" />
          Profile
        </Link>

        <section className="grid gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(420px,1.1fr)]">
          <div className="rounded-[1.75rem] bg-plum p-5 text-white lg:p-7">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-saffron">
                <Crown className="h-6 w-6 text-white" />
              </div>
              <div className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/75">
                Current: {currentPlan.shortName}
              </div>
            </div>
            <h1 className="font-fraunces text-4xl font-semibold leading-tight">
              Sarathy Plus
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-white/72">
              More memory, better plans, and fewer money surprises for {first}. Starter covers the daily loop. Plus is for deeper planning when you want Sarathy to remember more context.
            </p>
            <div className="mt-6 rounded-2xl border border-white/12 bg-white/8 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-white/50">Trust basics</p>
              <div className="mt-3 grid gap-2 text-sm text-white/75">
                <p>Sarathy never moves money for you.</p>
                <p>Your data stays yours.</p>
                <p>Billing is not active in this preview build.</p>
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {planOptions.map(plan => {
              const isPlus = plan.tier === 'plus'
              const isCurrent = currentPlan.tier === plan.tier

              return (
                <div
                  key={plan.tier}
                  className={`rounded-[1.5rem] border bg-white p-4 shadow-sm ${
                    isPlus ? 'border-plum' : 'border-line'
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
                      {isCurrent ? 'Manage Plus' : 'Join Plus waitlist'}
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  ) : (
                    <Link
                      href="/app/home"
                      className="mt-4 flex w-full items-center justify-center rounded-2xl border border-line bg-cream px-4 py-3 text-sm font-semibold text-ink"
                    >
                      {isCurrent ? 'Your current plan' : 'Use Starter'}
                    </Link>
                  )}
                </div>
              )
            })}
          </div>
        </section>

        <section className="mt-6">
          <div className="mb-3">
            <p className="font-fraunces text-2xl font-semibold text-ink">What Plus unlocks</p>
            <p className="mt-1 text-sm text-ink-3">
              Starter keeps today clear. Plus adds depth when your month has more moving parts.
            </p>
          </div>

          <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-[0_8px_24px_rgba(30,10,46,0.04)]">
            <div className="hidden grid-cols-[1.2fr_0.9fr_0.9fr] gap-4 border-b border-line bg-cream px-5 py-3 text-xs font-semibold uppercase tracking-wide text-ink-3 md:grid">
              <span>Feature</span>
              <span>Starter</span>
              <span>Plus</span>
            </div>
            {PLAN_FEATURES.map(feature => (
              <div
                key={feature.id}
                className="grid gap-3 border-b border-cream px-5 py-4 last:border-0 md:grid-cols-[1.2fr_0.9fr_0.9fr] md:gap-4"
              >
                <div>
                  <p className="text-sm font-semibold text-ink">{feature.title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-ink-3">{feature.description}</p>
                </div>
                <div>
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-ink-3 md:hidden">Starter</p>
                  <p className="text-sm leading-relaxed text-ink">{feature.free}</p>
                </div>
                <div>
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-ink-3 md:hidden">Plus</p>
                  <p className="text-sm font-medium leading-relaxed text-plum">{feature.plus}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

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
                  <p className="font-semibold text-ink">Plus waitlist noted</p>
                  <p className="text-xs text-ink-3">No charge happens in this build.</p>
                </div>
              </div>
              <p className="text-sm leading-relaxed text-ink-3">
                When billing is connected, Plus will use a server-verified subscription before unlocking paid features.
              </p>
              <button
                type="button"
                onClick={() => setUpgradeOpen(false)}
                className="btn-primary mt-5"
              >
                Done
              </button>
            </div>
          </>
        )}
      </main>

      <TabBar active="profile" />
    </div>
  )
}
