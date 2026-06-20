'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { Leaf, Clock, DollarSign, TrendingDown, Check, Zap, CheckCheck } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatCo2e } from '@/lib/emissions/appliance-calc'
import type { ActionPlan } from '@/lib/ai/negotiator-prompt'
import { cn } from '@/lib/utils'

// ============================================================================
// ActionPlanCard — renders a structured action plan as a rich embedded card.
//
// Redesign polish:
//   • Accept button shows a brief "Accepted!" state before resetting
//   • More compact on mobile (single-column stats)
//   • Smoother entrance animation
//   • Subtle hover lift
// ============================================================================

const DIFFICULTY_STYLES: Record<string, string> = {
  EASY: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  MEDIUM: 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400',
  HARD: 'border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400',
}

const CATEGORY_COLORS: Record<string, string> = {
  home: '#f59e0b',
  appliances: '#8b5cf6',
  transport: '#0ea5e9',
  lifestyle: '#ec4899',
  diet: '#10b981',
  other: '#94a3b8',
}

export function ActionPlanCard({
  plan,
  onAccept,
}: {
  plan: ActionPlan
  onAccept?: (plan: ActionPlan) => void
}) {
  const color = CATEGORY_COLORS[plan.category] ?? CATEGORY_COLORS.other
  const [accepted, setAccepted] = React.useState(false)

  const handleAccept = React.useCallback(() => {
    setAccepted(true)
    onAccept?.(plan)
    setTimeout(() => setAccepted(false), 2000)
  }, [plan, onAccept])

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="my-2 overflow-hidden rounded-xl border border-primary/30 bg-primary/5 transition-shadow duration-200 hover:shadow-sm"
    >
      {/* Header */}
      <div className="flex items-start gap-3 border-b border-primary/20 bg-primary/5 p-3 sm:p-4">
        <span
          className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset ring-black/5"
          style={{ backgroundColor: `${color}20`, color }}
        >
          <Zap className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-2 sm:items-center">
            <p className="text-sm font-semibold leading-tight">{plan.title}</p>
            <Badge
              variant="outline"
              className={cn(
                'shrink-0 text-[9px] leading-none px-1.5 py-0.5',
                DIFFICULTY_STYLES[plan.difficulty] ?? '',
              )}
            >
              {plan.difficulty}
            </Badge>
          </div>
          <p className="text-muted-foreground mt-0.5 text-xs leading-relaxed">
            {plan.description}
          </p>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-px bg-border sm:grid-cols-4">
        <Stat
          icon={Leaf}
          label="CO₂ Reduction"
          value={`−${formatCo2e(plan.co2ReductionKg)}`}
          sub="per year"
          accent="text-emerald-600 dark:text-emerald-400"
        />
        <Stat
          icon={DollarSign}
          label="Cost"
          value={plan.costUsd === 0 ? 'Free' : `$${plan.costUsd}`}
          sub={plan.costUsd === 0 ? 'no upfront' : 'upfront'}
          accent={plan.costUsd === 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}
        />
        <Stat
          icon={Clock}
          label="Time Required"
          value={plan.timeRequired.split(',')[0]}
          sub={plan.timeRequired.includes(',') ? plan.timeRequired.split(',')[1].trim() : 'commitment'}
          accent="text-sky-600 dark:text-sky-400"
        />
        <Stat
          icon={TrendingDown}
          label="Impact"
          value={plan.difficulty === 'EASY' ? 'Quick win' : plan.difficulty === 'MEDIUM' ? 'Moderate' : 'High effort'}
          sub={plan.category}
          accent="text-primary"
        />
      </div>

      {/* Accept CTA */}
      {onAccept && (
        <div className="flex items-center justify-end gap-2 border-t p-2.5 sm:p-3">
          <Button
            size="sm"
            variant={accepted ? 'default' : 'ghost'}
            className={cn(
              'text-xs gap-1.5 transition-all duration-200',
              accepted && 'bg-emerald-600 hover:bg-emerald-600 text-white',
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
// Stat cell — small metric display
// ---------------------------------------------------------------------------
function Stat({
  icon: Icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  sub: string
  accent: string
}) {
  return (
    <div className="bg-background p-2.5 sm:p-3">
      <div className="flex items-center gap-1">
        <Icon className={cn('size-3', accent)} />
        <p className="text-muted-foreground text-[9px] font-medium uppercase tracking-wider">
          {label}
        </p>
      </div>
      <p className={cn('mt-0.5 text-sm font-semibold tabular-nums', accent)}>
        {value}
      </p>
      <p className="text-muted-foreground/60 text-[9px] leading-none">{sub}</p>
    </div>
  )
}
