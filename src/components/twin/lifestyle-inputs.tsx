import {
  Home,
  Zap,
  Car,
  ShoppingBag,
  UtensilsCrossed,
  type LucideIcon,
} from 'lucide-react'

import { SectionCard } from '@/components/dashboard/section-card'
import { formatCo2e } from '@/lib/emissions/appliance-calc'
import type { TwinData } from '@/lib/services/twin.service'

// ============================================================================
// LifestyleInputs — 5 cards representing the input dimensions of the twin:
// Home, Appliances, Transport, Lifestyle, Diet. Each shows the annual kg,
// share, and a detail line.
// ============================================================================

const ICONS: Record<string, LucideIcon> = {
  Home,
  Zap,
  Car,
  ShoppingBag,
  UtensilsCrossed,
}

export function LifestyleInputs({ dimensions }: { dimensions: TwinData['dimensions'] }) {
  return (
    <SectionCard
      title="Lifestyle Inputs"
      subtitle="The 5 dimensions shaping your Climate Twin"
      bodyClassName="pt-0"
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {dimensions.map((d) => {
          const Icon = ICONS[d.icon] ?? Home
          return (
            <div
              key={d.key}
              className="rounded-xl border p-4 transition-colors hover:border-primary/30"
              style={{ borderTopColor: d.color, borderTopWidth: 2 }}
            >
              <div className="flex items-center justify-between">
                <span
                  className="flex size-9 items-center justify-center rounded-lg"
                  style={{ backgroundColor: `${d.color}20`, color: d.color }}
                >
                  <Icon className="size-4.5" />
                </span>
                <span
                  className="text-xs font-semibold tabular-nums"
                  style={{ color: d.color }}
                >
                  {d.share}%
                </span>
              </div>
              <p className="mt-3 text-sm font-medium">{d.label}</p>
              <p className="text-lg font-semibold tabular-nums">
                {formatCo2e(d.annualKg)}
              </p>
              <p className="text-muted-foreground mt-0.5 text-[11px] leading-relaxed">
                {d.detail}
              </p>
            </div>
          )
        })}
      </div>
    </SectionCard>
  )
}
