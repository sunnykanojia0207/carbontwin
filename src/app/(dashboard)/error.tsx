'use client'

import * as React from 'react'
import { AlertCircle, RotateCcw } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

// ============================================================================
// Dashboard error boundary — catches unhandled errors in the dashboard
// route group and offers a reset button.
// ============================================================================

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  React.useEffect(() => {
    // Log to console (Vercel picks this up); swap for Sentry in production
    // eslint-disable-next-line no-console
    console.error('[dashboard-error]', error)
  }, [error])

  return (
    <div className="mx-auto max-w-md px-4 py-20">
      <Alert variant="destructive">
        <AlertCircle className="size-4" />
        <AlertTitle>Something went wrong</AlertTitle>
        <AlertDescription className="mt-2">
          {error.message || 'An unexpected error occurred while loading your dashboard.'}
          {error.digest && (
            <span className="mt-1 block font-mono text-[10px] text-muted-foreground">
              Error ID: {error.digest}
            </span>
          )}
        </AlertDescription>
      </Alert>
      <div className="mt-4 flex justify-center gap-2">
        <Button onClick={reset} size="sm">
          <RotateCcw className="size-3.5" />
          Try again
        </Button>
      </div>
    </div>
  )
}
