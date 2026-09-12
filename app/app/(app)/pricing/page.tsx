import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { isAuthConfigured } from '@/lib/auth-config'

export const dynamic = 'force-dynamic'

export default async function PricingPage() {
  const session = isAuthConfigured() ? await getServerSession(authOptions) : null
  redirect(session?.user?.id ? '/app/profile/plus' : '/#pricing')
}
