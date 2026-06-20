'use client'

import { memo } from 'react'
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, ReferenceLine } from 'recharts'

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartConfig,
} from '@/components/ui/chart'
import { SectionCard } from '@/components/dashboard/section-card'
import { formatCo2e } from '@/lib/emissions/appliance-calc'
import type { GoalsData } from '@/lib/services/goals.service'

// ============================================================================
// ProgressChart — 8-week cumulative carbon saved vs target line.
// ============================================================================

const chartConfig = {
  saved: { label: 'Carbon saved', color: 'var(--primary)' },
  target: { label: 'Target', color: 'var(--chart-4)' },
} satisfies ChartConfig

export const ProgressChart = memo(function ProgressChart({
  weeklyTrend,
}: {
  weeklyTrend: GoalsData['weeklyTrend']
}) {
  return (
    <SectionCard
      title="Progress Trend"
      subtitle="Cumulative CO₂e saved (8 weeks)"
      bodyClassName="pt-0"
    >
      <ChartContainer config={chartConfig} className="aspect-auto h-[200px] w-full">
        <AreaChart data={weeklyTrend} margin={{ left: -16, right: 12, top: 8, bottom: 0 }}>
          <defs>
            <linearGradient id="saved-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.35} />
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
            width={44}
            className="text-[10px]"
            tickFormatter={(v) => formatCo2e(v)}
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
                formatter={(value) => (
                  <span className="font-mono font-medium tabular-nums">
                    {formatCo2e(Number(value))} CO₂e
                  </span>
                )}
              />
            }
          />
          <Area
            dataKey="saved"
            type="monotone"
            stroke="var(--primary)"
            strokeWidth={2.5}
            fill="url(#saved-grad)"
            dot={false}
            activeDot={{ r: 4 }}
          />
        </AreaChart>
      </ChartContainer>
    </SectionCard>
  )
})
