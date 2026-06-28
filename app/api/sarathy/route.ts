import { NextRequest, NextResponse } from 'next/server'
import { generateWithOpenAI, isOpenAIConfigured } from '@/lib/ai'

type SarathyContext = {
  name?: string | null
  companion_vibe?: string | null
  currency?: string | null
  planning_amount?: number | null
  spent?: number | null
  safe_today?: number | null
  days_remaining?: number | null
  status?: string | null
  money_fear?: string | null
  responsible_for?: string | null
  streak?: number | null
}

type SarathyHistoryItem = {
  role?: string
  content?: string
}

function compactValue(value: unknown) {
  if (value === null || value === undefined || value === '') return 'unknown'
  return String(value)
}

function buildContextBlock(context: SarathyContext = {}) {
  return [
    `Name: ${compactValue(context.name)}`,
    `Tone: ${compactValue(context.companion_vibe)}`,
    `Currency: ${compactValue(context.currency)}`,
    `Monthly plan: ${compactValue(context.planning_amount)}`,
    `Spent this period: ${compactValue(context.spent)}`,
    `Safe today: ${compactValue(context.safe_today)}`,
    `Days remaining: ${compactValue(context.days_remaining)}`,
    `Budget status: ${compactValue(context.status)}`,
    `Money fear: ${compactValue(context.money_fear)}`,
    `Responsible for: ${compactValue(context.responsible_for)}`,
    `Login streak: ${compactValue(context.streak)}`,
  ].join('\n')
}

function buildHistoryBlock(history: SarathyHistoryItem[] = []) {
  return history
    .slice(-8)
    .map(item => `${item.role === 'assistant' ? 'Sarathy' : 'User'}: ${compactValue(item.content)}`)
    .join('\n')
}

export async function POST(req: NextRequest) {
  try {
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

    const context = (body.context || {}) as SarathyContext
    const history = Array.isArray(body.history) ? (body.history as SarathyHistoryItem[]) : []
    const isAnxious = Boolean(body.isAnxious)

    const prompt = [
      `User message: ${message}`,
      '',
      'Current user money context:',
      buildContextBlock(context),
      '',
      history.length ? `Recent conversation:\n${buildHistoryBlock(history)}` : 'Recent conversation: none',
      '',
      isAnxious
        ? 'The user is anxious. Be grounding, concrete, and non-judgmental.'
        : 'The user wants practical money guidance.',
    ].join('\n')

    const raw = await generateWithOpenAI({
      instructions: [
        'You are Sarathy, a personal finance companion inside the app.',
        'Give concise, warm, specific guidance based only on the provided context.',
        'Do not claim to access bank accounts or data that was not provided.',
        'Avoid generic disclaimers. Keep the answer under 110 words unless the user asks for detail.',
      ].join(' '),
      maxOutputTokens: 450,
      content: [{ type: 'input_text', text: prompt }],
    })

    return NextResponse.json({ message: raw?.trim() || "I'm having a moment. Try again in a sec." })
  } catch {
    return NextResponse.json({ message: "I'm having trouble connecting right now, but I'm here. Try again in a moment." })
  }
}
