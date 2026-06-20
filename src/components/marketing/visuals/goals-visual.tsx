'use client'

import { Flame } from 'lucide-react'
import { motion, useReducedMotion } from 'framer-motion'

// ============================================================================
// GoalsVisual — "Sustainability Goals". Three progress rings (weekly,
// monthly, annual) with a streak chip. Reinforces that goals are tiered and
// always recoverable (amber, never red).
// ============================================================================

export function GoalsVisual() {
  const reduce = useReducedMotion()
  const goals = [
    { label: 'This week', pct: 0.78, kg: '12.4 / 16kg', tone: 'emerald' },
    { label: 'This month', pct: 0.52, kg: '38 / 72kg', tone: 'emerald' },
    { label: 'This year', pct: 0.34, kg: '620 / 1.8t', tone: 'amber' },
  ]

  return (
    <div className="relative aspect-[4/3] w-full">
      <div className="flex h-full flex-col rounded-2xl border bg-card/80 p-5 shadow-xl backdrop-blur">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Active goals
            </p>
            <p className="text-sm font-semibold">3 commitments in progress</p>
          </div>
          <div className="flex items-center gap-1.5 rounded-lg bg-amber-500/10 px-2.5 py-1">
            <Flame className="size-3.5 text-amber-500" />
            <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">
              12-day streak
            </span>
          </div>
        </div>

        <div className="grid flex-1 grid-cols-3 gap-3">
          {goals.map((g, i) => {
            const r = 26
            const circ = 2 * Math.PI * r
            const color =
              g.tone === 'amber' ? 'var(--chart-4)' : 'var(--primary)'
            return (
              <div
                key={g.label}
                className="flex flex-col items-center justify-center rounded-xl border bg-muted/20 p-3"
              >
                <div className="relative size-20">
                  <svg viewBox="0 0 64 64" className="size-full -rotate-90">
                    <circle
                      cx="32"
                      cy="32"
                      r={r}
                      fill="none"
                      strokeWidth="5"
                      className="stroke-border"
                    />
                    <motion.circle
                      cx="32"
                      cy="32"
                      r={r}
                      fill="none"
                      strokeWidth="5"
                      strokeLinecap="round"
                      stroke={color}
                      strokeDasharray={circ}
                      initial={{ strokeDashoffset: circ }}
                      whileInView={{
                        strokeDashoffset: circ * (1 - g.pct),
                      }}
                      viewport={{ once: true }}
                      transition={{
                        duration: 1.2,
                        delay: 0.3 + i * 0.15,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-sm font-semibold tabular-nums">
                      {Math.round(g.pct * 100)}%
                    </span>
                  </div>
                </div>
                <p className="mt-2 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                  {g.label}
                </p>
                <p className="font-mono text-[10px]">{g.kg}</p>
              </div>
            )
          })}
        </div>

        <div className="mt-3 flex items-center gap-2 rounded-lg bg-muted/30 px-3 py-2">
          <span className="size-1.5 rounded-full bg-amber-500" />
          <span className="text-[11px] text-muted-foreground">
            Annual goal is 12% behind — adjust target or extend timeline?
          </span>
        </div>
      </div>
    </div>
  )
}
