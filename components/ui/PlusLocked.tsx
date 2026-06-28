'use client'

import Link from 'next/link'
import { Crown, LockKeyhole, ChevronRight } from 'lucide-react'
import TabBar from '@/components/ui/TabBar'

type TabKey = 'home' | 'circles' | 'sarathy' | 'story' | 'profile'

export default function PlusLocked({
  active,
  title,
  body,
}: {
  active: TabKey
  title: string
  body: string
}) {
  return (
    <div className="min-h-dvh bg-cream px-5 pb-24 pt-12 md:pb-12 md:pl-32 md:pr-8 lg:pl-36">
      <main className="mx-auto flex min-h-[70dvh] w-full max-w-3xl items-center">
        <section className="w-full rounded-3xl border border-plum/15 bg-white p-6 shadow-[0_18px_50px_rgba(30,10,46,0.08)]">
          <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-plum text-white">
            <LockKeyhole className="h-6 w-6" />
          </div>
          <p className="mb-2 inline-flex items-center gap-2 rounded-full bg-saffron-soft px-3 py-1 text-xs font-semibold text-saffron">
            <Crown className="h-3.5 w-3.5" />
            Sarathy Plus
          </p>
          <h1 className="font-fraunces text-3xl font-semibold leading-tight text-ink">{title}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-3">{body}</p>
          <div className="mt-6 grid gap-3 sm:grid-cols-[1fr_auto]">
            <Link href="/app/profile/plus" className="btn-primary">
              View Plus
              <ChevronRight className="h-4 w-4" />
            </Link>
            <Link href="/app/story" className="btn-secondary">
              Back to tools
            </Link>
          </div>
        </section>
      </main>
      <TabBar active={active} />
    </div>
  )
}
