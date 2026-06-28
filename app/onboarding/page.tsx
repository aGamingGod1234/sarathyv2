'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowRight,
  BadgeCheck,
  BriefcaseBusiness,
  CalendarClock,
  Check,
  Crown,
  Gem,
  Globe2,
  GraduationCap,
  HeartHandshake,
  Home,
  MessageCircleHeart,
  ShieldCheck,
  Sparkles,
  UserRound,
  WalletCards,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { PLAN_DEFINITIONS } from '@/lib/plans'
import CurrencySelector from '@/components/ui/CurrencySelector'

type VibeId = 'calm_mentor' | 'hype_friend' | 'no_nonsense_sibling'
type PlanChoice = 'free' | 'plus'

type Choice = {
  id: string
  title: string
  description: string
  icon: LucideIcon
}

const introWords = 'Sarathy would like to know more about you to personalize your experience.'.split(' ')

const identityOptions: Choice[] = [
  {
    id: 'International student',
    title: 'International student',
    description: 'Budget, rent, food, school, and life away from home.',
    icon: GraduationCap,
  },
  {
    id: 'Young professional',
    title: 'Young professional',
    description: 'Income, independence, family support, and future plans.',
    icon: BriefcaseBusiness,
  },
  {
    id: 'Family planner',
    title: 'Family planner',
    description: 'Household decisions, commitments, and people depending on you.',
    icon: Home,
  },
]

const vibeOptions: Array<Choice & { id: VibeId }> = [
  {
    id: 'calm_mentor',
    title: 'Calm mentor',
    description: 'Soft, steady, and reassuring when money feels heavy.',
    icon: ShieldCheck,
  },
  {
    id: 'hype_friend',
    title: 'Hype friend',
    description: 'Warm, energetic, and good at making progress feel visible.',
    icon: Sparkles,
  },
  {
    id: 'no_nonsense_sibling',
    title: 'No-nonsense sibling',
    description: 'Direct, practical, and kind without sugarcoating.',
    icon: HeartHandshake,
  },
]

const responsibilityOptions = ['Me only', 'Me and parents', 'Me and partner', 'My whole family']
const fearOptions = [
  'Running out before month-end',
  'Letting family down',
  'Debt creeping up',
  'Not knowing where money goes',
  'Feeling guilty spending on myself',
]
const incomeOptions = ['Weekly', 'Monthly', 'Irregular']
const moneyTypeOptions = ['Monthly salary', 'Student stipend', 'Household budget', 'Irregular income', 'Lump sum']

function numericValue(value: string) {
  const parsed = Number.parseFloat(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function firstName(name: string) {
  return name.trim().split(/\s+/)[0] || 'there'
}

function setupResponsibilityPhrase(value: string) {
  if (value === 'Me only') return 'you'
  if (value === 'Me and parents') return 'you and your parents'
  if (value === 'Me and partner') return 'you and your partner'
  if (value === 'My whole family') return 'your whole family'
  return 'your real responsibilities'
}

function OptionCard({
  selected,
  title,
  description,
  icon: Icon,
  onClick,
}: {
  selected: boolean
  title: string
  description: string
  icon: LucideIcon
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition-all ${
        selected
          ? 'border-saffron bg-saffron-soft shadow-sm'
          : 'border-line bg-white active:bg-cream'
      }`}
    >
      <span
        className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${
          selected ? 'bg-saffron text-white' : 'bg-cream text-saffron'
        }`}
      >
        <Icon className="h-5 w-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center justify-between gap-2">
          <span className="text-sm font-semibold text-ink">{title}</span>
          {selected && <Check className="h-4 w-4 flex-shrink-0 text-saffron" />}
        </span>
        <span className="mt-1 block text-xs leading-relaxed text-ink-3">{description}</span>
      </span>
    </button>
  )
}

function Chip({
  selected,
  children,
  onClick,
}: {
  selected: boolean
  children: React.ReactNode
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3.5 py-2 text-sm font-medium transition-all ${
        selected
          ? 'border-saffron bg-saffron text-white'
          : 'border-saffron/20 bg-saffron-soft text-ink'
      }`}
    >
      {children}
    </button>
  )
}

function ProgressiveBlock({
  show,
  children,
  className = '',
}: {
  show: boolean
  children: React.ReactNode
  className?: string
}) {
  if (!show) return null
  return <section className={`page-enter ${className}`}>{children}</section>
}

export default function OnboardingPage() {
  const router = useRouter()
  const supabase = createClient()

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [name, setName] = useState('')
  const [selectedUserTypes, setSelectedUserTypes] = useState<string[]>([])
  const [currentCountry, setCurrentCountry] = useState('Singapore')
  const [homeCountry, setHomeCountry] = useState('')
  const [primaryCurrency, setPrimaryCurrency] = useState('SGD')
  const [vibe, setVibe] = useState<VibeId>('calm_mentor')
  const [responsibleFor, setResponsibleFor] = useState('')
  const [moneyFear, setMoneyFear] = useState('')
  const [incomeTiming, setIncomeTiming] = useState('')
  const [totalMoney, setTotalMoney] = useState('')
  const [moneyType, setMoneyType] = useState('')
  const [hasCommitted, setHasCommitted] = useState(false)
  const [committedAmount, setCommittedAmount] = useState('')
  const [selectedPlan, setSelectedPlan] = useState<PlanChoice>('free')

  const totalAmount = numericValue(totalMoney)
  const committed = hasCommitted ? numericValue(committedAmount) : 0
  const planningAmount = Math.max(0, totalAmount - committed)

  const selectedVibe = vibeOptions.find(option => option.id === vibe) || vibeOptions[0]
  const selectedIdentity = selectedUserTypes[0] || 'your setup'
  const starterPlan = PLAN_DEFINITIONS.free
  const plusPlan = PLAN_DEFINITIONS.plus

  const hasName = Boolean(name.trim())
  const hasLocation = Boolean(currentCountry.trim() && primaryCurrency)
  const hasIdentity = selectedUserTypes.length > 0
  const hasVibe = Boolean(vibe)
  const hasResponsibility = Boolean(responsibleFor)
  const hasFear = Boolean(moneyFear)
  const hasIncome = Boolean(incomeTiming)
  const hasMoneyAmount = totalAmount > 0
  const hasMoneyProfile = Boolean(moneyType) && (!hasCommitted || committed > 0)
  const isComplete = hasName
    && hasLocation
    && hasIdentity
    && hasVibe
    && hasResponsibility
    && hasFear
    && hasIncome
    && hasMoneyAmount
    && hasMoneyProfile

  const progress = [
    hasName,
    hasLocation,
    hasIdentity,
    hasVibe,
    hasResponsibility,
    hasFear,
    hasIncome,
    hasMoneyAmount,
    hasMoneyProfile,
    isComplete,
  ].filter(Boolean).length

  const personalPreview = useMemo(() => {
    const person = firstName(name)
    const countryLine = homeCountry.trim()
      ? `${currentCountry || 'your current country'} life with ${homeCountry.trim()} in view`
      : `life in ${currentCountry || 'your current country'}`
    const responsibility = setupResponsibilityPhrase(responsibleFor)
    const fear = moneyFear ? moneyFear.toLowerCase() : 'surprise money stress'

    return `For ${person}, Sarathy will watch ${countryLine}, protect ${responsibility}, and keep an eye on ${fear}.`
  }, [currentCountry, homeCountry, moneyFear, name, responsibleFor])

  const toggleUserType = (id: string) => {
    setSelectedUserTypes(current =>
      current.includes(id)
        ? current.filter(item => item !== id)
        : [...current, id]
    )
  }

  const handleFinish = async () => {
    if (saving || !isComplete) return
    setSaving(true)
    setError('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No user found. Please sign in again.')

      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          name: name.trim(),
          current_country: currentCountry.trim() || null,
          home_country: homeCountry.trim() || null,
          user_types: selectedUserTypes,
          primary_currency: primaryCurrency,
          companion_vibe: vibe,
          responsible_for: responsibleFor,
          money_fear: moneyFear,
          income_timing: incomeTiming,
          total_money: totalAmount || null,
          money_type: moneyType,
          planning_amount: planningAmount,
          onboarding_complete: true,
          total_xp: 300,
          achievements: selectedPlan === 'plus'
            ? ['starter_ready', 'plus_interested']
            : ['starter_ready'],
        })
        .eq('id', user.id)

      if (profileError) throw profileError

      const goals = [
        {
          name: 'Survive this month',
          emoji: '\uD83D\uDCC5',
          target_amount: Math.max(1, planningAmount),
          user_id: user.id,
        },
        {
          name: 'Dream fund',
          emoji: '\u2728',
          target_amount: Math.max(1, planningAmount * 0.1),
          user_id: user.id,
        },
      ]

      if (responsibleFor && responsibleFor !== 'Me only') {
        goals.splice(1, 0, {
          name: 'People I protect',
          emoji: '\u2764\uFE0F',
          target_amount: Math.max(1, planningAmount * 0.2),
          user_id: user.id,
        })
      }

      const { error: goalsError } = await supabase.from('goals').insert(goals)
      if (goalsError) console.error('Failed to create starter goals:', goalsError)

      router.replace('/home')
    } catch (err: any) {
      setError(err.message || 'Something went wrong saving your setup.')
      setSaving(false)
    }
  }

  return (
    <div className="min-h-dvh bg-white">
      <main className="mx-auto min-h-dvh max-w-[480px] bg-cream px-5 pb-8 pt-10">
        <div className="mb-7">
          <p className="text-xs font-semibold uppercase tracking-wide text-saffron">Setup</p>
          <h1 className="mt-2 font-fraunces text-3xl font-semibold leading-tight text-ink">
            {introWords.map((word, index) => (
              <span
                key={`${word}-${index}`}
                className="inline-block opacity-0"
                style={{
                  animation: 'wordReveal 0.5s ease forwards',
                  animationDelay: `${index * 85}ms`,
                }}
              >
                {word}{index === introWords.length - 1 ? '' : '\u00A0'}
              </span>
            ))}
          </h1>
          <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-cream-3" aria-hidden="true">
            <div
              className="h-full rounded-full bg-saffron transition-all duration-500"
              style={{ width: `${Math.min(100, progress * 10)}%` }}
            />
          </div>
        </div>

        <div className="space-y-6">
          <ProgressiveBlock show>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-ink-3">
              What should Sarathy call you?
            </label>
            <div className="relative">
              <UserRound className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-saffron" />
              <input
                type="text"
                value={name}
                onChange={event => setName(event.target.value)}
                placeholder="First name is enough"
                className="input-field pl-11 text-lg font-semibold"
                autoFocus
              />
            </div>
          </ProgressiveBlock>

          <ProgressiveBlock show={hasName} className="space-y-4">
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-ink-3">
                Current country
              </label>
              <input
                type="text"
                value={currentCountry}
                onChange={event => setCurrentCountry(event.target.value)}
                placeholder="Singapore"
                className="input-field"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-ink-3">
                Home country or roots
              </label>
              <input
                type="text"
                value={homeCountry}
                onChange={event => setHomeCountry(event.target.value)}
                placeholder="India, Vietnam, China..."
                className="input-field"
              />
            </div>

            <CurrencySelector
              label="Primary currency"
              value={primaryCurrency}
              onChange={setPrimaryCurrency}
            />
          </ProgressiveBlock>

          <ProgressiveBlock show={hasLocation}>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-3">
              What sounds most like you?
            </p>
            <div className="flex flex-col gap-3">
              {identityOptions.map(option => (
                <OptionCard
                  key={option.id}
                  selected={selectedUserTypes.includes(option.id)}
                  title={option.title}
                  description={option.description}
                  icon={option.icon}
                  onClick={() => toggleUserType(option.id)}
                />
              ))}
            </div>
          </ProgressiveBlock>

          <ProgressiveBlock show={hasIdentity}>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-3">
              Pick the voice you will actually listen to
            </p>
            <div className="flex flex-col gap-3">
              {vibeOptions.map(option => (
                <OptionCard
                  key={option.id}
                  selected={vibe === option.id}
                  title={option.title}
                  description={option.description}
                  icon={option.icon}
                  onClick={() => setVibe(option.id)}
                />
              ))}
            </div>
          </ProgressiveBlock>

          <ProgressiveBlock show={hasVibe}>
            <p className="mb-3 text-sm font-semibold text-ink">Who do you feel responsible for?</p>
            <div className="flex flex-wrap gap-2">
              {responsibilityOptions.map(option => (
                <Chip
                  key={option}
                  selected={responsibleFor === option}
                  onClick={() => setResponsibleFor(option)}
                >
                  {option}
                </Chip>
              ))}
            </div>
          </ProgressiveBlock>

          <ProgressiveBlock show={hasResponsibility}>
            <p className="mb-3 text-sm font-semibold text-ink">What worries you most about money?</p>
            <div className="flex flex-wrap gap-2">
              {fearOptions.map(option => (
                <Chip
                  key={option}
                  selected={moneyFear === option}
                  onClick={() => setMoneyFear(option)}
                >
                  {option}
                </Chip>
              ))}
            </div>
          </ProgressiveBlock>

          <ProgressiveBlock show={hasFear}>
            <p className="mb-3 text-sm font-semibold text-ink">When does money usually come in?</p>
            <div className="flex flex-wrap gap-2">
              {incomeOptions.map(option => (
                <Chip
                  key={option}
                  selected={incomeTiming === option}
                  onClick={() => setIncomeTiming(option)}
                >
                  {option}
                </Chip>
              ))}
            </div>
          </ProgressiveBlock>

          <ProgressiveBlock show={hasIncome}>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-ink-3">
              Monthly budget or income
            </label>
            <div className="rounded-[1.5rem] border border-line bg-white px-4 py-5">
              <input
                type="number"
                value={totalMoney}
                onChange={event => setTotalMoney(event.target.value)}
                placeholder="0"
                min="0"
                className="w-full bg-transparent text-center font-fraunces text-5xl font-semibold text-ink outline-none"
              />
            </div>
          </ProgressiveBlock>

          <ProgressiveBlock show={hasMoneyAmount} className="space-y-4">
            <div>
              <p className="mb-3 text-sm font-semibold text-ink">What kind of money is this?</p>
              <div className="flex flex-wrap gap-2">
                {moneyTypeOptions.map(option => (
                  <Chip
                    key={option}
                    selected={moneyType === option}
                    onClick={() => setMoneyType(option)}
                  >
                    {option}
                  </Chip>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setHasCommitted(current => !current)}
              className="flex w-full items-center gap-3 rounded-2xl border border-line bg-white p-4 text-left"
            >
              <span className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md border ${
                hasCommitted ? 'border-saffron bg-saffron text-white' : 'border-ink-3'
              }`}>
                {hasCommitted && <Check className="h-3.5 w-3.5" />}
              </span>
              <span>
                <span className="block text-sm font-semibold text-ink">Some of this is already committed</span>
                <span className="block text-xs text-ink-3">Rent, investments, family support, bills, or school fees.</span>
              </span>
            </button>

            {hasCommitted && (
              <div className="page-enter">
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-ink-3">
                  Already committed amount
                </label>
                <input
                  type="number"
                  value={committedAmount}
                  onChange={event => setCommittedAmount(event.target.value)}
                  placeholder="0"
                  min="0"
                  className="input-field"
                />
              </div>
            )}
          </ProgressiveBlock>

          <ProgressiveBlock show={Boolean(moneyType) && (!hasCommitted || committed > 0)}>
            <div className="rounded-2xl border border-saffron/20 bg-saffron-soft p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-saffron">Starting plan amount</p>
              <p className="mt-1 font-fraunces text-2xl font-semibold text-ink">
                {primaryCurrency} {planningAmount.toLocaleString()}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-ink-3">
                Sarathy will use this as the first safe-to-spend baseline.
              </p>
            </div>
          </ProgressiveBlock>

          <ProgressiveBlock show={hasMoneyProfile}>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-3">
              Choose how deep Sarathy should go
            </p>
            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={() => setSelectedPlan('free')}
                className={`rounded-[1.5rem] border p-4 text-left transition-all ${
                  selectedPlan === 'free'
                    ? 'border-saffron bg-white shadow-sm'
                    : 'border-line bg-white'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <WalletCards className="h-5 w-5 text-saffron" />
                      <p className="font-semibold text-ink">{starterPlan.name}</p>
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-ink-3">{starterPlan.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-fraunces text-xl font-semibold text-ink">{starterPlan.price}</p>
                    <p className="text-xs text-ink-3">{starterPlan.cadence}</p>
                  </div>
                </div>
                <div className="mt-4 grid gap-2">
                  {starterPlan.highlights.slice(0, 3).map(item => (
                    <div key={item} className="flex items-center gap-2 text-xs text-ink-3">
                      <Check className="h-3.5 w-3.5 text-safe" />
                      {item}
                    </div>
                  ))}
                </div>
              </button>

              <button
                type="button"
                onClick={() => setSelectedPlan('plus')}
                className={`rounded-[1.5rem] border p-4 text-left transition-all ${
                  selectedPlan === 'plus'
                    ? 'border-plum bg-plum text-white shadow-sm'
                    : 'border-line bg-white text-ink'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <Crown className={`h-5 w-5 ${selectedPlan === 'plus' ? 'text-saffron' : 'text-plum'}`} />
                      <p className={`font-semibold ${selectedPlan === 'plus' ? 'text-white' : 'text-ink'}`}>{plusPlan.name}</p>
                    </div>
                    <p className={`mt-1 text-xs leading-relaxed ${selectedPlan === 'plus' ? 'text-white/70' : 'text-ink-3'}`}>{plusPlan.description}</p>
                  </div>
                  <div className="text-right">
                    <p className={`font-fraunces text-xl font-semibold ${selectedPlan === 'plus' ? 'text-white' : 'text-ink'}`}>{plusPlan.price}</p>
                    <p className={`text-xs ${selectedPlan === 'plus' ? 'text-white/60' : 'text-ink-3'}`}>{plusPlan.cadence}</p>
                  </div>
                </div>
                <div className="mt-4 grid gap-2">
                  {plusPlan.highlights.slice(0, 4).map(item => (
                    <div key={item} className={`flex items-center gap-2 text-xs ${selectedPlan === 'plus' ? 'text-white/75' : 'text-ink-3'}`}>
                      <Check className="h-3.5 w-3.5 text-saffron" />
                      {item}
                    </div>
                  ))}
                </div>
              </button>

              <div className="rounded-2xl border border-line bg-white p-4">
                <div className="flex items-start gap-3">
                  <Gem className="mt-0.5 h-5 w-5 flex-shrink-0 text-plum" />
                  <p className="text-xs leading-relaxed text-ink-3">
                    Billing is not turned on in this build yet. Choosing Plus marks your interest and shows you what the paid layer will unlock.
                  </p>
                </div>
              </div>
            </div>
          </ProgressiveBlock>

          <ProgressiveBlock show={isComplete}>
            <div className="rounded-[1.5rem] bg-plum p-5 text-white">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-saffron">
                <BadgeCheck className="h-6 w-6 text-white" />
              </div>
              <h2 className="font-fraunces text-3xl font-semibold leading-tight">Your first Sarathy setup is ready.</h2>
              <p className="mt-3 text-sm leading-relaxed text-white/70">{personalPreview}</p>
            </div>

            <div className="mt-5 grid gap-3">
              <div className="card flex items-start gap-3">
                <MessageCircleHeart className="mt-0.5 h-5 w-5 flex-shrink-0 text-saffron" />
                <div>
                  <p className="text-sm font-semibold text-ink">{selectedVibe.title} voice</p>
                  <p className="mt-1 text-xs leading-relaxed text-ink-3">
                    Chat and daily notes will be tuned to how you prefer to hear money advice.
                  </p>
                </div>
              </div>

              <div className="card flex items-start gap-3">
                <CalendarClock className="mt-0.5 h-5 w-5 flex-shrink-0 text-saffron" />
                <div>
                  <p className="text-sm font-semibold text-ink">A month that starts with context</p>
                  <p className="mt-1 text-xs leading-relaxed text-ink-3">
                    {primaryCurrency} {planningAmount.toLocaleString()} becomes the first number behind safe-to-spend.
                  </p>
                </div>
              </div>

              <div className="card flex items-start gap-3">
                <Globe2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-saffron" />
                <div>
                  <p className="text-sm font-semibold text-ink">{selectedIdentity}</p>
                  <p className="mt-1 text-xs leading-relaxed text-ink-3">
                    Sarathy will use your country, currency, responsibility, and money worry across the app.
                  </p>
                </div>
              </div>
            </div>
          </ProgressiveBlock>

          {error && (
            <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-danger" role="alert" aria-live="polite">
              {error}
            </div>
          )}

          <div className="pt-2">
            <button
              type="button"
              onClick={handleFinish}
              disabled={!isComplete || saving}
              className="btn-primary"
            >
              {saving ? (
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <>
                  Enter Sarathy
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
