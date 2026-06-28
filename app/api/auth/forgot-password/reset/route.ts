import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { isValidEmail, normalizeEmail, verifyPasswordResetToken } from '@/lib/otp'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const email = normalizeEmail(body.email)
    const password = String(body.password || '')
    const confirmPassword = String(body.confirmPassword || '')
    const resetToken = String(body.resetToken || '')

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 })
    }

    if (!verifyPasswordResetToken(resetToken, email)) {
      return NextResponse.json({ error: 'Reset session expired. Send a new code.' }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 })
    }

    if (password !== confirmPassword) {
      return NextResponse.json({ error: 'Passwords do not match.' }, { status: 400 })
    }

    const password_hash = await bcrypt.hash(password, 12)
    await prisma.user.update({
      where: { email },
      data: {
        password_hash,
        emailVerified: new Date(),
      },
    })

    return NextResponse.json({ reset: true })
  } catch (err) {
    console.error('Password reset failed:', err)
    return NextResponse.json({ error: 'Could not reset password.' }, { status: 500 })
  }
}
