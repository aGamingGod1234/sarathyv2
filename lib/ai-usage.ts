import { prisma } from '@/lib/prisma'
import { getLocalDateKey } from '@/lib/dates'

const FREE_DAILY_AI_LIMIT = 30
const PLUS_DAILY_AI_LIMIT = 200

function getDailyLimit(planTier?: string | null) {
  return planTier === 'plus' ? PLUS_DAILY_AI_LIMIT : FREE_DAILY_AI_LIMIT
}

export async function reserveAiUsage({
  userId,
  planTier,
  productLookup,
  model,
}: {
  userId: string
  planTier?: string | null
  productLookup: boolean
  model?: string | null
}) {
  const dateKey = getLocalDateKey()
  const limit = getDailyLimit(planTier)

  await prisma.aiDailyUsage.upsert({
    where: {
      user_id_date_key: {
        user_id: userId,
        date_key: dateKey,
      },
    },
    update: { limit },
    create: {
      user_id: userId,
      date_key: dateKey,
      limit,
    },
  })

  return prisma.$transaction(async tx => {
    const updated = await tx.aiDailyUsage.updateMany({
      where: {
        user_id: userId,
        date_key: dateKey,
        message_count: { lt: limit },
      },
      data: {
        message_count: { increment: 1 },
        product_lookup_count: productLookup ? { increment: 1 } : undefined,
        limit,
      },
    })

    if (updated.count === 0) {
      const current = await tx.aiDailyUsage.findUnique({
        where: {
          user_id_date_key: {
            user_id: userId,
            date_key: dateKey,
          },
        },
      })

      return {
        allowed: false as const,
        used: current?.message_count || 0,
        limit,
        eventId: null,
      }
    }

    const daily = await tx.aiDailyUsage.findUnique({
      where: {
        user_id_date_key: {
          user_id: userId,
          date_key: dateKey,
        },
      },
    })

    const event = await tx.aiUsageEvent.create({
      data: {
        user_id: userId,
        product_lookup: productLookup,
        model,
        status: 'reserved',
      },
      select: { id: true },
    })

    return {
      allowed: true as const,
      used: daily?.message_count || 1,
      limit,
      eventId: event.id,
    }
  })
}

export async function finishAiUsage({
  eventId,
  status,
  inputTokens,
  outputTokens,
}: {
  eventId: string | null
  status: 'completed' | 'failed'
  inputTokens?: number | null
  outputTokens?: number | null
}) {
  if (!eventId) return

  await prisma.aiUsageEvent.update({
    where: { id: eventId },
    data: {
      status,
      input_tokens: inputTokens || undefined,
      output_tokens: outputTokens || undefined,
    },
  }).catch(error => {
    console.error('Failed to update AI usage event:', error)
  })
}
