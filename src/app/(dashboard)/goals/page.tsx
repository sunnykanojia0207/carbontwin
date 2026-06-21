import { Target, Leaf, Zap, ShoppingBag, Car } from 'lucide-react'

import { getSession } from '@/lib/auth'
import { getGoalsData } from '@/lib/services/goals.service'
import { Card, CardContent } from '@/components/ui/card'
import { EmptyState, type AchievementPreview } from '@/components/dashboard/empty-state'
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

const GOAL_ACHIEVEMENTS: AchievementPreview[] = [
  { icon: Leaf, label: 'Green Week', description: '7-day streak', color: 'border-emerald-300/30 text-emerald-600 dark:text-emerald-400' },
  { icon: Zap, label: 'Energy Saver', description: 'Cut 50 kg', color: 'border-amber-300/30 text-amber-600 dark:text-amber-400' },
  { icon: Car, label: 'Low Miles', description: 'Skip 5 car trips', color: 'border-blue-300/30 text-blue-600 dark:text-blue-400' },
  { icon: ShoppingBag, label: 'Waste Warrior', description: '3 low-waste weeks', color: 'border-violet-300/30 text-violet-600 dark:text-violet-400' },
  { icon: Target, label: 'Goal Getter', description: 'Complete 3 goals', color: 'border-rose-300/30 text-rose-600 dark:text-rose-400' },
  { icon: Leaf, label: 'Climate Hero', description: '1 tonne reduced', color: 'border-emerald-300/30 text-emerald-600 dark:text-emerald-400' },
]

export default async function GoalsPage() {
  const session = await getSession()
  const data = await getGoalsData(session!.user!.id)

  // --- Empty state ---
  if (data.isEmpty) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:py-10">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Goals</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Set reduction commitments you&apos;ll actually keep.
            </p>
          </div>
        </div>
        <Card className="mt-6 border-primary/30 bg-gradient-to-br from-primary/5 to-primary/0">
          <CardContent className="p-0">
            <EmptyState
              icon={Target}
              title="Start with one goal"
              body="Small commitments compound. Create your first goal, or I'll suggest ones tailored to your footprint."
              ctaLabel="Create your first goal"
              ctaHref="#"
              secondaryCta={{ label: 'Ask the AI negotiator', href: '/negotiator' }}
              achievements={GOAL_ACHIEVEMENTS}
            />
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
