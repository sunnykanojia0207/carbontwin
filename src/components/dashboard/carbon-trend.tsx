'use client'

import { Area, AreaChart, CartesianGrid, XAxis, YAxis, ReferenceLine } from 'recharts'

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartConfig,
} from '@/components/ui/chart'
import { SectionCard } from '@/components/dashboard/section-card'
import { shortDate, formatKg } from '@/components/dashboard/format'
import type { DashboardData } from '@/lib/services/dashboard.service'

// ============================================================================
// Carbon Trend — 14-day area chart with a goal reference line.
// The primary "am I trending the right way?" visual.
// ============================================================================

const chartConfig = {
  kg: { label: 'Emissions', color: 'var(--primary)' },
  goal: { label: 'Daily goal', color: 'var(--chart-4)' },
} satisfies ChartConfig

export function CarbonTrend({
  trend,
  weekKg,
}: {
  trend: DashboardData['trend']
  weekKg: number
}) {
  const avg = weekKg / 7
  const peak = Math.max(...trend.map((p) => p.kg), 1)

  return (
    <SectionCard
      title="Carbon Trend"
      subtitle="Last 14 days · kg CO₂e"
      action={
        <div className="text-right">
          <p className="text-muted-foreground text-[10px] uppercase">Daily avg</p>
          <p className="text-sm font-semibold tabular-nums">
            {avg.toFixed(1)} kg
          </p>
        </div>
      }
      bodyClassName="pt-0"
    >
      <ChartContainer config={chartConfig} className="aspect-auto h-[180px] w-full">
        <AreaChart data={trend} margin={{ left: -20, right: 8, top: 8, bottom: 0 }}>
          <defs>
            <linearGradient id="trend-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.35} />
              <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            vertical={false}
            strokeDasharray="3 3"
            className="stroke-border/50"
          />
          <XAxis
            dataKey="date"
            tickFormatter={shortDate}
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            interval="preserveStartEnd"
            minTickGap={20}
            className="text-[10px]"
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tickMargin={4}
            width={40}
            className="text-[10px]"
            domain={[0, Math.ceil(peak * 1.2)]}
          />
          <ChartTooltip
            content={
              <ChartTooltipContent
                labelFormatter={(_, p) => shortDate(p[0]?.payload?.date ?? '')}
                formatter={(value) => (
                  <span className="font-mono font-medium tabular-nums">
                    {Number(value).toFixed(1)} kg
                  </span>
                )}
              />
            }
          />
          <ReferenceLine
            y={trend[0]?.goal ?? 0}
            stroke="var(--chart-4)"
            strokeDasharray="4 4"
            strokeWidth={1.5}
            label={{ value: 'goal', position: 'right', fill: 'var(--chart-4)', fontSize: 9 }}
          />
          <Area
            dataKey="kg"
            type="monotone"
            stroke="var(--primary)"
            strokeWidth={2.5}
            fill="url(#trend-fill)"
            dot={false}
            activeDot={{ r: 4, fill: 'var(--primary)' }}
          />
        </AreaChart>
      </ChartContainer>
    </SectionCard>
  )
}
