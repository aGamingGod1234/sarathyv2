const FALLBACK_RATES_TO_SGD: Record<string, number> = {
  USD: 1.35,
  EUR: 1.46,
  GBP: 1.71,
  AUD: 0.9,
  INR: 0.016,
  MYR: 0.29,
  PHP: 0.023,
  CAD: 0.98,
  SGD: 1,
}

export async function convertToCurrency(amount: number, from: string, to: string) {
  const source = from.toUpperCase()
  const target = to.toUpperCase()
  if (source === target) return amount

  try {
    const response = await fetch(`https://api.frankfurter.app/latest?from=${source}&to=${target}`, {
      cache: 'no-store',
    })
    const data = await response.json()
    const rate = Number(data?.rates?.[target])
    if (Number.isFinite(rate) && rate > 0) return amount * rate
  } catch {
    // Fall back to SGD cross-rates when the exchange API is unavailable.
  }

  const sourceToSgd = FALLBACK_RATES_TO_SGD[source]
  const targetToSgd = FALLBACK_RATES_TO_SGD[target]
  if (sourceToSgd && targetToSgd) return amount * (sourceToSgd / targetToSgd)

  return null
}
