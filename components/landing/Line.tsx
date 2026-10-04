import type { ReactNode } from 'react'

/**
 * One line of a section heading, wrapped in a mask so it can slide up into place (reveal.ts).
 * The trailing space keeps the words apart for screen readers and copy-paste, since the lines
 * are separate blocks rather than text broken with <br />.
 */
export default function Line({ children }: { children: ReactNode }) {
  return (
    <span className="lp-line">
      <span className="lp-line-inner">{children}</span>{' '}
    </span>
  )
}
