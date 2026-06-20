'use client'

import { motion } from 'framer-motion'
import { CheckCircle2, Clock, Sparkles, MoreVertical } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatCo2e } from '@/lib/emissions/appliance-calc'
import type { GoalWithProgress } from '@/lib/services/goals.service'

// ============================================================================
// GoalCard — a single goal with progress ring, milestones, and actions.
// Clean, motivating, not childish. Shows progress %, current/target kg,
// days remaining, on-track status, and a milestone timeline.
// ============================================================================

export function GoalCard({ goal }: { goal: GoalWithProgress }) {
  const pct = goal.progressPct
  const circumference = 2 * Math.PI * 32
  const offset = circumference * (1 - pct / 100)

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="h-full">
        <CardHeader className="flex flex-row items-start justify-between gap-2 pb-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base font-semibold tracking-tight">
                {goal.title}
              </CardTitle>
              {goal.negotiatedWithAi && (
                <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary text-[9px]">
                  <Sparkles className="mr-1 size-2.5" />
                  AI
                </Badge>
              )}
            </div>
            {goal.description && (
              <p className="text-muted-foreground text-xs leading-relaxed">
                {goal.description}
              </p>
            )}
          </div>
          <Badge
            variant="outline"
            className={`shrink-0 text-[9px] ${
              goal.type === 'WEEKLY'
                ? 'border-sky-500/30 bg-sky-500/10 text-sky-600 dark:text-sky-400'
                : goal.type === 'MONTHLY'
                  ? 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400'
                  : 'border-violet-500/30 bg-violet-500/10 text-violet-600 dark:text-violet-400'
            }`}
          >
            {goal.type}
          </Badge>
        </CardHeader>

        <CardContent className="space-y-4 pt-0">
          {/* Progress ring + stats */}
          <div className="flex items-center gap-4">
            <div className="relative size-20 shrink-0">
              <svg viewBox="0 0 80 80" className="size-full -rotate-90">
                <circle
                  cx="40"
                  cy="40"
                  r="32"
                  fill="none"
                  strokeWidth="6"
                  className="stroke-muted"
                />
                <motion.circle
                  cx="40"
                  cy="40"
                  r="32"
                  fill="none"
                  strokeWidth="6"
                  strokeLinecap="round"
                  stroke={goal.onTrack ? 'var(--primary)' : '#f59e0b'}
                  strokeDasharray={circumference}
                  initial={{ strokeDashoffset: circumference }}
                  animate={{ strokeDashoffset: offset }}
                  transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-lg font-semibold tabular-nums">{pct}%</span>
              </div>
            </div>

            <div className="min-w-0 flex-1 space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-semibold tabular-nums">
                  {formatCo2e(goal.currentKg)} / {formatCo2e(goal.targetKg)}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Time left</span>
                <span
                  className={`flex items-center gap-1 font-medium tabular-nums ${
                    goal.daysRemaining <= 3
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-foreground'
                  }`}
                >
                  <Clock className="size-3" />
                  {goal.daysRemaining}d
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Status</span>
                <span
                  className={`flex items-center gap-1 font-medium ${
                    goal.onTrack
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-amber-600 dark:text-amber-400'
                  }`}
                >
                  <span
                    className={`size-1.5 rounded-full ${
                      goal.onTrack ? 'bg-emerald-500' : 'bg-amber-500'
                    }`}
                  />
                  {goal.onTrack ? 'On track' : 'Behind pace'}
                </span>
              </div>
            </div>
          </div>

          {/* Milestone timeline */}
          <div>
            <p className="text-muted-foreground mb-2 text-[10px] font-semibold uppercase tracking-wide">
              Milestones
            </p>
            <div className="flex items-center justify-between">
              {goal.milestones.map((m, i) => (
                <div key={i} className="flex flex-1 flex-col items-center">
                  <div className="relative flex w-full items-center">
                    {i > 0 && (
                      <div
                        className={`h-0.5 flex-1 ${
                          goal.milestones[i - 1].reached ? 'bg-primary' : 'bg-muted'
                        }`}
                      />
                    )}
                    <div
                      className={`flex size-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                        m.reached
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-muted bg-background'
                      }`}
                    >
                      {m.reached && <CheckCircle2 className="size-3" />}
                    </div>
                    {i < goal.milestones.length - 1 && (
                      <div
                        className={`h-0.5 flex-1 ${
                          m.reached ? 'bg-primary' : 'bg-muted'
                        }`}
                      />
                    )}
                  </div>
                  <span
                    className={`mt-1 text-[9px] ${
                      m.reached ? 'font-medium text-foreground' : 'text-muted-foreground'
                    }`}
                  >
                    {m.pct}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
