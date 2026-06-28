'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Chrome, Eye, EyeOff, Mail } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import BrandLogo from '@/components/ui/BrandLogo'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      router.replace('/app/home')
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-dvh bg-white">
      <main className="mx-auto flex min-h-dvh max-w-[480px] flex-col bg-white px-6 pb-8 pt-14">
        <div className="mb-10">
          <BrandLogo
            markClassName="h-12 w-12"
            wordmarkClassName="font-fraunces text-4xl font-semibold text-plum"
          />
          <h1 className="mb-2 mt-8 font-fraunces text-3xl font-semibold text-ink">Welcome back</h1>
          <p className="text-sm text-ink-3">Sign in with email. Sarathy will bring you back to your money loop.</p>
        </div>

        <button
          type="button"
          disabled
          className="mb-2 flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-2xl border border-line bg-slate-50 px-4 py-3.5 text-sm font-semibold text-ink-3 opacity-70 shadow-none"
        >
          <Chrome className="h-4 w-4 text-ink-3" />
          Continue with Google
          <span className="rounded-full bg-ink-2/10 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-ink-3">
            Paused
          </span>
        </button>
        <p className="mb-4 text-center text-xs text-ink-3">Google sign-in is temporarily unavailable.</p>

        <div className="mb-4 flex items-center gap-3">
          <span className="h-px flex-1 bg-line" />
          <span className="flex items-center gap-1.5 text-xs font-medium text-ink-3">
            <Mail className="h-3.5 w-3.5" />
            or sign in with email
          </span>
          <span className="h-px flex-1 bg-line" />
        </div>

        <form onSubmit={handleLogin} className="flex flex-1 flex-col gap-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-ink-3">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@email.com"
              className="input-field"
              required
              autoComplete="email"
            />
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between gap-3">
              <label className="block text-sm font-medium text-ink-3">Password</label>
              <Link href="/app/forgot-password" className="text-sm font-medium text-saffron">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="password"
                className="input-field pr-12"
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(value => !value)}
                className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-ink-3"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                aria-pressed={showPassword}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-danger" role="alert" aria-live="polite">
              {error}
            </div>
          )}

          <div className="mt-auto pt-4">
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-5 w-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  Signing in
                </span>
              ) : 'Sign in with email'}
            </button>

            <p className="mt-4 text-center text-sm text-ink-3">
              New here?{' '}
              <Link href="/app/signup" className="font-medium text-saffron">
                Create your account
              </Link>
            </p>
          </div>
        </form>
      </main>
    </div>
  )
}
