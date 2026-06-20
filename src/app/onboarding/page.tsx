'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Loader2, ArrowRight, Leaf } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { completeOnboarding } from '@/lib/onboarding.actions'

// ============================================================================
// Onboarding placeholder — a minimal welcome screen that completes onboarding
// and routes to the dashboard. The full 5-step wizard arrives in Phase 1.
// ============================================================================

export default function OnboardingPage() {
  const router = useRouter()
  const { update } = useSession()
  const [loading, setLoading] = React.useState(false)

  const handleProceed = async () => {
    setLoading(true)
    const res = await completeOnboarding()
    if (!res.ok) {
      setLoading(false)
      return
    }
    // Refresh the JWT so onboardingDone flips to true without a re-login.
    await update({ onboardingDone: true })
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="bg-background flex min-h-svh flex-col items-center justify-center px-4 py-10">
      <Card className="w-full max-w-md">
        <CardContent className="space-y-6 text-center">
          <span className="bg-primary/10 text-primary mx-auto flex size-14 items-center justify-center rounded-full">
            <Leaf className="size-7" />
          </span>
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight">
              Welcome to CarbonTwin
            </h1>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Your account is ready. The full onboarding wizard — which
              estimates your baseline footprint and forms your Climate Twin —
              arrives in the next phase. For now, head straight to your
              dashboard.
            </p>
          </div>
          <Button
            onClick={handleProceed}
            disabled={loading}
            className="w-full"
            size="lg"
          >
            {loading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <ArrowRight className="size-4" />
            )}
            Go to dashboard
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
