import type { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      plan: string
      onboardingDone: boolean
    } & DefaultSession['user']
  }

  interface User {
    plan?: string
    onboardingDone?: boolean
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string
    plan?: string
    onboardingDone?: boolean
  }
}
