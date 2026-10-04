'use client'

import { Import, LockKeyhole, MessageCircle } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useInView } from './hooks'
import Line from './Line'

type Tool = {
  id: string
  title: string
  body: string
  icon: LucideIcon
  visual: () => JSX.Element
}

function ScanVisual() {
  return (
    <div className="tv-scan" aria-hidden="true">
      <div className="tv-receipt">
        <p className="tv-receipt-title">Fairprice</p>
        <p>
          Eggs x10 <span>3.15</span>
        </p>
        <p>
          Bread <span>2.40</span>
        </p>
        <p>
          Milk 1L <span>3.05</span>
        </p>
        <p className="tv-receipt-total">
          Total <span>8.60</span>
        </p>
        <span className="tv-scan-beam" />
      </div>
      <ul className="tv-rows">
        <li style={{ '--i': 0 } as React.CSSProperties}>
          <span className="tv-dot tv-dot-food" />
          Groceries<b>S$8.60</b>
        </li>
        <li style={{ '--i': 1 } as React.CSSProperties}>
          <span className="tv-dot tv-dot-ride" />
          Grab<b>S$14.20</b>
        </li>
        <li style={{ '--i': 2 } as React.CSSProperties}>
          <span className="tv-dot tv-dot-sub" />
          Spotify<b>S$5.99</b>
        </li>
      </ul>
    </div>
  )
}

function FixedVisual() {
  const bills = [
    ['Hall fees', 'S$560.00'],
    ['MRT concession', 'S$64.00'],
    ['Phone plan', 'S$15.00'],
  ]
  return (
    <ul className="tv-bills" aria-hidden="true">
      {bills.map(([name, amount], index) => (
        <li key={name} style={{ '--i': index } as React.CSSProperties}>
          <span className="tv-lock">
            <LockKeyhole className="h-3.5 w-3.5" />
          </span>
          {name}
          <b>{amount}</b>
        </li>
      ))}
    </ul>
  )
}

function ChatVisual() {
  return (
    <div className="tv-chat" aria-hidden="true">
      <p className="tv-bubble tv-bubble-me">Can I afford the concert on Saturday?</p>
      <p className="tv-typing">
        <span />
        <span />
        <span />
      </p>
      <p className="tv-bubble tv-bubble-them">Yes, if you skip two Grab rides this week. You would keep S$15 a day.</p>
    </div>
  )
}

const tools: Tool[] = [
  {
    id: 'import',
    title: 'Imports and scans',
    body: "Snap a receipt, it's sorted.",
    icon: Import,
    visual: ScanVisual,
  },
  {
    id: 'fixed',
    title: 'Fixed costs, protected',
    body: 'Bills set aside first.',
    icon: LockKeyhole,
    visual: FixedVisual,
  },
  {
    id: 'chat',
    title: 'Sarathy chat',
    body: 'Answers from your real numbers.',
    icon: MessageCircle,
    visual: ChatVisual,
  },
]

function ToolCard({ tool }: { tool: Tool }) {
  const [ref, inView] = useInView<HTMLElement>()
  const Visual = tool.visual
  const Icon = tool.icon

  return (
    <article
      ref={ref}
      className={`lp-tool lp-tool-${tool.id}`}
      data-live={inView || undefined}
      data-reveal="batch"
    >
      <div className="lp-tool-visual">
        <Visual />
      </div>
      <div className="lp-tool-body">
        <div className="lp-tool-meta">
          <span className="lp-tool-icon">
            <Icon className="h-4 w-4" aria-hidden="true" />
          </span>
        </div>
        <h3 className="lp-tool-title">{tool.title}</h3>
        <p className="lp-tool-text">{tool.body}</p>
      </div>
    </article>
  )
}

export default function ToolsBento() {
  return (
    <section id="features" className="lp-tools" aria-labelledby="tools-title" data-nav-theme="light" data-day="16">
      <div className="lp-container">
        <div className="lp-section-head" data-reveal-group>
          <p className="lp-chapter" data-reveal="tag">
            <span>Day 16</span> The quiet work
          </p>
          <h2 id="tools-title" className="lp-h2" data-reveal="lines">
            <Line>Everything else,</Line>
            <Line>
              <em>handled quietly.</em>
            </Line>
          </h2>
          <p className="lp-lead" data-reveal="text">
            Receipts, bills and questions, handled without a spreadsheet.
          </p>
        </div>
        <div className="lp-tools-grid">
          {tools.map(tool => (
            <ToolCard key={tool.id} tool={tool} />
          ))}
        </div>
      </div>
    </section>
  )
}
