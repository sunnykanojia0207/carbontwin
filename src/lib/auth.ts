import { PrismaAdapter } from '@next-auth/prisma-adapter'
import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'

import { db, active } from '@/lib/db'
import { verifyPassword } from '@/lib/password'
import { authConfig } from '@/lib/auth.config'

// ============================================================================
// Full NextAuth options (Node runtime) — wires PrismaAdapter, Credentials,
// and Google OAuth. Session strategy MUST be 'jwt' because Credentials
// provider does not support database sessions.
//
// Google is added ONLY when credentials are configured, so the sandbox
// (no GOOGLE_CLIENT_ID) gracefully disables Google login.
// ============================================================================

const providers: NextAuthOptions['providers'] = [
  CredentialsProvider({
    name: 'credentials',
    credentials: {
      email: { label: 'Email', type: 'email' },
      password: { label: 'Password', type: 'password' },
    },
    async authorize(credentials) {
      // Defensive: never trust the raw input shape.
      const email = credentials?.email?.toString().trim().toLowerCase()
      const password = credentials?.password?.toString()
      if (!email || !password) return null

      const user = await db.user.findFirst({
        where: { email, ...active() },
        select: {
          id: true,
          email: true,
          name: true,
          image: true,
          hashedPassword: true,
          plan: true,
          onboardingDone: true,
          emailVerified: true,
        },
      })

      // OAuth-only user (no password set) cannot use credentials login.
      if (!user || !user.hashedPassword) return null

      const valid = await verifyPassword(password, user.hashedPassword)
      if (!valid) return null

      // Never leak the hash downstream.
      return {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
        plan: user.plan,
        onboardingDone: user.onboardingDone,
      }
    },
  }),
]

// Conditionally enable Google OAuth when configured.
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,

    }),
  )
}

export const authOptions: NextAuthOptions = {
  ...authConfig,
  adapter: PrismaAdapter(db),
  providers,
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user, trigger, session }) {
      // Initial sign-in: user is defined → enrich token.
      if (user) {
        token.id = user.id
        token.plan = (user.plan ?? 'FREE') as string
        token.onboardingDone = (user.onboardingDone ?? false) as boolean
      }
      // Session update trigger (e.g. after finishing onboarding we call
      // `update()` to refresh the JWT without a re-login).
      if (trigger === 'update' && session) {
        if (typeof session.onboardingDone === 'boolean')
          token.onboardingDone = session.onboardingDone
        if (typeof session.plan === 'string') token.plan = session.plan
        if (typeof session.name === 'string') token.name = session.name
      }
      return token
    },
    async signIn({ user, account: _account }) {
      // Block soft-deleted users from re-authenticating.
      if (user?.email) {
        const existing = await db.user.findFirst({
          where: { email: user.email },
          select: { deletedAt: true },
        })
        if (existing?.deletedAt) return false
      }
      // OAuth account sign-in: ensure the user has a password-free path.
      // (Credentials users are validated inside authorize() already.)
      return true
    },
  },
  events: {
    async createUser({ user }) {
      // Stamp first-seen timestamp for analytics.
      if (user.id) {
        await db.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        }).catch(() => {
          /* non-fatal */
        })
      }
    },
    async signIn({ user }) {
      if (user.id) {
        await db.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        }).catch(() => {
          /* non-fatal */
        })
      }
    },
  },
}

/** Helper to get the server session (used in Server Components / Route Handlers). */
export { getServerSession } from 'next-auth/next'

// ============================================================================
// Request-level session cache
// ----------------------------------------------------------------------------
// Next.js `cache()` deduplicates calls within the same server request, so
// the layout and page calling getServerSession() in the same render only
// hit the JWT decode once instead of twice.
// ============================================================================
import { cache } from 'react'
import { getServerSession as _getServerSession } from 'next-auth/next'

export const getSession = cache(() => _getServerSession(authOptions))
