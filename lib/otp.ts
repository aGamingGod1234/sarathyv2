import crypto from 'crypto'
import { prisma } from '@/lib/prisma'

export type OtpPurpose = 'email-verification' | 'password-reset'

export const OTP_TTL_MS = 5 * 60 * 1000
export const OTP_COOLDOWN_MS = 60 * 1000

type IssueOtpInput = {
  email: string
  purpose: OtpPurpose
}

type VerifyOtpInput = IssueOtpInput & {
  otp: string
  consume?: boolean
}

export class OtpCooldownError extends Error {
  constructor(readonly cooldownSeconds: number) {
    super(`Please wait ${cooldownSeconds} seconds before requesting another code.`)
    this.name = 'OtpCooldownError'
  }
}

export function normalizeEmail(email: unknown) {
  return String(email || '').trim().toLowerCase()
}

export function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function otpSecret() {
  return process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET || 'sarathy-local-otp-secret'
}

function identifierFor(email: string, purpose: OtpPurpose) {
  return `${purpose}:${email}`
}

function hashOtp(identifier: string, otp: string) {
  return crypto
    .createHmac('sha256', otpSecret())
    .update(`${identifier}:${otp}`)
    .digest('hex')
}

function generateOtp() {
  return crypto.randomInt(0, 1_000_000).toString().padStart(6, '0')
}

function secondsUntil(ms: number) {
  return Math.max(0, Math.ceil(ms / 1000))
}

function sentAtFromExpires(expires: Date) {
  return expires.getTime() - OTP_TTL_MS
}

async function sendOtpEmail(email: string, otp: string, purpose: OtpPurpose) {
  const isPasswordReset = purpose === 'password-reset'
  const subject = isPasswordReset ? 'Your Sarathy reset code' : 'Your Sarathy verification code'
  const intro = isPasswordReset
    ? 'Use this code to reset your Sarathy password.'
    : 'Use this code to verify your Sarathy account.'
  const text = `${intro}\n\n${otp}\n\nThis code expires in 5 minutes.`
  const html = `
    <div style="font-family:Arial,sans-serif;color:#1C0A00;line-height:1.5">
      <p>${intro}</p>
      <p style="font-size:28px;font-weight:700;letter-spacing:6px;margin:18px 0">${otp}</p>
      <p>This code expires in 5 minutes.</p>
    </div>
  `

  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.info(`[Sarathy OTP] ${purpose} code for ${email}: ${otp}`)
    return
  }

  const from = process.env.OTP_EMAIL_FROM || process.env.RESEND_FROM || 'Sarathy <onboarding@resend.dev>'
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: email,
      subject,
      text,
      html,
    }),
  })

  if (!response.ok) {
    const detail = await response.text().catch(() => '')
    console.error('Failed to send Sarathy OTP:', detail)
    throw new Error('Could not send verification code.')
  }
}

export async function issueOtp({ email, purpose }: IssueOtpInput) {
  const normalizedEmail = normalizeEmail(email)
  const identifier = identifierFor(normalizedEmail, purpose)
  const now = new Date()

  await prisma.verificationToken.deleteMany({
    where: { expires: { lt: now } },
  })

  const latestToken = await prisma.verificationToken.findFirst({
    where: { identifier },
    orderBy: { expires: 'desc' },
  })

  if (latestToken) {
    const cooldownEndsAt = sentAtFromExpires(latestToken.expires) + OTP_COOLDOWN_MS
    const cooldownRemainingMs = cooldownEndsAt - now.getTime()
    if (cooldownRemainingMs > 0) {
      throw new OtpCooldownError(secondsUntil(cooldownRemainingMs))
    }
  }

  const otp = generateOtp()
  const expires = new Date(now.getTime() + OTP_TTL_MS)

  await prisma.verificationToken.deleteMany({ where: { identifier } })
  await prisma.verificationToken.create({
    data: {
      identifier,
      token: hashOtp(identifier, otp),
      expires,
    },
  })

  await sendOtpEmail(normalizedEmail, otp, purpose)

  return {
    expiresAt: expires.toISOString(),
    cooldownSeconds: secondsUntil(OTP_COOLDOWN_MS),
  }
}

export async function verifyOtp({ email, purpose, otp, consume = true }: VerifyOtpInput) {
  const normalizedEmail = normalizeEmail(email)
  const cleanOtp = String(otp || '').replace(/\D/g, '')
  if (!/^\d{6}$/.test(cleanOtp)) {
    return { ok: false as const, reason: 'invalid' as const }
  }

  const identifier = identifierFor(normalizedEmail, purpose)
  const token = hashOtp(identifier, cleanOtp)
  const record = await prisma.verificationToken.findUnique({
    where: { identifier_token: { identifier, token } },
  })

  if (!record) {
    return { ok: false as const, reason: 'invalid' as const }
  }

  if (record.expires.getTime() <= Date.now()) {
    await prisma.verificationToken.deleteMany({ where: { identifier } })
    return { ok: false as const, reason: 'expired' as const }
  }

  if (consume) {
    await prisma.verificationToken.deleteMany({ where: { identifier } })
  }

  return { ok: true as const, expiresAt: record.expires }
}

function signPayload(payload: string) {
  return crypto.createHmac('sha256', otpSecret()).update(payload).digest('base64url')
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left)
  const rightBuffer = Buffer.from(right)
  return leftBuffer.length === rightBuffer.length && crypto.timingSafeEqual(leftBuffer, rightBuffer)
}

export function createPasswordResetToken(email: string, expiresAt: Date) {
  const payload = Buffer.from(JSON.stringify({
    email: normalizeEmail(email),
    purpose: 'password-reset',
    exp: expiresAt.getTime(),
  })).toString('base64url')

  return `${payload}.${signPayload(payload)}`
}

export function verifyPasswordResetToken(token: string, email: string) {
  const [payload, signature] = String(token || '').split('.')
  if (!payload || !signature || !safeEqual(signature, signPayload(payload))) return false

  try {
    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as {
      email?: string
      purpose?: string
      exp?: number
    }

    return decoded.purpose === 'password-reset'
      && decoded.email === normalizeEmail(email)
      && typeof decoded.exp === 'number'
      && decoded.exp > Date.now()
  } catch {
    return false
  }
}
