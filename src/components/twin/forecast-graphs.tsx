'use client'

import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
  ReferenceLine,
} from 'recharts'

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
// ForecastGraphs — multi-year projection: current trajectory vs optimized vs
// aggressive reduction. Shows the 1/3/5-year forks with a Paris target line.
// ============================================================================

const chartConfig = {
  current: { label: 'Current trajectory', color: 'var(--primary)' },
  optimized: { label: 'With recommendations', color: '#10b981' },
  aggressive: { label: 'Aggressive action', color: '#0ea5e9' },
} satisfies ChartConfig

export function ForecastGraphs({
  forecast,
  parisTargetKg,
  currentKg,
}: {
  forecast: TwinData['forecast']
  parisTargetKg: number
  currentKg: number
}) {
  // Build a smooth dataset: year 0 (now) + forecast points
  const data = [
    { label: 'Now', current: currentKg, optimized: currentKg, aggressive: currentKg },
    ...forecast.map((f) => ({
      label: f.label,
      current: f.current,
      optimized: f.optimized,
      aggressive: f.aggressive,
    })),
  ]

  const fiveYrOptimized = forecast[2]?.optimized ?? 0
  const reductionKg = currentKg - fiveYrOptimized
  const reductionPct = currentKg > 0 ? Math.round((reductionKg / currentKg) * 100) : 0

  return (
    <SectionCard
      title="Carbon Forecast"
      subtitle="1 / 3 / 5-year trajectory projections"
      action={
        <div className="text-right">
          <p className="text-muted-foreground text-[10px] uppercase">5-yr potential</p>
          <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
            −{formatCo2e(reductionKg)} ({reductionPct}%)
          </p>
        </div>
      }
      bodyClassName="pt-0"
    >
      <ChartContainer config={chartConfig} className="aspect-auto h-[240px] w-full">
        <AreaChart data={data} margin={{ left: -16, right: 12, top: 8, bottom: 0 }}>
          <defs>
            <linearGradient id="fc-current" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.25} />
              <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="fc-optimized" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity={0.2} />
              <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="fc-aggressive" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0ea5e9" stopOpacity={0.15} />
              <stop offset="100%" stopColor="#0ea5e9" stopOpacity={0} />
            </linearGradient>
          </defs>
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
                formatter={(value, name) => (
                  <span className="font-mono font-medium tabular-nums">
                    {formatCo2e(Number(value))}
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
            label={{
              value: 'Paris 1.5°C',
              position: 'right',
              fill: '#f59e0b',
              fontSize: 10,
            }}
          />
          <Area
            dataKey="current"
            type="monotone"
            stroke="var(--primary)"
            strokeWidth={2.5}
            fill="url(#fc-current)"
            dot={{ r: 3, fill: 'var(--primary)' }}
          />
          <Area
            dataKey="optimized"
            type="monotone"
            stroke="#10b981"
            strokeWidth={2}
            strokeDasharray="5 3"
            fill="url(#fc-optimized)"
            dot={{ r: 3, fill: '#10b981' }}
          />
          <Area
            dataKey="aggressive"
            type="monotone"
            stroke="#0ea5e9"
            strokeWidth={2}
            strokeDasharray="3 3"
            fill="url(#fc-aggressive)"
            dot={{ r: 3, fill: '#0ea5e9' }}
          />
        </AreaChart>
      </ChartContainer>

      {/* Legend */}
      <div className="mt-3 flex flex-wrap items-center justify-center gap-4 text-xs">
        <div className="flex items-center gap-1.5">
          <span className="h-0.5 w-4 rounded-full bg-primary" />
          <span className="font-medium">Current trajectory</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="relative h-0.5 w-4">
            <span className="absolute inset-0 border-t-2 border-emerald-500 border-dashed" />
          </span>
          <span className="text-muted-foreground">With recommendations</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="relative h-0.5 w-4">
            <span className="absolute inset-0 border-t-2 border-sky-500 border-dotted" />
          </span>
          <span className="text-muted-foreground">Aggressive action</span>
        </div>
      </div>

      {/* Forecast cards */}
      <div className="mt-4 grid grid-cols-3 gap-3">
        {forecast.map((f) => (
          <div key={f.year} className="rounded-lg border bg-muted/20 p-3 text-center">
            <p className="text-muted-foreground text-[10px] font-medium uppercase tracking-wide">
              {f.label}
            </p>
            <p className="mt-1 text-base font-semibold tabular-nums">
              {formatCo2e(f.optimized)}
            </p>
            <p className="text-emerald-600 dark:text-emerald-400 text-[10px] font-medium tabular-nums">
              −{Math.round((1 - f.optimized / currentKg) * 100)}%
            </p>
          </div>
        ))}
      </div>
    </SectionCard>
  )
}
