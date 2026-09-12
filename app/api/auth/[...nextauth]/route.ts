import NextAuth from 'next-auth'
import type { NextRequest } from 'next/server'
import { authOptions } from '@/lib/auth'
import { isAuthConfigured } from '@/lib/auth-config'

const nextAuthHandler = NextAuth(authOptions)

function handler(request: NextRequest, context: { params: Promise<{ nextauth: string[] }> }) {
  if (!isAuthConfigured()) {
    return Response.json({ error: 'Account services are unavailable.' }, { status: 503 })
  }
  return nextAuthHandler(request, context)
}

export { handler as GET, handler as POST }

