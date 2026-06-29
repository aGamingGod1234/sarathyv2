import { prisma } from '@/lib/prisma'

export const SARATHY_MEMORY_WINDOW_MINUTES = 30
export const FREE_SAVED_CHAT_TURN_LIMIT = 5
export const SARATHY_PROMPT_HISTORY_LIMIT = 8

const SARATHY_MEMORY_WINDOW_MS = SARATHY_MEMORY_WINDOW_MINUTES * 60 * 1000

type PlanTierLike = string | null | undefined

type ChatRow = {
  id: string
  role: string
}

function isPlus(planTier: PlanTierLike) {
  return planTier === 'plus'
}

function memoryCutoff(now = new Date()) {
  return new Date(now.getTime() - SARATHY_MEMORY_WINDOW_MS)
}

function latestFreeChatRows<T extends ChatRow>(rowsNewestFirst: T[]) {
  const kept: T[] = []
  let userTurns = 0

  for (const row of rowsNewestFirst) {
    if (row.role === 'user' && userTurns >= FREE_SAVED_CHAT_TURN_LIMIT) break

    kept.push(row)

    if (row.role === 'user') {
      userTurns += 1
      if (userTurns >= FREE_SAVED_CHAT_TURN_LIMIT) break
    }
  }

  const rowsToKeep = userTurns === 0
    ? kept.slice(0, FREE_SAVED_CHAT_TURN_LIMIT)
    : kept

  return rowsToKeep.reverse()
}

export async function loadPromptChatMemory(userId: string) {
  const history = await prisma.chatMessage.findMany({
    where: {
      user_id: userId,
      created_at: { gte: memoryCutoff() },
    },
    orderBy: { created_at: 'desc' },
    take: SARATHY_PROMPT_HISTORY_LIMIT,
  })

  return history.reverse()
}

export async function loadSavedChatHistory(userId: string, planTier: PlanTierLike) {
  if (isPlus(planTier)) {
    return prisma.chatMessage.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'asc' },
    })
  }

  const rows = await prisma.chatMessage.findMany({
    where: { user_id: userId },
    orderBy: { created_at: 'desc' },
  })

  return latestFreeChatRows(rows)
}

export async function pruneSavedChatHistory(userId: string, planTier: PlanTierLike) {
  if (isPlus(planTier)) return

  const rows = await prisma.chatMessage.findMany({
    where: { user_id: userId },
    orderBy: { created_at: 'desc' },
    select: { id: true, role: true },
  })
  const kept = latestFreeChatRows(rows)
  const keptIds = kept.map(row => row.id)

  if (rows.length === keptIds.length) return

  await prisma.chatMessage.deleteMany({
    where: {
      user_id: userId,
      id: { notIn: keptIds },
    },
  })
}
