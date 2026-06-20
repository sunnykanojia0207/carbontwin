import { Lightbulb } from 'lucide-react'
import Link from 'next/link'

import { SectionCard } from '@/components/dashboard/section-card'
import { Badge } from '@/components/ui/badge'
import { formatCo2e } from '@/lib/emissions/appliance-calc'
import { formatCost } from '@/lib/emissions/appliance-suggestions'
import type { ResultsData } from '@/lib/services/results.service'

// ============================================================================
// Savings Opportunities — ranked list of the top actionable improvements,
// each with potential CO₂e and $ savings. Links to the simulator.
// ============================================================================

const DIFFICULTY_STYLES: Record<string, string> = {
  EASY: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  MEDIUM: 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400',
  HARD: 'border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400',
}

export function SavingsOpportunities({
  opportunities,
}: {
  opportunities: ResultsData['savingsOpportunities']
}) {
  return (
    <SectionCard
      title="Savings Opportunities"
      subtitle="Top actions to reduce your footprint"
      action={
        <Link
          href="/simulator"
          className="text-primary hover:underline text-xs font-medium"
        >
          Simulate
        </Link>
      }
      bodyClassName="pt-0"
    >
      {opportunities.length === 0 ? (
        <p className="text-muted-foreground py-6 text-center text-sm">
          No opportunities detected yet.
        </p>
      ) : (
        <div className="space-y-2">
          {opportunities.map((opp, i) => (
            <div
              key={i}
              className="hover:border-primary/40 group flex items-start gap-3 rounded-lg border p-3 transition-colors"
            >
              <span className="bg-primary/10 text-primary mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg">
                <Lightbulb className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium leading-snug">{opp.title}</p>
                  <Badge
                    variant="outline"
                    className={`text-[9px] shrink-0 ${DIFFICULTY_STYLES[opp.difficulty] ?? ''}`}
                  >
                    {opp.difficulty}
                  </Badge>
                </div>
                <p className="text-muted-foreground mt-0.5 text-xs leading-relaxed">
                  {opp.description}
                </p>
                <p className="text-muted-foreground mt-1 text-[10px]">
                  For your {opp.applianceName.toLowerCase()}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
                  −{formatCo2e(opp.co2eKgPerYear)}
                </p>
                <p className="text-muted-foreground text-[9px]">
                  +{formatCost(opp.usdPerYear)}/yr
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  )
}
