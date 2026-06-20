'use client'

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Cell, ReferenceLine } from 'recharts'

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartConfig,
} from '@/components/ui/chart'
import { SectionCard } from '@/components/dashboard/section-card'
import { formatCo2e } from '@/lib/emissions/appliance-calc'
import type { TwinData } from '@/lib/services/twin.service'

// ============================================================================
// ScenarioForecast — bar chart comparing 4 scenarios: Current, Optimized,
// Aggressive, and Paris 1.5°C target. Shows the gap to the target visually.
// ============================================================================

const chartConfig = {
  annualKg: { label: 'Annual CO₂e', color: 'var(--primary)' },
} satisfies ChartConfig

export function ScenarioForecast({
  scenarios,
  parisTargetKg,
}: {
  scenarios: TwinData['scenarios']
  parisTargetKg: number
}) {
  return (
    <SectionCard
      title="Scenario Forecast"
      subtitle="What-if comparison of reduction paths"
      bodyClassName="pt-0"
    >
      <ChartContainer config={chartConfig} className="aspect-auto h-[220px] w-full">
        <BarChart
          data={scenarios}
          margin={{ left: -16, right: 12, top: 8, bottom: 0 }}
        >
          <CartesianGrid
            vertical={false}
            strokeDasharray="3 3"
            className="stroke-border/50"
          />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            className="text-[11px]"
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tickMargin={4}
            width={44}
            className="text-[10px]"
            tickFormatter={(v) => formatCo2e(v)}
          />
          <ChartTooltip
            content={
              <ChartTooltipContent
                formatter={(value) => (
                  <span className="font-mono font-medium tabular-nums">
                    {formatCo2e(Number(value))} CO₂e/yr
                  </span>
                )}
              />
            }
          />
          <ReferenceLine
            y={parisTargetKg}
            stroke="#f59e0b"
            strokeDasharray="6 3"
            strokeWidth={1.5}
          />
          <Bar dataKey="annualKg" radius={[6, 6, 0, 0]} barSize={56}>
            {scenarios.map((entry, i) => (
              <Cell key={i} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ChartContainer>

      {/* Scenario legend with reductions */}
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {scenarios.map((s) => (
          <div key={s.label} className="rounded-lg border p-2.5 text-center">
            <div className="flex items-center justify-center gap-1.5">
              <span
                className="size-2 rounded-full"
                style={{ backgroundColor: s.color }}
              />
              <p className="text-xs font-medium">{s.label}</p>
            </div>
            <p className="mt-1 text-sm font-semibold tabular-nums">
              {formatCo2e(s.annualKg)}
            </p>
            <p
              className={`text-[10px] font-medium tabular-nums ${
                s.reductionPct > 0
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-muted-foreground'
              }`}
            >
              {s.reductionPct > 0 ? `−${s.reductionPct}%` : 'baseline'}
            </p>
          </div>
        ))}
      </div>
    </SectionCard>
  )
}
