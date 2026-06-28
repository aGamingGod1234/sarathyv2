'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
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

const TOTAL_STEPS = 7

type VibeId = 'calm_mentor' | 'hype_friend' | 'no_nonsense_sibling'
type PlanChoice = 'free' | 'plus'

type Choice = {
  id: string
  title: string
  description: string
  icon: LucideIcon
}

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

export default function OnboardingPage() {
  const router = useRouter()
  const supabase = createClient()

  const [step, setStep] = useState(1)
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

  const personalPreview = useMemo(() => {
    const person = firstName(name)
    const countryLine = homeCountry.trim()
      ? `${currentCountry || 'your current country'} life with ${homeCountry.trim()} in view`
      : `life in ${currentCountry || 'your current country'}`
    const responsibility = setupResponsibilityPhrase(responsibleFor)
    const fear = moneyFear ? moneyFear.toLowerCase() : 'surprise money stress'

    return `For ${person}, Sarathy will watch ${countryLine}, protect ${responsibility}, and keep an eye on ${fear}.`
  }, [currentCountry, homeCountry, moneyFear, name, responsibleFor])

  const canContinue = useMemo(() => {
    if (step === 1) return Boolean(name.trim())
    if (step === 2) return Boolean(currentCountry.trim() && primaryCurrency && selectedUserTypes.length)
    if (step === 3) return Boolean(vibe)
    if (step === 4) return Boolean(responsibleFor && moneyFear && incomeTiming)
    if (step === 5) return totalAmount > 0 && Boolean(moneyType)
    return true
  }, [currentCountry, incomeTiming, moneyFear, moneyType, name, primaryCurrency, responsibleFor, selectedUserTypes.length, step, totalAmount, vibe])

  const goNext = () => {
    setError('')
    setStep(current => Math.min(current + 1, TOTAL_STEPS))
  }

  const goPrev = () => {
    setError('')
    setStep(current => Math.max(current - 1, 1))
  }

  const toggleUserType = (id: string) => {
    setSelectedUserTypes(current =>
      current.includes(id)
        ? current.filter(item => item !== id)
        : [...current, id]
    )
  }

  const handleFinish = async () => {
    if (saving) return
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
      <main className="mx-auto flex min-h-dvh max-w-[480px] flex-col bg-cream px-5 pb-8 pt-10">
        <div className="mb-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-saffron">Setup</p>
              <p className="font-fraunces text-2xl font-semibold text-ink">Make Sarathy yours</p>
            </div>
            <div className="rounded-full border border-line bg-white px-3 py-1 text-xs font-semibold text-ink-3">
              {step}/{TOTAL_STEPS}
            </div>
          </div>
          <div className="grid grid-cols-7 gap-1.5" aria-hidden="true">
            {Array.from({ length: TOTAL_STEPS }).map((_, index) => (
              <span
                key={index}
                className={`h-1.5 rounded-full transition-all ${
                  index < step ? 'bg-saffron' : 'bg-cream-3'
                }`}
              />
            ))}
          </div>
        </div>

        <section className="flex min-h-0 flex-1 flex-col page-enter">
          {step === 1 && (
            <div className="flex flex-1 flex-col">
              <div className="mb-8 rounded-[1.75rem] bg-plum p-5 text-white shadow-sm">
                <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10">
                  <UserRound className="h-5 w-5 text-saffron" />
                </div>
                <h1 className="font-fraunces text-3xl font-semibold leading-tight">
                  This should feel like a companion, not a spreadsheet.
                </h1>
                <p className="mt-3 text-sm leading-relaxed text-white/70">
                  Answer a few honest questions and Sarathy will tune the home screen, chat tone, goals, and daily nudges around your actual life.
                </p>
              </div>

              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-ink-3">
                What should Sarathy call you?
              </label>
              <input
                type="text"
                value={name}
                onChange={event => setName(event.target.value)}
                placeholder="First name is enough"
                className="input-field text-lg font-semibold"
                autoFocus
              />

              {name.trim() && (
                <div className="mt-4 rounded-2xl border border-saffron/20 bg-saffron-soft p-4">
                  <p className="text-sm font-semibold text-ink">Hey {firstName(name)}.</p>
                  <p className="mt-1 text-xs leading-relaxed text-ink-3">
                    I will keep the setup quiet and useful. No spam, no generic money lectures.
                  </p>
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="flex flex-1 flex-col">
              <h1 className="font-fraunces text-2xl font-semibold text-ink">Where does your money life happen?</h1>
              <p className="mt-2 text-sm leading-relaxed text-ink-3">
                Sarathy uses this for currency, remittance context, and the way it frames advice.
              </p>

              <div className="mt-6 flex flex-col gap-4">
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

                <div>
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
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="flex flex-1 flex-col">
              <h1 className="font-fraunces text-2xl font-semibold text-ink">Pick the voice you will actually listen to.</h1>
              <p className="mt-2 text-sm leading-relaxed text-ink-3">
                This changes the way Sarathy writes check-ins, warnings, and chat replies.
              </p>
              <div className="mt-6 flex flex-col gap-3">
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
              <div className="mt-5 rounded-2xl border border-line bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-3">Preview</p>
                <p className="mt-2 text-sm leading-relaxed text-ink">
                  {selectedVibe.title} mode is active for {firstName(name)}. Sarathy will keep things personal without becoming noisy.
                </p>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="flex min-h-0 flex-1 flex-col overflow-y-auto pr-1">
              <h1 className="font-fraunces text-2xl font-semibold text-ink">What should Sarathy protect?</h1>
              <p className="mt-2 text-sm leading-relaxed text-ink-3">
                These answers make the app feel like it knows what is at stake.
              </p>

              <div className="mt-6 flex flex-col gap-6">
                <div>
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
                </div>

                <div>
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
                </div>

                <div>
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
                </div>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="flex flex-1 flex-col">
              <h1 className="font-fraunces text-2xl font-semibold text-ink">Set your first monthly number.</h1>
              <p className="mt-2 text-sm leading-relaxed text-ink-3">
                This becomes the starting point for safe-to-spend, reminders, and future projections.
              </p>

              <div className="mt-7 rounded-[1.75rem] border border-line bg-white p-5">
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-ink-3">
                  Monthly budget or income
                </label>
                <input
                  type="number"
                  value={totalMoney}
                  onChange={event => setTotalMoney(event.target.value)}
                  placeholder="0"
                  min="0"
                  className="w-full bg-transparent text-center font-fraunces text-5xl font-semibold text-ink outline-none"
                />
                <div className="mt-4 flex flex-wrap justify-center gap-2">
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
                className="mt-4 flex items-center gap-3 rounded-2xl border border-line bg-white p-4 text-left"
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
                <div className="mt-4">
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

              {totalAmount > 0 && (
                <div className="mt-4 rounded-2xl border border-saffron/20 bg-saffron-soft p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-saffron">Starting plan amount</p>
                  <p className="mt-1 font-fraunces text-2xl font-semibold text-ink">
                    {primaryCurrency} {planningAmount.toLocaleString()}
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-ink-3">
                    Sarathy will use this as the first safe-to-spend baseline.
                  </p>
                </div>
              )}
            </div>
          )}

          {step === 6 && (
            <div className="flex min-h-0 flex-1 flex-col overflow-y-auto pr-1">
              <h1 className="font-fraunces text-2xl font-semibold text-ink">Choose how deep Sarathy should go.</h1>
              <p className="mt-2 text-sm leading-relaxed text-ink-3">
                Starter is enough to begin. Plus is for people who want Sarathy to become part of their money routine.
              </p>

              <div className="mt-6 flex flex-col gap-3">
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
              </div>

              <div className="mt-4 rounded-2xl border border-line bg-white p-4">
                <div className="flex items-start gap-3">
                  <Gem className="mt-0.5 h-5 w-5 flex-shrink-0 text-plum" />
                  <p className="text-xs leading-relaxed text-ink-3">
                    Billing is not turned on in this build yet. Choosing Plus marks your interest and shows you what the paid layer will unlock.
                  </p>
                </div>
              </div>
            </div>
          )}

          {step === 7 && (
            <div className="flex flex-1 flex-col">
              <div className="rounded-[1.75rem] bg-plum p-5 text-white">
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-saffron">
                  <BadgeCheck className="h-6 w-6 text-white" />
                </div>
                <h1 className="font-fraunces text-3xl font-semibold leading-tight">Your first Sarathy setup is ready.</h1>
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

              {error && (
                <div className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-danger" role="alert" aria-live="polite">
                  {error}
                </div>
              )}
            </div>
          )}
        </section>

        <div className="mt-6 flex gap-3">
          {step > 1 && (
            <button type="button" onClick={goPrev} className="btn-secondary flex-1">
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
          )}
          {step < TOTAL_STEPS ? (
            <button
              type="button"
              onClick={goNext}
              disabled={!canContinue}
              className="btn-primary flex-1"
            >
              Continue
              <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinish}
              disabled={saving}
              className="btn-primary flex-1"
            >
              {saving ? (
                <span className="h-5 w-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
              ) : (
                <>
                  Enter Sarathy
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          )}
        </div>
      </main>
    </div>
  )
}
