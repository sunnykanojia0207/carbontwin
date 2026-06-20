'use client'

import { Cell, Pie, PieChart } from 'recharts'

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartConfig,
} from '@/components/ui/chart'
import { SectionCard } from '@/components/dashboard/section-card'
import { formatCo2e } from '@/lib/emissions/appliance-calc'
import { formatCost } from '@/lib/emissions/appliance-suggestions'
import type { ResultsData } from '@/lib/services/results.service'

// ============================================================================
// Impact Breakdown — pie chart of annual CO₂e by appliance type.
// ============================================================================

export function ImpactBreakdown({
  breakdown,
  totalCo2eKg,
  totalCostUsd,
}: {
  breakdown: ResultsData['impactBreakdown']
  totalCo2eKg: number
  totalCostUsd: number
}) {
  const chartConfig: ChartConfig = {}
  for (const b of breakdown) {
    chartConfig[b.type] = { label: b.name, color: b.color }
  }

  const data =
    breakdown.length > 0
      ? breakdown
      : [{ type: 'none', name: 'No data', kg: 1, share: 100, color: 'var(--muted)', cost: 0 }]

  return (
    <SectionCard
      title="Impact Breakdown"
      subtitle="CO₂e by appliance type"
      bodyClassName="pt-0"
    >
      <div className="flex items-center gap-4">
        {/* Pie */}
        <div className="relative size-36 shrink-0">
          <ChartContainer config={chartConfig} className="size-full">
            <PieChart>
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    nameKey="type"
                    formatter={(value) => (
                      <span className="font-mono font-medium tabular-nums">
                        {formatCo2e(Number(value))} CO₂e
                      </span>
                    )}
                  />
                }
              />
              <Pie
                data={data}
                dataKey="kg"
                nameKey="type"
                innerRadius="58%"
                outerRadius="100%"
                paddingAngle={2}
                strokeWidth={0}
              >
                {data.map((entry) => (
                  <Cell key={entry.type} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ChartContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-base font-semibold tabular-nums">
              {formatCo2e(totalCo2eKg)}
            </span>
            <span className="text-muted-foreground text-[9px] uppercase tracking-wide">
              total
            </span>
          </div>
        </div>

        {/* Legend */}
        <div className="min-w-0 flex-1 space-y-1.5">
          {breakdown.map((b) => (
            <div key={b.type} className="flex items-center gap-2">
              <span
                className="size-2.5 shrink-0 rounded-sm"
                style={{ backgroundColor: b.color }}
              />
              <span className="text-xs font-medium">{b.name}</span>
              <span className="text-muted-foreground ml-auto font-mono text-xs tabular-nums">
                {formatCo2e(b.kg)}
              </span>
              <span className="text-muted-foreground w-8 text-right text-xs tabular-nums">
                {b.share}%
              </span>
            </div>
          ))}
          {breakdown.length === 0 && (
            <p className="text-muted-foreground text-xs">No data available.</p>
          )}
          <div className="mt-2 border-t pt-2">
            <p className="text-muted-foreground text-[10px] uppercase tracking-wide">
              Total cost
            </p>
            <p className="text-sm font-semibold text-sky-600 dark:text-sky-400 tabular-nums">
              {formatCost(totalCostUsd)}/yr
            </p>
          </div>
        </div>
      </div>
    </SectionCard>
  )
}
