import { convertToCurrency } from '@/lib/exchange-rates'

export type ProductPriceLookup = {
  productName: string
  amount: number
  currency: string
  cadence: string
  sourceLabel: string
  sourceUrl: string
  confidence: 'known' | 'none'
  convertedAmount?: number | null
  convertedCurrency?: string | null
}

const moneyPattern = /\b(s\$|sgd|usd|us\$|\$|eur|gbp|aud|cad|inr|rs)\s*\d|\b\d+(\.\d{1,2})?\s*(sgd|usd|eur|gbp|aud|cad|inr)\b/i
const explicitLookupPattern = /\b(price|cost|how much|buy|purchase|order|get|afford|subscribe|subscription|pay for)\b/i
const commercialSignalPattern = /\b(plan|plus|pro|max|premium|ultra|subscription|membership|iphone|ipad|macbook|airpods|playstation|xbox|nintendo|netflix|spotify|youtube|amazon|prime|adobe|canva|notion|figma|cursor|windsurf|chatgpt|claude|gemini|perplexity|vpn|sneakers|shoes|headphones|laptop|monitor|keyboard|mouse|phone|tablet)\b/i
const coachingPromptPattern = /\b(help me|ground me|calm me|feel in control|safe-to-spend|safe to spend|what should i watch|what should i protect|money|budget|debt|income|salary|rent|family|anxious|stress|spending today)\b/i
const genericAffordabilityPattern = /\b(can i afford this|can i afford it|afford this today|afford it today|can i buy this|can i buy it)\b/i
const CLAUDE_MAX_SOURCE = 'https://support.claude.com/en/articles/11049741-what-is-the-max-plan'

export function shouldLookupProductPrice(message: string) {
  const trimmed = message.trim()
  if (!trimmed || moneyPattern.test(trimmed)) return false
  if (trimmed.length > 160) return false

  if (genericAffordabilityPattern.test(trimmed) && !commercialSignalPattern.test(trimmed)) return false
  if (explicitLookupPattern.test(trimmed)) return true
  if (commercialSignalPattern.test(trimmed)) return true

  const words = trimmed
    .replace(/[^\w\s.-]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)

  const looksLikeShortItem =
    words.length >= 2 &&
    words.length <= 7 &&
    /[a-z]/i.test(trimmed) &&
    !coachingPromptPattern.test(trimmed)

  return looksLikeShortItem
}

export async function lookupKnownProductPrice(message: string, targetCurrency = 'SGD'): Promise<ProductPriceLookup | null> {
  const lower = message.toLowerCase()
  let lookup: ProductPriceLookup | null = null

  if (lower.includes('claude') && lower.includes('max') && (lower.includes('20') || lower.includes('20x'))) {
    lookup = {
      productName: 'Claude Max 20x',
      amount: 200,
      currency: 'USD',
      cadence: 'per month',
      sourceLabel: 'Claude Help Center',
      sourceUrl: CLAUDE_MAX_SOURCE,
      confidence: 'known',
    }
  } else if (lower.includes('claude') && lower.includes('max')) {
    lookup = {
      productName: 'Claude Max 5x',
      amount: 100,
      currency: 'USD',
      cadence: 'per month',
      sourceLabel: 'Claude Help Center',
      sourceUrl: CLAUDE_MAX_SOURCE,
      confidence: 'known',
    }
  } else if (lower.includes('claude') && lower.includes('pro')) {
    lookup = {
      productName: 'Claude Pro',
      amount: 20,
      currency: 'USD',
      cadence: 'per month',
      sourceLabel: 'Anthropic Claude pricing',
      sourceUrl: 'https://www.anthropic.com/pricing',
      confidence: 'known',
    }
  }

  if (!lookup) return null

  const convertedAmount = await convertToCurrency(lookup.amount, lookup.currency, targetCurrency)
  return {
    ...lookup,
    convertedAmount,
    convertedCurrency: convertedAmount === null ? null : targetCurrency,
  }
}
