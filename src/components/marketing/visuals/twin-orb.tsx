'use client'

import { motion, useReducedMotion } from 'framer-motion'

// ============================================================================
// TwinOrb — "Digital Climate Twin". A generative avatar: concentric rings
// representing the user's category composition, orbiting a core. Color shifts
// with footprint tier (here: verdant/emerald). No mascot, no uncanny face.
// ============================================================================

export function TwinOrb() {
  const reduce = useReducedMotion()
  const axes = [
    { label: 'Transport', pct: 34 },
    { label: 'Food', pct: 24 },
    { label: 'Home', pct: 18 },
    { label: 'Shopping', pct: 12 },
    { label: 'Digital', pct: 7 },
    { label: 'Travel', pct: 5 },
  ]

  return (
    <div className="relative aspect-square w-full max-w-sm">
      {/* Outer glow */}
      <div className="absolute inset-8 rounded-full bg-primary/20 blur-3xl" />

      {/* Orbiting rings */}
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          className="absolute size-full rounded-full border border-primary/20"
          animate={reduce ? undefined : { rotate: 360 }}
          transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
        >
          <span className="absolute left-1/2 top-0 size-2 -translate-x-1/2 rounded-full bg-primary/60" />
        </motion.div>
        <motion.div
          className="absolute size-[80%] rounded-full border border-primary/15"
          animate={reduce ? undefined : { rotate: -360 }}
          transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
        >
          <span className="absolute left-0 top-1/2 size-1.5 -translate-y-1/2 rounded-full bg-emerald-400/60" />
        </motion.div>
        <motion.div
          className="absolute size-[60%] rounded-full border border-primary/10"
          animate={reduce ? undefined : { rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
        >
          <span className="absolute bottom-0 left-1/2 size-1 -translate-x-1/2 rounded-full bg-teal-400/60" />
        </motion.div>

        {/* Core */}
        <motion.div
          className="relative flex size-40 items-center justify-center rounded-full bg-gradient-to-br from-primary via-emerald-400 to-teal-500 shadow-2xl"
          animate={reduce ? undefined : { scale: [1, 1.03, 1] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        >
          <div className="absolute inset-2 rounded-full bg-gradient-to-br from-white/20 to-transparent" />
          <div className="relative text-center">
            <p className="text-[9px] font-medium uppercase tracking-widest text-white/80">
              Verdant
            </p>
            <p className="text-2xl font-semibold text-white">7.4t</p>
            <p className="text-[9px] text-white/70">CO₂e / yr</p>
          </div>
        </motion.div>
      </div>

      {/* Composition legend */}
      <div className="absolute -right-2 top-4 space-y-1.5 rounded-xl border bg-card/80 p-3 shadow-lg backdrop-blur sm:right-0">
        <p className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
          composition
        </p>
        {axes.slice(0, 4).map((a, i) => (
          <div key={a.label} className="flex items-center gap-2">
            <span
              className="size-2 rounded-full"
              style={{
                background: ['var(--primary)', '#34d399', '#2dd4bf', '#fbbf24'][i],
              }}
            />
            <span className="w-16 text-[10px] text-muted-foreground">{a.label}</span>
            <span className="font-mono text-[10px] font-medium">{a.pct}%</span>
          </div>
        ))}
      </div>

      {/* Comparison badge */}
      <motion.div
        className="absolute -bottom-2 left-0 rounded-xl border bg-card/80 px-3 py-2 shadow-lg backdrop-blur"
        initial={{ opacity: 0, y: 8 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.5 }}
      >
        <p className="text-[9px] uppercase tracking-wide text-muted-foreground">
          vs country avg
        </p>
        <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
          ↓ 18% below
        </p>
      </motion.div>
    </div>
  )
}
