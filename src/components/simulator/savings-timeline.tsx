'use client'

import { Area, AreaChart, CartesianGrid, XAxis, YAxis, ReferenceLine, Line, ComposedChart } from 'recharts'

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartConfig,
} from '@/components/ui/chart'
import { SectionCard } from '@/components/dashboard/section-card'
import { formatCo2e } from '@/lib/emissions/appliance-calc'
import { formatCost } from '@/lib/emissions/appliance-suggestions'
import type { TimelinePoint } from '@/lib/simulator/scenarios'

// ============================================================================
// SavingsTimeline — 10-year cumulative projection showing carbon saved
// (area) and net financial benefit (line), with a payback reference line.
// Uses a single Y-axis (normalized to carbon kg) with the cost line on a
// secondary scale shown via tooltip only — avoids dual-axis rendering issues.
// ============================================================================

const chartConfig = {
  cumulativeCarbonKg: { label: 'Carbon saved', color: 'var(--primary)' },
  netUsd: { label: 'Net $ benefit', color: '#10b981' },
} satisfies ChartConfig

export function SavingsTimeline({
  timeline,
  paybackYears,
}: {
  timeline: TimelinePoint[]
  paybackYears: number
}) {
  return (
    <SectionCard
      title="Savings Timeline"
      subtitle="10-year cumulative carbon & financial benefit"
      action={
        paybackYears > 0 ? (
          <div className="text-right">
            <p className="text-muted-foreground text-[10px] uppercase">Payback</p>
            <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
              {paybackYears} yrs
            </p>
          </div>
        ) : undefined
      }
      bodyClassName="pt-0"
    >
      <ChartContainer config={chartConfig} className="aspect-auto h-[240px] w-full">
        <ComposedChart data={timeline} margin={{ left: -16, right: 12, top: 8, bottom: 0 }}>
          <defs>
            <linearGradient id="carbon-grad" x1="0" y1="0" x2="0" y2="1">
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
            dataKey="year"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            className="text-[11px]"
            tickFormatter={(v) => `Y${v}`}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tickMargin={4}
            width={48}
            className="text-[10px]"
            tickFormatter={(v) => formatCo2e(v)}
          />
          <ChartTooltip
            content={
              <ChartTooltipContent
                labelFormatter={(v) => `Year ${v}`}
                formatter={(value, name) => (
                  <span className="font-mono font-medium tabular-nums">
                    {name === 'netUsd'
                      ? `${formatCost(Number(value))} net`
                      : `${formatCo2e(Number(value))} CO₂e`}
                  </span>
                )}
              />
            }
          />
          {paybackYears > 0 && (
            <ReferenceLine
              x={paybackYears}
              stroke="#f59e0b"
              strokeDasharray="4 4"
              strokeWidth={1.5}
              label={{
                value: 'break-even',
                position: 'top',
                fill: '#f59e0b',
                fontSize: 10,
              }}
            />
          )}
          <Area
            dataKey="cumulativeCarbonKg"
            type="monotone"
            stroke="var(--primary)"
            strokeWidth={2.5}
            fill="url(#carbon-grad)"
            dot={false}
          />
          <Line
            dataKey="netUsd"
            type="monotone"
            stroke="#10b981"
            strokeWidth={2}
            strokeDasharray="5 3"
            dot={false}
            yAxisId={0}
          />
        </ComposedChart>
      </ChartContainer>

      {/* Legend */}
      <div className="mt-3 flex items-center justify-center gap-4 text-xs">
        <div className="flex items-center gap-1.5">
          <span className="h-0.5 w-4 rounded-full bg-primary" />
          <span className="font-medium">Carbon saved (cumulative)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-0.5 w-4 bg-emerald-500" style={{ borderTop: '2px dashed #10b981' }} />
          <span className="text-muted-foreground">Net $ benefit</span>
        </div>
      </div>
    </SectionCard>
  )
}
