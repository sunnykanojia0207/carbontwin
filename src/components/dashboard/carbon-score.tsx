'use client'

import { memo } from 'react'
import { RadialBarChart, RadialBar, PolarAngleAxis } from 'recharts'

import {
  ChartContainer,
  ChartConfig,
} from '@/components/ui/chart'
import { SectionCard } from '@/components/dashboard/section-card'
import { TrendIndicator } from '@/components/dashboard/trend-indicator'
import { formatKg } from '@/components/dashboard/format'
import type { DashboardData } from '@/lib/services/dashboard.service'

// ============================================================================
// Carbon Score — radial gauge (0-100) with trend + context.
// Higher score = lower footprint. The gauge is the emotional anchor of the
// dashboard's "how am I doing?" answer.
// ============================================================================

const chartConfig = {
  score: {
    label: 'Score',
    color: 'var(--primary)',
  },
} satisfies ChartConfig

const SCORE_BANDS = [
  { min: 75, label: 'Excellent', color: 'var(--primary)' },
  { min: 50, label: 'Good', color: 'var(--primary)' },
  { min: 30, label: 'Fair', color: 'var(--chart-4)' },
  { min: 0, label: 'High', color: 'var(--destructive)' },
]

export const CarbonScore = memo(function CarbonScore({ score }: { score: DashboardData['score'] }) {
  const band = SCORE_BANDS.find((b) => score.value >= b.min) ?? SCORE_BANDS[3]
  const data = [{ name: 'score', value: score.value, fill: band.color }]
  const trendDir =
    score.deltaPct > 1 ? 'up' : score.deltaPct < -1 ? 'down' : 'stable'

  return (
    <SectionCard
      title="Carbon Score"
      subtitle="Higher is better"
      action={
        <TrendIndicator
          value={score.deltaPct}
          direction={trendDir}
          goodWhenDown={false}
        />
      }
      bodyClassName="pt-0"
    >
      <div className="flex items-center gap-4">
        {/* Gauge */}
        <div className="relative size-32 shrink-0">
          <ChartContainer config={chartConfig} className="size-full">
            <RadialBarChart
              data={data}
              startAngle={90}
              endAngle={-270}
              innerRadius="72%"
              outerRadius="100%"
            >
              <PolarAngleAxis
                type="number"
                domain={[0, 100]}
                angleAxisId={0}
                tick={false}
              />
              <RadialBar
                dataKey="value"
                background={{ fill: 'var(--muted)' }}
                cornerRadius={20}
              />
            </RadialBarChart>
          </ChartContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-semibold tabular-nums">
              {score.value}
            </span>
            <span className="text-muted-foreground text-[10px] uppercase tracking-wide">
              / 100
            </span>
          </div>
        </div>

        {/* Context */}
        <div className="min-w-0 flex-1 space-y-2.5">
          <div>
            <p className="text-sm font-semibold" style={{ color: band.color }}>
              {band.label}
            </p>
            <p className="text-muted-foreground text-xs leading-relaxed">
              Your weekly footprint is{' '}
              <span className="text-foreground font-medium">
                {formatKg(score.currentKg)}
              </span>
              , against a target of{' '}
              <span className="text-foreground font-medium">
                {formatKg(score.targetKg)}
              </span>
              .
            </p>
          </div>
          <div className="flex gap-3 text-xs">
            <div className="bg-muted/40 flex-1 rounded-lg px-2.5 py-1.5">
              <p className="text-muted-foreground text-[10px] uppercase">Current</p>
              <p className="font-semibold tabular-nums">
                {formatKg(score.currentKg)}
              </p>
            </div>
            <div className="bg-muted/40 flex-1 rounded-lg px-2.5 py-1.5">
              <p className="text-muted-foreground text-[10px] uppercase">Target</p>
              <p className="font-semibold tabular-nums">
                {formatKg(score.targetKg)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </SectionCard>
  )
})
