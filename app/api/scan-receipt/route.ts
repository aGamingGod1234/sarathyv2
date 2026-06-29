import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { OPENAI_MODEL, generateWithOpenAI, isOpenAIConfigured } from '@/lib/ai'
import { finishAiUsage, reserveAiUsage } from '@/lib/ai-usage'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const MAX_RECEIPT_BASE64_LENGTH = 7_000_000

function normalizeImageBase64(value: unknown) {
  if (typeof value !== 'string') return null
  const body = value.includes(',') ? value.split(',').pop() || '' : value
  const compact = body.replace(/\s/g, '')
  if (!compact || compact.length > MAX_RECEIPT_BASE64_LENGTH) return null
  if (!/^[A-Za-z0-9+/=]+$/.test(compact)) return null
  return compact
}

export async function POST(req: NextRequest) {
  let eventId: string | null = null
  try {
    const session = await getServerSession(authOptions)
    const userId = session?.user?.id
    if (!userId) {
      return NextResponse.json({ error: 'Please sign in again before scanning receipts.' }, { status: 401 })
    }

    if (!isOpenAIConfigured()) {
      return NextResponse.json({ error: 'AI receipt scanning is not configured.' }, { status: 503 })
    }

    const body = await req.json().catch(() => null)
    const imageBase64 = normalizeImageBase64(body?.imageBase64)
    if (!imageBase64) {
      return NextResponse.json({ error: 'Upload a valid receipt image under 5 MB.' }, { status: 400 })
    }

    const profile = await prisma.profile.findUnique({
      where: { id: userId },
      select: { plan_tier: true },
    })
    if (!profile) {
      return NextResponse.json({ error: 'Profile not found. Sign out and sign in again.' }, { status: 404 })
    }

    const quota = await reserveAiUsage({
      userId,
      planTier: profile.plan_tier,
      productLookup: false,
      model: OPENAI_MODEL,
    })
    if (!quota.allowed) {
      return NextResponse.json({
        error: `Daily AI limit reached (${quota.used}/${quota.limit}). Try again tomorrow or upgrade to Plus.`,
      }, { status: 429 })
    }
    eventId = quota.eventId

    const raw = await generateWithOpenAI({
      maxOutputTokens: 300,
      content: [
        { type: 'input_image', image_url: `data:image/jpeg;base64,${imageBase64}`, detail: 'low' },
        { type: 'input_text', text: 'Extract from this receipt: total amount, merchant name, and category (Food/Transport/Social/Home/Family/Shopping/Health/Education/Entertainment/Other). Return ONLY JSON: {"amount": 12.50, "merchant": "McDonalds", "category": "Food"}' },
      ],
    })
    const cleaned = (raw || '{}').replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(cleaned)
    await finishAiUsage({ eventId, status: 'completed' })
    return NextResponse.json(parsed)
  } catch (err) {
    console.error('Receipt scan failed:', err)
    await finishAiUsage({ eventId, status: 'failed' })
    return NextResponse.json({ error: 'Could not read this receipt. Try a clearer photo.' }, { status: 502 })
  }
}
