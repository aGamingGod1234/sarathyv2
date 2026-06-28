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
    if (!user) {
      return NextResponse.json({ error: 'Invalid verification code.' }, { status: 400 })
    }

    if (user.emailVerified) {
      return NextResponse.json({ verified: true })
    }

    const result = await verifyOtp({ email, purpose: 'email-verification', otp })
    if (!result.ok) {
      return NextResponse.json(
        { error: result.reason === 'expired' ? 'That code expired. Send a new one.' : 'Invalid verification code.' },
        { status: 400 },
      )
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: new Date() },
    })

    return NextResponse.json({ verified: true })
  } catch (err) {
    console.error('Email verification failed:', err)
    return NextResponse.json({ error: 'Could not verify email.' }, { status: 500 })
  }
}
