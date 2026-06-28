import LandingPageClient from './LandingPageClient'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const runtime = 'nodejs'

export default function LandingPage() {
  return <LandingPageClient />
}
