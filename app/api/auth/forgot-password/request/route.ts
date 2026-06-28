import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isValidEmail, issueOtp, normalizeEmail, OtpCooldownError } from '@/lib/otp'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const email = normalizeEmail(body.email)

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, emailVerified: true },
    })

    if (!user?.emailVerified) {
      return NextResponse.json({ sent: true, cooldownSeconds: 60 })
    }

    const otp = await issueOtp({ email, purpose: 'password-reset' })
    return NextResponse.json({ sent: true, ...otp })
  } catch (err) {
    if (err instanceof OtpCooldownError) {
      return NextResponse.json(
        { error: err.message, cooldownSeconds: err.cooldownSeconds },
        { status: 429 },
      )
    }

    console.error('Password reset request failed:', err)
    return NextResponse.json({ error: 'Could not send reset code.' }, { status: 500 })
  }
}
