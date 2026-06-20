'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { Camera, Mic, Type, Sparkles, CheckCircle2 } from 'lucide-react'

// ============================================================================
// DetectorVisual — redesigned as a clean "terminal / live feed" UI mock.
// No SVG lines. Instead: a card with a top input bar, an AI processing row,
// and an animated list of detections appearing one by one.
// This is reliable, responsive, and visually polished.
// ============================================================================

const INPUTS = [
  { icon: Camera, label: 'Photo scan',   color: 'text-sky-500',   bg: 'bg-sky-500/10'   },
  { icon: Mic,    label: 'Voice note',   color: 'text-violet-500', bg: 'bg-violet-500/10' },
  { icon: Type,   label: 'Text entry',   color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
] as const

const DETECTIONS = [
  { label: 'Burger',            kg: '5.2', conf: 94, color: 'bg-red-400'     },
  { label: 'Train · 12 km',    kg: '0.4', conf: 91, color: 'bg-sky-400'     },
  { label: 'T-shirt · cotton', kg: '3.1', conf: 88, color: 'bg-violet-400'  },
] as const

export function DetectorVisual() {
  const reduce = useReducedMotion()

  return (
    <div className="relative w-full">
      {/* Outer glow */}
      <div className="pointer-events-none absolute -inset-4 rounded-3xl bg-primary/10 blur-2xl" />

      <div className="relative rounded-2xl border bg-card shadow-xl overflow-hidden">

        {/* ── Top bar ── */}
        <div className="flex items-center justify-between border-b bg-muted/30 px-4 py-2.5">
          <div className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-red-400/70" />
            <span className="size-2.5 rounded-full bg-amber-400/70" />
            <span className="size-2.5 rounded-full bg-emerald-400/70" />
          </div>
          <div className="flex items-center gap-1.5">
            <motion.span
              className="size-1.5 rounded-full bg-emerald-500"
              animate={reduce ? undefined : { opacity: [1, 0.3, 1] }}
              transition={{ duration: 1.8, repeat: Infinity }}
            />
            <span className="font-mono text-[10px] text-muted-foreground">
              carbon detector · live
            </span>
          </div>
        </div>

        {/* ── Input source tabs ── */}
        <div className="flex gap-2 border-b px-4 py-3">
          {INPUTS.map((inp, i) => (
            <motion.div
              key={inp.label}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium ${inp.bg} ${inp.color} ${i === 0 ? 'ring-1 ring-current ring-offset-1' : 'opacity-50'}`}
              initial={{ opacity: 0, y: -6 }}
              whileInView={{ opacity: i === 0 ? 1 : 0.5, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 + i * 0.1, duration: 0.3 }}
            >
              <inp.icon className="size-3" />
              {inp.label}
            </motion.div>
          ))}
        </div>

        {/* ── AI processing row ── */}
        <div className="flex items-center gap-3 border-b bg-primary/5 px-4 py-3">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/15">
            <Sparkles className="size-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium">AI extracting carbon activities…</p>
            <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-muted">
              <motion.div
                className="h-full rounded-full bg-primary"
                initial={{ width: '0%' }}
                whileInView={{ width: '100%' }}
                viewport={{ once: true }}
                transition={{ delay: 0.4, duration: 1.2, ease: 'easeInOut' }}
              />
            </div>
          </div>
          <motion.span
            className="shrink-0 font-mono text-[10px] text-primary"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 1.6 }}
          >
            done
          </motion.span>
        </div>

        {/* ── Detected items ── */}
        <div className="divide-y">
          <div className="px-4 pt-3 pb-1">
            <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Detected · {DETECTIONS.length} activities
            </span>
          </div>

          {DETECTIONS.map((d, i) => (
            <motion.div
              key={d.label}
              className="flex items-center gap-3 px-4 py-3"
              initial={{ opacity: 0, x: 16 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 1.0 + i * 0.2, duration: 0.4 }}
            >
              {/* Check */}
              <CheckCircle2 className="size-4 shrink-0 text-primary" />

              {/* Label + bar */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium truncate">{d.label}</span>
                  <span className="ml-3 shrink-0 font-mono text-xs font-semibold text-primary">
                    {d.kg} kg
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                    <motion.div
                      className={`h-full rounded-full ${d.color}`}
                      initial={{ width: 0 }}
                      whileInView={{ width: `${d.conf}%` }}
                      viewport={{ once: true }}
                      transition={{ delay: 1.2 + i * 0.2, duration: 0.6 }}
                    />
                  </div>
                  <span className="shrink-0 font-mono text-[10px] text-muted-foreground w-7 text-right">
                    {d.conf}%
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* ── Bottom action bar ── */}
        <div className="flex items-center justify-between border-t bg-muted/20 px-4 py-2.5">
          <span className="text-xs text-muted-foreground">
            Review before saving
          </span>
          <motion.div
            className="rounded-md bg-primary px-3 py-1 text-xs font-medium text-primary-foreground"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 1.8 }}
          >
            Confirm all →
          </motion.div>
        </div>
      </div>
    </div>
  )
}
