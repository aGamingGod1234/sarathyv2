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

const SARATHY_INSTRUCTIONS = [
  'You are Sarathy, a personal finance companion inside the app.',
  'Sound concise, friendly, steady, and personal. Be a calm money companion, not a bank, therapist, or generic chatbot.',
  'Keep most replies to 1 to 4 short sentences. Use simple words and make the next step obvious.',
  'Use the user name, responsibility, money fear, currency, streak, and safe-to-spend context only when it feels natural.',
  'Never pretend to know data that was not provided. If a field is unknown, do not mention it.',
  'When numbers are provided, use them directly and explain what they mean in practical terms.',
  'If the user is anxious, slow the reply down: validate the feeling, point to the safest concrete next action, and avoid shame.',
  'Do not be salesy, noisy, moralizing, overly cheerful, or dramatic.',
  'Use plain ASCII punctuation only. Do not use em dashes, en dashes, smart quotes, ellipses, or decorative symbols.',
  'Avoid generic disclaimers unless the user asks for formal financial advice. Keep the answer under 110 words unless the user asks for detail.',
].join(' ')

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
      instructions: SARATHY_INSTRUCTIONS,
      maxOutputTokens: 450,
      content: [{ type: 'input_text', text: prompt }],
    })

    return NextResponse.json({ message: raw ? normalizeAssistantMessage(raw) : "I'm having a moment. Try again in a sec." })
  } catch {
    return NextResponse.json({ message: "I'm having trouble connecting right now, but I'm here. Try again in a moment." })
  }
}
