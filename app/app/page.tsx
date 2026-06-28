'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import LandingPageClient from '../LandingPageClient'

export default function AppIndexPage() {
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    if (pathname === '/app') {
      router.replace('/app/login')
    }
  }, [pathname, router])

  if (pathname === '/app') {
    return null
  }

  return <LandingPageClient />
}
