import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import {
  assertSecurityAttemptAllowed,
  clearSecurityAttempts,
  recordSecurityAttemptFailure,
  SecurityAttemptLimitError,
} from '@/lib/security-attempts'

export const dynamic = 'force-dynamic'

const JOIN_ERROR = 'Could not join circle. Check the invite code and try again.'

function clientIp(req: Request) {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || req.headers.get('x-real-ip')?.trim()
    || 'unknown'
}

function joinAttemptKeys(req: Request, userId: string) {
  return [`user:${userId}`, `ip:${clientIp(req)}`]
}

async function assertJoinAllowed(keys: string[]) {
  for (const key of keys) {
    await assertSecurityAttemptAllowed('circle:join', key)
  }
}

async function recordJoinFailure(keys: string[]) {
  let lockout: SecurityAttemptLimitError | null = null

  for (const key of keys) {
    try {
      await recordSecurityAttemptFailure('circle:join', key)
    } catch (err) {
      if (err instanceof SecurityAttemptLimitError) {
        lockout = err
        continue
      }
      throw err
    }
  }

  if (lockout) throw lockout
}

async function clearJoinFailures(keys: string[]) {
  await Promise.all(keys.map(key => clearSecurityAttempts('circle:join', key)))
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    const userId = session?.user?.id
    if (!userId) {
      return NextResponse.json({ error: 'Please sign in again.' }, { status: 401 })
    }

    const attemptKeys = joinAttemptKeys(req, userId)
    await assertJoinAllowed(attemptKeys)

    const body = await req.json()
    const inviteCode = String(body.inviteCode || '').trim().toLowerCase()
    if (!/^[a-f0-9]{8,16}$/.test(inviteCode)) {
      await recordJoinFailure(attemptKeys)
      return NextResponse.json({ error: JOIN_ERROR }, { status: 400 })
    }

    const circle = await prisma.circle.findUnique({
      where: { invite_code: inviteCode },
      select: { id: true, name: true, created_at: true },
    })

    if (!circle) {
      await recordJoinFailure(attemptKeys)
      return NextResponse.json({ error: JOIN_ERROR }, { status: 404 })
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

    await clearJoinFailures(attemptKeys)

    return NextResponse.json({ circle })
  } catch (err) {
    if (err instanceof SecurityAttemptLimitError) {
      return NextResponse.json(
        { error: 'Too many attempts. Try again later.', cooldownSeconds: err.retryAfterSeconds },
        { status: 429 },
      )
    }

    console.error('Circle join failed:', err)
    return NextResponse.json({ error: 'Could not join circle.' }, { status: 500 })
  }
}
