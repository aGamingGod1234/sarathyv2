'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Chrome, Eye, EyeOff, Mail, RotateCw, ShieldCheck } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import BrandLogo from '@/components/ui/BrandLogo'

type SignupStage = 'form' | 'verify'

function cleanOtp(value: string) {
  return value.replace(/\D/g, '').slice(0, 6)
}

export default function SignupPage() {
  const router = useRouter()
  const supabase = createClient()
  const [stage, setStage] = useState<SignupStage>('form')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [otp, setOtp] = useState('')
  const [cooldown, setCooldown] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (stage !== 'verify' || cooldown <= 0) return
    const timer = window.setTimeout(() => setCooldown(current => Math.max(0, current - 1)), 1000)
    return () => window.clearTimeout(timer)
  }, [cooldown, stage])

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (password !== confirmPassword) {
      setLoading(false)
      setError('Passwords do not match.')
      return
    }

    try {
      const { data, error } = await supabase.auth.signUp({ email, password, confirmPassword })
      if (error) throw error
      setStage('verify')
      setCooldown(data?.cooldownSeconds || 60)
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      })
      const payload = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(payload?.error || 'Could not verify email.')

      const login = await supabase.auth.signInWithPassword({ email, password })
      if (login.error) throw login.error

      router.replace('/app/onboarding')
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (cooldown > 0 || loading) return
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const payload = await res.json().catch(() => ({}))
      if (!res.ok) {
        if (payload?.cooldownSeconds) setCooldown(payload.cooldownSeconds)
        throw new Error(payload?.error || 'Could not send another code.')
      }
      setCooldown(payload?.cooldownSeconds || 60)
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
          <h1 className="mb-2 mt-8 font-fraunces text-3xl font-semibold text-ink">
            {stage === 'verify' ? 'Verify your email' : 'Create your account'}
          </h1>
          <p className="text-sm text-ink-3">
            {stage === 'verify'
              ? `Enter the 6 digit code sent to ${email}. It expires in 5 minutes.`
              : 'Create an account with email and start your setup.'}
          </p>
        </div>

        {stage === 'form' && (
          <>
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
            <p className="mb-4 text-center text-xs text-ink-3">Google sign-up is temporarily unavailable.</p>

            <div className="mb-4 flex items-center gap-3">
              <span className="h-px flex-1 bg-line" />
              <span className="flex items-center gap-1.5 text-xs font-medium text-ink-3">
                <Mail className="h-3.5 w-3.5" />
                or create with email
              </span>
              <span className="h-px flex-1 bg-line" />
            </div>
          </>
        )}

        <form onSubmit={stage === 'verify' ? handleVerify : handleSignup} className="flex flex-1 flex-col gap-4">
          {stage === 'form' ? (
            <>
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
                <label className="mb-2 block text-sm font-medium text-ink-3">Choose a password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="at least 8 characters"
                    className="input-field pr-12"
                    required
                    minLength={8}
                    autoComplete="new-password"
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

              <div>
                <label className="mb-2 block text-sm font-medium text-ink-3">Confirm your password</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="repeat your password"
                    className="input-field pr-12"
                    required
                    minLength={8}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(value => !value)}
                    className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-ink-3"
                    aria-label={showConfirmPassword ? 'Hide confirmed password' : 'Show confirmed password'}
                    aria-pressed={showConfirmPassword}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="rounded-2xl border border-saffron/20 bg-saffron-soft p-4">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="mt-0.5 h-5 w-5 flex-shrink-0 text-saffron" />
                  <p className="text-sm leading-relaxed text-ink">
                    Check your email for the Sarathy code. You can request another code after the cooldown.
                  </p>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-ink-3">6 digit code</label>
                <input
                  type="text"
                  value={otp}
                  onChange={e => setOtp(cleanOtp(e.target.value))}
                  placeholder="000000"
                  className="input-field text-center text-2xl font-semibold tracking-[0.35em]"
                  required
                  inputMode="numeric"
                  autoComplete="one-time-code"
                />
              </div>

              <button
                type="button"
                onClick={handleResend}
                disabled={cooldown > 0 || loading}
                className="btn-secondary flex items-center justify-center gap-2"
              >
                <RotateCw className="h-4 w-4" />
                {cooldown > 0 ? `Send again in ${cooldown}s` : 'Send code again'}
              </button>
            </>
          )}

          {error && (
            <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-danger" role="alert" aria-live="polite">
              {error}
              {error.toLowerCase().includes('already exists') && (
                <Link href="/app/login" className="mt-2 block font-semibold text-saffron">
                  Go to sign in
                </Link>
              )}
            </div>
          )}

          <div className="mt-auto pt-4">
            <button type="submit" className="btn-primary" disabled={loading || (stage === 'verify' && otp.length !== 6)}>
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  {stage === 'verify' ? 'Verifying' : 'Creating account'}
                </span>
              ) : stage === 'verify' ? 'Verify and continue' : 'Create with email'}
            </button>

            <p className="mt-4 text-center text-sm text-ink-3">
              Already have an account?{' '}
              <Link href="/app/login" className="font-medium text-saffron">Sign in</Link>
            </p>
          </div>
        </form>
      </main>
    </div>
  )
}
