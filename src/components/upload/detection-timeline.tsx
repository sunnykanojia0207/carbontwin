'use client'

import { motion } from 'framer-motion'
import {
  Upload,
  Eye,
  ScanSearch,
  Calculator,
  Database,
  CheckCircle2,
  Loader2,
} from 'lucide-react'

import { cn } from '@/lib/utils'

// ============================================================================
// DetectionTimeline — animated AI analysis steps shown while the detection
// API is in flight. The steps are cosmetic (the actual work happens in one
// server request), but they make the wait feel shorter and explain what the
// AI is doing.
//
// Steps advance on a timer, then jump to "done" when `completed` is true.
// ============================================================================

const STEPS = [
  { icon: Upload, label: 'Uploading image', desc: 'Sending your photo securely' },
  { icon: Eye, label: 'Analyzing room', desc: 'Vision model reading the scene' },
  { icon: ScanSearch, label: 'Detecting appliances', desc: 'Identifying devices & estimating wattage' },
  { icon: Calculator, label: 'Estimating carbon impact', desc: 'Computing annual kWh & CO₂e' },
  { icon: Database, label: 'Storing results', desc: 'Saving to your dashboard' },
]

export function DetectionTimeline({
  currentStep,
  completed,
  error,
}: {
  currentStep: number
  completed: boolean
  error: string | null
}) {
  return (
    <div className="space-y-1">
      {STEPS.map((step, i) => {
        const isDone = completed || i < currentStep
        const isActive = !completed && !error && i === currentStep
        const isError = !completed && !!error && i === currentStep
        const isPending = i > currentStep && !completed

        return (
          <div key={step.label} className="relative flex gap-3">
            {/* Icon column with connecting line */}
            <div className="flex flex-col items-center">
              <span
                className={cn(
                  'flex size-8 shrink-0 items-center justify-center rounded-lg transition-all',
                  isDone && 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
                  isActive && 'bg-primary/15 text-primary',
                  isPending && 'bg-muted text-muted-foreground/50',
                  isError && 'bg-destructive/10 text-destructive',
                )}
              >
                {isDone ? (
                  <CheckCircle2 className="size-4" />
                ) : isError ? (
                  <span className="text-xs font-bold">!</span>
                ) : isActive ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <step.icon className="size-4" />
                )}
              </span>
              {/* Vertical connector line */}
              {i < STEPS.length - 1 && (
                <div
                  className={cn(
                    'mt-1 h-5 w-0.5 rounded-full transition-colors',
                    isDone ? 'bg-emerald-500/30' : 'bg-border',
                  )}
                />
              )}
            </div>

            {/* Text */}
            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1, duration: 0.3 }}
              className={cn(
                'flex-1 rounded-lg px-3 py-2.5 transition-colors',
                isActive && 'bg-primary/5',
              )}
            >
              <p
                className={cn(
                  'text-sm font-medium transition-colors',
                  isPending && 'text-muted-foreground/60',
                  isActive && 'text-foreground',
                  isDone && 'text-foreground',
                )}
              >
                {step.label}
              </p>
              <p
                className={cn(
                  'text-xs transition-colors',
                  isPending ? 'text-muted-foreground/40' : 'text-muted-foreground',
                )}
              >
                  {isError ? error : step.desc}
              </p>
            </motion.div>
          </div>
        )
      })}
    </div>
  )
}
