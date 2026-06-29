import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { OPENAI_MODEL, generateWithOpenAI, isOpenAIConfigured } from '@/lib/ai'
import { finishAiUsage, reserveAiUsage } from '@/lib/ai-usage'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const MAX_STATEMENT_TRANSACTIONS = 100
const MAX_DESCRIPTION_LENGTH = 180

function normalizeTransactions(value: unknown) {
  if (!Array.isArray(value)) return null
  if (value.length > MAX_STATEMENT_TRANSACTIONS) return 'too_many' as const

  return value.flatMap((transaction, index) => {
    if (!transaction || typeof transaction !== 'object') return []
    const row = transaction as Record<string, unknown>
    const amount = Number(row.amount)
    const description = String(row.description || '').trim().slice(0, MAX_DESCRIPTION_LENGTH)
    if (!Number.isFinite(amount) || amount <= 0 || !description) return []
    return [{ index, amount, description }]
  })
}

export async function POST(req: NextRequest) {
  let eventId: string | null = null
  try {
    const session = await getServerSession(authOptions)
    const userId = session?.user?.id
    if (!userId) {
      return NextResponse.json({ categorized: [], error: 'Please sign in again before importing statements.' }, { status: 401 })
    }

    if (!isOpenAIConfigured()) {
      return NextResponse.json({ categorized: [], error: 'AI statement parsing is not configured.' }, { status: 503 })
    }

    const body = await req.json().catch(() => null)
    const transactions = normalizeTransactions(body?.transactions)
    if (transactions === 'too_many') {
      return NextResponse.json({
        categorized: [],
        error: `Import up to ${MAX_STATEMENT_TRANSACTIONS} transactions at a time.`,
      }, { status: 413 })
    }
    if (!transactions || transactions.length === 0) {
      return NextResponse.json({ categorized: [] })
    }

    const profile = await prisma.profile.findUnique({
      where: { id: userId },
      select: { plan_tier: true },
    })
    if (!profile) {
      return NextResponse.json({ categorized: [], error: 'Profile not found. Sign out and sign in again.' }, { status: 404 })
    }

    const quota = await reserveAiUsage({
      userId,
      planTier: profile.plan_tier,
      productLookup: false,
      model: OPENAI_MODEL,
    })
    if (!quota.allowed) {
      return NextResponse.json({
        categorized: [],
        error: `Daily AI limit reached (${quota.used}/${quota.limit}). Try again tomorrow or upgrade to Plus.`,
      }, { status: 429 })
    }
    eventId = quota.eventId

    const prompt = `Categorize each transaction into one of: Food, Transport, Social, Home, Family, Shopping, Health, Education, Entertainment, Other. Return ONLY a JSON array: [{"index":0,"category":"Food","description":"McDonald's lunch"}]. Transactions: ${transactions.map((t: any, i: number) => `${i}. Amount: ${t.amount}, Description: "${t.description}"`).join('\n')}`
    const raw = await generateWithOpenAI({
      maxOutputTokens: 2000,
      content: [{ type: 'input_text', text: prompt }],
    })
    const cleaned = (raw || '[]').replace(/```json|```/g, '').trim()
    const categorized = JSON.parse(cleaned)
    if (!Array.isArray(categorized)) throw new Error('AI returned non-array statement categories.')
    await finishAiUsage({ eventId, status: 'completed' })
    return NextResponse.json({ categorized })
  } catch (error) {
    console.error('Statement parse failed:', error)
    await finishAiUsage({ eventId, status: 'failed' })
    return NextResponse.json({ categorized: [], error: 'Could not categorize this statement. Try again or set categories manually.' }, { status: 502 })
  }
}
