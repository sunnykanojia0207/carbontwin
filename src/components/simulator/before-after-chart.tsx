'use client'

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Legend } from 'recharts'

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartConfig,
} from '@/components/ui/chart'
import { SectionCard } from '@/components/dashboard/section-card'
import { formatCo2e } from '@/lib/emissions/appliance-calc'
import type { ComparisonBar } from '@/lib/simulator/scenarios'

// ============================================================================
// BeforeAfterChart — grouped bar chart comparing each affected dimension's
// footprint before and after the active scenarios.
// ============================================================================

const chartConfig = {
  before: { label: 'Before', color: 'var(--muted-foreground)' },
  after: { label: 'After', color: 'var(--primary)' },
} satisfies ChartConfig

export function BeforeAfterChart({ data }: { data: ComparisonBar[] }) {
  const chartData = data.map((d) => ({
    label: d.label,
    before: d.before,
    after: d.after,
  }))

  return (
    <SectionCard
      title="Before vs After"
      subtitle="Per-dimension impact of active scenarios"
      bodyClassName="pt-0"
    >
      {data.length === 0 ? (
        <p className="text-muted-foreground py-8 text-center text-sm">
          Select a scenario to see the before/after comparison.
        </p>
      ) : (
        <ChartContainer config={chartConfig} className="aspect-auto h-[240px] w-full">
          <BarChart data={chartData} margin={{ left: -16, right: 12, top: 8, bottom: 0 }}>
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
                      {formatCo2e(Number(value))} CO₂e
                    </span>
                  )}
                />
              }
            />
            <Legend
              wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }}
              iconType="circle"
            />
            <Bar dataKey="before" fill="var(--muted-foreground)" radius={[4, 4, 0, 0]} barSize={28} fillOpacity={0.4} />
            <Bar dataKey="after" fill="var(--primary)" radius={[4, 4, 0, 0]} barSize={28} />
          </BarChart>
        </ChartContainer>
      )}
    </SectionCard>
  )
}
