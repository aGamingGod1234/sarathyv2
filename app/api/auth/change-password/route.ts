import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import bcrypt from 'bcryptjs'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

async function getSessionUserId() {
  try {
    const session = await getServerSession(authOptions)
    return session?.user?.id || null
  } catch (err) {
    console.error('Change password session lookup failed:', err)
    return null
  }
}

export async function POST(req: Request) {
  try {
    const userId = await getSessionUserId()
    if (!userId) {
      return NextResponse.json({ error: 'Please sign in again.' }, { status: 401 })
    }

    const body = await req.json()
    const currentPassword = typeof body.currentPassword === 'string' ? body.currentPassword : ''
    const newPassword = typeof body.newPassword === 'string' ? body.newPassword : ''
    const confirmPassword = typeof body.confirmPassword === 'string' ? body.confirmPassword : ''

    if (!currentPassword || !newPassword || !confirmPassword) {
      return NextResponse.json({ error: 'Fill in all password fields.' }, { status: 400 })
    }

    if (newPassword.length < 8) {
      return NextResponse.json({ error: 'New password must be at least 8 characters.' }, { status: 400 })
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json({ error: 'New passwords do not match.' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { password_hash: true },
    })

    if (!user?.password_hash) {
      return NextResponse.json(
        { error: 'This account does not have a password set. Use forgot password from sign in.' },
        { status: 400 },
      )
    }

    const valid = await bcrypt.compare(currentPassword, user.password_hash)
    if (!valid) {
      return NextResponse.json({ error: 'Current password is incorrect.' }, { status: 400 })
    }

    const passwordHash = await bcrypt.hash(newPassword, 12)
    await prisma.user.update({
      where: { id: userId },
      data: {
        password_hash: passwordHash,
        password_changed_at: new Date(),
      },
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Change password failed:', err)
    return NextResponse.json({ error: 'Could not change password right now.' }, { status: 500 })
  }
}
