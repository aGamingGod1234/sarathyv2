import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import {
  FREE_SAVED_CHAT_TURN_LIMIT,
  SARATHY_MEMORY_WINDOW_MINUTES,
  loadSavedChatHistory,
  pruneSavedChatHistory,
} from '@/lib/chat-history'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    const userId = session?.user?.id
    if (!userId) {
      return NextResponse.json({ message: 'Please sign in again.' }, { status: 401 })
    }

    const profile = await prisma.profile.findUnique({
      where: { id: userId },
      select: { plan_tier: true },
    })

    if (!profile) {
      return NextResponse.json({ message: 'Profile not found. Please complete setup again.' }, { status: 404 })
    }

    await pruneSavedChatHistory(userId, profile.plan_tier)
    const messages = await loadSavedChatHistory(userId, profile.plan_tier)

    return NextResponse.json({
      messages,
      retention: {
        memoryWindowMinutes: SARATHY_MEMORY_WINDOW_MINUTES,
        savedChatTurns: profile.plan_tier === 'plus' ? null : FREE_SAVED_CHAT_TURN_LIMIT,
      },
    })
  } catch (err) {
    console.error('Sarathy history failed:', err)
    return NextResponse.json({ message: 'Could not load Sarathy chat history.' }, { status: 500 })
  }
}
