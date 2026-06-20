'use client'

import { Activity, Sparkles, MessageSquare, Zap, AlertTriangle } from 'lucide-react'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { SettingsSection } from '@/components/settings/settings-section'
import type { SettingsData } from '@/lib/services/settings.service'

// ============================================================================
// ApiStatusSection — shows the AI model in use, today's usage vs budget,
// and total conversations. Pure display (read-only).
// ============================================================================

export function ApiStatusSection({
  aiUsage,
  aiEnabled,
}: {
  aiUsage: SettingsData['aiUsage']
  aiEnabled: boolean
}) {
  const budgetPct = Math.min(100, Math.round((aiUsage.todayMessageCount / aiUsage.dailyBudget) * 100))
  const remainingPct = 100 - budgetPct

  const stats = [
    {
      icon: MessageSquare,
      label: 'Today',
      value: `${aiUsage.todayMessageCount}`,
      sub: `of ${aiUsage.dailyBudget} budget`,
      accent: 'text-sky-600 dark:text-sky-400',
    },
    {
      icon: Sparkles,
      label: 'Remaining',
      value: `${aiUsage.budgetRemaining}`,
      sub: 'messages today',
      accent: 'text-emerald-600 dark:text-emerald-400',
    },
    {
      icon: Activity,
      label: 'Conversations',
      value: `${aiUsage.totalConversations}`,
      sub: 'total threads',
      accent: 'text-primary',
    },
  ]

  return (
    <SettingsSection
      icon={Zap}
      title="API Status"
      description="AI model and usage"
    >
      <div className="space-y-4">
        {/* Quota warning */}
        {aiUsage.quotaExhausted && (
          <Alert variant="destructive" className="border-destructive/30 bg-destructive/5 py-2">
            <AlertTriangle className="size-4" />
            <AlertDescription className="text-xs">
              Gemini API quota exceeded. AI responses use deterministic fallbacks until the quota resets. Check your{' '}
              <a
                href="https://aistudio.google.com/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium underline underline-offset-2"
              >
                Google AI Studio
              </a>{' '}
              dashboard for details.
            </AlertDescription>
          </Alert>
        )}

        {/* Model info */}
        <div className="flex items-center justify-between rounded-lg border bg-muted/20 p-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Active model
            </p>
            <p className="text-sm font-semibold">Gemini 2.0 Flash</p>
          </div>
          <span
            className={`rounded-md px-2.5 py-1 text-xs font-medium ${
              aiEnabled
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            {aiEnabled ? '● Active' : '● Disabled'}
          </span>
        </div>

        {/* Usage stats */}
        <div className="grid grid-cols-3 gap-2">
          {stats.map((s) => (
            <div key={s.label} className="rounded-lg border p-2.5 text-center">
              <s.icon className={`mx-auto mb-1 size-4 ${s.accent}`} />
              <p className="text-lg font-semibold tabular-nums">{s.value}</p>
              <p className="text-muted-foreground text-[10px]">{s.sub}</p>
              <p className="text-muted-foreground mt-0.5 text-[9px] font-medium uppercase tracking-wide">
                {s.label}
              </p>
            </div>
          ))}
        </div>

        {/* Budget bar */}
        <div>
          <div className="mb-1.5 flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Daily AI budget</span>
            <span className="font-medium tabular-nums">
              {aiUsage.todayMessageCount} / {aiUsage.dailyBudget}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className={`h-full rounded-full transition-all ${
                budgetPct >= 90
                  ? 'bg-destructive'
                  : budgetPct >= 70
                    ? 'bg-amber-500'
                    : 'bg-primary'
              }`}
              style={{ width: `${budgetPct}%` }}
            />
          </div>
          <p className="text-muted-foreground mt-1 text-[10px]">
            {remainingPct}% of today&apos;s budget remaining · resets at midnight
          </p>
        </div>
      </div>
    </SettingsSection>
  )
}
