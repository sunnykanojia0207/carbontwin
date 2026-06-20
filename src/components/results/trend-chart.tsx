'use client'

import { memo } from 'react'
import { Area, Line, ComposedChart, CartesianGrid, XAxis, YAxis } from 'recharts'

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartConfig,
} from '@/components/ui/chart'
import { SectionCard } from '@/components/dashboard/section-card'
import { formatCo2e } from '@/lib/emissions/appliance-calc'
import type { ResultsData } from '@/lib/services/results.service'

// ============================================================================
// Trend Chart — 12-week projection: current trajectory vs optimized (if the
// top savings suggestions are applied). Shows the gap as a filled area.
// ============================================================================

export const TrendChart = memo(function TrendChart({
  trend,
  potentialSavingsKg,
}: {
  trend: ResultsData['trend']
  potentialSavingsKg: number
}) {
  const chartConfig = {
    current: { label: 'Current', color: 'var(--primary)' },
    optimized: { label: 'Optimized', color: 'var(--chart-4)' },
  } satisfies ChartConfig

  return (
    <SectionCard
      title="Weekly Trend"
      subtitle="12-week projection · current vs optimized"
      action={
        potentialSavingsKg > 0 ? (
          <div className="text-right">
            <p className="text-muted-foreground text-[10px] uppercase">Saveable</p>
            <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
              {formatCo2e(potentialSavingsKg)}/yr
            </p>
          </div>
        ) : undefined
      }
      bodyClassName="pt-0"
    >
      <ChartContainer config={chartConfig} className="aspect-auto h-[180px] w-full">
        <ComposedChart data={trend} margin={{ left: -20, right: 8, top: 8, bottom: 0 }}>
          <defs>
            <linearGradient id="trend-gap" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.2} />
              <stop offset="100%" stopColor="var(--primary)" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid
            vertical={false}
            strokeDasharray="3 3"
            className="stroke-border/50"
          />
          <XAxis
            dataKey="week"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            interval="preserveStartEnd"
            minTickGap={24}
            className="text-[10px]"
            tickFormatter={(v) => {
              const d = new Date(v)
              return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
            }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tickMargin={4}
            width={36}
            className="text-[10px]"
          />
          <ChartTooltip
            content={
              <ChartTooltipContent
                labelFormatter={(v) =>
                  new Date(v).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })
                }
                formatter={(value, name) => (
                  <span className="font-mono font-medium tabular-nums">
                    {Number(value).toFixed(1)} kg
                  </span>
                )}
              />
            }
          />
          {/* Gap area between current and optimized */}
          <Area
            dataKey="current"
            stroke="none"
            fill="url(#trend-gap)"
            connectNulls
          />
          {/* Optimized line (dashed amber) */}
          <Line
            dataKey="optimized"
            type="monotone"
            stroke="var(--chart-4)"
            strokeWidth={2}
            strokeDasharray="4 4"
            dot={false}
            connectNulls
          />
          {/* Current line (solid primary) */}
          <Line
            dataKey="current"
            type="monotone"
            stroke="var(--primary)"
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 4 }}
          />
        </ComposedChart>
      </ChartContainer>
      <div className="mt-2 flex items-center justify-center gap-4 text-xs">
        <div className="flex items-center gap-1.5">
          <span className="h-0.5 w-4 rounded-full bg-primary" />
          <span className="font-medium">Current</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-0.5 w-4 border-t-2 border-dashed border-amber-500" />
          <span className="text-muted-foreground">Optimized</span>
        </div>
      </div>
    </SectionCard>
  )
})
