import type { NextAuthOptions } from 'next-auth'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import { encode as defaultJwtEncode, decode as defaultJwtDecode } from 'next-auth/jwt'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import {
  assertSecurityAttemptAllowed,
  clearSecurityAttempts,
  recordSecurityAttemptFailure,
  SecurityAttemptLimitError,
} from '@/lib/security-attempts'

const ONE_DAY_SECONDS = 24 * 60 * 60
export const REMEMBER_ME_MAX_AGE_SECONDS = 60 * ONE_DAY_SECONDS

async function ensureProfile(user: { id?: string; name?: string | null; email?: string | null }) {
  if (!user.id) return
  await prisma.profile.upsert({
    where: { id: user.id },
    update: {
      name: user.name || undefined,
    },
    create: {
      id: user.id,
      name: user.name || user.email?.split('@')[0] || null,
      primary_currency: 'SGD',
      companion_vibe: 'calm_mentor',
      onboarding_complete: false,
      colour_theme: 'saffron',
      achievements: [],
      user_types: [],
    },
  })
}

function credentialsLockoutError() {
  return new Error('Too many sign-in attempts. Try again later.')
}

async function assertCredentialsAllowed(email: string) {
  try {
    await assertSecurityAttemptAllowed('auth:credentials', email)
  } catch (err) {
    if (err instanceof SecurityAttemptLimitError) throw credentialsLockoutError()
    throw err
  }
}

async function recordFailedCredentials(email: string) {
  try {
    await recordSecurityAttemptFailure('auth:credentials', email)
  } catch (err) {
    if (err instanceof SecurityAttemptLimitError) throw credentialsLockoutError()
    throw err
  }
}

const providers: NextAuthOptions['providers'] = [
  CredentialsProvider({
    name: 'Email',
    credentials: {
      email: { label: 'Email', type: 'email' },
      password: { label: 'Password', type: 'password' },
      rememberMe: { label: 'Remember me', type: 'text' },
    },
    async authorize(credentials) {
      const email = credentials?.email?.trim().toLowerCase()
      const password = credentials?.password
      const rememberMe = credentials?.rememberMe !== 'false'
      if (!email || !password) return null

      await assertCredentialsAllowed(email)

      const user = await prisma.user.findUnique({ where: { email } })
      if (!user?.password_hash) {
        await recordFailedCredentials(email)
        return null
      }

      const valid = await bcrypt.compare(password, user.password_hash)
      if (!valid) {
        await recordFailedCredentials(email)
        return null
      }

      await clearSecurityAttempts('auth:credentials', email)

      if (!user.emailVerified) {
        throw new Error('Please verify your email before signing in.')
      }

      await ensureProfile(user)

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        rememberMe,
      }
    },
  }),
]

if (process.env.GOOGLE_AUTH_ENABLED === 'true' && process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  )
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers,
  session: {
    strategy: 'jwt',
    maxAge: REMEMBER_ME_MAX_AGE_SECONDS,
  },
  jwt: {
    async encode(params) {
      return defaultJwtEncode({
        ...params,
        maxAge: params.token?.rememberMe === false ? ONE_DAY_SECONDS : REMEMBER_ME_MAX_AGE_SECONDS,
      })
    },
    async decode(params) {
      return defaultJwtDecode(params)
    },
  },
  pages: {
    signIn: '/app/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user?.id) token.sub = user.id
      if (user && 'rememberMe' in user) {
        token.rememberMe = user.rememberMe !== false
      }
      if (token.sub) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.sub },
          select: { password_changed_at: true },
        })
        const issuedAt = typeof token.iat === 'number' ? token.iat * 1000 : Date.now()
        if (dbUser?.password_changed_at && dbUser.password_changed_at.getTime() > issuedAt) {
          token.sub = undefined
        }
      }
      return token
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub
      }
      return session
    },
    async signIn({ user }) {
      await ensureProfile(user)
      return true
    },
  },
}
