import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function createServerSupabaseClient() {
  const session = await getServerSession(authOptions)

  return {
    auth: {
      async getUser() {
        return {
          data: {
            user: session?.user ?? null,
          },
          error: null,
        }
      },
    },
  }
}
