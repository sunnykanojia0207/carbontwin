import Link from 'next/link'
import { Home, ArrowRight } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { getServerSession } from '@/lib/auth'
import { authOptions } from '@/lib/auth'

// ============================================================================
// 404 — custom not-found page. Branded, calm, with a path home.
// Dashboard link only shown for authenticated users.
// ============================================================================

export default async function NotFound() {
  const session = await getServerSession(authOptions)
  const authenticated = !!session

  return (
    <div className="bg-background flex min-h-svh flex-col items-center justify-center px-4 text-center">
      <div className="bg-radial-brand pointer-events-none absolute inset-0 opacity-50" />

      <div className="relative space-y-6">
        {/* 404 mark */}
        <div className="flex items-center justify-center gap-2">
          <span className="text-gradient-brand text-7xl font-bold tracking-tighter sm:text-8xl">
            404
          </span>
        </div>

        <div className="space-y-2">
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
            This page drifted off course
          </h1>
          <p className="text-muted-foreground max-w-sm text-sm leading-relaxed">
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
            Let&apos;s get you back on track.
          </p>
        </div>

        <div className="flex flex-col items-center justify-center gap-2 sm:flex-row">
          <Button asChild>
            <Link href="/">
              <Home className="size-4" />
              Back to home
              <ArrowRight className="size-4" />
            </Link>
          </Button>
          {authenticated && (
            <Button asChild variant="outline">
              <Link href="/dashboard">Go to dashboard</Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
