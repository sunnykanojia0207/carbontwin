'use client'

import { motion } from 'framer-motion'
import {
  Target,
  Trophy,
  Award,
  Leaf,
  TrendingDown,
  Snowflake,
  Flame,
  CheckCircle2,
  type LucideIcon,
} from 'lucide-react'

import { SectionCard } from '@/components/dashboard/section-card'
import { cn } from '@/lib/utils'
import type { Achievement } from '@/lib/services/goals.service'

// ============================================================================
// AchievementsGrid — badges earned (and in-progress) from goal history.
// Clean, motivating, not childish. Gold/silver/bronze tier coloring.
// ============================================================================

const ICONS: Record<string, LucideIcon> = {
  Target,
  Trophy,
  Award,
  Leaf,
  TrendingDown,
  Snowflake,
  Flame,
  CheckCircle2,
}

const TIER_STYLES: Record<string, { ring: string; bg: string; text: string; label: string }> = {
  BRONZE: {
    ring: 'border-amber-700/30',
    bg: 'bg-amber-700/5',
    text: 'text-amber-700 dark:text-amber-500',
    label: 'Bronze',
  },
  SILVER: {
    ring: 'border-slate-400/30',
    bg: 'bg-slate-400/5',
    text: 'text-slate-500 dark:text-slate-300',
    label: 'Silver',
  },
  GOLD: {
    ring: 'border-amber-500/30',
    bg: 'bg-amber-500/5',
    text: 'text-amber-600 dark:text-amber-400',
    label: 'Gold',
  },
}

export function AchievementsGrid({
  achievements,
}: {
  achievements: Achievement[]
}) {
  const earned = achievements.filter((a) => a.earned)

  return (
    <SectionCard
      title="Achievements"
      subtitle={`${earned.length} of ${achievements.length} earned`}
      bodyClassName="pt-0"
    >
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {achievements.map((ach, i) => {
          const Icon = ICONS[ach.icon] ?? Award
          const style = TIER_STYLES[ach.tier] ?? TIER_STYLES.BRONZE
          return (
            <motion.div
              key={ach.slug}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05, duration: 0.3 }}
              className={cn(
                'relative flex flex-col items-center rounded-xl border p-3 text-center transition-all',
                ach.earned
                  ? `${style.ring} ${style.bg}`
                  : 'border-border opacity-50 grayscale',
              )}
            >
              {/* Icon */}
              <div
                className={cn(
                  'mb-2 flex size-10 items-center justify-center rounded-full',
                  ach.earned ? `${style.bg} ${style.text}` : 'bg-muted text-muted-foreground',
                )}
              >
                <Icon className="size-5" />
              </div>

              {/* Name + description */}
              <p className="text-xs font-semibold leading-tight">{ach.name}</p>
              <p className="text-muted-foreground mt-0.5 text-[10px] leading-relaxed">
                {ach.description}
              </p>

              {/* Tier badge */}
              <span
                className={cn(
                  'mt-1.5 rounded px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-wide',
                  ach.earned ? `${style.bg} ${style.text}` : 'bg-muted text-muted-foreground',
                )}
              >
                {style.label}
              </span>

              {/* Progress bar for unearned */}
              {!ach.earned && typeof ach.progress === 'number' && ach.progress > 0 && (
                <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-muted-foreground/50"
                    style={{ width: `${ach.progress * 100}%` }}
                  />
                </div>
              )}
            </motion.div>
          )
        })}
      </div>
    </SectionCard>
  )
}
