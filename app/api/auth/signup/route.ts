import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import {
  isValidEmail,
  issueOtp,
  normalizeEmail,
  OtpCooldownError,
  OtpDeliveryError,
  otpDeliveryErrorPayload,
} from '@/lib/otp'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const email = normalizeEmail(body.email)
    const password = String(body.password || '')
    const confirmPassword = body.confirmPassword === undefined ? password : String(body.confirmPassword || '')
    const name = body.name ? String(body.name).trim() : null

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 })
    }

    if (password !== confirmPassword) {
      return NextResponse.json({ error: 'Passwords do not match.' }, { status: 400 })
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing?.emailVerified) {
      return NextResponse.json(
        {
          error: 'An account already exists for this email. Sign in instead, or use forgot password if you need a new password.',
          code: 'ACCOUNT_EXISTS',
          action: '/app/login',
        },
        { status: 409 },
      )
    }

    const password_hash = await bcrypt.hash(password, 12)
    const profileDefaults = {
      name: name || null,
      primary_currency: 'SGD',
      companion_vibe: 'calm_mentor',
      onboarding_complete: false,
      colour_theme: 'saffron',
      achievements: [],
      user_types: [],
    }

    let createdUserId: string | null = null

    const user = existing
      ? await prisma.user.update({
          where: { id: existing.id },
          data: {
            name: name || existing.name || email.split('@')[0],
            password_hash,
            profile: {
              upsert: {
                update: { name: name || undefined },
                create: profileDefaults,
              },
            },
          },
          select: { id: true, email: true, name: true },
        })
      : await prisma.user.create({
          data: {
            email,
            name: name || email.split('@')[0],
            password_hash,
            profile: {
              create: profileDefaults,
            },
          },
          select: { id: true, email: true, name: true },
        })

    if (!existing) createdUserId = user.id

    const otp = await issueOtp({ email, purpose: 'email-verification' }).catch(async err => {
      if (createdUserId) {
        await prisma.user.delete({ where: { id: createdUserId } }).catch(cleanupErr => {
          console.error('Failed to clean up unverified user after OTP delivery failure:', cleanupErr)
        })
      }
      throw err
    })

    return NextResponse.json({ user, verificationRequired: true, ...otp })
  } catch (err) {
    if (err instanceof OtpCooldownError) {
      return NextResponse.json(
        { error: err.message, code: 'OTP_COOLDOWN', cooldownSeconds: err.cooldownSeconds },
        { status: 429 },
      )
    }

    if (err instanceof OtpDeliveryError) {
      return NextResponse.json(otpDeliveryErrorPayload(err), { status: err.status })
    }

    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      return NextResponse.json(
        {
          error: 'An account already exists for this email. Sign in instead, or use forgot password if you need a new password.',
          code: 'ACCOUNT_EXISTS',
          action: '/app/login',
        },
        { status: 409 },
      )
    }

    console.error('Signup failed:', err)
    return NextResponse.json(
      {
        error: 'Could not create account. Refresh and try again. If this email was used before, go to sign in or forgot password.',
        code: 'SIGNUP_FAILED',
      },
      { status: 500 },
    )
  }
}
