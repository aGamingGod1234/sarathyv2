import Groq from 'groq-sdk'

type TextMessage = {
  role: 'system' | 'user' | 'assistant'
  content: string
}

type TextCompletionOptions = {
  groqModel: string
  maxTokens: number
  messages: TextMessage[]
}

type DeepSeekCompletion = {
  choices?: Array<{
    message?: {
      content?: string | null
    }
  }>
}

const DEEPSEEK_CHAT_URL = 'https://api.deepseek.com/chat/completions'
const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL || 'deepseek-v4-flash'

async function completeWithGroq({ groqModel, maxTokens, messages }: TextCompletionOptions) {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) return null

  const groq = new Groq({ apiKey })
  const completion = await groq.chat.completions.create({
    model: groqModel,
    max_tokens: maxTokens,
    messages,
  })

  return completion.choices[0]?.message?.content || null
}

async function completeWithDeepSeek({ maxTokens, messages }: TextCompletionOptions) {
  const apiKey = process.env.DEEPSEEK_API_KEY
  if (!apiKey) return null

  const response = await fetch(DEEPSEEK_CHAT_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: DEEPSEEK_MODEL,
      max_tokens: maxTokens,
      thinking: { type: 'disabled' },
      messages,
    }),
  })

  if (!response.ok) {
    const details = await response.text().catch(() => '')
    throw new Error(`DeepSeek request failed with ${response.status}: ${details.slice(0, 240)}`)
  }

  const data = (await response.json()) as DeepSeekCompletion
  return data.choices?.[0]?.message?.content || null
}

export async function completeTextWithFallback(options: TextCompletionOptions) {
  try {
    const groqContent = await completeWithGroq(options)
    if (groqContent) return groqContent
  } catch {
    // DeepSeek is the silent fallback for text-only AI routes.
  }

  return completeWithDeepSeek(options)
}
