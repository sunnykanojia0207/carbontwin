import { Sparkles, ChevronRight, Lightbulb } from 'lucide-react'

import { SectionCard } from '@/components/dashboard/section-card'
import { EmptyState } from '@/components/dashboard/empty-state'
import { formatKg } from '@/components/dashboard/format'
import { Badge } from '@/components/ui/badge'
import type { DashboardData } from '@/lib/services/dashboard.service'

// ============================================================================
// Recent Recommendations — AI-suggested reduction levers, ranked by potential
// impact. Each shows potential kg saved, difficulty, and accept status.
// ============================================================================

const DIFFICULTY_STYLES: Record<string, string> = {
  EASY: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  MEDIUM: 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400',
  HARD: 'border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400',
}

const IMPACT_DOT: Record<string, string> = {
  HIGH: 'bg-emerald-500',
  MEDIUM: 'bg-amber-500',
  LOW: 'bg-muted-foreground',
}

export function RecentRecommendations({
  recs,
}: {
  recs: DashboardData['recentRecommendations']
}) {
  return (
    <SectionCard
      title="Recommendations"
      subtitle="AI-suggested reductions"
      bodyClassName="pt-0"
    >
      {recs.length === 0 ? (
        <EmptyState
          icon={Lightbulb}
          title="No recommendations yet"
          body="Log a few activities and the AI will suggest personalized reductions."
          ctaLabel="Upload & Detect"
          ctaHref="/upload"
        />
      ) : (
        <ul className="space-y-2">
          {recs.map((rec) => (
            <li
              key={rec.id}
              className="hover:border-primary/40 group rounded-lg border p-3 transition-colors"
            >
              <div className="flex items-start gap-3">
                <span className="bg-primary/10 text-primary mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg">
                  <Sparkles className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium leading-snug">{rec.title}</p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                    <Badge
                      variant="outline"
                      className={`text-[9px] font-semibold uppercase ${DIFFICULTY_STYLES[rec.difficulty] ?? ''}`}
                    >
                      {rec.difficulty.toLowerCase()}
                    </Badge>
                    {rec.status === 'ACCEPTED' && (
                      <Badge
                        variant="outline"
                        className="border-primary/30 bg-primary/10 text-primary text-[9px] font-semibold uppercase"
                      >
                        Accepted
                      </Badge>
                    )}
                    <span className="text-muted-foreground flex items-center gap-1 text-[10px]">
                      <span
                        className={`size-1.5 rounded-full ${IMPACT_DOT[rec.impact] ?? IMPACT_DOT.LOW}`}
                      />
                      {rec.impact.toLowerCase()} impact
                    </span>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
                    −{formatKg(rec.potentialKg)}
                  </p>
                  <p className="text-muted-foreground text-[9px]">per year</p>
                </div>
                <ChevronRight className="text-muted-foreground/40 group-hover:text-foreground/60 mt-1 size-4 shrink-0 transition-colors" />
              </div>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  )
}
