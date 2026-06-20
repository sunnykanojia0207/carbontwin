'use client'

import { Car, Lightbulb, UtensilsCrossed, Plane } from 'lucide-react'
import { motion } from 'framer-motion'

import { cn } from '@/lib/utils'

// ============================================================================
// SuggestedPrompts — redesigned starter cards.
//
// Each card has a category accent color, icon, and prompt text. Hover lifts
// the card slightly. Cards stagger in on mount.
// ============================================================================

type PromptEntry = {
  icon: typeof Car
  text: string
  category: 'transport' | 'home' | 'diet' | 'lifestyle'
}

const SUGGESTED_PROMPTS: PromptEntry[] = [
  {
    icon: Car,
    text: 'How can I reduce my transport footprint without giving up my car?',
    category: 'transport',
  },
  {
    icon: Lightbulb,
    text: "What's the cheapest way to cut my home energy use?",
    category: 'home',
  },
  {
    icon: UtensilsCrossed,
    text: "I want to eat more sustainably but I'm not ready to go vegan. What can I do?",
    category: 'diet',
  },
  {
    icon: Plane,
    text: 'I fly a lot for work. How do I offset that?',
    category: 'lifestyle',
  },
]

const CATEGORY_STYLES: Record<string, { bg: string; border: string; icon: string }> = {
  transport: {
    bg: 'bg-sky-500/5 dark:bg-sky-500/10',
    border: 'border-sky-500/20 dark:border-sky-500/30 hover:border-sky-500/50',
    icon: 'text-sky-600 dark:text-sky-400',
  },
  home: {
    bg: 'bg-amber-500/5 dark:bg-amber-500/10',
    border: 'border-amber-500/20 dark:border-amber-500/30 hover:border-amber-500/50',
    icon: 'text-amber-600 dark:text-amber-400',
  },
  diet: {
    bg: 'bg-emerald-500/5 dark:bg-emerald-500/10',
    border: 'border-emerald-500/20 dark:border-emerald-500/30 hover:border-emerald-500/50',
    icon: 'text-emerald-600 dark:text-emerald-400',
  },
  lifestyle: {
    bg: 'bg-purple-500/5 dark:bg-purple-500/10',
    border: 'border-purple-500/20 dark:border-purple-500/30 hover:border-purple-500/50',
    icon: 'text-purple-600 dark:text-purple-400',
  },
}

export function SuggestedPrompts({
  onPromptClick,
  className,
}: {
  onPromptClick: (prompt: string) => void
  className?: string
}) {
  return (
    <div className={cn('space-y-3', className)}>
      <p className="text-muted-foreground text-center text-[11px] font-medium tracking-wide">
        Try asking about…
      </p>
      <div className="grid gap-2 sm:grid-cols-2">
        {SUGGESTED_PROMPTS.map((prompt, i) => {
          const styles = CATEGORY_STYLES[prompt.category]
          const Icon = prompt.icon

          return (
            <motion.button
              key={i}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08, duration: 0.3, ease: 'easeOut' }}
              onClick={() => onPromptClick(prompt.text)}
              className={cn(
                'group flex items-start gap-3 rounded-2xl border p-4 text-left transition-all duration-200',
                styles.bg,
                styles.border,
                'hover:shadow-sm hover:-translate-y-0.5',
              )}
            >
              <span
                className={cn(
                  'mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-background ring-1 ring-border transition-colors',
                  styles.icon,
                )}
              >
                <Icon className="size-4" />
              </span>
              <span className="text-foreground/80 group-hover:text-foreground text-sm leading-snug transition-colors">
                {prompt.text}
              </span>
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}
