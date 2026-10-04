import { Fraunces, JetBrains_Mono } from 'next/font/google'

// Editorial accent face for a few emphasised words on the landing page only.
// The app keeps Bricolage Grotesque + Manrope from the root layout.
export const fraunces = Fraunces({
  subsets: ['latin'],
  display: 'swap',
  style: ['italic'],
  weight: ['400', '500'],
  variable: '--font-accent',
})

// Small labels, chapter stamps and figures: a monospace gives the UI its precise, instrument-like edge.
export const mono = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  weight: ['500', '600', '700'],
  variable: '--font-mono',
})
