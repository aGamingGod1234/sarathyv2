import type { NextAuthOptions } from 'next-auth'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

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

const providers: NextAuthOptions['providers'] = [
  CredentialsProvider({
    name: 'Email',
    credentials: {
      email: { label: 'Email', type: 'email' },
      password: { label: 'Password', type: 'password' },
    },
    async authorize(credentials) {
      const email = credentials?.email?.trim().toLowerCase()
      const password = credentials?.password
      if (!email || !password) return null

      const user = await prisma.user.findUnique({ where: { email } })
      if (!user?.password_hash) return null

      const valid = await bcrypt.compare(password, user.password_hash)
      if (!valid) return null

      if (!user.emailVerified) {
        throw new Error('Please verify your email before signing in.')
      }

      await ensureProfile(user)

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
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
  },
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user?.id) token.sub = user.id
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
