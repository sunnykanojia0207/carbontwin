'use client'

import * as React from 'react'
import { Sparkles, Loader2, RefreshCw } from 'lucide-react'

import { SectionCard } from '@/components/dashboard/section-card'
import { Button } from '@/components/ui/button'

// ============================================================================
// AI Insights — fetches an AI-generated narrative from /api/insights and
// displays it with highlights. Includes a regenerate button.
// ============================================================================

type InsightResponse = {
  insight: string
  highlights: string[]
}

export function AiInsights({ scanId }: { scanId?: string }) {
  const [data, setData] = React.useState<InsightResponse | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState(false)

  const fetchInsight = React.useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      const res = await fetch('/api/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scanId }),
      })
      if (!res.ok) throw new Error('Failed to fetch insight')
      const json = await res.json()
      setData(json)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [scanId])

  React.useEffect(() => {
    fetchInsight()
  }, [fetchInsight])

  return (
    <SectionCard
      title="AI Insights"
      subtitle="Personalized analysis of your results"
      action={
        <Button
          variant="ghost"
          size="sm"
          onClick={fetchInsight}
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
        <div className="flex items-center gap-3 py-6">
          <span className="bg-primary/10 text-primary flex size-9 items-center justify-center rounded-full">
            <Sparkles className="size-4" />
          </span>
          <div className="flex-1 space-y-2">
            <div className="bg-muted h-3 w-3/4 animate-pulse rounded" />
            <div className="bg-muted h-3 w-1/2 animate-pulse rounded" />
          </div>
        </div>
      ) : error ? (
        <div className="py-4 text-center">
          <p className="text-muted-foreground text-sm">
            Couldn&apos;t generate insights right now.
          </p>
          <Button onClick={fetchInsight} variant="outline" size="sm" className="mt-2">
            Try again
          </Button>
        </div>
      ) : data ? (
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <span className="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-full">
              <Sparkles className="size-4" />
            </span>
            <p className="text-sm leading-relaxed">{data.insight}</p>
          </div>
          {data.highlights.length > 0 && (
            <ul className="space-y-1.5 border-t pt-3">
              {data.highlights.map((h, i) => (
                <li key={i} className="flex items-start gap-2 text-xs">
                  <span className="bg-primary mt-1.5 size-1.5 shrink-0 rounded-full" />
                  <span className="text-muted-foreground leading-relaxed">{h}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </SectionCard>
  )
}
