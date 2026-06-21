'use client'

import { memo } from 'react'
import { Cell, Pie, PieChart } from 'recharts'

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartConfig,
} from '@/components/ui/chart'
import { SectionCard } from '@/components/dashboard/section-card'
import { formatKg } from '@/components/dashboard/format'
import type { DashboardData } from '@/lib/services/dashboard.service'

// ============================================================================
// Category Donut — this week's emissions by category, with a center total
// and a legend list. Clickable in a future phase; static for now.
// ============================================================================

export const CategoryDonut = memo(function CategoryDonut({
  categories,
  weekKg,
}: {
  categories: DashboardData['categories']
  weekKg: number
}) {
  // Build a dynamic config so the tooltip labels resolve.
  const chartConfig: ChartConfig = {}
  for (const c of categories) {
    chartConfig[c.slug] = { label: c.name, color: c.color }
  }

  const data =
    categories.length > 0
      ? categories
      : [{ slug: 'none', name: 'No data', kg: 1, share: 100, color: 'var(--muted)' }]

  return (
    <SectionCard
      title="By Category"
      subtitle="This week's breakdown"
      bodyClassName="pt-0"
    >
      <div className="flex items-center gap-3">
        {/* Donut */}
        <div className="relative size-32 shrink-0">
          <ChartContainer config={chartConfig} className="size-full">
            <PieChart>
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    nameKey="slug"
                    formatter={(value, _name, _item) => (
                      <span className="font-mono font-medium tabular-nums">
                        {Number(value).toFixed(1)} kg
                      </span>
                    )}
                  />
                }
              />
              <Pie
                data={data}
                dataKey="kg"
                nameKey="slug"
                innerRadius="62%"
                outerRadius="100%"
                paddingAngle={2}
                strokeWidth={0}
              >
                {data.map((entry) => (
                  <Cell key={entry.slug} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ChartContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-lg font-semibold tabular-nums">
              {formatKg(weekKg)}
            </span>
            <span className="text-muted-foreground text-[9px] uppercase tracking-wide">
              total
            </span>
          </div>
        </div>

        {/* Legend list */}
        <div className="min-w-0 flex-1 space-y-1.5">
          {categories.slice(0, 5).map((c) => (
            <div key={c.slug} className="flex items-center gap-2">
              <span
                className="size-2.5 shrink-0 rounded-sm"
                style={{ backgroundColor: c.color }}
              />
              <span className="text-xs font-medium">{c.name}</span>
              <span className="text-muted-foreground ml-auto font-mono text-xs tabular-nums">
                {formatKg(c.kg)}
              </span>
              <span className="text-muted-foreground w-8 text-right text-xs tabular-nums">
                {c.share}%
              </span>
            </div>
          ))}
          {categories.length === 0 && (
            <p className="text-muted-foreground text-xs">No data yet this week.</p>
          )}
        </div>
      </div>
    </SectionCard>
  )
})
