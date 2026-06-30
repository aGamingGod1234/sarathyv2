import { prisma } from '@/lib/prisma'

export type SecurityAttemptScope =
  | 'otp:email-verification'
  | 'otp:password-reset'
  | 'auth:credentials'
  | 'circle:join'

type SecurityAttemptPolicy = {
  maxAttempts: number
  windowMs: number
  lockoutMs: number
}

export const SECURITY_ATTEMPT_POLICIES: Record<SecurityAttemptScope, SecurityAttemptPolicy> = {
  'otp:email-verification': {
    maxAttempts: 5,
    windowMs: 5 * 60 * 1000,
    lockoutMs: 15 * 60 * 1000,
  },
  'otp:password-reset': {
    maxAttempts: 5,
    windowMs: 5 * 60 * 1000,
    lockoutMs: 15 * 60 * 1000,
  },
  'auth:credentials': {
    maxAttempts: 10,
    windowMs: 15 * 60 * 1000,
    lockoutMs: 15 * 60 * 1000,
  },
  'circle:join': {
    maxAttempts: 8,
    windowMs: 15 * 60 * 1000,
    lockoutMs: 30 * 60 * 1000,
  },
}

export class SecurityAttemptLimitError extends Error {
  constructor(readonly retryAfterSeconds: number) {
    super('Too many attempts. Try again later.')
    this.name = 'SecurityAttemptLimitError'
  }
}

function attemptPolicy(scope: SecurityAttemptScope) {
  return SECURITY_ATTEMPT_POLICIES[scope]
}

function attemptKey(key: string) {
  return String(key || 'unknown').trim().toLowerCase().slice(0, 240) || 'unknown'
}

function secondsUntil(date: Date, now = Date.now()) {
  return Math.max(1, Math.ceil((date.getTime() - now) / 1000))
}

function isFresh(lastAttemptAt: Date, windowMs: number, now = Date.now()) {
  return now - lastAttemptAt.getTime() <= windowMs
}

export async function assertSecurityAttemptAllowed(scope: SecurityAttemptScope, key: string) {
  const policy = attemptPolicy(scope)
  const cleanKey = attemptKey(key)
  const now = Date.now()

  const attempt = await prisma.securityAttempt.findUnique({
    where: { scope_key: { scope, key: cleanKey } },
  })

  if (!attempt) return

  if (attempt.locked_until && attempt.locked_until.getTime() > now) {
    throw new SecurityAttemptLimitError(secondsUntil(attempt.locked_until, now))
  }

  if (!isFresh(attempt.last_attempt_at, policy.windowMs, now)) {
    await prisma.securityAttempt.deleteMany({
      where: { scope, key: cleanKey },
    })
  }
}

export async function recordSecurityAttemptFailure(scope: SecurityAttemptScope, key: string) {
  const policy = attemptPolicy(scope)
  const cleanKey = attemptKey(key)
  const now = new Date()
  const existing = await prisma.securityAttempt.findUnique({
    where: { scope_key: { scope, key: cleanKey } },
  })

  if (existing?.locked_until && existing.locked_until.getTime() > now.getTime()) {
    throw new SecurityAttemptLimitError(secondsUntil(existing.locked_until, now.getTime()))
  }

  const count = existing && isFresh(existing.last_attempt_at, policy.windowMs, now.getTime())
    ? existing.count + 1
    : 1
  const lockedUntil = count >= policy.maxAttempts
    ? new Date(now.getTime() + policy.lockoutMs)
    : null

  await prisma.securityAttempt.upsert({
    where: { scope_key: { scope, key: cleanKey } },
    update: {
      count,
      locked_until: lockedUntil,
      last_attempt_at: now,
    },
    create: {
      scope,
      key: cleanKey,
      count,
      locked_until: lockedUntil,
      last_attempt_at: now,
    },
  })

  if (lockedUntil) {
    throw new SecurityAttemptLimitError(secondsUntil(lockedUntil, now.getTime()))
  }

  return {
    count,
    remainingAttempts: Math.max(0, policy.maxAttempts - count),
  }
}

export async function clearSecurityAttempts(scope: SecurityAttemptScope, key: string) {
  await prisma.securityAttempt.deleteMany({
    where: {
      scope,
      key: attemptKey(key),
    },
  })
}
