import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  isValidEmail,
  issueOtp,
  normalizeEmail,
  OtpCooldownError,
  OtpDeliveryError,
  otpDeliveryErrorPayload,
} from '@/lib/otp'

function verificationSentPayload(cooldownSeconds = 60) {
  return { sent: true, cooldownSeconds }
}

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

    if (!user || user.emailVerified) {
      return NextResponse.json(verificationSentPayload())
    }

    const otp = await issueOtp({ email, purpose: 'email-verification' })
    return NextResponse.json({ sent: true, ...otp })
  } catch (err) {
    if (err instanceof OtpCooldownError) {
      return NextResponse.json(verificationSentPayload(err.cooldownSeconds))
    }

    if (err instanceof OtpDeliveryError) {
      return NextResponse.json(otpDeliveryErrorPayload(err), { status: err.status })
    }

    console.error('Verification resend failed:', err)
    return NextResponse.json(
      {
        error: 'Could not send verification code.',
        code: 'OTP_DELIVERY_FAILED',
      },
      { status: 500 },
    )
  }
}
