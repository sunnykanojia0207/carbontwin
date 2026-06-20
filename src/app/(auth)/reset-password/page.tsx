import { Suspense } from 'react'

import { ResetPasswordForm } from '@/components/auth/reset-password-form'

export const metadata = {
  title: 'Set a new password · CarbonTwin',
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  )
}
