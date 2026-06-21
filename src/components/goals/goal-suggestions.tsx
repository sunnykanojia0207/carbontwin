'use client'

import * as React from 'react'
import { Loader2, RefreshCw, ArrowRight, Lightbulb } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

import { SectionCard } from '@/components/dashboard/section-card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatCo2e } from '@/lib/emissions/appliance-calc'
import type { GoalSuggestion } from '@/components/goals/create-goal-dialog'
import { createGoal } from '@/lib/goal-actions'

// ============================================================================
// GoalSuggestions — fetches AI-generated goal suggestions and lets the user
// create a goal directly from a suggestion with one click.
// ============================================================================

export function GoalSuggestions() {
  const router = useRouter()
  const [suggestions, setSuggestions] = React.useState<GoalSuggestion[]>([])
  const [loading, setLoading] = React.useState(true)
  const [creating, setCreating] = React.useState<string | null>(null)

  const fetchSuggestions = React.useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/goal-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      if (!res.ok) throw new Error('Failed')
      const data = await res.json()
      setSuggestions(data.suggestions ?? [])
    } catch {
      setSuggestions([])
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchSuggestions()
  }, [fetchSuggestions])

  const handleCreate = async (s: GoalSuggestion) => {
    setCreating(s.title)
    const durationDays =
      s.type === 'WEEKLY' ? 7 : s.type === 'MONTHLY' ? 30 : s.type === 'ANNUAL' ? 365 : 30
    const res = await createGoal({
      title: s.title,
      description: s.description,
      type: s.type,
      targetKg: s.targetKg,
      baselineKg: s.targetKg,
      durationDays,
    })
    setCreating(null)
    if (res.ok) {
      toast.success('Goal created!', { description: s.title })
      router.refresh()
    } else {
      toast.error(res.error ?? 'Failed to create goal')
    }
  }

  return (
    <SectionCard
      title="AI Goal Suggestions"
      subtitle="Personalized for your footprint"
      action={
        <Button
          variant="ghost"
          size="sm"
          onClick={fetchSuggestions}
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
        <div className="space-y-2 py-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="bg-muted size-8 animate-pulse rounded-lg" />
              <div className="flex-1 space-y-1.5">
                <div className="bg-muted h-3 w-3/4 animate-pulse rounded" />
                <div className="bg-muted h-2.5 w-1/2 animate-pulse rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : suggestions.length === 0 ? (
        <div className="py-6 text-center">
          <p className="text-muted-foreground text-sm">
            Log activities to get personalized suggestions.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {suggestions.map((s, i) => (
            <div
              key={i}
              className="hover:border-primary/40 group flex items-start gap-3 rounded-lg border p-3 transition-colors"
            >
              <span className="bg-primary/10 text-primary mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg">
                <Lightbulb className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium leading-snug">{s.title}</p>
                  <Badge
                    variant="outline"
                    className={`shrink-0 text-[9px] ${
                      s.difficulty === 'EASY'
                        ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        : s.difficulty === 'MEDIUM'
                          ? 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400'
                          : 'border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400'
                    }`}
                  >
                    {s.difficulty}
                  </Badge>
                </div>
                <p className="text-muted-foreground mt-0.5 text-xs leading-relaxed">
                  {s.description}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[10px]">
                  <span className="text-muted-foreground">
                    Target:{' '}
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
                      {formatCo2e(s.targetKg)}
                    </span>
                  </span>
                  <span className="text-muted-foreground">·</span>
                  <span className="text-muted-foreground">{s.type}</span>
                  <span className="text-muted-foreground">·</span>
                  <span className="text-muted-foreground italic">{s.potentialImpact}</span>
                </div>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleCreate(s)}
                disabled={creating === s.title}
                className="shrink-0"
              >
                {creating === s.title ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <ArrowRight className="size-3.5" />
                )}
              </Button>
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  )
}
