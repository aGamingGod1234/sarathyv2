import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    const userId = session?.user?.id
    if (!userId) {
      return NextResponse.json({ error: 'Please sign in again.' }, { status: 401 })
    }

    const body = await req.json()
    const inviteCode = String(body.inviteCode || '').trim().toLowerCase()
    if (!/^[a-z0-9]{4,16}$/.test(inviteCode)) {
      return NextResponse.json({ error: 'Enter a valid invite code.' }, { status: 400 })
    }

    const circle = await prisma.circle.findUnique({
      where: { invite_code: inviteCode },
      select: { id: true, name: true, invite_code: true, created_by: true, created_at: true },
    })

    if (!circle) {
      return NextResponse.json({ error: 'Circle not found. Check the invite code.' }, { status: 404 })
    }

    await prisma.circleMember.upsert({
      where: {
        circle_id_user_id: {
          circle_id: circle.id,
          user_id: userId,
        },
      },
      update: {},
      create: {
        circle_id: circle.id,
        user_id: userId,
      },
    })

    return NextResponse.json({ circle })
  } catch (err) {
    console.error('Circle join failed:', err)
    return NextResponse.json({ error: 'Could not join circle.' }, { status: 500 })
  }
}
