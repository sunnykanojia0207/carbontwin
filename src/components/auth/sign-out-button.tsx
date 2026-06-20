'use client'

import { signOut } from 'next-auth/react'
import { Loader2, LogOut } from 'lucide-react'
import * as React from 'react'

import { Button } from '@/components/ui/button'

// ============================================================================
// Sign-out button — client (uses next-auth/react signOut).
// ============================================================================

export function SignOutButton({
  variant = 'ghost',
  className,
}: {
  variant?: React.ComponentProps<typeof Button>['variant']
  className?: string
}) {
  const [loading, setLoading] = React.useState(false)
  return (
    <Button
      variant={variant}
      className={className}
      disabled={loading}
      onClick={async () => {
        setLoading(true)
        await signOut({ callbackUrl: '/' })
      }}
    >
      {loading ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <LogOut className="size-4" />
      )}
      <span className="hidden sm:inline">Sign out</span>
    </Button>
  )
}
