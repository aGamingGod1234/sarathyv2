type OpenAIContent =
  | { type: 'input_text'; text: string }
  | { type: 'input_image'; image_url: string; detail?: 'low' | 'high' | 'auto' }

type OpenAITool =
  | { type: 'web_search_preview'; search_context_size?: 'low' | 'medium' | 'high' }

type OpenAIResponse = {
  output_text?: string
  usage?: {
    input_tokens?: number
    output_tokens?: number
    total_tokens?: number
  }
  output?: Array<{
    content?: Array<{
      type?: string
      text?: string
    }>
  }>
}

type GenerateOptions = {
  content: OpenAIContent[]
  instructions?: string
  maxOutputTokens: number
  model?: string
  tools?: OpenAITool[]
}

const OPENAI_RESPONSES_URL = 'https://api.openai.com/v1/responses'
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-5.5'
const OPENAI_REASONING_EFFORT = process.env.OPENAI_REASONING_EFFORT || 'low'

function getOutputText(data: OpenAIResponse) {
  if (data.output_text) return data.output_text

  for (const item of data.output || []) {
    for (const content of item.content || []) {
      if (content.type === 'output_text' && content.text) {
        return content.text
      }
    }
  }

  return null
}

export function isOpenAIConfigured() {
  return Boolean(process.env.OPENAI_API_KEY)
}

function buildOpenAIBody({ content, instructions, maxOutputTokens, model, tools }: GenerateOptions) {
  return {
    model: model || OPENAI_MODEL,
    instructions,
    reasoning: {
      effort: OPENAI_REASONING_EFFORT,
    },
    max_output_tokens: maxOutputTokens,
    ...(tools?.length ? { tools, tool_choice: 'auto' } : {}),
    input: [
      {
        role: 'user',
        content,
      },
    ],
  }
}

export async function generateWithOpenAI(options: GenerateOptions) {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return null

  const response = await fetch(OPENAI_RESPONSES_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(buildOpenAIBody(options)),
  })

  if (!response.ok) {
    const details = await response.text().catch(() => '')
    throw new Error(`OpenAI request failed with ${response.status}: ${details.slice(0, 240)}`)
  }

  return getOutputText((await response.json()) as OpenAIResponse)
}

export async function* streamWithOpenAI(options: GenerateOptions) {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return

  const response = await fetch(OPENAI_RESPONSES_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ...buildOpenAIBody(options),
      stream: true,
    }),
  })

  if (!response.ok || !response.body) {
    const details = await response.text().catch(() => '')
    throw new Error(`OpenAI stream failed with ${response.status}: ${details.slice(0, 240)}`)
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() || ''

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed.startsWith('data:')) continue
      const raw = trimmed.slice(5).trim()
      if (!raw || raw === '[DONE]') continue

      try {
        const event = JSON.parse(raw)
        if (event.type === 'response.output_text.delta' && typeof event.delta === 'string') {
          yield event.delta
        }
      } catch {
        // Ignore non-JSON SSE metadata lines.
      }
    }
  }
}
