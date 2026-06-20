'use client'

import { motion, useReducedMotion } from 'framer-motion'

// ============================================================================
// NegotiatorVisual — "AI Carbon Negotiator". A chat-thread mock where the AI
// proposes a lever, the user counters, and a commitment lands. Conversational
// + structured, not generic.
// ============================================================================

export function NegotiatorVisual() {
  const reduce = useReducedMotion()
  const messages = [
    {
      role: 'ai' as const,
      text: 'You fly short-haul ~6×/yr. Cutting 2 to rail saves 480kg. Doable, or too much?',
    },
    { role: 'user' as const, text: 'Maybe 1 flight. Travel is non-negotiable right now.' },
    {
      role: 'ai' as const,
      text: 'Fair — 1 flight to rail = ~240kg/yr. Want me to lock that in as a goal?',
    },
  ]

  return (
    <div className="relative aspect-[4/3] w-full">
      <div className="flex h-full flex-col rounded-2xl border bg-card/80 p-4 shadow-xl backdrop-blur">
        {/* Header */}
        <div className="mb-3 flex items-center justify-between border-b pb-3">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-full bg-primary/15">
              <span className="size-3 rounded-full bg-primary" />
            </div>
            <div>
              <p className="text-xs font-semibold">AI Negotiator</p>
              <p className="text-[9px] text-emerald-600 dark:text-emerald-400">
                ● finding your best lever
              </p>
            </div>
          </div>
          <span className="font-mono text-[9px] text-muted-foreground">3 turns</span>
        </div>

        {/* Thread */}
        <div className="flex-1 space-y-2.5 overflow-hidden">
          {messages.map((m, i) => (
            <motion.div
              key={i}
              className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              initial={reduce ? { opacity: 1 } : { opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 + i * 0.5, duration: 0.5 }}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-3 py-2 text-xs leading-relaxed ${
                  m.role === 'user'
                    ? 'rounded-br-sm bg-primary text-primary-foreground'
                    : 'rounded-bl-sm border bg-muted/50'
                }`}
              >
                {m.text}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Commitment card */}
        <motion.div
          className="mt-3 rounded-xl border border-primary/30 bg-primary/5 p-3"
          initial={reduce ? { opacity: 1 } : { opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 1.9, duration: 0.5 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[9px] font-medium uppercase tracking-wide text-primary">
                proposed commitment
              </p>
              <p className="text-xs font-semibold">
                1 short-haul flight → rail / year
              </p>
            </div>
            <span className="rounded-md bg-emerald-500/15 px-2 py-0.5 font-mono text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
              −240 kg
            </span>
          </div>
          <div className="mt-2.5 flex gap-2">
            <span className="flex-1 rounded-md bg-primary py-1.5 text-center text-[11px] font-medium text-primary-foreground">
              Lock in
            </span>
            <span className="rounded-md border px-3 py-1.5 text-center text-[11px] text-muted-foreground">
              Adjust
            </span>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
