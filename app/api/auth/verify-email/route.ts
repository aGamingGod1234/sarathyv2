import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isValidEmail, normalizeEmail, verifyOtp } from '@/lib/otp'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const email = normalizeEmail(body.email)
    const otp = String(body.otp || '')

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { email }, select: { id: true, emailVerified: true } })
    if (!user || user.emailVerified) {
      return NextResponse.json({ error: 'Invalid verification code.' }, { status: 400 })
    }

    const result = await verifyOtp({ email, purpose: 'email-verification', otp })
    if (!result.ok) {
      if (result.reason === 'rate_limited') {
        return NextResponse.json(
          { error: 'Too many attempts. Send a new code later.', cooldownSeconds: result.retryAfterSeconds },
          { status: 429 },
        )
      }

      return NextResponse.json(
        { error: result.reason === 'expired' ? 'That code expired. Send a new one.' : 'Invalid verification code.' },
        { status: 400 },
      )
    }

    await prisma.$transaction(async tx => {
      const pending = await tx.pendingCredentialChange.findUnique({ where: { email } })
      const now = new Date()
      const credentialUpdate = pending && pending.expires.getTime() > now.getTime()
        ? {
            password_hash: pending.password_hash,
            password_changed_at: now,
            ...(pending.name ? { name: pending.name } : {}),
          }
        : {}

      await tx.user.update({
        where: { id: user.id },
        data: {
          emailVerified: now,
          ...credentialUpdate,
        },
      })

      if (pending) {
        await tx.pendingCredentialChange.delete({ where: { email } })
      }
    })

    return NextResponse.json({ verified: true })
  } catch (err) {
    console.error('Email verification failed:', err)
    return NextResponse.json({ error: 'Could not verify email.' }, { status: 500 })
  }
}
