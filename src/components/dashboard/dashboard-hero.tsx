'use client'

import Link from 'next/link'
import {
  ScanLine,
  Handshake,
  SlidersHorizontal,
  UsersRound,
  TrendingUp,
  Target,
  ArrowRight,
  TreePine,
  Sparkles,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { formatKg } from '@/components/dashboard/format'
import { TrendIndicator } from '@/components/dashboard/trend-indicator'
import { Badge } from '@/components/ui/badge'
import type { DashboardData } from '@/lib/services/dashboard.service'

// ============================================================================
// DashboardHero — premium hero section for the dashboard.
//
// Design (Linear/Vercel-inspired):
//   • Full-bleed gradient background with subtle mesh/blur effect
//   • Time-based greeting + date
//   • Climate Score as a large, animated badge
//   • KPI snippets (trees, streak, reduction)
//   • Quick action chips — one per core flow
// ============================================================================

const QUICK_ACTIONS = [
  {
    href: '/upload',
    icon: ScanLine,
    label: 'Upload & Detect',
    desc: 'Snap a room photo',
    iconBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  },
  {
    href: '/simulator',
    icon: SlidersHorizontal,
    label: 'Simulator',
    desc: 'Model what-if changes',
    iconBg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  },
  {
    href: '/negotiator',
    icon: Handshake,
    label: 'AI Negotiator',
    desc: 'Get personalized advice',
    iconBg: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
  },
  {
    href: '/twin',
    icon: UsersRound,
    label: 'Climate Twin',
    desc: 'Your carbon persona',
    iconBg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  },
] as const

const SCORE_BANDS = [
  { min: 75, label: 'Excellent', color: 'text-emerald-500', ring: 'ring-emerald-500/30' },
  { min: 50, label: 'Good', color: 'text-blue-500', ring: 'ring-blue-500/30' },
  { min: 30, label: 'Fair', color: 'text-amber-500', ring: 'ring-amber-500/30' },
  { min: 0, label: 'Needs Work', color: 'text-red-500', ring: 'ring-red-500/30' },
]

export function DashboardHero({
  data,
  firstName,
  date,
}: {
  data: DashboardData
  firstName: string
  date: string
}) {
  const { score, kpis } = data
  const band = SCORE_BANDS.find((b) => score.value >= b.min) ?? SCORE_BANDS[3]

  // Time-based greeting
  const hour = new Date().getHours()
  const greeting =
    hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  const trendDir =
    score.deltaPct > 1 ? 'up' : score.deltaPct < -1 ? 'down' : 'stable'

  return (
    <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-background via-background to-muted/30">
      {/* Subtle mesh gradient decoration */}
      <div className="pointer-events-none absolute -right-32 -top-32 size-96 rounded-full bg-gradient-to-br from-primary/5 via-primary/3 to-transparent blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -left-32 size-80 rounded-full bg-gradient-to-tr from-blue-500/5 via-violet-500/3 to-transparent blur-3xl" />

      <div className="relative z-10 px-6 py-6 sm:px-8 lg:px-10 lg:py-8">
        {/* Top row: greeting + date + score badge */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                {greeting}, {firstName}
              </h1>
              <span className="bg-primary/10 text-primary hidden size-8 items-center justify-center rounded-full sm:inline-flex">
                <Sparkles className="size-4" />
              </span>
            </div>
            <p className="mt-0.5 text-sm text-muted-foreground">{date}</p>
          </div>

          {/* Score badge */}
          <Link
            href="/results"
            className={cn(
              'group relative flex shrink-0 items-center gap-3 rounded-xl border bg-card p-3 ring-1 transition-all hover:shadow-md',
              band.ring,
            )}
          >
            <div className="flex flex-col items-center">
              <span
                className={cn(
                  'text-3xl font-bold tabular-nums transition-colors',
                  band.color,
                )}
              >
                {score.value}
              </span>
              <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                Score
              </span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className={cn('text-sm font-semibold', band.color)}>
                {band.label}
              </span>
              <div className="flex items-center gap-1.5">
                <TrendIndicator
                  value={score.deltaPct}
                  direction={trendDir}
                  goodWhenDown={false}
                />
                <span className="text-[11px] text-muted-foreground">
                  vs last week
                </span>
              </div>
            </div>
            <ArrowRight className="absolute right-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground/0 transition-all group-hover:text-muted-foreground/60" />
          </Link>
        </div>

        {/* KPI strip */}
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <Badge
            variant="secondary"
            className="gap-1.5 px-3 py-1.5 text-xs font-medium"
          >
            <TrendingUp className="size-3.5 text-emerald-500" />
            <span>
              <span className="tabular-nums">{formatKg(kpis.reductionKg)}</span>{' '}
              reduced
            </span>
          </Badge>
          <Badge
            variant="secondary"
            className="gap-1.5 px-3 py-1.5 text-xs font-medium"
          >
            <TreePine className="size-3.5 text-emerald-500" />
            <span>
              <span className="tabular-nums">{kpis.treesEquivalent}</span> trees
              worth
            </span>
          </Badge>
          <Badge
            variant="secondary"
            className="gap-1.5 px-3 py-1.5 text-xs font-medium"
          >
            <Target className="size-3.5 text-blue-500" />
            <span>
              <span className="tabular-nums">{kpis.streakDays}</span> day streak
            </span>
          </Badge>
          <Badge
            variant="secondary"
            className="gap-1.5 px-3 py-1.5 text-xs font-medium"
          >
            <span className="tabular-nums">{kpis.activitiesLogged}</span>{' '}
            activities
          </Badge>
        </div>

        {/* Quick action chips */}
        <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {QUICK_ACTIONS.map(({ href, icon: Icon, label, desc, iconBg }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'group relative flex items-center gap-3 overflow-hidden rounded-xl border bg-card p-3 transition-all hover:shadow-md',
                'hover:border-primary/30',
              )}
            >
              <span
                className={cn(
                  'flex size-10 shrink-0 items-center justify-center rounded-lg transition-transform group-hover:scale-110',
                  iconBg,
                )}
              >
                <Icon className="size-5" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-medium leading-tight">{label}</p>
                <p className="text-[11px] leading-tight text-muted-foreground">
                  {desc}
                </p>
              </div>
              <ArrowRight className="ml-auto size-3.5 shrink-0 text-muted-foreground/30 transition-colors group-hover:text-muted-foreground/70" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
