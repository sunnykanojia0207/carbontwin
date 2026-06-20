'use client'

import { memo } from 'react'
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from 'recharts'

import {
  ChartContainer,
  ChartConfig,
} from '@/components/ui/chart'
import { SectionCard } from '@/components/dashboard/section-card'
import { formatCo2e } from '@/lib/emissions/appliance-calc'
import type { TwinData } from '@/lib/services/twin.service'

// ============================================================================
// CategoryComparison — radar chart comparing the user's 5 lifestyle dimensions.
// Shows the "shape" of their footprint at a glance.
// ============================================================================

const chartConfig = {
  value: { label: 'Your footprint', color: 'var(--primary)' },
} satisfies ChartConfig

export const CategoryComparison = memo(function CategoryComparison({
  radar,
  dimensions,
}: {
  radar: TwinData['radar']
  dimensions: TwinData['dimensions']
}) {
  return (
    <SectionCard
      title="Category Comparison"
      subtitle="Your footprint shape across 5 dimensions"
      bodyClassName="pt-0"
    >
      <ChartContainer config={chartConfig} className="mx-auto aspect-square max-w-[260px]">
        <RadarChart data={radar} outerRadius="72%">
          <PolarGrid stroke="var(--border)" />
          <PolarAngleAxis
            dataKey="dimension"
            tick={{ fill: 'var(--foreground)', fontSize: 11 }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tick={{ fill: 'var(--muted-foreground)', fontSize: 9 }}
            axisLine={false}
          />
          <Radar
            dataKey="value"
            stroke="var(--primary)"
            fill="var(--primary)"
            fillOpacity={0.3}
            strokeWidth={2}
          />
        </RadarChart>
      </ChartContainer>

      {/* Dimension list */}
      <div className="mt-4 space-y-1.5">
        {dimensions.map((d) => (
          <div key={d.key} className="flex items-center gap-2">
            <span
              className="size-2.5 shrink-0 rounded-sm"
              style={{ backgroundColor: d.color }}
            />
            <span className="text-xs font-medium">{d.label}</span>
            <span className="text-muted-foreground ml-auto font-mono text-xs tabular-nums">
              {formatCo2e(d.annualKg)}
            </span>
            <span className="text-muted-foreground w-8 text-right text-xs tabular-nums">
              {d.share}%
            </span>
          </div>
        ))}
      </div>
    </SectionCard>
  )
})
