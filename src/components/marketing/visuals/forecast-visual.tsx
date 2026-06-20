'use client'

import { motion, useReducedMotion } from 'framer-motion'

// ============================================================================
// ForecastVisual — "Carbon Forecasting". A 12-month projection: history (solid)
// + forecast (dotted) with a confidence band and a Paris-aligned target line.
// ============================================================================

export function ForecastVisual() {
  const reduce = useReducedMotion()
  const history = [62, 58, 65, 60, 55, 52, 50, 48, 52, 49, 45, 42]
  const forecast = [42, 40, 38, 37, 35, 34, 33, 32, 31, 30, 30, 29]
  const lower = forecast.map((v) => v - 4)
  const upper = forecast.map((v) => v + 5)

  const W = 320
  const H = 150
  const step = W / (history.length + forecast.length - 2)

  return (
    <div className="relative aspect-[4/3] w-full">
      <div className="flex h-full flex-col rounded-2xl border bg-card/80 p-5 shadow-xl backdrop-blur">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              12-month forecast
            </p>
            <p className="text-sm font-semibold">Projected: 29 kg/week by Dec</p>
          </div>
          <div className="rounded-lg bg-emerald-500/10 px-2.5 py-1">
            <p className="font-mono text-[9px] text-muted-foreground">confidence</p>
            <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              87%
            </p>
          </div>
        </div>

        <div className="relative flex-1">
          <svg viewBox={`0 0 ${W} ${H}`} className="size-full" preserveAspectRatio="none">
            <defs>
              <linearGradient id="fc-hist" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.3" />
                <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="fc-band" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.18" />
                <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.04" />
              </linearGradient>
            </defs>

            {/* Grid */}
            {[0, 37, 75, 112, 150].map((y) => (
              <line
                key={y}
                x1="0"
                y1={y}
                x2={W}
                y2={y}
                stroke="var(--border)"
                strokeWidth="1"
                strokeDasharray="2 4"
              />
            ))}

            {/* Target line */}
            <line
              x1="0"
              y1={H - (30 / 80) * H}
              x2={W}
              y2={H - (30 / 80) * H}
              stroke="var(--chart-4)"
              strokeWidth="1.5"
              strokeDasharray="6 3"
              opacity="0.7"
            />

            {/* Confidence band */}
            <path d={bandPath(upper, lower, H, 80, step)} fill="url(#fc-band)" />

            {/* History area */}
            <path
              d={areaPath(history, H, 80, step, 0)}
              fill="url(#fc-hist)"
            />
            {/* History line */}
            <motion.path
              d={linePath(history, H, 80, step, 0)}
              fill="none"
              stroke="var(--primary)"
              strokeWidth="2.5"
              strokeLinecap="round"
              initial={reduce ? undefined : { pathLength: 0 }}
              whileInView={{ pathLength: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
            />

            {/* Forecast line (dotted) */}
            <motion.path
              d={linePath(forecast, H, 80, step, history.length - 1)}
              fill="none"
              stroke="var(--primary)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray="4 4"
              opacity="0.7"
              initial={reduce ? undefined : { pathLength: 0 }}
              whileInView={{ pathLength: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1, delay: 0.8, ease: [0.22, 1, 0.36, 1] }}
            />

            {/* "Now" marker */}
            <line
              x1={(history.length - 1) * step}
              y1="0"
              x2={(history.length - 1) * step}
              y2={H}
              stroke="var(--foreground)"
              strokeWidth="1"
              strokeDasharray="2 2"
              opacity="0.3"
            />
          </svg>

          {/* Legend */}
          <div className="absolute right-0 top-0 flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5">
              <span className="h-0.5 w-4 rounded-full bg-primary" />
              <span className="text-[10px] font-medium">History</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-0.5 w-4 border-t-2 border-dashed border-primary/70" />
              <span className="text-[10px] text-muted-foreground">Forecast</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-0.5 w-4 border-t-2 border-dashed border-amber-500/70" />
              <span className="text-[10px] text-muted-foreground">Target</span>
            </div>
          </div>

          <span className="absolute bottom-0 font-mono text-[9px] text-muted-foreground"
            style={{ left: `${((history.length - 1) / (history.length + forecast.length - 2)) * 100}%`, transform: 'translateX(-50%)' }}
          >
            now
          </span>
        </div>
      </div>
    </div>
  )
}

function linePath(
  data: number[],
  h: number,
  max: number,
  step: number,
  offset: number,
): string {
  return data
    .map((v, i) => {
      const x = (i + offset) * step
      const y = h - (v / max) * h
      return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`
    })
    .join(' ')
}

function areaPath(
  data: number[],
  h: number,
  max: number,
  step: number,
  offset: number,
): string {
  const top = linePath(data, h, max, step, offset)
  const lastX = (data.length - 1 + offset) * step
  const firstX = offset * step
  return `${top} L ${lastX.toFixed(1)} ${h} L ${firstX.toFixed(1)} ${h} Z`
}

function bandPath(
  upper: number[],
  lower: number[],
  h: number,
  max: number,
  step: number,
): string {
  const offset = 11 // forecast starts after 12 history points (index 11)
  const top = upper
    .map((v, i) => {
      const x = (i + offset) * step
      const y = h - (v / max) * h
      return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`
    })
    .join(' ')
  const bottom = lower
    .slice()
    .reverse()
    .map((v, i) => {
      const x = (lower.length - 1 - i + offset) * step
      const y = h - (v / max) * h
      return `L ${x.toFixed(1)} ${y.toFixed(1)}`
    })
    .join(' ')
  return `${top} ${bottom} Z`
}
