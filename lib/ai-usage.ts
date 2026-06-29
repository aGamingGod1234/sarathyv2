import { prisma } from '@/lib/prisma'
import { getLocalDateKey } from '@/lib/dates'

export const FREE_DAILY_AI_LIMIT = 20

function getDailyQuota(planTier?: string | null) {
  return planTier === 'plus'
    ? { limit: 0, unlimited: true }
    : { limit: FREE_DAILY_AI_LIMIT, unlimited: false }
}

function usageResponse({
  used,
  limit,
  unlimited,
  eventId,
  allowed = true,
}: {
  used: number
  limit: number
  unlimited: boolean
  eventId: string | null
  allowed?: boolean
}) {
  return {
    allowed,
    used,
    limit: unlimited ? null : limit,
    remaining: unlimited ? null : Math.max(0, limit - used),
    unlimited,
    eventId,
  }
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
  const quota = getDailyQuota(planTier)

  await prisma.aiDailyUsage.upsert({
    where: {
      user_id_date_key: {
        user_id: userId,
        date_key: dateKey,
      },
    },
    update: { limit: quota.limit },
    create: {
      user_id: userId,
      date_key: dateKey,
      limit: quota.limit,
    },
  })

  return prisma.$transaction(async tx => {
    if (quota.unlimited) {
      const daily = await tx.aiDailyUsage.update({
        where: {
          user_id_date_key: {
            user_id: userId,
            date_key: dateKey,
          },
        },
        data: {
          message_count: { increment: 1 },
          product_lookup_count: productLookup ? { increment: 1 } : undefined,
          limit: quota.limit,
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

      return usageResponse({
        used: daily.message_count,
        limit: quota.limit,
        unlimited: true,
        eventId: event.id,
      })
    }

    const updated = await tx.aiDailyUsage.updateMany({
      where: {
        user_id: userId,
        date_key: dateKey,
        message_count: { lt: quota.limit },
      },
      data: {
        message_count: { increment: 1 },
        product_lookup_count: productLookup ? { increment: 1 } : undefined,
        limit: quota.limit,
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

      return usageResponse({
        allowed: false,
        used: current?.message_count || 0,
        limit: quota.limit,
        unlimited: false,
        eventId: null,
      })
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

    return usageResponse({
      used: daily?.message_count || 1,
      limit: quota.limit,
      unlimited: false,
      eventId: event.id,
    })
  })
}

export async function getAiUsageStatus({
  userId,
  planTier,
}: {
  userId: string
  planTier?: string | null
}) {
  const dateKey = getLocalDateKey()
  const quota = getDailyQuota(planTier)
  const daily = await prisma.aiDailyUsage.findUnique({
    where: {
      user_id_date_key: {
        user_id: userId,
        date_key: dateKey,
      },
    },
  })
  const used = daily?.message_count || 0

  return {
    used,
    limit: quota.unlimited ? null : quota.limit,
    remaining: quota.unlimited ? null : Math.max(0, quota.limit - used),
    unlimited: quota.unlimited,
  }
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
