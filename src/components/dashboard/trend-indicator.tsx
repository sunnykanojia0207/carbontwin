import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react'

import { cn } from '@/lib/utils'

// ============================================================================
// Trend indicator — compact up/down/stable badge with delta.
// Convention: for emissions, "down is good" (green); for score, "up is good".
// ============================================================================

export function TrendIndicator({
  value,
  direction,
  goodWhenDown = true,
  suffix = '%',
  className,
}: {
  value: number
  direction: 'up' | 'down' | 'stable'
  goodWhenDown?: boolean
  suffix?: string
  className?: string
}) {
  if (direction === 'stable' || Math.abs(value) < 0.1) {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-0.5 text-xs font-medium text-muted-foreground',
          className,
        )}
      >
        <Minus className="size-3" />
        stable
      </span>
    )
  }

  const isGood = goodWhenDown ? direction === 'down' : direction === 'up'
  const Icon = direction === 'up' ? ArrowUpRight : ArrowDownRight
  const colorClass = isGood
    ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10'
    : 'text-amber-600 dark:text-amber-400 bg-amber-500/10'

  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-xs font-semibold tabular-nums',
        colorClass,
        className,
      )}
    >
      <Icon className="size-3" />
      {Math.abs(value).toFixed(1)}
      {suffix}
    </span>
  )
}
