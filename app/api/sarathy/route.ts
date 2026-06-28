import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { OPENAI_MODEL, generateWithOpenAI, isOpenAIConfigured, streamWithOpenAI } from '@/lib/ai'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { calculateSafeToSpend, formatCurrency, getMonthEntries, groupEntriesByCategory } from '@/lib/calculations'
import { formatDateKey, getCurrentMonthDateRange, getLocalDateKey } from '@/lib/dates'
import { finishAiUsage, reserveAiUsage } from '@/lib/ai-usage'
import {
  lookupKnownProductPrice,
  shouldLookupProductPrice,
  type ProductPriceLookup,
} from '@/lib/product-pricing'
import type { BudgetEntry, FixedSpending, Goal, MoodLog, Profile } from '@/types'

export const dynamic = 'force-dynamic'

type SarathyHistoryItem = {
  role?: string
  content?: string
}

const SARATHY_INSTRUCTIONS = [
  'You are Sarathy, a personal finance companion inside the app.',
  'Answer directly and precisely. Default to 1 or 2 short sentences.',
  'Use markdown only when it improves clarity, such as bold numbers or short bullet lists.',
  'Sound steady and personal, not like a bank, therapist, or generic chatbot.',
  'Use the user name, responsibility, money fear, currency, streak, and safe-to-spend context only when it feels natural.',
  'Never pretend to know data that was not provided. If a field is unknown, do not mention it.',
  'If the user asks what they spent, what changed, or why safe-to-spend is low, use the provided transaction, category, fixed-cost, and safety-calculation data. Do not say you cannot see totals when those totals are in context.',
  'When numbers are provided, use them directly and explain what they mean in practical terms.',
  'If product price context is provided, use it before making an affordability call. Mention the source label briefly.',
  'If the user asks about a product without a price and no reliable price is available, ask for a link or exact price instead of guessing.',
  'If the user is anxious, validate once, then give the safest concrete next action.',
  'Do not be salesy, noisy, moralizing, overly cheerful, dramatic, or repetitive.',
  'Use plain ASCII punctuation only. Do not use em dashes, en dashes, smart quotes, ellipses, or decorative symbols.',
  'Avoid generic disclaimers unless the user asks for formal financial advice. Keep the answer under 80 words unless the user asks for detail.',
].join(' ')

const WEB_SEARCH_TOOL = [{ type: 'web_search_preview' as const, search_context_size: 'medium' as const }]

function compactValue(value: unknown) {
  if (value === null || value === undefined || value === '') return 'unknown'
  return String(value)
}

function normalizeAssistantMessage(message: string) {
  return message
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/\u2026/g, '...')
    .trim()
}

function listLines(lines: string[], empty = 'none') {
  return lines.length ? lines.join('\n') : empty
}

function formatEntryLine(entry: BudgetEntry, currency: string) {
  const description = entry.description?.trim()
  return [
    `- ${entry.entry_date}`,
    entry.category,
    formatCurrency(entry.amount, currency),
    description ? `(${description})` : '',
  ].filter(Boolean).join(' ')
}

function formatFixedLine(item: FixedSpending, currency: string) {
  const due = item.due_day ? ` due day ${item.due_day}` : ''
  return `- ${item.name}: ${formatCurrency(item.amount, currency)}${due}`
}

function formatGoalLine(goal: Goal, currency: string) {
  return `- ${goal.name}: ${formatCurrency(goal.current_amount, currency)} of ${formatCurrency(goal.target_amount, currency)}${goal.deadline ? ` by ${goal.deadline}` : ''}`
}

function formatMoodLine(mood: MoodLog) {
  return `- ${mood.entry_date}: ${mood.mood}`
}

function buildContextBlock(context: NonNullable<Awaited<ReturnType<typeof loadMoneyContext>>>) {
  const { profile, safeData, monthSpent, categories, entries, recentEntries, fixedSpending, goals, moodLogs } = context
  const currency = profile.primary_currency || safeData.currency || 'SGD'
  const todayKey = getLocalDateKey()
  const todayEntries = entries.filter(entry => entry.entry_date === todayKey)
  const todaySpent = todayEntries.reduce((sum, entry) => sum + entry.amount, 0)
  const todayOverBy = Math.max(0, todaySpent - safeData.dailyAllowance)
  const topCategory = categories[0]
  const monthCategoryLines = categories
    .slice(0, 10)
    .map(category => `- ${category.category}: ${formatCurrency(category.total, currency)} (${category.percentage}%)`)
  const recentEntryLines = recentEntries
    .slice(0, 60)
    .map(entry => formatEntryLine(entry, currency))
  const todayEntryLines = todayEntries
    .slice(0, 30)
    .map(entry => formatEntryLine(entry, currency))

  return [
    `Name: ${compactValue(profile.name)}`,
    `Tone: ${compactValue(profile.companion_vibe)}`,
    `Plan tier: ${compactValue(profile.plan_tier || 'free')}`,
    `Currency: ${compactValue(profile.primary_currency)}`,
    `Current country: ${compactValue(profile.current_country)}`,
    `Home country or roots: ${compactValue(profile.home_country)}`,
    `User status tags: ${profile.user_types?.length ? profile.user_types.join(', ') : 'unknown'}`,
    `Income timing: ${compactValue(profile.income_timing)}`,
    `Total money stated during setup: ${compactValue(profile.total_money)}`,
    `Monthly plan: ${compactValue(profile.planning_amount)}`,
    `Monthly spend so far: ${formatCurrency(monthSpent, currency)}`,
    `Fixed costs still due: ${formatCurrency(safeData.fixedLeft, currency)}`,
    `Safety buffer: ${formatCurrency(safeData.buffer, currency)}`,
    `Spent before today: ${formatCurrency(safeData.spentBeforeToday, currency)}`,
    `Today spent total: ${formatCurrency(todaySpent, currency)}`,
    `Today daily allowance: ${formatCurrency(safeData.dailyAllowance, currency)}`,
    `Today safe-to-spend remaining: ${formatCurrency(safeData.safeToSpend, currency)}`,
    `Today overspent by: ${formatCurrency(todayOverBy, currency)}`,
    `Month pool after today's spending: ${formatCurrency(safeData.freeToUse, currency)}`,
    `Days remaining: ${compactValue(safeData.daysLeft)}`,
    `Budget status: ${compactValue(safeData.status)}`,
    `Top category this month: ${topCategory ? `${topCategory.category} at ${formatCurrency(topCategory.total, currency)} (${topCategory.percentage}%)` : 'unknown'}`,
    `Money fear: ${compactValue(profile.money_fear)}`,
    `Responsible for: ${compactValue(profile.responsible_for)}`,
    `Login streak: ${compactValue(profile.daily_login_streak)}`,
    '',
    `Today transactions (${todayEntries.length}, ${formatDateKey(todayKey, 'en-SG', { day: 'numeric', month: 'short', year: 'numeric' })}):`,
    listLines(todayEntryLines),
    todayEntries.length > todayEntryLines.length ? `Today transaction list truncated after ${todayEntryLines.length} items.` : '',
    '',
    'Current-month category totals:',
    listLines(monthCategoryLines),
    '',
    `Recent transactions available to Sarathy (${recentEntries.length}, newest first):`,
    listLines(recentEntryLines),
    recentEntries.length > recentEntryLines.length ? `Recent transaction list truncated after ${recentEntryLines.length} items.` : '',
    '',
    'Active fixed costs:',
    listLines(fixedSpending.slice(0, 20).map(item => formatFixedLine(item, currency))),
    fixedSpending.length > 20 ? 'Fixed cost list truncated after 20 items.' : '',
    '',
    'Goals:',
    listLines(goals.slice(0, 12).map(goal => formatGoalLine(goal, currency))),
    goals.length > 12 ? 'Goal list truncated after 12 items.' : '',
    '',
    'Recent mood logs:',
    listLines(moodLogs.slice(0, 14).map(formatMoodLine)),
    moodLogs.length > 14 ? 'Mood list truncated after 14 items.' : '',
  ].join('\n')
}

function buildHistoryBlock(history: SarathyHistoryItem[] = []) {
  return history
    .slice(-8)
    .map(item => `${item.role === 'assistant' ? 'Sarathy' : 'User'}: ${compactValue(item.content)}`)
    .join('\n')
}

function buildPriceBlock(price: ProductPriceLookup | null, targetCurrency: string, wantsLookup: boolean) {
  if (price) {
    const converted = price.convertedAmount !== null && price.convertedAmount !== undefined && price.convertedCurrency
      ? `${formatCurrency(price.convertedAmount, price.convertedCurrency)} ${price.convertedCurrency}`
      : 'conversion unavailable'

    return [
      `Product: ${price.productName}`,
      `Listed price: ${price.currency} ${price.amount} ${price.cadence}`,
      `Approx ${targetCurrency}: ${converted}`,
      `Source: ${price.sourceLabel} (${price.sourceUrl})`,
      'Use this price for the affordability decision, and note that taxes or local billing can change the final charge.',
    ].join('\n')
  }

  if (wantsLookup) {
    return [
      'The user appears to be asking about a product or subscription without giving a price.',
      'Use web search to find a current price from a reliable source. Prefer official product pages.',
      `Convert the price to ${targetCurrency} if possible. If no reliable price appears, ask for a link or exact price.`,
    ].join('\n')
  }

  return 'No product price lookup needed.'
}

async function loadMoneyContext(userId: string) {
  const { monthStart, nextMonthStart } = getCurrentMonthDateRange()

  const [profile, entries, recentEntries, fixedSpending, goals, moodLogs, history] = await Promise.all([
    prisma.profile.findUnique({ where: { id: userId } }),
    prisma.budgetEntry.findMany({
      where: { user_id: userId, entry_date: { gte: monthStart, lt: nextMonthStart } },
      orderBy: [{ entry_date: 'desc' }, { created_at: 'desc' }],
    }),
    prisma.budgetEntry.findMany({
      where: { user_id: userId },
      orderBy: [{ entry_date: 'desc' }, { created_at: 'desc' }],
      take: 80,
    }),
    prisma.fixedSpending.findMany({
      where: { user_id: userId, is_active: true },
      orderBy: { created_at: 'desc' },
    }),
    prisma.goal.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
    }),
    prisma.moodLog.findMany({
      where: { user_id: userId },
      orderBy: { entry_date: 'desc' },
      take: 30,
    }),
    prisma.chatMessage.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
      take: 8,
    }),
  ])

  if (!profile) return null

  const typedProfile = profile as unknown as Profile
  const typedEntries = entries as unknown as BudgetEntry[]
  const typedRecentEntries = recentEntries as unknown as BudgetEntry[]
  const typedFixed = fixedSpending as unknown as FixedSpending[]
  const typedGoals = goals as unknown as Goal[]
  const typedMoodLogs = moodLogs as unknown as MoodLog[]
  const safeData = calculateSafeToSpend(typedProfile, typedEntries, typedFixed)
  const monthEntries = getMonthEntries(typedEntries)
  const categories = groupEntriesByCategory(monthEntries)
  const monthSpent = monthEntries.reduce((sum, entry) => sum + entry.amount, 0)

  return {
    profile: typedProfile,
    entries: typedEntries,
    recentEntries: typedRecentEntries,
    fixedSpending: typedFixed,
    goals: typedGoals,
    moodLogs: typedMoodLogs,
    safeData,
    monthSpent,
    categories,
    history: history.reverse(),
  }
}

function buildPrompt({
  message,
  isAnxious,
  context,
  history,
  price,
  wantsLookup,
}: {
  message: string
  isAnxious: boolean
  context: Awaited<ReturnType<typeof loadMoneyContext>>
  history: SarathyHistoryItem[]
  price: ProductPriceLookup | null
  wantsLookup: boolean
}) {
  if (!context) return message
  const targetCurrency = context.profile.primary_currency || 'SGD'

  return [
    `User message: ${message}`,
    '',
    'Current user money context:',
    buildContextBlock(context),
    '',
    'Product price context:',
    buildPriceBlock(price, targetCurrency, wantsLookup),
    '',
    history.length ? `Recent conversation:\n${buildHistoryBlock(history)}` : 'Recent conversation: none',
    '',
    isAnxious
      ? 'The user is anxious. Be grounding, concrete, and non-judgmental.'
      : 'The user wants practical money guidance.',
  ].join('\n')
}

async function generateReply({
  prompt,
  useWebSearch,
}: {
  prompt: string
  useWebSearch: boolean
}) {
  try {
    return await generateWithOpenAI({
      instructions: SARATHY_INSTRUCTIONS,
      maxOutputTokens: 320,
      tools: useWebSearch ? WEB_SEARCH_TOOL : undefined,
      content: [{ type: 'input_text', text: prompt }],
    })
  } catch (err) {
    if (!useWebSearch) throw err

    const fallbackPrompt = [
      prompt,
      '',
      'Web search was unavailable. If the product price was not provided in product price context, ask the user for a link or price instead of guessing.',
    ].join('\n')

    return generateWithOpenAI({
      instructions: SARATHY_INSTRUCTIONS,
      maxOutputTokens: 260,
      content: [{ type: 'input_text', text: fallbackPrompt }],
    })
  }
}

function streamText(text: string) {
  return text.match(/\S+\s*/g) || [text]
}

async function getSessionUserId() {
  try {
    const session = await getServerSession(authOptions)
    return session?.user?.id || null
  } catch (err) {
    console.error('Sarathy session lookup failed:', err)
    return null
  }
}

export async function POST(req: NextRequest) {
  let usageEventId: string | null = null

  try {
    const userId = await getSessionUserId()
    if (!userId) {
      return NextResponse.json({ message: 'Please sign in again.' }, { status: 401 })
    }

    if (!isOpenAIConfigured()) {
      return NextResponse.json(
        { message: "Sarathy's AI is not configured yet. Add OPENAI_API_KEY in Railway to turn this on." },
        { status: 503 },
      )
    }

    const body = await req.json()
    const message = typeof body.message === 'string' ? body.message.trim() : ''
    if (!message) {
      return NextResponse.json({ message: 'Ask me something about your money and I will help.' }, { status: 400 })
    }

    const context = await loadMoneyContext(userId)
    if (!context) {
      return NextResponse.json({ message: 'Profile not found. Please complete setup again.' }, { status: 404 })
    }

    const isAnxious = Boolean(body.isAnxious)
    const shouldStream = Boolean(body.stream)
    const shouldPersistChat = body.source === 'chat' || shouldStream
    const wantsLookup = shouldLookupProductPrice(message)
    const knownPrice = wantsLookup
      ? await lookupKnownProductPrice(message, context.profile.primary_currency || 'SGD')
      : null
    const useWebSearch = wantsLookup && !knownPrice

    const quota = await reserveAiUsage({
      userId,
      planTier: context.profile.plan_tier,
      productLookup: wantsLookup,
      model: OPENAI_MODEL,
    })
    usageEventId = quota.eventId

    if (!quota.allowed) {
      return NextResponse.json(
        {
          message: `You have used today's ${quota.limit} Sarathy AI messages. Try again tomorrow or move to Plus for a higher daily limit.`,
        },
        { status: 429 },
      )
    }

    const requestHistory = Array.isArray(body.history) ? (body.history as SarathyHistoryItem[]) : []
    const serverHistory = context.history.map(item => ({ role: item.role, content: item.content }))
    const history = shouldPersistChat ? serverHistory : requestHistory
    const prompt = buildPrompt({
      message,
      isAnxious,
      context,
      history,
      price: knownPrice,
      wantsLookup,
    })

    if (shouldPersistChat) {
      await prisma.chatMessage.create({
        data: { user_id: userId, role: 'user', content: message },
      })
    }

    if (shouldStream) {
      const encoder = new TextEncoder()
      let assistantText = ''

      const stream = new ReadableStream({
        async start(controller) {
          const send = (payload: unknown) => {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`))
          }

          try {
            try {
              for await (const delta of streamWithOpenAI({
                instructions: SARATHY_INSTRUCTIONS,
                maxOutputTokens: 320,
                tools: useWebSearch ? WEB_SEARCH_TOOL : undefined,
                content: [{ type: 'input_text', text: prompt }],
              })) {
                assistantText += delta
                send({ delta })
              }
            } catch (err) {
              if (!useWebSearch) throw err

              const fallback = await generateReply({ prompt, useWebSearch: false })
              for (const delta of streamText(fallback || 'I could not verify that product price. Send me the link or exact price and I will check it against your budget.')) {
                assistantText += delta
                send({ delta })
              }
            }

            const finalMessage = normalizeAssistantMessage(assistantText || "I'm having a moment. Try again in a sec.")
            if (shouldPersistChat) {
              await prisma.chatMessage.create({
                data: { user_id: userId, role: 'assistant', content: finalMessage },
              })
            }
            await finishAiUsage({ eventId: usageEventId, status: 'completed' })
            send({ done: true, message: finalMessage, usage: { used: quota.used, limit: quota.limit } })
          } catch (err) {
            console.error('Sarathy stream failed:', err)
            await finishAiUsage({ eventId: usageEventId, status: 'failed' })
            send({ error: "I'm having trouble connecting right now, but I'm here. Try again in a moment." })
          } finally {
            controller.close()
          }
        },
      })

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream; charset=utf-8',
          'Cache-Control': 'no-cache, no-transform',
          Connection: 'keep-alive',
        },
      })
    }

    const raw = await generateReply({ prompt, useWebSearch })
    const assistantMessage = normalizeAssistantMessage(raw || "I'm having a moment. Try again in a sec.")
    await finishAiUsage({ eventId: usageEventId, status: 'completed' })

    return NextResponse.json({
      message: assistantMessage,
      usage: { used: quota.used, limit: quota.limit },
    })
  } catch (err) {
    console.error('Sarathy route failed:', err)
    await finishAiUsage({ eventId: usageEventId, status: 'failed' })
    return NextResponse.json({ message: "I'm having trouble connecting right now, but I'm here. Try again in a moment." })
  }
}
