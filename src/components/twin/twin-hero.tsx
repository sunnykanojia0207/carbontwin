'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { TrendingDown, TrendingUp, Minus } from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'
import { formatCo2e } from '@/lib/emissions/appliance-calc'
import type { TwinData } from '@/lib/services/twin.service'

// ============================================================================
// TwinHero — the centerpiece. A generative orb avatar (reused from the
// marketing site, but now driven by real data) + current state summary.
// ============================================================================

export function TwinHero({ data }: { data: TwinData }) {
  const reduce = useReducedMotion()
  const { tier, current, profile } = data

  const trendIcon =
    current.vsBaselinePct < -2 ? (
      <TrendingDown className="size-3.5" />
    ) : current.vsBaselinePct > 2 ? (
      <TrendingUp className="size-3.5" />
    ) : (
      <Minus className="size-3.5" />
    )
  const trendColor =
    current.vsBaselinePct < 0
      ? 'text-emerald-600 dark:text-emerald-400'
      : 'text-amber-600 dark:text-amber-400'

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="bg-radial-brand relative grid gap-6 p-6 sm:grid-cols-[auto,1fr] sm:p-8">
          {/* Orb */}
          <div className="relative mx-auto size-40 sm:size-44">
            <div
              className="absolute inset-6 rounded-full blur-2xl"
              style={{ backgroundColor: tier.color, opacity: 0.25 }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div
                className="absolute size-full rounded-full border"
                style={{ borderColor: `${tier.color}40` }}
                animate={reduce ? undefined : { rotate: 360 }}
                transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
              >
                <span
                  className="absolute left-1/2 top-0 size-2 -translate-x-1/2 rounded-full"
                  style={{ backgroundColor: tier.color, opacity: 0.6 }}
                />
              </motion.div>
              <motion.div
                className="absolute size-[78%] rounded-full border"
                style={{ borderColor: `${tier.color}30` }}
                animate={reduce ? undefined : { rotate: -360 }}
                transition={{ duration: 28, repeat: Infinity, ease: 'linear' }}
              >
                <span
                  className="absolute left-0 top-1/2 size-1.5 -translate-y-1/2 rounded-full"
                  style={{ backgroundColor: tier.color, opacity: 0.5 }}
                />
              </motion.div>

              {/* Core */}
              <motion.div
                className="relative flex size-36 items-center justify-center rounded-full shadow-2xl sm:size-40"
                style={{
                  background: `linear-gradient(135deg, ${tier.color}, ${tier.color}cc)`,
                }}
                animate={reduce ? undefined : { scale: [1, 1.03, 1] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              >
                <div className="absolute inset-2 rounded-full bg-gradient-to-br from-white/20 to-transparent" />
                <div className="relative text-center">
                  <p className="text-[10px] font-medium uppercase tracking-widest text-white/80">
                    {tier.name}
                  </p>
                  <p className="text-2xl font-semibold text-white sm:text-3xl">
                    {formatCo2e(current.totalAnnualKg)}
                  </p>
                  <p className="text-[10px] text-white/70">CO₂e / year</p>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Summary */}
          <div className="flex flex-col justify-center space-y-4">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                  {profile.name}&apos;s Climate Twin
                </h1>
                <span
                  className="rounded-md px-2 py-0.5 text-xs font-medium"
                  style={{
                    backgroundColor: `${tier.color}20`,
                    color: tier.color,
                  }}
                >
                  {tier.name}
                </span>
              </div>
              <p className="text-muted-foreground mt-1 text-sm">
                {tier.description} · {profile.householdSize}-person household ·{' '}
                {profile.region ?? 'global'}
              </p>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Stat
                label="Monthly"
                value={formatCo2e(current.monthlyKg)}
                sub="CO₂e"
              />
              <Stat
                label="vs Avg"
                value={`${current.vsCountryAvgPct > 0 ? '+' : ''}${current.vsCountryAvgPct}%`}
                sub="country average"
                valueClass={
                  current.vsCountryAvgPct < 0
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-amber-600 dark:text-amber-400'
                }
              />
              <Stat
                label="vs Baseline"
                value={`${current.vsBaselinePct > 0 ? '+' : ''}${current.vsBaselinePct}%`}
                sub="your starting point"
                valueClass={trendColor}
                icon={trendIcon}
              />
              <Stat
                label="Paris 1.5°C"
                value={formatCo2e(current.parisTargetKg)}
                sub="target / year"
                valueClass="text-amber-600 dark:text-amber-400"
              />
            </div>

            {/* On-track badge */}
            <div
              className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium ${
                current.onTrack
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                  : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
              }`}
            >
              <span
                className={`size-1.5 rounded-full ${
                  current.onTrack ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
              />
              {current.onTrack
                ? 'On track for Paris 1.5°C target'
                : `${formatCo2e(current.totalAnnualKg - current.parisTargetKg)} above Paris 1.5°C target`}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function Stat({
  label,
  value,
  sub,
  valueClass,
  icon,
}: {
  label: string
  value: string
  sub: string
  valueClass?: string
  icon?: React.ReactNode
}) {
  return (
    <div className="rounded-lg border bg-background/60 p-3 backdrop-blur">
      <p className="text-muted-foreground text-[10px] font-medium uppercase tracking-wide">
        {label}
      </p>
      <p
        className={`mt-0.5 flex items-center gap-1 text-lg font-semibold tabular-nums ${valueClass ?? ''}`}
      >
        {icon}
        {value}
      </p>
      <p className="text-muted-foreground text-[10px]">{sub}</p>
    </div>
  )
}
