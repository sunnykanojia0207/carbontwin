'use client'

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Cell } from 'recharts'

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartConfig,
} from '@/components/ui/chart'
import { SectionCard } from '@/components/dashboard/section-card'
import { formatCo2e } from '@/lib/emissions/appliance-calc'
import { formatCost } from '@/lib/emissions/appliance-suggestions'
import type { ScenarioResult } from '@/lib/simulator/scenarios'

// ============================================================================
// ScenarioComparison — horizontal bar chart ranking active scenarios by
// annual carbon saved. Each bar colored by the scenario's color.
// ============================================================================

const chartConfig = {
  carbonSavedKg: { label: 'CO₂e saved / yr', color: 'var(--primary)' },
} satisfies ChartConfig

export function ScenarioComparison({
  scenarios,
}: {
  scenarios: ScenarioResult[]
}) {
  const data = scenarios
    .map((s) => ({
      name: s.scenario.shortTitle,
      carbonSavedKg: s.carbonSavedKg,
      costSavedUsd: s.costSavedUsd,
      color: s.scenario.color,
    }))
    .sort((a, b) => b.carbonSavedKg - a.carbonSavedKg)

  return (
    <SectionCard
      title="Scenario Comparison"
      subtitle="Active scenarios ranked by carbon savings"
      bodyClassName="pt-0"
    >
      {data.length === 0 ? (
        <p className="text-muted-foreground py-8 text-center text-sm">
          Select scenarios to compare their impact.
        </p>
      ) : (
        <>
          <ChartContainer config={chartConfig} className="aspect-auto h-[200px] w-full">
            <BarChart
              data={data}
              layout="vertical"
              margin={{ left: 8, right: 16, top: 8, bottom: 0 }}
            >
              <CartesianGrid
                horizontal={false}
                strokeDasharray="3 3"
                className="stroke-border/50"
              />
              <XAxis
                type="number"
                tickLine={false}
                axisLine={false}
                tickMargin={4}
                className="text-[10px]"
                tickFormatter={(v) => formatCo2e(v)}
              />
              <YAxis
                type="category"
                dataKey="name"
                tickLine={false}
                axisLine={false}
                width={110}
                className="text-[11px]"
                tick={{ fill: 'var(--foreground)' }}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value, _name, item) => (
                      <div className="flex flex-col gap-0.5">
                        <span className="font-mono font-medium tabular-nums">
                          {formatCo2e(Number(value))} CO₂e/yr
                        </span>
                        <span className="text-muted-foreground font-mono text-[10px] tabular-nums">
                          +{formatCost(item.payload?.costSavedUsd ?? 0)}/yr saved
                        </span>
                      </div>
                    )}
                  />
                }
              />
              <Bar dataKey="carbonSavedKg" radius={[0, 4, 4, 0]} barSize={20}>
                {data.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>

          {/* Cost savings mini-table */}
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {scenarios.map((s) => (
              <div
                key={s.scenario.key}
                className="rounded-lg border p-2 text-center"
              >
                <div className="flex items-center justify-center gap-1.5">
                  <span
                    className="size-2 rounded-full"
                    style={{ backgroundColor: s.scenario.color }}
                  />
                  <p className="truncate text-[10px] font-medium">
                    {s.scenario.shortTitle}
                  </p>
                </div>
                <p className="mt-1 text-sm font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
                  +{formatCost(s.costSavedUsd)}
                </p>
                <p className="text-muted-foreground text-[9px]">saved / yr</p>
              </div>
            ))}
          </div>
        </>
      )}
    </SectionCard>
  )
}
