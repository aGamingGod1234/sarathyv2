'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { BrandMark } from '@/components/ui/BrandLogo'
import { formatSgd, safeToday } from './example'
import Line from './Line'

const landingSections = [
  { label: 'Problem', href: '#problem' },
  { label: 'How it helps', href: '#how-it-helps' },
  { label: 'Features', href: '#features' },
  { label: 'Plan ahead', href: '#tools' },
  { label: 'Pricing', href: '#pricing' },
]

export default function ClosingFooter({ isSignedIn }: { isSignedIn: boolean }) {
  return (
    <footer className="lp-close" data-nav-theme="dark">
      <div className="lp-close-glow" aria-hidden="true" />
      <div className="lp-container">
        <div className="lp-close-hero" data-reveal-group>
          <p className="lp-close-number" aria-hidden="true" data-reveal="visual">
            {formatSgd(safeToday)}
          </p>
          <h2 className="lp-close-title" data-reveal="lines">
            <Line>Know today&apos;s number.</Line>
            <Line>
              <em>Spend without the guilt.</em>
            </Line>
          </h2>
          <div className="lp-close-actions" data-reveal="text">
            <Link href={isSignedIn ? '/app/home' : '/app/signup'} className="lp-btn lp-btn-primary lp-btn-lg">
              {isSignedIn ? 'Open app' : 'Start free'}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            {!isSignedIn && (
              <Link href="/app/login" className="lp-btn lp-btn-ghost-dark lp-btn-lg">
                I have an account
              </Link>
            )}
          </div>
        </div>

        <div className="lp-footer">
          <div className="lp-footer-brand">
            <span className="lp-footer-mark">
              <BrandMark decorative size={36} className="h-9 w-9" />
            </span>
            <div>
              <p className="lp-footer-name">Sarathy</p>
              <p className="lp-footer-tag">Money clarity for university students in Singapore.</p>
            </div>
          </div>
          <nav className="lp-footer-cols" aria-label="Footer">
            <div>
              <p className="lp-footer-head">Explore</p>
              {landingSections.map(section => (
                <a key={section.href} href={section.href}>
                  {section.label}
                </a>
              ))}
            </div>
            <div>
              <p className="lp-footer-head">App</p>
              {isSignedIn ? (
                <>
                  <Link href="/app/home">Open app</Link>
                  <Link href="/app/profile">Profile</Link>
                </>
              ) : (
                <>
                  <Link href="/app/signup">Sign up</Link>
                  <Link href="/app/login">Sign in</Link>
                </>
              )}
              <Link href="/app/pricing">App pricing</Link>
            </div>
          </nav>
        </div>

        <div className="lp-footer-base">
          <p>&copy; 2026 Sarathy. All rights reserved.</p>
          <p>Figures on this page are an example month.</p>
        </div>
      </div>
    </footer>
  )
}
