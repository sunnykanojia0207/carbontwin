import { Target, ArrowRight, Sparkles } from 'lucide-react'
import Link from 'next/link'

import { getServerSession } from '@/lib/auth'

import { authOptions } from '@/lib/auth'
import { getGoalsData } from '@/lib/services/goals.service'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { CreateGoalDialog } from '@/components/goals/create-goal-dialog'
import { GoalsTabs } from '@/components/goals/goals-tabs'

// ============================================================================
// /goals — Goals page.
// Server Component: fetches goals data, then delegates to GoalsTabs (client
// component) for the tabbed layout.
//
// Tabs: Active, Completed, Achievements, Suggestions
// ============================================================================

export const metadata = {
  title: 'Goals',
}

export default async function GoalsPage() {
  const session = await getServerSession(authOptions)
  const data = await getGoalsData(session!.user!.id)

  // --- Empty state ---
  if (data.isEmpty) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:py-10">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Goals</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Set reduction commitments you&apos;ll actually keep.
            </p>
          </div>
        </div>
        <Card className="mt-6 border-primary/30 bg-primary/5">
          <CardContent className="flex flex-col items-center gap-5 py-12 text-center">
            <span className="bg-primary/15 text-primary flex size-14 items-center justify-center rounded-full">
              <Sparkles className="size-7" />
            </span>
            <div className="max-w-md space-y-2">
              <h2 className="text-xl font-semibold tracking-tight">
                Start with one goal
              </h2>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Small commitments compound. Pick a goal below — the AI will
                suggest ones tailored to your footprint, or create your own.
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <CreateGoalDialog suggestions={[]} />
              <Button asChild variant="outline">
                <Link href="/negotiator">
                  <Target className="size-4" />
                  Ask the AI negotiator
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // --- Populated goals page ---
  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:py-8">
      {/* Header */}
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Goals</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Track your reduction commitments and celebrate progress.
          </p>
        </div>
        <CreateGoalDialog suggestions={[]} />
      </div>

      <GoalsTabs data={data} />
    </div>
  )
}
