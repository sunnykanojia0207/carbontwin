'use client'

import {
  Target,
  CheckCircle2,
  Trophy,
  Lightbulb,
} from 'lucide-react'

import { PageTabs, type TabItem } from '@/components/shared/page-tabs'
import { GoalsHeader } from '@/components/goals/goals-header'
import { GoalCard } from '@/components/goals/goal-card'
import { AchievementsGrid } from '@/components/goals/achievements-grid'
import { ProgressChart } from '@/components/goals/progress-chart'
import { GoalSuggestions } from '@/components/goals/goal-suggestions'
import { Card, CardContent } from '@/components/ui/card'
import type { GoalsData } from '@/lib/services/goals.service'

// ============================================================================
// GoalsTabs — tabbed layout for the Goals page.
//
// Tabs:
//   Active        → active goals list with KPIs header
//   Completed     → completed goals
//   Achievements  → achievement badges
//   Suggestions   → AI goal suggestions
// ============================================================================

interface GoalsTabsProps {
  data: GoalsData
}

export function GoalsTabs({ data }: GoalsTabsProps) {
  const tabs: TabItem[] = [
    {
      value: 'active',
      label: 'Active',
      icon: Target,
      badge: data.activeGoals.length > 0 ? data.activeGoals.length : undefined,
      content: (
        <div className="space-y-4">
          <GoalsHeader kpis={data.kpis} />

          {data.activeGoals.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {data.activeGoals.map((goal) => (
                <GoalCard key={goal.id} goal={goal} />
              ))}
            </div>
          ) : (
            <Card className="flex h-full flex-col items-center justify-center py-12 text-center">
              <CardContent className="space-y-3">
                <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  <Target className="size-6" />
                </div>
                <p className="text-sm font-medium">No active goals</p>
                <p className="text-muted-foreground text-xs">
                  Create one or accept an AI suggestion.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      ),
    },
    {
      value: 'completed',
      label: 'Completed',
      icon: CheckCircle2,
      badge: data.completedGoals.length > 0 ? data.completedGoals.length : undefined,
      content: (
        <div className="space-y-4">
          {data.completedGoals.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {data.completedGoals.map((goal) => (
                <GoalCard key={goal.id} goal={goal} />
              ))}
            </div>
          ) : (
            <Card className="flex h-full flex-col items-center justify-center py-12 text-center">
              <CardContent className="space-y-3">
                <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  <CheckCircle2 className="size-6" />
                </div>
                <p className="text-sm font-medium">No completed goals yet</p>
                <p className="text-muted-foreground text-xs">
                  Keep working on your active goals — every bit counts.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      ),
    },
    {
      value: 'achievements',
      label: 'Achievements',
      icon: Trophy,
      content: (
        <div className="space-y-4">
          <AchievementsGrid achievements={data.achievements} />
        </div>
      ),
    },
    {
      value: 'suggestions',
      label: 'Suggestions',
      icon: Lightbulb,
      content: (
        <div className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <ProgressChart weeklyTrend={data.weeklyTrend} />
            </div>
            <div className="lg:col-span-5">
              <GoalSuggestions />
            </div>
          </div>
        </div>
      ),
    },
  ]

  return (
    <PageTabs
      tabs={tabs}
      defaultTab="active"
      paramKey="gt"
      variant="primary"
    />
  )
}
