type OpenAIContent =
  | { type: 'input_text'; text: string }
  | { type: 'input_image'; image_url: string; detail?: 'low' | 'high' | 'auto' }

type OpenAIResponse = {
  output_text?: string
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
}

const OPENAI_RESPONSES_URL = 'https://api.openai.com/v1/responses'
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-5.4-nano'
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

export async function generateWithOpenAI({ content, instructions, maxOutputTokens }: GenerateOptions) {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return null

  const response = await fetch(OPENAI_RESPONSES_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      instructions,
      reasoning: {
        effort: OPENAI_REASONING_EFFORT,
      },
      max_output_tokens: maxOutputTokens,
      input: [
        {
          role: 'user',
          content,
        },
      ],
    }),
  })

  if (!response.ok) {
    const details = await response.text().catch(() => '')
    throw new Error(`OpenAI request failed with ${response.status}: ${details.slice(0, 240)}`)
  }

  return getOutputText((await response.json()) as OpenAIResponse)
}
