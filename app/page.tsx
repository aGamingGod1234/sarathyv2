import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { isAuthConfigured } from '@/lib/auth-config'
import LandingPageClient from './LandingPageClient'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const runtime = 'nodejs'

export default async function LandingPage() {
  const authConfigured = isAuthConfigured()
  const session = authConfigured ? await getServerSession(authOptions) : null

  return (
    <LandingPageClient
      authConfigured={authConfigured}
      initialUser={session?.user
        ? {
            name: session.user.name,
            email: session.user.email,
            image: session.user.image,
          }
        : null}
    />
  )
}
