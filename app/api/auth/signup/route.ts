import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const email = String(body.email || '').trim().toLowerCase()
    const password = String(body.password || '')
    const name = body.name ? String(body.name).trim() : null

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 })
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: 'An account already exists for this email.' }, { status: 409 })
    }

    const password_hash = await bcrypt.hash(password, 12)
    const user = await prisma.user.create({
      data: {
        email,
        name: name || email.split('@')[0],
        password_hash,
        profile: {
          create: {
            name: name || null,
            primary_currency: 'SGD',
            companion_vibe: 'calm_mentor',
            onboarding_complete: false,
            colour_theme: 'saffron',
            achievements: [],
            user_types: [],
          },
        },
      },
      select: { id: true, email: true, name: true },
    })

    return NextResponse.json({ user })
  } catch (err) {
    console.error('Signup failed:', err)
    return NextResponse.json({ error: 'Could not create account.' }, { status: 500 })
  }
}

