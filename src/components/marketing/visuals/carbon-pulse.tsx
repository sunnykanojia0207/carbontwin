'use client'

import { Flame } from 'lucide-react'
import { motion, useReducedMotion } from 'framer-motion'

// ============================================================================
// CarbonPulse — the hero centerpiece. A premium "live dashboard" mock.
// Refined: gradient border, layered glow, live pulse, sparkline, glassmorphic
// chips. No globe, no stock art — pure generative SVG/CSS.
// ============================================================================

export function CarbonPulse() {
  const reduce = useReducedMotion()
  const bars = [42, 68, 55, 80, 48, 35, 62, 50, 72, 45, 58, 38]
  const spark = [30, 45, 38, 52, 41, 28, 35, 30, 25]

  return (
    <div className="relative aspect-[5/4] w-full">
      {/* Layered ambient glow */}
      <div className="absolute -inset-2 rounded-[2rem] bg-primary/20 blur-3xl" />
      <div className="absolute inset-4 rounded-[1.75rem] bg-emerald-400/10 blur-2xl" />

      {/* Gradient border wrapper */}
      <div className="relative h-full rounded-2xl bg-gradient-to-br from-primary/30 via-border to-border p-px shadow-2xl">
        <div className="flex h-full flex-col overflow-hidden rounded-2xl bg-card/90 backdrop-blur-xl">
          {/* Top bar — refined */}
          <div className="flex items-center justify-between border-b border-border/60 px-5 py-3">
            <div className="flex items-center gap-2">
              <span className="size-2.5 rounded-full bg-red-400/70" />
              <span className="size-2.5 rounded-full bg-amber-400/70" />
              <span className="size-2.5 rounded-full bg-emerald-400/70" />
            </div>
            <div className="flex items-center gap-1.5">
              <motion.span
                className="size-1.5 rounded-full bg-emerald-500"
                animate={
                  reduce ? undefined : { opacity: [1, 0.3, 1] }
                }
                transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
              />
              <span className="font-mono text-[10px] tracking-wide text-muted-foreground">
                carbontwin · live
              </span>
            </div>
          </div>

          {/* Body */}
          <div className="grid flex-1 grid-cols-5 gap-4 p-5">
            {/* Left — gauge + headline */}
            <div className="col-span-2 flex flex-col justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  This week
                </p>
                <p className="mt-1.5 text-[2rem] font-semibold leading-none tracking-tight tabular-nums">
                  42.3
                </p>
                <p className="-mt-0.5 text-xs text-muted-foreground">
                  kg CO₂e
                </p>
                <div className="mt-2 inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-1.5 py-0.5">
                  <svg viewBox="0 0 12 12" className="size-2.5 text-emerald-600 dark:text-emerald-400" fill="none">
                    <path d="M6 9.5V2.5M6 2.5L2.5 6M6 2.5L9.5 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" transform="rotate(180 6 6)" />
                  </svg>
                  <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                    18% vs last week
                  </span>
                </div>
              </div>

              {/* Radial gauge — refined with track gradient */}
              <div className="relative mx-auto my-3 size-28">
                <div className="absolute inset-0 rounded-full bg-primary/5 blur-md" />
                <svg viewBox="0 0 100 100" className="relative size-full -rotate-90">
                  <defs>
                    <linearGradient id="gauge-grad" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="var(--primary)" />
                      <stop offset="100%" stopColor="#34d399" />
                    </linearGradient>
                  </defs>
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    fill="none"
                    strokeWidth="7"
                    className="stroke-muted/60"
                  />
                  <motion.circle
                    cx="50"
                    cy="50"
                    r="42"
                    fill="none"
                    strokeWidth="7"
                    strokeLinecap="round"
                    stroke="url(#gauge-grad)"
                    strokeDasharray={2 * Math.PI * 42}
                    initial={{ strokeDashoffset: 2 * Math.PI * 42 }}
                    whileInView={{ strokeDashoffset: 2 * Math.PI * 42 * (1 - 0.62) }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xl font-semibold tabular-nums">62%</span>
                  <span className="text-[9px] uppercase tracking-wide text-muted-foreground">
                    of target
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-emerald-500" />
                <span className="font-mono text-[10px] text-muted-foreground">
                  on track
                </span>
              </div>
            </div>

            {/* Right — chart + insight + chips */}
            <div className="col-span-3 flex flex-col gap-3">
              {/* Bar chart with refined styling */}
              <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[10px] font-medium text-muted-foreground">
                    Daily emissions
                  </span>
                  <span className="font-mono text-[9px] text-muted-foreground">
                    last 12d
                  </span>
                </div>
                <div className="flex h-16 items-end gap-1">
                  {bars.map((h, i) => (
                    <motion.div
                      key={i}
                      className="flex-1 rounded-t-sm bg-gradient-to-t from-primary/70 to-primary"
                      initial={reduce ? { height: h } : { height: 0 }}
                      whileInView={{ height: `${h}%` }}
                      viewport={{ once: true }}
                      transition={{
                        duration: 0.6,
                        delay: 0.4 + i * 0.05,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                      style={{ minHeight: 3 }}
                    />
                  ))}
                </div>
              </div>

              {/* Insight chip — refined */}
              <div className="group relative overflow-hidden rounded-lg border border-primary/20 bg-gradient-to-br from-primary/5 to-transparent p-3">
                <div className="flex items-start gap-2">
                  <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-primary/15">
                    <svg viewBox="0 0 12 12" className="size-2.5 text-primary" fill="none">
                      <path d="M3 6L5 8L9 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-primary">
                      AI insight
                    </p>
                    <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                      Transport dropped 32% — like charging your phone
                      <span className="font-semibold text-foreground"> 350 times.</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Category chips with sparkline accent */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
                    top sources
                  </span>
                  <div className="flex items-end gap-0.5">
                    {spark.map((v, i) => (
                      <span
                        key={i}
                        className="w-0.5 rounded-full bg-primary/40"
                        style={{ height: `${v / 3}px` }}
                      />
                    ))}
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { l: 'Transport', v: '14.2', c: 'bg-sky-500/10 text-sky-600 dark:text-sky-400', dot: 'bg-sky-500' },
                    { l: 'Food', v: '9.8', c: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400', dot: 'bg-emerald-500' },
                    { l: 'Home', v: '7.1', c: 'bg-amber-500/10 text-amber-600 dark:text-amber-400', dot: 'bg-amber-500' },
                  ].map((c) => (
                    <span
                      key={c.l}
                      className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[10px] font-medium ${c.c}`}
                    >
                      <span className={`size-1.5 rounded-full ${c.dot}`} />
                      {c.l}
                      <span className="font-mono opacity-70">{c.v}</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom status bar */}
          <div className="flex items-center justify-between border-t border-border/60 px-5 py-2">
            <div className="flex items-center gap-3">
              <span className="font-mono text-[9px] text-muted-foreground">
                streak
              </span>
              <span className="inline-flex items-center gap-1 text-xs font-semibold">12 days <Flame className="size-3.5 text-amber-500" /></span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-[9px] text-muted-foreground">
                updated
              </span>
              <span className="font-mono text-[10px]">just now</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
