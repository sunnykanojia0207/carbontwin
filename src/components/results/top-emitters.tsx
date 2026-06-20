'use client'

import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Cell,
} from 'recharts'

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
// Top Emitters — horizontal bar chart ranking appliances by annual CO₂e.
// The highest emitter is highlighted in the brand color; others are muted.
// ============================================================================

export function TopEmitters({
  emitters,
}: {
  emitters: ResultsData['topEmitters']
}) {
  const chartConfig = {
    kg: { label: 'CO₂e/yr', color: 'var(--primary)' },
  } satisfies ChartConfig

  const data = emitters.map((e) => ({
    name: e.name.length > 18 ? e.name.slice(0, 16) + '…' : e.name,
    fullName: e.name,
    kg: e.carbon.annualCo2eKg,
    type: e.type,
  }))

  const maxKg = Math.max(...data.map((d) => d.kg), 1)

  return (
    <SectionCard
      title="Top Emitters"
      subtitle="Ranked by annual CO₂e"
      bodyClassName="pt-0"
    >
      {data.length === 0 ? (
        <p className="text-muted-foreground py-8 text-center text-sm">
          No appliances detected yet.
        </p>
      ) : (
        <ChartContainer config={chartConfig} className="aspect-auto h-[220px] w-full">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ left: 8, right: 16, top: 8, bottom: 0 }}
          >
            <CartesianGrid
              horizontal={false}
              strokeDasharray="3 3"
              className="stroke-border/50"
            />
            <XAxis
              type="number"
              tickLine={false}
              axisLine={false}
              tickMargin={4}
              className="text-[10px]"
              domain={[0, Math.ceil(maxKg * 1.15)]}
            />
            <YAxis
              type="category"
              dataKey="name"
              tickLine={false}
              axisLine={false}
              width={100}
              className="text-[10px]"
              tick={{ fill: 'var(--foreground)' }}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value, _name, item) => (
                    <div className="flex flex-col gap-0.5">
                      <span className="font-medium">{item.payload?.fullName}</span>
                      <span className="font-mono text-muted-foreground tabular-nums">
                        {formatCo2e(Number(value))} CO₂e/yr
                      </span>
                    </div>
                  )}
                />
              }
            />
            <Bar dataKey="kg" radius={[0, 4, 4, 0]} barSize={18}>
              {data.map((entry, i) => (
                <Cell
                  key={i}
                  fill={i === 0 ? 'var(--primary)' : 'var(--primary)'}
                  fillOpacity={i === 0 ? 1 : 0.4 + 0.15 * (data.length - i) / data.length}
                />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      )}
    </SectionCard>
  )
}
