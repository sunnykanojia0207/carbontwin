import Link from 'next/link'
import { Target, ChevronRight } from 'lucide-react'

import { SectionCard } from '@/components/dashboard/section-card'
import { EmptyState } from '@/components/dashboard/empty-state'
import { formatKg } from '@/components/dashboard/format'
import type { DashboardData } from '@/lib/services/dashboard.service'

// ============================================================================
// Goals Progress — active goals as mini progress rings/bars. Compact,
// scannable, with days remaining and on-track status.
// ============================================================================

function daysUntil(date: Date | string): number {
  const d = typeof date === 'string' ? new Date(date) : date
  return Math.max(0, Math.ceil((d.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
}

export function GoalsProgress({ goals }: { goals: DashboardData['goals'] }) {
  return (
    <SectionCard
      title="Goals Progress"
      subtitle="Active commitments"
      action={
        <Link
          href="/goals"
          className="text-primary hover:underline text-xs font-medium"
        >
          View all
        </Link>
      }
      bodyClassName="pt-0"
    >
      {goals.length === 0 ? (
        <EmptyState
          icon={Target}
          title="No goals yet"
          body="Set a reduction goal to track your progress here."
          ctaLabel="Set a goal"
          ctaHref="/goals"
        />
      ) : (
        <ul className="space-y-3">
          {goals.map((g) => {
            const pct = g.progressPct
            const days = daysUntil(g.endDate)
            const circumference = 2 * Math.PI * 16
            const offset = circumference * (1 - pct / 100)
            return (
              <li key={g.id}>
                <Link
                  href="/goals"
                  className="hover:bg-accent group flex items-center gap-3 rounded-lg p-1.5 transition-colors"
                >
                  {/* Mini ring */}
                  <div className="relative size-12 shrink-0">
                    <svg viewBox="0 0 40 40" className="size-full -rotate-90">
                      <circle
                        cx="20"
                        cy="20"
                        r="16"
                        fill="none"
                        strokeWidth="4"
                        className="stroke-muted"
                      />
                      <circle
                        cx="20"
                        cy="20"
                        r="16"
                        fill="none"
                        strokeWidth="4"
                        strokeLinecap="round"
                        stroke="var(--primary)"
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-[10px] font-semibold tabular-nums">
                        {pct}%
                      </span>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{g.title}</p>
                    <div className="mt-0.5 flex items-center gap-2 text-xs">
                      <span className="text-muted-foreground">
                        {formatKg(g.currentKg)} / {formatKg(g.targetKg)}
                      </span>
                      <span className="text-muted-foreground/50">·</span>
                      <span
                        className={
                          days <= 3
                            ? 'text-amber-600 dark:text-amber-400 font-medium'
                            : 'text-muted-foreground'
                        }
                      >
                        {days}d left
                      </span>
                    </div>
                  </div>

                  {/* Status dot */}
                  <span
                    className={`size-2 shrink-0 rounded-full ${
                      g.onTrack ? 'bg-emerald-500' : 'bg-amber-500'
                    }`}
                    title={g.onTrack ? 'On track' : 'Behind pace'}
                  />
                  <ChevronRight className="text-muted-foreground/40 group-hover:text-foreground/60 size-4 shrink-0 transition-colors" />
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </SectionCard>
  )
}
