'use client'

import {
  Sun,
  Car,
  Home,
  Lightbulb,
  Bus,
  Leaf,
  Check,
  type LucideIcon,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import type { ScenarioDef, ScenarioKey } from '@/lib/simulator/scenarios'

// ============================================================================
// ScenarioCards — grid of 6 selectable scenario cards. Clicking toggles
// active state. Active cards show a checkmark + brand border.
// ============================================================================

const ICONS: Record<string, LucideIcon> = {
  Sun,
  Car,
  Home,
  Lightbulb,
  Bus,
  Leaf,
}

const DIFFICULTY_STYLES: Record<string, string> = {
  EASY: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  MEDIUM: 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400',
  HARD: 'border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400',
}

export function ScenarioCards({
  scenarios,
  active,
  onToggle,
}: {
  scenarios: ScenarioDef[]
  active: ScenarioKey[]
  onToggle: (key: ScenarioKey) => void
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {scenarios.map((scenario) => {
        const Icon = ICONS[scenario.icon] ?? Lightbulb
        const isActive = active.includes(scenario.key)
        return (
          <button
            key={scenario.key}
            onClick={() => onToggle(scenario.key)}
            className={cn(
              'group relative flex flex-col gap-3 rounded-xl border p-4 text-left transition-all',
              isActive
                ? 'border-primary bg-primary/5 shadow-sm'
                : 'border-border hover:border-primary/40 hover:bg-accent/30',
            )}
          >
            {/* Active checkmark */}
            {isActive && (
              <span className="bg-primary text-primary-foreground absolute right-3 top-3 flex size-5 items-center justify-center rounded-full">
                <Check className="size-3" />
              </span>
            )}

            {/* Header */}
            <div className="flex items-center gap-3">
              <span
                className="flex size-10 items-center justify-center rounded-lg transition-transform group-hover:scale-110"
                style={{
                  backgroundColor: `${scenario.color}20`,
                  color: scenario.color,
                }}
              >
                <Icon className="size-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold leading-tight">
                  {scenario.shortTitle}
                </p>
                <Badge
                  variant="outline"
                  className={`mt-1 text-[9px] ${DIFFICULTY_STYLES[scenario.difficulty]}`}
                >
                  {scenario.difficulty}
                </Badge>
              </div>
            </div>

            {/* Description */}
            <p className="text-muted-foreground text-xs leading-relaxed">
              {scenario.description}
            </p>

            {/* Stats */}
            <div className="mt-auto flex items-center gap-3 border-t pt-2.5 text-[10px]">
              <div>
                <p className="text-muted-foreground uppercase tracking-wide">Upfront</p>
                <p className="font-semibold tabular-nums">
                  {scenario.upfrontCostUsd === 0 ? 'Free' : `$${scenario.upfrontCostUsd.toLocaleString()}`}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground uppercase tracking-wide">Saves</p>
                <p className="font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
                  ${scenario.annualSavingsUsd}/yr
                </p>
              </div>
              <div className="ml-auto">
                <p className="text-muted-foreground uppercase tracking-wide">Cut</p>
                <p className="font-semibold tabular-nums">
                  −{Math.round(scenario.reductionPct * 100)}%
                </p>
              </div>
            </div>
          </button>
        )
      })}
    </div>
  )
}
