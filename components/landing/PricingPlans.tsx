'use client'

import Link from 'next/link'
import { ArrowRight, Check } from 'lucide-react'
import { PLAN_DEFINITIONS } from '@/lib/plans'
import Faq from './Faq'
import Line from './Line'

const plans = [PLAN_DEFINITIONS.free, PLAN_DEFINITIONS.plus]
const planHighlights = {
  free: [
    'Safe-to-spend check',
    'Basic transaction logging',
    'Starter goals and money story',
    '20 Sarathy messages per day',
  ],
  plus: [
    'Unlimited Sarathy AI messages',
    'Unlimited imports and receipt scans',
    'Advanced future scenarios',
    'Monthly personal money report',
  ],
}

export default function PricingPlans({ isSignedIn }: { isSignedIn: boolean }) {
  return (
    <section id="pricing" className="lp-pricing" aria-labelledby="pricing-title" data-nav-theme="light">
      <div className="lp-container">
        <div className="lp-section-head lp-section-head-center" data-reveal-group>
          <p className="lp-eyebrow" data-reveal="tag">
            Pricing
          </p>
          <h2 id="pricing-title" className="lp-h2" data-reveal="lines">
            <Line>Start free.</Line>
            <Line>
              <em>Upgrade when it pays.</em>
            </Line>
          </h2>
          <p className="lp-lead" data-reveal="text">
            Start on Starter. Add Plus in the app when you need more. Prices in SGD.
          </p>
        </div>

        <div className="lp-plans">
          {plans.map(plan => {
            const isPlus = plan.tier === 'plus'
            const highlights = plan.highlights.filter(highlight => planHighlights[plan.tier].includes(highlight))
            const ctaLabel = isSignedIn ? (isPlus ? 'See Plus' : 'Open app') : isPlus ? 'Get Plus' : 'Start free'
            return (
              <article
                key={plan.tier}
                className={isPlus ? 'lp-plan lp-plan-plus' : 'lp-plan'}
                // Plus sits on the dark ink surface: the token layer swaps every colour inside it.
                data-nav-theme={isPlus ? 'dark' : undefined}
                data-reveal="batch"
              >
                <div className="lp-plan-top">
                  <h3 className="lp-plan-name">{plan.name}</h3>
                  {isPlus && <span className="lp-plan-badge">Most personal</span>}
                </div>
                <p className="lp-plan-desc">{plan.description}</p>
                <p className="lp-plan-price">
                  <span className="lp-plan-amount">{plan.price}</span>
                  <span className="lp-plan-cadence">{plan.cadence}</span>
                </p>
                <ul className="lp-plan-list">
                  {highlights.map(highlight => (
                    <li key={highlight}>
                      <Check className="h-4 w-4 shrink-0" aria-hidden="true" />
                      {highlight}
                    </li>
                  ))}
                </ul>
                <Link
                  href={isSignedIn ? (isPlus ? '/app/profile/plus' : '/app/home') : '/app/signup'}
                  className={isPlus ? 'lp-btn lp-btn-primary lp-plan-cta' : 'lp-btn lp-btn-outline lp-plan-cta'}
                >
                  {ctaLabel}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </article>
            )
          })}
        </div>
        <Faq />
      </div>
    </section>
  )
}
