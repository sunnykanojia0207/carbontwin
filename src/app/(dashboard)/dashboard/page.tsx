import Link from 'next/link'
import { Sparkles, ArrowRight } from 'lucide-react'

import { getServerSession } from '@/lib/auth'

import { authOptions } from '@/lib/auth'
import { getDashboardData } from '@/lib/services/dashboard.service'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { DashboardTabs } from '@/components/dashboard/dashboard-tabs'
import { DashboardHero } from '@/components/dashboard/dashboard-hero'
import {
  LoadDemoDataButton,
  ResetDataButton,
} from '@/components/dashboard/demo-data-button'

// ============================================================================
// Dashboard home — the command center.
// Server Component: fetches all data via the dashboard service, then
// delegates to DashboardTabs (client component) for the tabbed layout.
//
// Tabs: Overview, Analytics, Activity, Goals
// ============================================================================

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  const firstName = session?.user?.name?.split(' ')[0] ?? 'there'
  const userId = session!.user!.id

  const data = await getDashboardData(userId)

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  })

  // --- Empty state ---
  if (data.isEmpty) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:py-10">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight">
            Welcome, {firstName}
          </h1>
          <p className="text-muted-foreground text-sm">{today}</p>
        </div>
        <Card className="mt-6 border-primary/30 bg-primary/5">
          <CardContent className="flex flex-col items-center gap-5 py-12 text-center">
            <span className="bg-primary/15 text-primary flex size-14 items-center justify-center rounded-full">
              <Sparkles className="size-7" />
            </span>
            <div className="max-w-md space-y-2">
              <h2 className="text-xl font-semibold tracking-tight">
                Your dashboard is ready — it just needs data
              </h2>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Log your first activity, or load realistic sample data to
                explore every chart, goal, and forecast before you start
                tracking for real.
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <LoadDemoDataButton />
              <Button asChild variant="outline">
                <Link href="/upload">
                  Upload & Detect
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // --- Populated dashboard ---
  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:py-8">
      <DashboardHero data={data} firstName={firstName} date={today} />

      <div className="mt-5">
        <DashboardTabs data={data} />
      </div>
    </div>
  )
}
