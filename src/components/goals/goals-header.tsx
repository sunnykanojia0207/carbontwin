import { Leaf, Target, Trophy, TrendingUp } from 'lucide-react'

import { Card } from '@/components/ui/card'
import { formatCo2e } from '@/lib/emissions/appliance-calc'
import type { GoalsData } from '@/lib/services/goals.service'

// ============================================================================
// GoalsHeader — top KPI summary: total carbon saved, active goals, completed,
// average progress.
// ============================================================================

export function GoalsHeader({ kpis }: { kpis: GoalsData['kpis'] }) {
  const cards = [
    {
      icon: Leaf,
      label: 'Carbon Saved',
      value: formatCo2e(kpis.totalCarbonSavedKg),
      sub: 'CO₂e reduced',
      accent: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-500/10',
    },
    {
      icon: Target,
      label: 'Active Goals',
      value: `${kpis.activeGoalCount}`,
      sub: 'in progress',
      accent: 'text-primary',
      bg: 'bg-primary/10',
    },
    {
      icon: Trophy,
      label: 'Completed',
      value: `${kpis.completedGoalCount}`,
      sub: 'goals achieved',
      accent: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-500/10',
    },
    {
      icon: TrendingUp,
      label: 'Avg Progress',
      value: `${kpis.avgProgressPct}%`,
      sub: 'across active goals',
      accent: 'text-sky-600 dark:text-sky-400',
      bg: 'bg-sky-500/10',
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {cards.map((c) => (
        <Card key={c.label} className="gap-0 p-4">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
              {c.label}
            </span>
            <span className={`flex size-7 items-center justify-center rounded-lg ${c.bg}`}>
              <c.icon className={`size-3.5 ${c.accent}`} />
            </span>
          </div>
          <p className={`mt-2 text-2xl font-semibold tracking-tight tabular-nums ${c.accent}`}>
            {c.value}
          </p>
          <p className="text-muted-foreground mt-1 truncate text-xs">{c.sub}</p>
        </Card>
      ))}
    </div>
  )
}
