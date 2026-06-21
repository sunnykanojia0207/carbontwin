'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { Leaf, Clock, DollarSign, TrendingDown, Check, CheckCheck } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatCo2e } from '@/lib/emissions/appliance-calc'
import type { ActionPlan } from '@/lib/ai/negotiator-prompt'
import { cn } from '@/lib/utils'

// ============================================================================
// ActionPlanCard — a structured action plan embedded in the chat.
// Redesigned to match the app's card style (border, bg-card, rounded-xl).
// Consistent with kpi-row, section-card, and twin dimension cards.
// ============================================================================

const DIFFICULTY_BADGE: Record<string, string> = {
  EASY:   'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  MEDIUM: 'border-amber-500/30  bg-amber-500/10  text-amber-700  dark:text-amber-400',
  HARD:   'border-red-500/30    bg-red-500/10    text-red-700    dark:text-red-400',
}

const CATEGORY_COLOR: Record<string, string> = {
  home:       '#f59e0b',
  appliances: '#8b5cf6',
  transport:  '#0ea5e9',
  lifestyle:  '#ec4899',
  diet:       '#10b981',
  other:      '#94a3b8',
}

export function ActionPlanCard({
  plan,
  onAccept,
}: {
  plan: ActionPlan
  onAccept?: (plan: ActionPlan) => void
}) {
  const color = CATEGORY_COLOR[plan.category] ?? CATEGORY_COLOR.other
  const [accepted, setAccepted] = React.useState(false)

  const handleAccept = React.useCallback(() => {
    setAccepted(true)
    onAccept?.(plan)
    setTimeout(() => setAccepted(false), 2500)
  }, [plan, onAccept])

  return (
    <motion.div
      initial={{ opacity: 0, y: 6, scale: 0.99 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="mt-1 overflow-hidden rounded-xl border border-border bg-card shadow-xs"
    >
      {/* Colored top accent bar */}
      <div className="h-0.5 w-full" style={{ backgroundColor: color }} />

      {/* Header */}
      <div className="flex items-start gap-3 border-b bg-muted/30 px-4 py-3">
        <div
          className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset ring-black/5"
          style={{ backgroundColor: `${color}20`, color }}
        >
          <TrendingDown className="size-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start gap-2">
            <p className="text-sm font-semibold leading-tight">{plan.title}</p>
            <Badge
              variant="outline"
              className={cn(
                'shrink-0 px-1.5 py-0.5 text-[10px] leading-none',
                DIFFICULTY_BADGE[plan.difficulty] ?? '',
              )}
            >
              {plan.difficulty}
            </Badge>
          </div>
          <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
            {plan.description}
          </p>
        </div>
      </div>

      {/* Stats — 2-up on mobile, 4-up on sm+ */}
      <div className="grid grid-cols-2 gap-px bg-border sm:grid-cols-4">
        <StatCell
          icon={Leaf}
          label="Reduction"
          value={`−${formatCo2e(plan.co2ReductionKg)}`}
          sub="per year"
          color="text-emerald-600 dark:text-emerald-400"
        />
        <StatCell
          icon={DollarSign}
          label="Cost"
          value={plan.costUsd === 0 ? 'Free' : `$${plan.costUsd}`}
          sub={plan.costUsd === 0 ? 'no upfront cost' : 'one-time'}
          color={plan.costUsd === 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}
        />
        <StatCell
          icon={Clock}
          label="Time"
          value={plan.timeRequired.split(',')[0]}
          sub={plan.timeRequired.includes(',') ? plan.timeRequired.split(',')[1]?.trim() : 'commitment'}
          color="text-sky-600 dark:text-sky-400"
        />
        <StatCell
          icon={TrendingDown}
          label="Difficulty"
          value={
            plan.difficulty === 'EASY'
              ? 'Quick win'
              : plan.difficulty === 'MEDIUM'
              ? 'Moderate'
              : 'High effort'
          }
          sub={plan.category}
          color="text-primary"
        />
      </div>

      {/* Footer CTA */}
      {onAccept && (
        <div className="flex items-center justify-end border-t px-3 py-2.5">
          <Button
            size="sm"
            variant="outline"
            className={cn(
              'h-7 gap-1.5 px-3 text-xs transition-all duration-200',
              accepted &&
                'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/10 dark:text-emerald-400',
            )}
            onClick={handleAccept}
          >
            {accepted ? (
              <>
                <CheckCheck className="size-3.5" />
                Accepted!
              </>
            ) : (
              <>
                <Check className="size-3.5" />
                Accept this plan
              </>
            )}
          </Button>
        </div>
      )}
    </motion.div>
  )
}

// ---------------------------------------------------------------------------
// StatCell — compact metric cell inside the plan card
// ---------------------------------------------------------------------------
function StatCell({
  icon: Icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  sub: string
  color: string
}) {
  return (
    <div className="bg-background px-3 py-2.5">
      <div className="flex items-center gap-1 mb-1">
        <Icon className={cn('size-3 shrink-0', color)} />
        <p className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
      </div>
      <p className={cn('text-sm font-semibold tabular-nums leading-tight', color)}>
        {value}
      </p>
      <p className="mt-0.5 text-[10px] leading-none text-muted-foreground/60 capitalize">
        {sub}
      </p>
    </div>
  )
}
