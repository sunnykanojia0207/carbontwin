'use client'

import { Leaf, DollarSign, Clock, TrendingDown } from 'lucide-react'

import { Card } from '@/components/ui/card'
import { formatCo2e } from '@/lib/emissions/appliance-calc'
import { formatCost } from '@/lib/emissions/appliance-suggestions'
import type { SimulationResult } from '@/lib/simulator/scenarios'

// ============================================================================
// SimulationSummary — the 4 output KPIs: Carbon Savings, Cost Savings,
// Payback Period, Future Projection. Shows when scenarios are active.
// ============================================================================

export function SimulationSummary({ result }: { result: SimulationResult }) {
  const cards = [
    {
      icon: Leaf,
      label: 'Carbon Savings',
      value: `${formatCo2e(result.totalCarbonSavedKg)}`,
      sub: `${result.reductionPct}% reduction / yr`,
      accent: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-500/10',
    },
    {
      icon: DollarSign,
      label: 'Cost Savings',
      value: `${formatCost(result.totalCostSavedUsd)}`,
      sub: 'per year on energy & fuel',
      accent: 'text-sky-600 dark:text-sky-400',
      bg: 'bg-sky-500/10',
    },
    {
      icon: Clock,
      label: 'Payback Period',
      value: result.blendedPaybackYears > 0 ? `${result.blendedPaybackYears} yrs` : 'Immediate',
      sub: result.totalUpfrontUsd > 0
        ? `$${result.totalUpfrontUsd.toLocaleString()} upfront`
        : 'No upfront cost',
      accent: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-500/10',
    },
    {
      icon: TrendingDown,
      label: 'Future Projection',
      value: `${formatCo2e(result.afterKg)}`,
      sub: `down from ${formatCo2e(result.beforeKg)}`,
      accent: 'text-primary',
      bg: 'bg-primary/10',
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
