import { BudgetEntry, FixedSpending, Profile, SafeToSpendData, SafetyStatus, PLCategory } from '@/types'
import { compareDateKeysDesc, getLocalDateKey, isDateKeyInCurrentMonth } from './dates'

function ordinal(day: number) {
  const suffix = day % 10 === 1 && day % 100 !== 11
    ? 'st'
    : day % 10 === 2 && day % 100 !== 12
    ? 'nd'
    : day % 10 === 3 && day % 100 !== 13
    ? 'rd'
    : 'th'
  return `${day}${suffix}`
}

export function calculateSafeToSpend(
  profile: Profile,
  entries: BudgetEntry[],
  fixedSpending: FixedSpending[]
): SafeToSpendData {
  const now = new Date()
  const today = now.getDate()
  const year = now.getFullYear()
  const month = now.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const daysLeft = daysInMonth - today + 1
  const currency = profile.primary_currency || 'SGD'
  const planAmount = profile.planning_amount || 0

  // Fixed costs still due this month
  const fixedLeft = fixedSpending
    .filter(f => f.is_active && (f.due_day || 1) >= today)
    .reduce((sum, f) => sum + f.amount, 0)

  // Already spent this month
  const currentMonthEntries = entries.filter(e => isDateKeyInCurrentMonth(e.entry_date, now))
  const alreadySpent = currentMonthEntries.reduce((sum, e) => sum + e.amount, 0)
  const todayKey = getLocalDateKey(now)
  const todaySpent = currentMonthEntries
    .filter(e => e.entry_date === todayKey)
    .reduce((sum, e) => sum + e.amount, 0)
  const spentBeforeToday = Math.max(0, alreadySpent - todaySpent)

  // 10% safety buffer
  const buffer = planAmount * 0.10

  // Free money. The headline safe number is the remaining amount for today.
  const freeBeforeToday = planAmount - fixedLeft - spentBeforeToday - buffer
  const freeToUse = planAmount - fixedLeft - alreadySpent - buffer
  const dailyAllowance = Math.max(0, Math.floor(freeBeforeToday / Math.max(daysLeft, 1)))
  const todayRemaining = Math.floor(dailyAllowance - todaySpent)
  const safeToSpend = todayRemaining

  // Safety status
  const dailyIdeal = planAmount / daysInMonth
  let status: SafetyStatus = 'safe'
  if (planAmount <= 0 || freeToUse <= 0 || todaySpent > dailyAllowance) status = 'danger'
  else if (todayRemaining < dailyAllowance * 0.35 || dailyAllowance < dailyIdeal * 0.5) status = 'tight'

  // Safety line in plain language
  let safetyLine = ''
  const monthEnd = ordinal(daysInMonth)
  if (status === 'safe') {
    safetyLine = `You're safe through the ${monthEnd}`
  } else if (todaySpent > dailyAllowance) {
    safetyLine = `Over today's safe amount by ${formatCurrency(Math.abs(todayRemaining), currency)}`
  } else if (status === 'tight') {
    safetyLine = `A bit tight - watch spending through the ${monthEnd}`
  } else {
    safetyLine = `At risk this week - let's fix it`
  }

  return {
    safeToSpend,
    status,
    safetyLine,
    planAmount,
    fixedLeft,
    alreadySpent,
    spentBeforeToday,
    todaySpent,
    todayRemaining,
    dailyAllowance,
    buffer,
    freeToUse,
    daysLeft,
    currency,
  }
}

export function groupEntriesByCategory(entries: BudgetEntry[]): PLCategory[] {
  const groups: Record<string, BudgetEntry[]> = {}
  entries.forEach(entry => {
    if (!groups[entry.category]) groups[entry.category] = []
    groups[entry.category].push(entry)
  })

  const total = entries.reduce((sum, e) => sum + e.amount, 0)

  return Object.entries(groups)
    .map(([category, catEntries]) => ({
      category,
      total: catEntries.reduce((sum, e) => sum + e.amount, 0),
      entries: catEntries.sort((a, b) => compareDateKeysDesc(a.entry_date, b.entry_date)),
      percentage: total > 0 ? Math.round((catEntries.reduce((sum, e) => sum + e.amount, 0) / total) * 100) : 0,
    }))
    .sort((a, b) => b.total - a.total)
}

export function formatCurrency(amount: number, currency: string = 'SGD'): string {
  const isNegative = amount < 0
  const rounded = Math.abs(amount).toFixed(0)
  const currencyCode = (currency || 'SGD').trim().toUpperCase()
  const symbols: Record<string, string> = {
    SGD: 'S$',
    INR: 'Rs ',
    USD: '$',
    GBP: 'GBP ',
    AUD: 'A$',
    CAD: 'C$',
    MYR: 'RM ',
    EUR: 'EUR ',
    CNY: 'CNY ',
    VND: 'VND ',
    PHP: 'PHP ',
    BDT: 'BDT ',
  }

  const formattedAmount = `${symbols[currencyCode] || `${currencyCode} `}${rounded}`
  return isNegative ? `-${formattedAmount}` : formattedAmount
}

export function getCategoryEmoji(category: string): string {
  const map: Record<string, string> = {
    'Food': '🍔',
    'Transport': '🚕',
    'Social': '👥',
    'Home': '🏠',
    'Family': '❤️',
    'Shopping': '🛍️',
    'Health': '💊',
    'Education': '📚',
    'Entertainment': '🎬',
    'Other': '📌',
  }
  return map[category] || '📌'
}

export function getLevelName(xp: number): string {
  if (xp < 200) return 'Starting out'
  if (xp < 500) return 'Getting curious'
  if (xp < 900) return 'Building habits'
  if (xp < 1400) return 'Finding flow'
  if (xp < 2000) return 'Money-smart'
  if (xp < 3000) return 'Sarathy champion'
  if (xp < 5000) return 'Financial guide'
  return 'Sarathy legend'
}

export function getMonthEntries(entries: BudgetEntry[]): BudgetEntry[] {
  const now = new Date()
  return entries.filter(e => isDateKeyInCurrentMonth(e.entry_date, now))
}
