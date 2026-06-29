import crypto from 'crypto'
import { prisma } from '@/lib/prisma'

export type OtpPurpose = 'email-verification' | 'password-reset'

export const OTP_TTL_MS = 5 * 60 * 1000
export const OTP_COOLDOWN_MS = 60 * 1000

export type OtpDeliveryErrorCode =
  | 'OTP_EMAIL_NOT_CONFIGURED'
  | 'OTP_FROM_DOMAIN_RESTRICTED'
  | 'OTP_FROM_DOMAIN_UNVERIFIED'
  | 'OTP_INVALID_SENDER'
  | 'OTP_INVALID_RECIPIENT'
  | 'OTP_EMAIL_PROVIDER_AUTH_FAILED'
  | 'OTP_EMAIL_REQUEST_BLOCKED'
  | 'OTP_EMAIL_RATE_LIMITED'
  | 'OTP_EMAIL_QUOTA_EXCEEDED'
  | 'OTP_EMAIL_PROVIDER_UNAVAILABLE'
  | 'OTP_DELIVERY_FAILED'

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

type OtpDeliveryErrorDetails = {
  message: string
  suggestion: string
  status: number
}

const OTP_DELIVERY_ERROR_DETAILS: Record<OtpDeliveryErrorCode, OtpDeliveryErrorDetails> = {
  OTP_EMAIL_NOT_CONFIGURED: {
    message: 'Email verification is not configured on the server.',
    suggestion: 'Set RESEND_API_KEY and OTP_EMAIL_FROM on the app service before accepting email sign-ups.',
    status: 503,
  },
  OTP_FROM_DOMAIN_RESTRICTED: {
    message: 'Email verification is not configured for public sign-ups yet.',
    suggestion: 'Verify a sending domain in Resend, then set OTP_EMAIL_FROM to an address on that domain. Do not use onboarding@resend.dev for public users.',
    status: 503,
  },
  OTP_FROM_DOMAIN_UNVERIFIED: {
    message: 'Email verification is using a sender domain that is not verified.',
    suggestion: 'Finish domain verification in Resend or change OTP_EMAIL_FROM to an already verified sender.',
    status: 503,
  },
  OTP_INVALID_SENDER: {
    message: 'Email verification is using an invalid sender address.',
    suggestion: 'Set OTP_EMAIL_FROM in the format "Sarathy <verify@your-verified-domain.com>".',
    status: 503,
  },
  OTP_INVALID_RECIPIENT: {
    message: 'Could not send the verification code to that email address.',
    suggestion: 'Check the email address for typos. If it looks right, try a different address or contact support.',
    status: 400,
  },
  OTP_EMAIL_PROVIDER_AUTH_FAILED: {
    message: 'Email verification could not authenticate with the email provider.',
    suggestion: 'Check that RESEND_API_KEY is present, active, and belongs to the Resend account that owns the sender domain.',
    status: 503,
  },
  OTP_EMAIL_REQUEST_BLOCKED: {
    message: 'Email verification was blocked by the email provider.',
    suggestion: 'Confirm the email request includes a User-Agent header, then check the API key and sender domain in Resend.',
    status: 503,
  },
  OTP_EMAIL_RATE_LIMITED: {
    message: 'Email verification is being rate limited by the email provider.',
    suggestion: 'Wait a few minutes before trying again. If this repeats, review Resend rate limits and app retry volume.',
    status: 503,
  },
  OTP_EMAIL_QUOTA_EXCEEDED: {
    message: 'Email verification has hit the email provider sending limit.',
    suggestion: 'Review the Resend account limit or billing plan, then try again after quota is available.',
    status: 503,
  },
  OTP_EMAIL_PROVIDER_UNAVAILABLE: {
    message: 'Email verification is temporarily unavailable.',
    suggestion: 'Retry in a few minutes. If it continues, check Resend status and the app service logs.',
    status: 503,
  },
  OTP_DELIVERY_FAILED: {
    message: 'Could not send the verification code.',
    suggestion: 'Check the app service logs for the email provider response, then retry after the provider issue is fixed.',
    status: 503,
  },
}

type OtpDeliveryErrorOptions = {
  providerStatus?: number
  providerCode?: string
  providerMessage?: string
}

export class OtpDeliveryError extends Error {
  readonly status: number
  readonly suggestion: string
  readonly provider = 'resend'
  readonly providerStatus?: number
  readonly providerCode?: string
  readonly providerMessage?: string

  constructor(readonly code: OtpDeliveryErrorCode, options: OtpDeliveryErrorOptions = {}) {
    const details = OTP_DELIVERY_ERROR_DETAILS[code]
    super(details.message)
    this.name = 'OtpDeliveryError'
    this.status = details.status
    this.suggestion = details.suggestion
    this.providerStatus = options.providerStatus
    this.providerCode = options.providerCode
    this.providerMessage = options.providerMessage
  }
}

type OtpDeliveryResponsePayload = {
  error: string
  code: OtpDeliveryErrorCode
  suggestion: string
  provider: string
  providerStatus?: number
  providerCode?: string
}

export function otpDeliveryErrorPayload(error: OtpDeliveryError): OtpDeliveryResponsePayload {
  return {
    error: error.message,
    code: error.code,
    suggestion: error.suggestion,
    provider: error.provider,
    providerStatus: error.providerStatus,
    providerCode: error.providerCode,
  }
}

type ResendErrorBody = {
  name?: string
  message?: string
  statusCode?: number
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

function configuredSender() {
  return process.env.OTP_EMAIL_FROM || process.env.RESEND_FROM || 'Sarathy <onboarding@resend.dev>'
}

function parseResendError(detail: string): ResendErrorBody {
  try {
    const parsed = JSON.parse(detail) as ResendErrorBody
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return { message: detail }
  }
}

function classifyResendError(status: number, from: string, detail: string) {
  const providerError = parseResendError(detail)
  const providerCode = providerError.name
  const providerMessage = providerError.message || detail
  const lowerMessage = providerMessage.toLowerCase()
  const lowerFrom = from.toLowerCase()
  const common = { providerStatus: status, providerCode, providerMessage }

  if (status === 401 || lowerMessage.includes('api key')) {
    return new OtpDeliveryError('OTP_EMAIL_PROVIDER_AUTH_FAILED', common)
  }

  if (status === 403 && (lowerMessage.includes('1010') || lowerMessage.includes('access denied'))) {
    return new OtpDeliveryError('OTP_EMAIL_REQUEST_BLOCKED', common)
  }

  if (
    status === 403
    && (lowerFrom.includes('@resend.dev') || lowerMessage.includes('resend.dev') || lowerMessage.includes('testing emails'))
  ) {
    return new OtpDeliveryError('OTP_FROM_DOMAIN_RESTRICTED', common)
  }

  if (
    status === 403
    && lowerMessage.includes('domain')
    && (lowerMessage.includes('verify') || lowerMessage.includes('verified'))
  ) {
    return new OtpDeliveryError('OTP_FROM_DOMAIN_UNVERIFIED', common)
  }

  if ((status === 400 || status === 422) && (lowerMessage.includes('from') || lowerMessage.includes('sender'))) {
    return new OtpDeliveryError('OTP_INVALID_SENDER', common)
  }

  if (
    (status === 400 || status === 422)
    && (lowerMessage.includes('recipient') || lowerMessage.includes('to email') || lowerMessage.includes('to field'))
  ) {
    return new OtpDeliveryError('OTP_INVALID_RECIPIENT', common)
  }

  if (status === 429 && (lowerMessage.includes('quota') || lowerMessage.includes('limit exceeded'))) {
    return new OtpDeliveryError('OTP_EMAIL_QUOTA_EXCEEDED', common)
  }

  if (status === 429) {
    return new OtpDeliveryError('OTP_EMAIL_RATE_LIMITED', common)
  }

  if (status >= 500) {
    return new OtpDeliveryError('OTP_EMAIL_PROVIDER_UNAVAILABLE', common)
  }

  return new OtpDeliveryError('OTP_DELIVERY_FAILED', common)
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
    if (process.env.NODE_ENV === 'production') {
      throw new OtpDeliveryError('OTP_EMAIL_NOT_CONFIGURED')
    }
    console.info(`[Sarathy OTP] ${purpose} code for ${email}: ${otp}`)
    return
  }

  const from = configuredSender()
  if (process.env.NODE_ENV === 'production' && /@resend\.dev/i.test(from)) {
    throw new OtpDeliveryError('OTP_FROM_DOMAIN_RESTRICTED', {
      providerStatus: 403,
      providerCode: 'validation_error',
      providerMessage: 'The Resend test sender is restricted to the verified account email and cannot be used for public sign-ups.',
    })
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'User-Agent': 'sarathy/0.1.0',
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
    const error = classifyResendError(response.status, from, detail)
    console.error('Failed to send Sarathy OTP:', {
      code: error.code,
      provider: error.provider,
      providerStatus: error.providerStatus,
      providerCode: error.providerCode,
      providerMessage: error.providerMessage,
    })
    throw error
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

  try {
    await sendOtpEmail(normalizedEmail, otp, purpose)
  } catch (err) {
    await prisma.verificationToken.deleteMany({ where: { identifier } })
    throw err
  }

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
