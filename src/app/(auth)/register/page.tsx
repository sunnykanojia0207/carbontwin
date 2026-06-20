import { Suspense } from 'react'
import { redirect } from 'next/navigation'

import { getServerSession } from '@/lib/auth'

import { authOptions } from '@/lib/auth'
import { RegisterForm } from '@/components/auth/register-form'

export const metadata = {
  title: 'Create your account · CarbonTwin',
}

export default async function RegisterPage() {
  const session = await getServerSession(authOptions)
  if (session) {
    redirect(session.user.onboardingDone ? '/dashboard' : '/onboarding')
  }
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  )
}
