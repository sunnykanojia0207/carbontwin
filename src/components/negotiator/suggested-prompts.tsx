'use client'

import { Car, Lightbulb, UtensilsCrossed, Plane, ArrowRight } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

// ============================================================================
// SuggestedPrompts — redesigned to match the app's card style.
// Uses the same border + bg patterns as KpiRow and DashboardHero quick actions.
// ============================================================================

type PromptEntry = {
  icon: typeof Car
  label: string
  text: string
  accent: string
  iconBg: string
}

const PROMPTS: PromptEntry[] = [
  {
    icon: Car,
    label: 'Transport',
    text: 'How can I reduce my transport footprint without giving up my car?',
    accent: 'text-sky-600 dark:text-sky-400',
    iconBg: 'bg-sky-500/10 text-sky-600 dark:text-sky-400',
  },
  {
    icon: Lightbulb,
    label: 'Home energy',
    text: "What's the cheapest way to cut my home energy use this month?",
    accent: 'text-amber-600 dark:text-amber-400',
    iconBg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  },
  {
    icon: UtensilsCrossed,
    label: 'Diet',
    text: "I want to eat more sustainably but I'm not ready to go vegan. What can I do?",
    accent: 'text-emerald-600 dark:text-emerald-400',
    iconBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  },
  {
    icon: Plane,
    label: 'Travel',
    text: 'I fly a lot for work. How do I reduce or offset that realistically?',
    accent: 'text-violet-600 dark:text-violet-400',
    iconBg: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
  },
]

export function SuggestedPrompts({
  onPromptClick,
  className,
}: {
  onPromptClick: (prompt: string) => void
  className?: string
}) {
  return (
    <div className={cn('grid gap-2 sm:grid-cols-2', className)}>
      {PROMPTS.map((prompt, i) => {
        const Icon = prompt.icon
        return (
          <motion.button
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07, duration: 0.25, ease: 'easeOut' }}
            onClick={() => onPromptClick(prompt.text)}
            className={cn(
              'group flex items-start gap-3 rounded-xl border bg-card p-4 text-left',
              'transition-all duration-200 hover:border-primary/30 hover:shadow-sm',
            )}
          >
            <span
              className={cn(
                'mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg transition-transform group-hover:scale-110',
                prompt.iconBg,
              )}
            >
              <Icon className="size-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className={cn('mb-0.5 text-[11px] font-semibold uppercase tracking-wider', prompt.accent)}>
                {prompt.label}
              </p>
              <p className="text-sm leading-snug text-foreground/75 group-hover:text-foreground transition-colors">
                {prompt.text}
              </p>
            </div>
            <ArrowRight className="mt-1 size-3.5 shrink-0 text-muted-foreground/30 transition-colors group-hover:text-muted-foreground/70" />
          </motion.button>
        )
      })}
    </div>
  )
}
