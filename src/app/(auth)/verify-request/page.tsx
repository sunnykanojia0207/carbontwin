import { MailCheck } from 'lucide-react'

import { Logo } from '@/components/shared/logo'

// ============================================================================
// /verify-request — shown after a magic-link / email-verification flow.
// CarbonTwin uses credentials by default, so this page is mostly a fallback,
// but NextAuth routes here for email provider flows.
// ============================================================================

export const metadata = {
  title: 'Check your email · CarbonTwin',
}

export default function VerifyRequestPage() {
  return (
    <div className="flex flex-col items-center text-center">
      <span className="bg-primary/10 text-primary mb-4 flex size-12 items-center justify-center rounded-full">
        <MailCheck className="size-6" />
      </span>
      <h1 className="text-2xl font-semibold tracking-tight">Check your email</h1>
      <p className="text-muted-foreground mt-2 text-sm">
        A sign-in link is on its way. Click it to finish signing in.
      </p>
      <p className="text-muted-foreground mt-1 text-xs">
        The link expires shortly and can only be used once.
      </p>
      <div className="mt-6">
        <Logo href="/" />
      </div>
    </div>
  )
}
