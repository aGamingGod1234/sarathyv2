import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { isValidEmail, issueOtp, normalizeEmail, OtpCooldownError } from '@/lib/otp'

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
      return NextResponse.json({ error: 'An account already exists for this email.' }, { status: 409 })
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

    const otp = await issueOtp({ email, purpose: 'email-verification' })

    return NextResponse.json({ user, verificationRequired: true, ...otp })
  } catch (err) {
    if (err instanceof OtpCooldownError) {
      return NextResponse.json(
        { error: err.message, cooldownSeconds: err.cooldownSeconds },
        { status: 429 },
      )
    }

    console.error('Signup failed:', err)
    return NextResponse.json({ error: 'Could not create account.' }, { status: 500 })
  }
}
