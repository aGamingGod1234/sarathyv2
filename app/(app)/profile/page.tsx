'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  BarChart3,
  ChevronRight,
  Gem,
  Globe2,
  HeartHandshake,
  KeyRound,
  LogOut,
  ShieldCheck,
  Sparkles,
  UserRound,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { Profile } from '@/types'
import { getLevelName, formatCurrency } from '@/lib/calculations'
import { getInitials, getProfileSummary } from '@/lib/personalization'
import TabBar from '@/components/ui/TabBar'
import CurrencySelector from '@/components/ui/CurrencySelector'

export default function ProfilePage() {
  const router = useRouter()
  const supabase = createClient()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [passwordOpen, setPasswordOpen] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')

  const loadProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.replace('/login'); return }
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    if (data) setProfile(data as Profile)
    setLoading(false)
  }

  useEffect(() => { loadProfile() }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.replace('/login')
  }

  const handleCurrencyChange = async (code: string) => {
    if (!profile) return
    await supabase.from('profiles').update({ primary_currency: code }).eq('id', profile.id)
    setProfile(prev => prev ? { ...prev, primary_currency: code } : prev)
  }

  const handleChangePassword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (passwordSaving) return
    setPasswordSaving(true)
    setPasswordError('')
    setPasswordSuccess('')

    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      })
      const data = await response.json()

      if (!response.ok) throw new Error(data.error || 'Could not change password.')

      setPasswordSuccess('Password changed. Please sign in again.')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      window.setTimeout(async () => {
        await supabase.auth.signOut()
        router.replace('/login')
      }, 900)
    } catch (err: any) {
      setPasswordError(err.message || 'Could not change password.')
    } finally {
      setPasswordSaving(false)
    }
  }

  if (loading || !profile) {
    return (
      <div className="min-h-dvh bg-cream flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-saffron border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const summary = getProfileSummary(profile)
  const details: Array<{ label: string; value: string; icon: LucideIcon }> = [
    { label: 'Companion vibe', value: profile.companion_vibe?.replace(/_/g, ' ') || 'calm mentor', icon: Sparkles },
    { label: 'Home country', value: profile.home_country || 'Not set', icon: Globe2 },
    { label: 'Responsible for', value: profile.responsible_for || 'Not set', icon: HeartHandshake },
    { label: 'Money fear', value: profile.money_fear || 'Not set', icon: ShieldCheck },
  ]

  return (
    <div className="min-h-dvh bg-cream pb-28 px-5 pt-12 md:pb-12 md:pl-32 md:pr-8 lg:pl-36">
      <main className="mx-auto w-full max-w-5xl">
      <div className="mb-5">
        <h1 className="font-fraunces text-2xl font-semibold text-ink mb-1">{summary.title}</h1>
        <p className="text-sm text-ink-3">{summary.subtitle}</p>
      </div>

      <div className="bg-white rounded-2xl p-5 shadow-sm mb-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-saffron-soft rounded-full flex items-center justify-center text-sm font-bold text-saffron">
            {getInitials(profile)}
          </div>
          <div>
            <p className="font-semibold text-ink">{profile.name || 'Your Sarathy profile'}</p>
            <p className="text-ink-3 text-xs">{getLevelName(profile.total_xp)}</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center">
            <p className="font-fraunces text-xl font-semibold text-ink">{profile.daily_login_streak}</p>
            <p className="text-xs text-ink-3">day streak</p>
          </div>
          <div className="text-center">
            <p className="font-fraunces text-xl font-semibold text-ink">{profile.total_xp}</p>
            <p className="text-xs text-ink-3">total XP</p>
          </div>
          <div className="text-center">
            <p className="font-fraunces text-xl font-semibold text-ink">
              {profile.planning_amount ? formatCurrency(profile.planning_amount, profile.primary_currency) : '-'}
            </p>
            <p className="text-xs text-ink-3">monthly plan</p>
          </div>
        </div>
      </div>

      <div className="card mb-4 border-l-4 border-plum">
        <div className="flex items-start gap-3">
          <UserRound className="mt-0.5 h-5 w-5 flex-shrink-0 text-plum" />
          <div>
            <p className="text-sm font-semibold text-ink">How Sarathy personalizes this app</p>
            <p className="mt-1 text-xs leading-relaxed text-ink-3">{summary.note}</p>
          </div>
        </div>
      </div>

      <div className="card mb-4">
        <p className="text-xs font-medium text-ink-3 uppercase tracking-wide mb-3">
          Primary currency
        </p>
        <CurrencySelector
          value={profile.primary_currency || 'SGD'}
          onChange={handleCurrencyChange}
        />
        <p className="text-xs text-ink-3 mt-2">
          Your safe-to-spend and all expenses display in this currency. You can log in any currency and we convert automatically.
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-4">
        {details.map((item) => {
          const Icon = item.icon
          return (
          <div key={item.label} className="flex items-center justify-between px-4 py-3.5 border-b border-cream last:border-0">
            <div className="flex items-center gap-2">
              <Icon className="h-4 w-4 text-saffron" />
              <span className="text-sm text-ink">{item.label}</span>
            </div>
            <span className="text-sm text-ink-3 capitalize">{item.value}</span>
          </div>
          )
        })}
      </div>

      <div className="flex flex-col gap-3 mb-4">
        <Link href="/mydata" className="card flex items-center justify-between active:opacity-70">
          <div className="flex items-center gap-3">
            <BarChart3 className="h-5 w-5 text-plum" />
            <div>
              <p className="font-medium text-ink text-sm">My data</p>
              <p className="text-ink-3 text-xs">Profile, behaviour, and benchmarks</p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-ink-3" />
        </Link>
        <Link href="/profile/plus" className="card flex items-center justify-between active:opacity-70">
          <div className="flex items-center gap-3">
            <Gem className="h-5 w-5 text-plum" />
            <div>
              <p className="font-medium text-ink text-sm">Sarathy Plus</p>
              <p className="text-ink-3 text-xs">Memory, imports, reports, and deeper planning</p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-ink-3" />
        </Link>
      </div>

      <div className="card mb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <KeyRound className="mt-0.5 h-5 w-5 flex-shrink-0 text-plum" />
            <div>
              <p className="text-sm font-semibold text-ink">Account & security</p>
              <p className="mt-1 text-xs leading-relaxed text-ink-3">
                Change your password here, or use the OTP reset flow if you do not know the current one.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setPasswordOpen(current => !current)}
            className="flex-shrink-0 rounded-xl border border-line px-3 py-2 text-xs font-semibold text-ink"
          >
            {passwordOpen ? 'Close' : 'Change'}
          </button>
        </div>

        {passwordOpen && (
          <form onSubmit={handleChangePassword} className="mt-4 grid gap-3 page-enter">
            <input
              type="password"
              value={currentPassword}
              onChange={event => setCurrentPassword(event.target.value)}
              placeholder="Current password"
              className="input-field"
              autoComplete="current-password"
            />
            <input
              type="password"
              value={newPassword}
              onChange={event => setNewPassword(event.target.value)}
              placeholder="New password"
              className="input-field"
              autoComplete="new-password"
            />
            <input
              type="password"
              value={confirmPassword}
              onChange={event => setConfirmPassword(event.target.value)}
              placeholder="Confirm new password"
              className="input-field"
              autoComplete="new-password"
            />
            {passwordError && <p className="text-xs font-medium text-danger">{passwordError}</p>}
            {passwordSuccess && <p className="text-xs font-medium text-safe">{passwordSuccess}</p>}
            <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
              <button type="submit" className="btn-primary" disabled={passwordSaving}>
                {passwordSaving ? 'Changing...' : 'Save new password'}
              </button>
              <Link href="/forgot-password" className="btn-secondary text-center">
                Forgot current password
              </Link>
            </div>
          </form>
        )}
      </div>

      <button
        onClick={handleSignOut}
        className="flex w-full items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-medium text-danger bg-red-50 border border-red-100"
      >
        <LogOut className="h-4 w-4" />
        Sign out
      </button>
      </main>

      <TabBar active="profile" />
    </div>
  )
}
