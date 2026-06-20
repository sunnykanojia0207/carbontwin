import { Leaf, TrendingDown, CalendarDays, Flame } from 'lucide-react'

import { Card } from '@/components/ui/card'
import { TrendIndicator } from '@/components/dashboard/trend-indicator'
import { formatKg } from '@/components/dashboard/format'
import type { DashboardData } from '@/lib/services/dashboard.service'

// ============================================================================
// KPI row — four metric cards answering the top glanceable questions:
//   1. How much this week? (vs last week)
//   2. Month-to-date total
//   3. Logging streak
//   4. Trees-equivalent (relatable translator)
// Dense, scannable, zero wasted whitespace.
// ============================================================================

export function KpiRow({ kpis }: { kpis: DashboardData['kpis'] }) {
  const cards = [
    {
      icon: Leaf,
      label: 'This week',
      value: formatKg(kpis.weekKg),
      sub: `Last week ${formatKg(kpis.lastWeekKg)}`,
      trend: kpis.weekDeltaPct,
      direction: (kpis.weekDeltaPct < 0 ? 'down' : kpis.weekDeltaPct > 0 ? 'up' : 'stable') as 'up' | 'down' | 'stable',
      goodWhenDown: true,
    },
    {
      icon: CalendarDays,
      label: 'This month',
      value: formatKg(kpis.monthKg),
      sub: `${kpis.activitiesLogged} activities logged`,
      trend: null,
    },
    {
      icon: Flame,
      label: 'Logging streak',
      value: `${kpis.streakDays}d`,
      sub: kpis.streakDays >= 7 ? 'On fire' : 'Keep it going',
      trend: null,
    },
    {
      icon: TrendingDown,
      label: 'vs last week',
      value: kpis.reductionKg > 0 ? `−${formatKg(kpis.reductionKg)}` : '—',
      sub: kpis.reductionKg > 0 ? 'Reduction achieved' : 'No reduction yet',
      trend: null,
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
            <c.icon className="text-muted-foreground/60 size-3.5" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-semibold tracking-tight tabular-nums">
              {c.value}
            </span>
            {c.trend !== null && c.trend !== undefined && c.direction && (
              <TrendIndicator
                value={c.trend}
                direction={c.direction}
                goodWhenDown={c.goodWhenDown}
              />
            )}
          </div>
          <p className="text-muted-foreground mt-1 truncate text-xs">{c.sub}</p>
        </Card>
      ))}
    </div>
  )
}
