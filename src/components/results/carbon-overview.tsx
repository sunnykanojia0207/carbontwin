import { Leaf, DollarSign, Zap, TrendingDown } from 'lucide-react'

import { Card } from '@/components/ui/card'
import { formatCo2e } from '@/lib/emissions/appliance-calc'
import { formatCost } from '@/lib/emissions/appliance-suggestions'
import type { ResultsData } from '@/lib/services/results.service'

// ============================================================================
// Carbon Overview — top KPI cards summarizing the scan results.
// ============================================================================

export function CarbonOverview({ kpis }: { kpis: ResultsData['kpis'] }) {
  const cards = [
    {
      icon: Leaf,
      label: 'Annual Carbon',
      value: formatCo2e(kpis.totalCo2eKg),
      sub: 'CO₂e per year',
      accent: 'text-emerald-600 dark:text-emerald-400',
    },
    {
      icon: DollarSign,
      label: 'Annual Cost',
      value: formatCost(kpis.totalCostUsd),
      sub: 'Electricity per year',
      accent: 'text-sky-600 dark:text-sky-400',
    },
    {
      icon: Zap,
      label: 'Energy Use',
      value: `${kpis.totalKwh.toLocaleString()}`,
      sub: 'kWh per year',
      accent: 'text-amber-600 dark:text-amber-400',
    },
    {
      icon: TrendingDown,
      label: 'Potential Savings',
      value: `${formatCo2e(kpis.potentialSavingsKg)}`,
      sub: `${formatCost(kpis.potentialSavingsUsd)}/yr saveable`,
      accent: 'text-primary',
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
            <c.icon className={`size-3.5 ${c.accent}`} />
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
