import type { NextAuthOptions } from 'next-auth'

// ============================================================================
// Edge-safe NextAuth config — imported by middleware (which runs on the Edge
// runtime and cannot use Prisma). This file must stay free of Node-only deps.
// The full options (with PrismaAdapter + Credentials) live in src/lib/auth.ts.
// ============================================================================

export const authConfig: NextAuthOptions = {
  providers: [], // populated in src/lib/auth.ts (Node runtime)
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
    error: '/login',
    verifyRequest: '/verify-request',
    newUser: '/onboarding',
  },
  callbacks: {
    // Edge-safe JWT handling; the Node version enriches the token on first
    // sign-in via the `user` object. These guards keep it idempotent.
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        // user here is the object returned by authorize() / the adapter;
        // extra fields are attached there (see src/lib/auth.ts).
        token.plan = user.plan ?? 'FREE'
        token.onboardingDone = user.onboardingDone ?? false
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.plan = (token.plan as string) ?? 'FREE'
        session.user.onboardingDone = (token.onboardingDone as boolean) ?? false
      }
      return session
    },
  },
}
