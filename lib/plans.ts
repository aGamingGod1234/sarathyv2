export type PlanTier = 'free' | 'plus'

export type PlanFeature = {
  id: string
  title: string
  description: string
  free: string
  plus: string
}

export type PlanDefinition = {
  tier: PlanTier
  name: string
  shortName: string
  price: string
  cadence: string
  description: string
  cta: string
  highlights: string[]
}

export const PLAN_DEFINITIONS: Record<PlanTier, PlanDefinition> = {
  free: {
    tier: 'free',
    name: 'Sarathy Starter',
    shortName: 'Starter',
    price: 'S$0',
    cadence: 'forever',
    description: 'The daily safety loop for people who want to know if today is okay.',
    cta: 'Keep using Starter',
    highlights: [
      'Safe-to-spend check',
      'Basic transaction logging',
      'Starter goals and money story',
      'Full current money context in chat',
    ],
  },
  plus: {
    tier: 'plus',
    name: 'Sarathy Plus',
    shortName: 'Plus',
    price: 'S$5.99',
    cadence: 'per month',
    description: 'Deeper memory, stronger planning, and a more personal Sarathy that keeps learning with you.',
    cta: 'Prepare Plus upgrade',
    highlights: [
      'Unlimited imports and receipt scans',
      'Longer Sarathy chat memory',
      'Advanced future scenarios',
      'Monthly personal money report',
      'Family and remittance guardrails',
    ],
  },
}

export const PLAN_FEATURES: PlanFeature[] = [
  {
    id: 'ai-memory',
    title: 'Sarathy context and memory',
    description: 'The companion can use your real app data for direct, practical answers.',
    free: 'Full current profile, budget, transactions, fixed costs, goals, and mood context',
    plus: 'Longer historical memory and richer personal recall',
  },
  {
    id: 'imports',
    title: 'Imports and scans',
    description: 'Keep the app useful without making every expense a manual chore.',
    free: 'Manual logging and light imports',
    plus: 'Unlimited statement imports and receipt scans',
  },
  {
    id: 'future',
    title: 'Future scenarios',
    description: 'See how small changes affect your next few months before you commit.',
    free: 'Basic 6-month projection',
    plus: 'Custom what-if scenarios and saved plans',
  },
  {
    id: 'reports',
    title: 'Personal reports',
    description: 'Turn the month into a readable story you can actually learn from.',
    free: 'In-app story and XP',
    plus: 'Monthly personal money report',
  },
  {
    id: 'support',
    title: 'Home and family planning',
    description: 'Protect support for family, rent, school, and remittance before spending decisions.',
    free: 'Basic responsible-for context',
    plus: 'Dedicated guardrails and reminders',
  },
]

export function getPlanDefinition(tier?: string | null) {
  return tier === 'plus' ? PLAN_DEFINITIONS.plus : PLAN_DEFINITIONS.free
}
