import { AlertTriangle, ShieldAlert } from 'lucide-react'

import { SectionCard } from '@/components/dashboard/section-card'
import { Badge } from '@/components/ui/badge'
import { formatCo2e } from '@/lib/emissions/appliance-calc'
import type { TwinData } from '@/lib/services/twin.service'

// ============================================================================
// RiskAreas — the dimensions with the highest emissions, ranked by severity.
// ============================================================================

const SEVERITY_STYLES: Record<string, { badge: string; bar: string; icon: string }> = {
  HIGH: {
    badge: 'border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400',
    bar: 'bg-red-500',
    icon: 'text-red-500',
  },
  MEDIUM: {
    badge: 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400',
    bar: 'bg-amber-500',
    icon: 'text-amber-500',
  },
  LOW: {
    badge: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    bar: 'bg-emerald-500',
    icon: 'text-emerald-500',
  },
}

export function RiskAreas({ riskAreas }: { riskAreas: TwinData['riskAreas'] }) {
  const maxKg = Math.max(...riskAreas.map((r) => r.annualKg), 1)

  return (
    <SectionCard
      title="Risk Areas"
      subtitle="Where your footprint is most concentrated"
      bodyClassName="pt-0"
    >
      {riskAreas.length === 0 ? (
        <p className="text-muted-foreground py-6 text-center text-sm">
          No risk areas identified.
        </p>
      ) : (
        <div className="space-y-3">
          {riskAreas.map((risk, i) => {
            const style = SEVERITY_STYLES[risk.severity] ?? SEVERITY_STYLES.LOW
            return (
              <div key={i} className="rounded-lg border p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className={`size-4 ${style.icon}`} />
                    <p className="text-sm font-medium">{risk.label}</p>
                  </div>
                  <Badge variant="outline" className={`text-[9px] ${style.badge}`}>
                    {risk.severity}
                  </Badge>
                </div>
                {/* Bar */}
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full rounded-full ${style.bar}`}
                    style={{ width: `${(risk.annualKg / maxKg) * 100}%` }}
                  />
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <p className="text-muted-foreground text-xs leading-relaxed">
                    {risk.reason}
                  </p>
                  <span className="ml-2 shrink-0 text-sm font-semibold tabular-nums">
                    {formatCo2e(risk.annualKg)}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </SectionCard>
  )
}
