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
const productSignalPattern = /\b(price|cost|buy|afford|subscription|plan|plus|pro|max|premium|claude|chatgpt|netflix|spotify|notion|figma|cursor|windsurf)\b/i
const CLAUDE_MAX_SOURCE = 'https://support.claude.com/en/articles/11049741-what-is-the-max-plan'

export function shouldLookupProductPrice(message: string) {
  const trimmed = message.trim()
  if (!trimmed || moneyPattern.test(trimmed)) return false
  return productSignalPattern.test(trimmed) && trimmed.length <= 160
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
