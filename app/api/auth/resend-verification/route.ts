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

    if (!user) {
      return NextResponse.json({ error: 'Create an account first.' }, { status: 404 })
    }

    if (user.emailVerified) {
      return NextResponse.json({ verified: true })
    }

    const otp = await issueOtp({ email, purpose: 'email-verification' })
    return NextResponse.json({ sent: true, ...otp })
  } catch (err) {
    if (err instanceof OtpCooldownError) {
      return NextResponse.json(
        { error: err.message, cooldownSeconds: err.cooldownSeconds },
        { status: 429 },
      )
    }

    console.error('Verification resend failed:', err)
    return NextResponse.json({ error: 'Could not send verification code.' }, { status: 500 })
  }
}
