'use client'

import * as React from 'react'
import { Sparkles, Loader2, RefreshCw, Lightbulb, TrendingUp } from 'lucide-react'

import { SectionCard } from '@/components/dashboard/section-card'
import { Button } from '@/components/ui/button'
import { formatCo2e } from '@/lib/emissions/appliance-calc'
import type { TwinData } from '@/lib/services/twin.service'

// ============================================================================
// AiRecommendations — fetches an AI narrative from /api/twin-recommendations
// and displays: summary, 5-year outlook, risk assessment, and actionable
// recommendations. Includes regenerate + deterministic fallback.
// ============================================================================

type AiResponse = {
  summary: string
  outlook: string
  recommendations: string[]
  riskAssessment: string
}

export function AiRecommendations({
  opportunities,
}: {
  opportunities: TwinData['opportunities']
}) {
  const [data, setData] = React.useState<AiResponse | null>(null)
  const [loading, setLoading] = React.useState(true)

  const fetchRecommendations = React.useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/twin-recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      if (!res.ok) throw new Error('Failed')
      const json = await res.json()
      setData(json)
    } catch {
      // Deterministic fallback
      setData({
        summary: '',
        outlook: '',
        recommendations: opportunities.slice(0, 3).map(
          (o) => `${o.title}: ${o.description} (saves ${formatCo2e(o.potentialKg)}/yr)`,
        ),
        riskAssessment: '',
      })
    } finally {
      setLoading(false)
    }
  }, [opportunities])

  React.useEffect(() => {
    fetchRecommendations()
  }, [fetchRecommendations])

  return (
    <SectionCard
      title="AI Recommendations"
      subtitle="Personalized analysis & action plan"
      action={
        <Button
          variant="ghost"
          size="sm"
          onClick={fetchRecommendations}
          disabled={loading}
          className="h-7 px-2 text-xs"
        >
          {loading ? (
            <Loader2 className="size-3 animate-spin" />
          ) : (
            <RefreshCw className="size-3" />
          )}
          Refresh
        </Button>
      }
      bodyClassName="pt-0"
    >
      {loading ? (
        <div className="space-y-3 py-4">
          <div className="flex items-center gap-3">
            <span className="bg-primary/10 text-primary flex size-9 items-center justify-center rounded-full">
              <Sparkles className="size-4" />
            </span>
            <div className="flex-1 space-y-2">
              <div className="bg-muted h-3 w-3/4 animate-pulse rounded" />
              <div className="bg-muted h-3 w-1/2 animate-pulse rounded" />
            </div>
          </div>
        </div>
      ) : data ? (
        <div className="space-y-4">
          {/* Summary */}
          {data.summary && (
            <div className="flex items-start gap-3">
              <span className="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-full">
                <Sparkles className="size-4" />
              </span>
              <p className="text-sm leading-relaxed">{data.summary}</p>
            </div>
          )}

          {/* Outlook */}
          {data.outlook && (
            <div className="rounded-lg border bg-muted/20 p-3">
              <p className="text-muted-foreground mb-1 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide">
                <TrendingUp className="size-3" />
                5-Year Outlook
              </p>
              <p className="text-sm leading-relaxed">{data.outlook}</p>
            </div>
          )}

          {/* Risk assessment */}
          {data.riskAssessment && (
            <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
              <p className="text-amber-600 dark:text-amber-400 mb-1 text-[10px] font-semibold uppercase tracking-wide">
                Risk Assessment
              </p>
              <p className="text-sm leading-relaxed">{data.riskAssessment}</p>
            </div>
          )}

          {/* Recommendations */}
          {data.recommendations.length > 0 && (
            <div>
              <p className="text-muted-foreground mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide">
                <Lightbulb className="size-3" />
                Recommended Actions
              </p>
              <ul className="space-y-2">
                {data.recommendations.map((rec, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <span className="bg-primary mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold text-primary-foreground">
                      {i + 1}
                    </span>
                    <span className="text-sm leading-relaxed">{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : null}
    </SectionCard>
  )
}
