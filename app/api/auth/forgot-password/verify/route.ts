import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createPasswordResetToken, isValidEmail, normalizeEmail, verifyOtp } from '@/lib/otp'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const email = normalizeEmail(body.email)
    const otp = String(body.otp || '')

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, emailVerified: true },
    })

    if (!user?.emailVerified) {
      return NextResponse.json({ error: 'Invalid reset code.' }, { status: 400 })
    }

    const result = await verifyOtp({ email, purpose: 'password-reset', otp })
    if (!result.ok) {
      return NextResponse.json(
        { error: result.reason === 'expired' ? 'That code expired. Send a new one.' : 'Invalid reset code.' },
        { status: 400 },
      )
    }

    return NextResponse.json({
      resetToken: createPasswordResetToken(email, result.expiresAt),
    })
  } catch (err) {
    console.error('Password reset verification failed:', err)
    return NextResponse.json({ error: 'Could not verify reset code.' }, { status: 500 })
  }
}
