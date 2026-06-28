'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, KeyRound, Mail, RotateCw, ShieldCheck } from 'lucide-react'

type ResetStage = 'request' | 'verify' | 'reset'

function cleanOtp(value: string) {
  return value.replace(/\D/g, '').slice(0, 6)
}

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [stage, setStage] = useState<ResetStage>('request')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [resetToken, setResetToken] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [cooldown, setCooldown] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (stage === 'request' || cooldown <= 0) return
    const timer = window.setTimeout(() => setCooldown(current => Math.max(0, current - 1)), 1000)
    return () => window.clearTimeout(timer)
  }, [cooldown, stage])

  const requestCode = async () => {
    const res = await fetch('/api/auth/forgot-password/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    const payload = await res.json().catch(() => ({}))
    if (!res.ok) {
      if (payload?.cooldownSeconds) setCooldown(payload.cooldownSeconds)
      throw new Error(payload?.error || 'Could not send reset code.')
    }
    setCooldown(payload?.cooldownSeconds || 60)
  }

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      await requestCode()
      setStage('verify')
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (cooldown > 0 || loading) return
    setLoading(true)
    setError('')

    try {
      await requestCode()
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
      const res = await fetch('/api/auth/forgot-password/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      })
      const payload = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(payload?.error || 'Could not verify reset code.')
      setResetToken(payload.resetToken)
      setStage('reset')
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (password !== confirmPassword) {
      setLoading(false)
      setError('Passwords do not match.')
      return
    }

    try {
      const res = await fetch('/api/auth/forgot-password/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, resetToken, password, confirmPassword }),
      })
      const payload = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(payload?.error || 'Could not reset password.')
      router.replace('/login')
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
      setLoading(false)
    }
  }

  const title = stage === 'request'
    ? 'Reset your password'
    : stage === 'verify'
      ? 'Enter your reset code'
      : 'Create a new password'

  return (
    <div className="min-h-dvh bg-white">
      <main className="mx-auto flex min-h-dvh max-w-[480px] flex-col bg-white px-6 pb-8 pt-14">
        <div className="mb-10">
          <p className="font-fraunces text-4xl font-semibold text-plum">Sarathy</p>
          <h1 className="mb-2 mt-8 font-fraunces text-3xl font-semibold text-ink">{title}</h1>
          <p className="text-sm text-ink-3">
            {stage === 'request'
              ? 'We will send a 6 digit reset code that is valid for 5 minutes.'
              : stage === 'verify'
                ? `Use the 6 digit code sent to ${email}.`
                : 'Set the password you want to use from now on.'}
          </p>
        </div>

        <form
          onSubmit={stage === 'request' ? handleRequest : stage === 'verify' ? handleVerify : handleReset}
          className="flex flex-1 flex-col gap-4"
        >
          {stage === 'request' && (
            <div>
              <label className="mb-2 block text-sm font-medium text-ink-3">Email</label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-3" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@email.com"
                  className="input-field pl-11"
                  required
                  autoComplete="email"
                />
              </div>
            </div>
          )}

          {stage === 'verify' && (
            <>
              <div className="rounded-2xl border border-saffron/20 bg-saffron-soft p-4">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="mt-0.5 h-5 w-5 flex-shrink-0 text-saffron" />
                  <p className="text-sm leading-relaxed text-ink">
                    The code expires in 5 minutes. You can request another after the cooldown.
                  </p>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-ink-3">6 digit reset code</label>
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

          {stage === 'reset' && (
            <>
              <div>
                <label className="mb-2 block text-sm font-medium text-ink-3">New password</label>
                <div className="relative">
                  <KeyRound className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-3" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="at least 8 characters"
                    className="input-field pl-11 pr-12"
                    required
                    minLength={8}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(value => !value)}
                    className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-ink-3"
                    aria-label={showPassword ? 'Hide new password' : 'Show new password'}
                    aria-pressed={showPassword}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-ink-3">Confirm new password</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="repeat your new password"
                    className="input-field pr-12"
                    required
                    minLength={8}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(value => !value)}
                    className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-ink-3"
                    aria-label={showConfirmPassword ? 'Hide confirmed new password' : 'Show confirmed new password'}
                    aria-pressed={showConfirmPassword}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </>
          )}

          {error && (
            <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-danger" role="alert" aria-live="polite">
              {error}
            </div>
          )}

          <div className="mt-auto pt-4">
            <button
              type="submit"
              className="btn-primary"
              disabled={loading || (stage === 'verify' && otp.length !== 6)}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  {stage === 'request' ? 'Sending code' : stage === 'verify' ? 'Checking code' : 'Saving password'}
                </span>
              ) : stage === 'request' ? 'Send reset code' : stage === 'verify' ? 'Continue' : 'Reset password'}
            </button>

            <p className="mt-4 text-center text-sm text-ink-3">
              Remembered it?{' '}
              <Link href="/login" className="font-medium text-saffron">Back to sign in</Link>
            </p>
          </div>
        </form>
      </main>
    </div>
  )
}
