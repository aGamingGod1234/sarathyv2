import type { ReactNode } from 'react'
import Link from 'next/link'
import BrandLogo from '@/components/ui/BrandLogo'
import { isAuthConfigured } from '@/lib/auth-config'

export const dynamic = 'force-dynamic'

export default function AuthLayout({ children }: { children: ReactNode }) {
  if (isAuthConfigured()) return children

  return (
    <main className="mx-auto flex min-h-dvh max-w-[480px] flex-col px-6 pb-8 pt-14">
      <BrandLogo
        markClassName="h-12 w-12"
        wordmarkClassName="font-brand text-4xl font-semibold text-plum"
      />
      <h1 className="mb-3 mt-8 font-fraunces text-3xl font-semibold text-ink">
        Account services are unavailable
      </h1>
      <p className="text-sm leading-7 text-ink-3">
        Sign-in and registration are not available on this deployment yet. You can still explore Sarathy’s features on the website.
      </p>
      <Link href="/" className="mt-6 font-semibold text-saffron">
        Back to Sarathy
      </Link>
    </main>
  )
}
