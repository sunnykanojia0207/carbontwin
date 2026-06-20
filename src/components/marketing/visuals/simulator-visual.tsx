'use client'

import * as React from 'react'
import { motion, useReducedMotion } from 'framer-motion'

// ============================================================================
// SimulatorVisual — "What-If Simulator". A slider that (on the page) is
// non-interactive but animates on view to show baseline → scenario with a
// confidence band. Pure SVG/CSS, no chart library needed for a hero mock.
// ============================================================================

export function SimulatorVisual() {
  const reduce = useReducedMotion()
  const [intensity, setIntensity] = React.useState(0)
  const target = 0.5

  React.useEffect(() => {
    if (reduce) {
      setIntensity(target)
      return
    }
    const t = setTimeout(() => setIntensity(target), 600)
    return () => clearTimeout(t)
  }, [reduce])

  // Scenario path shrinks the area under the curve proportional to intensity.
  const baseline = [40, 58, 50, 72, 65, 80, 75]
  const scenario = baseline.map((v) => v * (1 - intensity * 0.45))

  return (
    <div className="relative aspect-[4/3] w-full">
      <div className="flex h-full flex-col rounded-2xl border bg-card/80 p-5 shadow-xl backdrop-blur">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Scenario
            </p>
            <p className="text-sm font-semibold">Cut meat by 50%</p>
          </div>
          <div className="rounded-lg bg-primary/10 px-2.5 py-1 text-right">
            <p className="font-mono text-[10px] text-muted-foreground">saves</p>
            <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
              312 kg/yr
            </p>
          </div>
        </div>

        {/* Chart */}
        <div className="relative flex-1">
          <svg viewBox="0 0 320 140" className="size-full" preserveAspectRatio="none">
            <defs>
              <linearGradient id="sim-baseline" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--muted-foreground)" stopOpacity="0.25" />
                <stop offset="100%" stopColor="var(--muted-foreground)" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="sim-scenario" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.4" />
                <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Grid */}
            {[0, 35, 70, 105, 140].map((y) => (
              <line
                key={y}
                x1="0"
                y1={y}
                x2="320"
                y2={y}
                stroke="var(--border)"
                strokeWidth="1"
                strokeDasharray="2 4"
              />
            ))}

            {/* Confidence band (between baseline and scenario) */}
            <motion.path
              d={areaBetween(baseline, scenario, 140, 80)}
              fill="var(--primary)"
              fillOpacity="0.08"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.8, duration: 0.6 }}
            />

            {/* Baseline area */}
            <path
              d={areaPath(baseline, 140, 80)}
              fill="url(#sim-baseline)"
            />
            {/* Baseline line */}
            <path
              d={linePath(baseline, 140, 80)}
              fill="none"
              stroke="var(--muted-foreground)"
              strokeWidth="1.5"
              strokeDasharray="4 3"
              opacity="0.6"
            />

            {/* Scenario area (animated) */}
            <motion.path
              d={areaPath(scenario, 140, 80)}
              fill="url(#sim-scenario)"
              initial={reduce ? undefined : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.6 }}
            />
            {/* Scenario line (animated) */}
            <motion.path
              d={linePath(scenario, 140, 80)}
              fill="none"
              stroke="var(--primary)"
              strokeWidth="2.5"
              strokeLinecap="round"
              initial={reduce ? undefined : { pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ delay: 0.4, duration: 1, ease: [0.22, 1, 0.36, 1] }}
            />
          </svg>

          {/* Legend */}
          <div className="absolute right-0 top-0 flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5">
              <span className="h-0.5 w-4 border-t-2 border-dashed border-muted-foreground/60" />
              <span className="text-[10px] text-muted-foreground">Baseline</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-0.5 w-4 rounded-full bg-primary" />
              <span className="text-[10px] font-medium">Scenario</span>
            </div>
          </div>
        </div>

        {/* Slider mock */}
        <div className="mt-4">
          <div className="mb-1.5 flex justify-between text-[10px] text-muted-foreground">
            <span>0%</span>
            <span className="font-medium text-foreground">
              {Math.round(intensity * 100)}% reduction
            </span>
            <span>100%</span>
          </div>
          <div className="relative h-2 rounded-full bg-muted">
            <motion.div
              className="absolute inset-y-0 left-0 rounded-full bg-primary"
              animate={{ width: `${intensity * 100}%` }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            />
            <motion.div
              className="absolute top-1/2 size-4 -translate-y-1/2 rounded-full border-2 border-primary bg-background shadow"
              animate={{ left: `calc(${intensity * 100}% - 8px)` }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

// Helpers — map data arrays into SVG path strings.
function linePath(data: number[], h: number, max: number): string {
  const step = 320 / (data.length - 1)
  return data
    .map((v, i) => {
      const x = i * step
      const y = h - (v / max) * h
      return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`
    })
    .join(' ')
}

function areaPath(data: number[], h: number, max: number): string {
  const step = 320 / (data.length - 1)
  const top = data
    .map((v, i) => {
      const x = i * step
      const y = h - (v / max) * h
      return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`
    })
    .join(' ')
  return `${top} L 320 ${h} L 0 ${h} Z`
}

function areaBetween(
  upper: number[],
  lower: number[],
  h: number,
  max: number,
): string {
  const step = 320 / (upper.length - 1)
  const top = upper
    .map((v, i) => {
      const x = i * step
      const y = h - (v / max) * h
      return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`
    })
    .join(' ')
  const bottom = lower
    .slice()
    .reverse()
    .map((v, i) => {
      const x = (lower.length - 1 - i) * step
      const y = h - (v / max) * h
      return `L ${x.toFixed(1)} ${y.toFixed(1)}`
    })
    .join(' ')
  return `${top} ${bottom} Z`
}
