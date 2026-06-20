'use client'

import {
  Line,
  Area,
  ComposedChart,
  CartesianGrid,
  XAxis,
  YAxis,
  ReferenceLine,
} from 'recharts'

import {
  ChartContainer,
  ChartConfig,
} from '@/components/ui/chart'
import { SectionCard } from '@/components/dashboard/section-card'
import { formatKg } from '@/components/dashboard/format'
import type { DashboardData } from '@/lib/services/dashboard.service'

// ============================================================================
// Forecast Snapshot — 12-week history + 12-week projection with a confidence
// band and the Paris-aligned target line. The "where am I headed?" visual.
// ============================================================================

const chartConfig = {
  history: { label: 'History', color: 'var(--primary)' },
  forecast: { label: 'Forecast', color: 'var(--primary)' },
  band: { label: 'Confidence', color: 'var(--primary)' },
} satisfies ChartConfig

export function ForecastSnapshot({
  forecast,
}: {
  forecast: DashboardData['forecast']
}) {
  const { points, projectedAnnualKg, targetAnnualKg, confidence, willHitTarget } =
    forecast

  return (
    <SectionCard
      title="Forecast Snapshot"
      subtitle="12-week projection"
      action={
        <div className="text-right">
          <p className="text-muted-foreground text-[10px] uppercase">Confidence</p>
          <p className="text-sm font-semibold tabular-nums">{confidence}%</p>
        </div>
      }
      bodyClassName="pt-0"
    >
      <ChartContainer config={chartConfig} className="aspect-auto h-[160px] w-full">
        <ComposedChart data={points} margin={{ left: -20, right: 8, top: 8, bottom: 0 }}>
          <defs>
            <linearGradient id="fc-band" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.18} />
              <stop offset="100%" stopColor="var(--primary)" stopOpacity={0.04} />
            </linearGradient>
          </defs>
          <CartesianGrid
            vertical={false}
            strokeDasharray="3 3"
            className="stroke-border/50"
          />
          <XAxis
            dataKey="date"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            interval="preserveStartEnd"
            minTickGap={24}
            className="text-[10px]"
            tickFormatter={(v) => {
              const d = new Date(v)
              return d.toLocaleDateString('en-US', { month: 'short' })
            }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tickMargin={4}
            width={36}
            className="text-[10px]"
          />
          <ReferenceLine
            y={targetAnnualKg / 52}
            stroke="var(--chart-4)"
            strokeDasharray="4 4"
            strokeWidth={1.5}
            label={{ value: 'target', position: 'right', fill: 'var(--chart-4)', fontSize: 9 }}
          />
          {/* Confidence band (area between ciLow and ciHigh for forecast portion) */}
          <Area
            dataKey="ciHigh"
            stroke="none"
            fill="url(#fc-band)"
            connectNulls={false}
          />
          <Area
            dataKey="ciLow"
            stroke="none"
            fill="var(--background)"
            connectNulls={false}
          />
          {/* History line */}
          <Line
            dataKey="history"
            type="monotone"
            stroke="var(--primary)"
            strokeWidth={2.5}
            dot={false}
            connectNulls
          />
          {/* Forecast line (dotted) */}
          <Line
            dataKey="forecast"
            type="monotone"
            stroke="var(--primary)"
            strokeWidth={2}
            strokeDasharray="4 4"
            dot={false}
            connectNulls
            opacity={0.7}
          />
        </ComposedChart>
      </ChartContainer>

      {/* Summary footer */}
      <div className="mt-3 flex items-center justify-between gap-2 rounded-lg border bg-muted/30 px-3 py-2">
        <div>
          <p className="text-muted-foreground text-[10px] uppercase tracking-wide">
            Projected annual
          </p>
          <p className="text-sm font-semibold tabular-nums">
            {formatKg(projectedAnnualKg)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-muted-foreground text-[10px] uppercase tracking-wide">
            vs target
          </p>
          <p
            className={`text-sm font-semibold tabular-nums ${
              willHitTarget
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-amber-600 dark:text-amber-400'
            }`}
          >
            {willHitTarget ? '↓ on track' : `+${formatKg(projectedAnnualKg - targetAnnualKg)} over`}
          </p>
        </div>
      </div>
    </SectionCard>
  )
}
