'use client'

import { useId, useState } from 'react'
import { Plus } from 'lucide-react'
import { PLAN_DEFINITIONS } from '@/lib/plans'

const plus = PLAN_DEFINITIONS.plus

// Answers stick to what the app does today (CSV statement import, receipt photos,
// manual logging, the My data page, the plan definitions in lib/plans.ts).
const questions = [
  {
    q: 'Do I have to link my bank account?',
    a: 'No. Import a CSV statement from your bank, snap a photo of a receipt, or log spending yourself. Sarathy works from what you choose to give it.',
  },
  {
    q: 'What does Plus add?',
    a: `${plus.name} is ${plus.price} ${plus.cadence}: unlimited Sarathy messages, unlimited imports and receipt scans, saved chat history, future scenarios, a monthly personal money report, and family and remittance guardrails.`,
  },
  {
    q: 'Can I see what Sarathy knows about me?',
    a: 'Yes. The My data page shows the profile, logs and context Sarathy uses for its answers.',
  },
]

export default function Faq() {
  const baseId = useId()
  const [open, setOpen] = useState(0)

  return (
    <div className="lp-faq" data-reveal-group data-reveal="text">
      <h3 className="lp-faq-title">Questions before you start</h3>
      <div className="lp-faq-list">
        {questions.map((item, index) => {
          const isOpen = open === index
          const panelId = `${baseId}-panel-${index}`
          return (
            <div key={item.q} className="lp-faq-item" data-open={isOpen || undefined}>
              <h4>
                <button
                  type="button"
                  className="lp-faq-q"
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() => setOpen(isOpen ? -1 : index)}
                >
                  {item.q}
                  <Plus className="lp-faq-icon h-4 w-4" aria-hidden="true" />
                </button>
              </h4>
              <div id={panelId} className="lp-faq-a" role="region" aria-label={item.q}>
                <div>
                  <p>{item.a}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
