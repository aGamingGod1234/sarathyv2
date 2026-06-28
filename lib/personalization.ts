import { BudgetEntry, FixedSpending, Profile, PLCategory, SafeToSpendData } from '@/types'
import { formatCurrency } from './calculations'
import { getLocalDateKey } from './dates'

type MaybeProfile = Partial<Profile> | null | undefined
type InboxAction = 'log-expense' | 'open-safety'

export type SarathyInboxItem = {
  id: string
  title: string
  body: string
  actionLabel: string
  href?: string
  action?: InboxAction
  icon: 'alert' | 'check' | 'clock' | 'home' | 'message' | 'sparkles' | 'target' | 'wallet'
  tone: 'danger' | 'warning' | 'safe' | 'plum' | 'saffron'
}

const DEFAULT_NAME = 'there'

function cleanValue(value?: string | null) {
  return value?.replace(/_/g, ' ').trim() || ''
}

function titleCase(value?: string | null) {
  const cleaned = cleanValue(value)
  if (!cleaned) return ''
  return cleaned
    .split(' ')
    .map(word => word ? word[0].toUpperCase() + word.slice(1).toLowerCase() : word)
    .join(' ')
}

export function getFirstName(profile?: MaybeProfile) {
  const name = profile?.name?.trim()
  if (!name) return DEFAULT_NAME
  return name.split(/\s+/)[0]
}

export function hasPersonalName(profile?: MaybeProfile) {
  return Boolean(profile?.name?.trim())
}

function possessiveTitle(profile: MaybeProfile, label: string) {
  return hasPersonalName(profile) ? `${getFirstName(profile)}'s ${label}` : `Your ${label}`
}

export function getCompanionLabel(profile?: MaybeProfile) {
  const vibe = profile?.companion_vibe
  if (vibe === 'hype_friend') return 'Hype friend'
  if (vibe === 'no_nonsense_sibling') return 'No-nonsense sibling'
  return 'Calm mentor'
}

export function getResponsibilityPhrase(profile?: MaybeProfile) {
  const raw = cleanValue(profile?.responsible_for).toLowerCase()
  if (!raw) return 'your own plan'
  if (raw.includes('parent') || raw.includes('family') || raw.includes('home')) return 'you and the people back home'
  if (raw.includes('partner') || raw.includes('spouse')) return 'you and your partner'
  if (raw.includes('child') || raw.includes('kids')) return 'your household'
  if (raw.includes('self') || raw.includes('me')) return 'you'
  return `your ${raw}`
}

export function getMoneyFearPhrase(profile?: MaybeProfile) {
  const raw = cleanValue(profile?.money_fear).toLowerCase()
  if (!raw) return 'surprise money stress'
  if (raw.includes('run out') || raw.includes('running out')) return 'running out before the month ends'
  if (raw.includes('debt')) return 'debt creeping up'
  if (raw.includes('family') || raw.includes('home')) return 'letting people back home down'
  if (raw.includes('emergency') || raw.includes('surprise')) return 'unexpected costs'
  if (raw.includes('waste')) return 'wasting money on the wrong things'
  return raw
}

export function getProfileCountryLine(profile?: MaybeProfile) {
  const current = titleCase(profile?.current_country)
  const home = titleCase(profile?.home_country)
  if (current && home && current !== home) return `${current} life, ${home} roots`
  if (current) return `Built around life in ${current}`
  if (home) return `Built around your ${home} context`
  return 'Built around your setup'
}

export function getHomePersonalization(
  profile: MaybeProfile,
  safeData: SafeToSpendData,
  topCategory?: PLCategory | null,
) {
  const currency = safeData.currency || profile?.primary_currency || 'SGD'
  const safeAmount = formatCurrency(safeData.safeToSpend, currency)
  const overToday = safeData.safeToSpend < 0 ? formatCurrency(Math.abs(safeData.safeToSpend), currency) : null
  const responsibility = getResponsibilityPhrase(profile)
  const fear = getMoneyFearPhrase(profile)
  const topCategoryLine = topCategory
    ? `${topCategory.category} is your biggest category this month at ${topCategory.percentage}%.`
    : 'Your monthly picture will get sharper as you log a few more expenses.'

  if (safeData.status === 'danger') {
    return {
      eyebrow: 'Personal note',
      title: 'Make today a reset day',
      body: overToday
        ? `You are ${overToday} over today's safe amount. Pause non-essential spending so the plan still protects ${responsibility}.`
        : `You have ${safeAmount} marked safe today. Use Money check before non-essential spending so the plan still protects ${responsibility}.`,
      detail: topCategoryLine,
    }
  }

  if (safeData.status === 'tight') {
    return {
      eyebrow: 'Personal note',
      title: 'Keep today intentional',
      body: `${safeAmount} is available today, but the month is tight. Sarathy is watching for ${fear}, not judging every small purchase.`,
      detail: topCategoryLine,
    }
  }

  return {
    eyebrow: 'Personal note',
    title: 'You have room today',
    body: `${safeAmount} is safe to spend today. Keep ${responsibility} protected by checking the purchases that would change tomorrow.`,
    detail: topCategoryLine,
  }
}

export function getPersonalActionHelpers(
  profile: MaybeProfile,
  safeData?: SafeToSpendData | null,
  topCategory?: PLCategory | null,
) {
  const currency = safeData?.currency || profile?.primary_currency || 'SGD'
  const checkAmount = safeData ? Math.max(10, Math.round(safeData.safeToSpend / 3)) : 25
  const topCategoryName = topCategory?.category || 'top spending'
  const home = titleCase(profile?.home_country)
  const responsibility = getResponsibilityPhrase(profile)

  return {
    check: safeData?.status === 'danger'
      ? 'Pause non-essential spending'
      : `Ask about anything over ${formatCurrency(checkAmount, currency)}`,
    future: `See how ${topCategoryName} changes 6 months`,
    upload: 'Give your budget more signal',
    biases: `Spot patterns behind ${getMoneyFearPhrase(profile)}`,
    insights: 'A read on your actual habits',
    mydata: 'Everything Sarathy knows',
    remittance: home ? `Plan support for ${home}` : 'Rates and support planning',
    marketplace: 'Offers filtered for your setup',
    fixed: `Protect ${responsibility} first`,
  }
}

export function getSarathyOpening(profile: MaybeProfile) {
  const firstName = getFirstName(profile)
  const responsibility = getResponsibilityPhrase(profile)
  const fear = getMoneyFearPhrase(profile)
  return `Hey ${firstName}, I'm Sarathy. I'm keeping an eye on today's budget, ${responsibility}, and ${fear}. What do you want to figure out first?`
}

export function getSarathyQuickChips(profile: MaybeProfile) {
  const responsibility = getResponsibilityPhrase(profile)
  const fear = getMoneyFearPhrase(profile)
  const vibe = profile?.companion_vibe

  const chips = [
    'Can I afford a purchase today?',
    'Check a product price in SGD',
    `What should I protect for ${responsibility}?`,
    `Help me handle ${fear}`,
  ]

  if (vibe === 'no_nonsense_sibling') chips.push('Give me the honest version')
  else if (vibe === 'hype_friend') chips.push('Help me feel in control')
  else chips.push('Walk me through this calmly')

  return chips
}

export function getMoneyCheckIntro(profile: MaybeProfile, safeData?: SafeToSpendData | null) {
  const firstName = getFirstName(profile)
  const personalName = hasPersonalName(profile)
  const responsibility = getResponsibilityPhrase(profile)
  const currency = safeData?.currency || profile?.primary_currency || 'SGD'
  const safeAmount = safeData ? formatCurrency(safeData.safeToSpend, currency) : null
  const overToday = safeData && safeData.safeToSpend < 0
    ? formatCurrency(Math.abs(safeData.safeToSpend), currency)
    : null

  return {
    title: possessiveTitle(profile, 'money check'),
    subtitle: overToday
      ? `You are ${overToday} over today's safe amount. Check only required spending.`
      : safeAmount
      ? `${safeAmount} safe today. Ask before a purchase changes the plan for ${responsibility}.`
      : `Ask before a purchase changes the plan for ${responsibility}.`,
    impulseTitle: personalName ? `Pause for ${firstName}` : 'Pause before spending',
    impulseBody: `A 30-second check for the purchases that usually hit when ${getMoneyFearPhrase(profile)} is loud.`,
  }
}

export function getFutureIntro(profile: MaybeProfile, topCategory?: string | null) {
  const firstName = getFirstName(profile)
  const focus = topCategory || "today's choices"
  return {
    title: possessiveTitle(profile, 'future you'),
    subtitle: `Three 6-month versions based on ${focus}, your budget, and the goals Sarathy knows about.`,
  }
}

export function getInsightsIntro(profile: MaybeProfile) {
  return {
    title: possessiveTitle(profile, 'financial DNA'),
    subtitle: `Patterns from your transactions, moods, and the money stress you named during setup.`,
  }
}

export function getProfileSummary(profile: MaybeProfile) {
  return {
    title: possessiveTitle(profile, 'profile'),
    subtitle: `${getProfileCountryLine(profile)}. Sarathy uses this to tune every check, story, and insight.`,
    note: `${getCompanionLabel(profile)} mode is active for ${getResponsibilityPhrase(profile)}.`,
  }
}

export function getStoryIntro(profile: MaybeProfile) {
  return {
    title: possessiveTitle(profile, 'story'),
    subtitle: `${getProfileCountryLine(profile)}. Your goals, streaks, and XP stay tied to your real life context.`,
  }
}

export function getRemittanceIntro(profile: MaybeProfile) {
  const home = titleCase(profile?.home_country) || 'home'
  return {
    title: home === 'home' ? 'Send money home' : `Send money to ${home}`,
    subtitle: `Compare the cost before money leaves your monthly plan for ${getResponsibilityPhrase(profile)}.`,
  }
}

export function getInitials(profile: MaybeProfile) {
  const name = profile?.name?.trim()
  if (!name) return 'S'
  const parts = name.split(/\s+/).slice(0, 2)
  return parts.map(part => part[0]?.toUpperCase()).join('') || 'S'
}

export function getSarathyInbox(
  profile: MaybeProfile,
  safeData: SafeToSpendData,
  entries: BudgetEntry[],
  fixedSpending: FixedSpending[],
  categories: PLCategory[],
) {
  const currency = safeData.currency || profile?.primary_currency || 'SGD'
  const today = getLocalDateKey()
  const todayEntries = entries.filter(entry => entry.entry_date === today)
  const topCategory = categories[0]
  const todaySpent = todayEntries.reduce((sum, entry) => sum + entry.amount, 0)
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const reminderWindowEnd = new Date(todayStart)
  reminderWindowEnd.setDate(todayStart.getDate() + 5)
  const dueSoon = fixedSpending.find(item => {
    if (item.is_active === false) return false
    if (!item.due_day) return false
    const thisMonthLastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
    const thisMonthDueDay = Math.min(item.due_day, thisMonthLastDay)
    let dueDate = new Date(now.getFullYear(), now.getMonth(), thisMonthDueDay)

    if (dueDate < todayStart) {
      const nextMonthLastDay = new Date(now.getFullYear(), now.getMonth() + 2, 0).getDate()
      const nextMonthDueDay = Math.min(item.due_day, nextMonthLastDay)
      dueDate = new Date(now.getFullYear(), now.getMonth() + 1, nextMonthDueDay)
    }

    return dueDate >= todayStart && dueDate <= reminderWindowEnd
  })

  const items: SarathyInboxItem[] = []

  if (safeData.status === 'danger') {
    items.push({
      id: 'safety-danger',
      title: 'I would check before spending today',
      body: safeData.safeToSpend < 0
        ? `You are ${formatCurrency(Math.abs(safeData.safeToSpend), currency)} over today's safe amount. Pause non-essential spending and check the plan.`
        : todaySpent > safeData.dailyAllowance
        ? `${formatCurrency(todaySpent, currency)} is already logged today. Pause non-essential spending and check the plan.`
        : `${formatCurrency(safeData.safeToSpend, currency)} is marked safe. A 20-second check can keep the plan steady.`,
      actionLabel: 'Open money check',
      href: '/app/check',
      icon: 'alert',
      tone: 'danger',
    })
  } else if (safeData.status === 'tight') {
    items.push({
      id: 'safety-tight',
      title: 'Today needs a lighter touch',
      body: `${formatCurrency(safeData.safeToSpend, currency)} is safe today. Sarathy can help decide what is worth it.`,
      actionLabel: 'Ask before buying',
      href: '/app/check',
      icon: 'clock',
      tone: 'warning',
    })
  }

  if (topCategory && topCategory.percentage >= 55) {
    items.push({
      id: 'top-category',
      title: `${topCategory.category} is leading this month`,
      body: `${topCategory.percentage}% of spending is here. That is high enough to review before the next purchase.`,
      actionLabel: 'Open insight',
      href: '/app/insights',
      icon: 'wallet',
      tone: 'warning',
    })
  }

  if (dueSoon) {
    items.push({
      id: 'fixed-due',
      title: `${dueSoon.name} is coming up`,
      body: `${formatCurrency(dueSoon.amount, currency)} is already part of the protected plan.`,
      actionLabel: 'Review fixed costs',
      href: '/app/fixed',
      icon: 'clock',
      tone: 'warning',
    })
  }

  return {
    title: 'Sarathy inbox',
    subtitle: items.length
      ? 'Important notes only. Mark them read when handled.'
      : 'No important notes right now.',
    items,
  }
}
