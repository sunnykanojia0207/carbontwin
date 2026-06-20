import { Suspense } from 'react'
import { redirect } from 'next/navigation'

import { getServerSession } from '@/lib/auth'

import { authOptions } from '@/lib/auth'
import { LoginForm } from '@/components/auth/login-form'

// ============================================================================
// /login — credentials + Google sign-in.
// Already-authenticated users are redirected server-side (race-free) to their
// next destination. The form is wrapped in <Suspense> because it reads search
// params (callbackUrl, registered, error), which requires a boundary.
// ============================================================================

export const metadata = {
  title: 'Sign in · CarbonTwin',
}

export default async function LoginPage() {
  const session = await getServerSession(authOptions)
  if (session) {
    redirect(session.user.onboardingDone ? '/dashboard' : '/onboarding')
  }
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
