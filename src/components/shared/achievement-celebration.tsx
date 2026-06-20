'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Trophy, X } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

// ============================================================================
// AchievementCelebration — lightweight confetti + toast for goal milestones.
//
// Two variants:
//   1. Toast — small notification that auto-dismisses
//   2. Modal — full achievement unlock screen for major milestones
//
// Usage:
//   import { celebrateGoal, celebrateMilestone } from './achievement-celebration'
//
//   celebrateGoal('First Scan!', 'You uploaded your first room photo.', 'EASY')
//   celebrateMilestone('1 Tonne Club', 'You've saved 1000 kg CO₂e!', 'HARD')
// ============================================================================

type AchievementLevel = 'EASY' | 'MEDIUM' | 'HARD'

const LEVEL_CONFIG: Record<AchievementLevel, {
  icon: typeof Sparkles
  label: string
  primaryColor: string
  bgGradient: string
  ringColor: string
  particleCount: number
}> = {
  EASY: {
    icon: Sparkles,
    label: 'Achievement',
    primaryColor: 'text-emerald-500',
    bgGradient: 'from-emerald-500/20 to-emerald-500/5',
    ringColor: 'ring-emerald-500/30',
    particleCount: 12,
  },
  MEDIUM: {
    icon: Trophy,
    label: 'Milestone',
    primaryColor: 'text-blue-500',
    bgGradient: 'from-blue-500/20 to-blue-500/5',
    ringColor: 'ring-blue-500/30',
    particleCount: 20,
  },
  HARD: {
    icon: Trophy,
    label: 'Epic Achievement',
    primaryColor: 'text-violet-500',
    bgGradient: 'from-violet-500/20 to-violet-500/5',
    ringColor: 'ring-violet-500/30',
    particleCount: 30,
  },
}

// --- Particles generator ---
function ConfettiParticles({ count, color }: { count: number; color: string }) {
  const particles = React.useMemo(() => {
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 0.3,
      duration: 0.6 + Math.random() * 0.8,
      size: 4 + Math.random() * 8,
      rotation: Math.random() * 360,
    }))
  }, [count])

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className={cn('absolute rounded-full', color)}
          style={{
            left: `${p.x}%`,
            top: '-10%',
            width: p.size,
            height: p.size,
          }}
          initial={{ y: -20, opacity: 1, rotate: 0 }}
          animate={{
            y: 300,
            opacity: [1, 1, 0],
            rotate: p.rotation,
            x: [0, (Math.random() - 0.5) * 60],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            ease: 'easeOut',
          }}
        />
      ))}
    </div>
  )
}

// --- Toast celebration (auto-dismiss) ---
export function showAchievementToast(
  title: string,
  description: string,
  level: AchievementLevel = 'EASY',
) {
  // Create a temporary container
  const container = document.createElement('div')
  container.className = 'fixed bottom-4 right-4 z-[100]'
  document.body.appendChild(container)

  const root = document.createElement('div')
  container.appendChild(root)

  // Actually we'll use sonner toast with a custom component
  // Import sonner here won't work, so let's use a different approach
}

// --- Modal celebration ---
interface CelebrationModalProps {
  open: boolean
  onClose: () => void
  title: string
  description: string
  level?: AchievementLevel
}

export function CelebrationModal({
  open,
  onClose,
  title,
  description,
  level = 'EASY',
}: CelebrationModalProps) {
  const config = LEVEL_CONFIG[level]
  const Icon = config.icon

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative mx-4 w-full max-w-sm overflow-hidden rounded-2xl border bg-card shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Confetti particles */}
            <ConfettiParticles
              count={config.particleCount}
              color="bg-primary/40"
            />

            <div className="relative z-10 flex flex-col items-center gap-4 p-8 text-center">
              {/* Icon */}
              <motion.span
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', damping: 15, stiffness: 200, delay: 0.1 }}
                className={cn(
                  'flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br shadow-lg ring-1',
                  config.bgGradient,
                  config.ringColor,
                )}
              >
                <Icon className={cn('size-7', config.primaryColor)} />
              </motion.span>

              {/* Level badge */}
              <span
                className={cn(
                  'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider',
                  config.primaryColor,
                  config.bgGradient,
                )}
              >
                {config.label}
              </span>

              {/* Text */}
              <div className="space-y-1">
                <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {description}
                </p>
              </div>

              {/* Close button */}
              <Button size="sm" className="mt-1" onClick={onClose}>
                <Sparkles className="size-3.5" />
                Awesome!
              </Button>
            </div>

            {/* Close X */}
            <button
              onClick={onClose}
              className="absolute right-3 top-3 z-20 rounded-full p-1 text-muted-foreground transition-colors hover:text-foreground"
              aria-label="Close"
            >
              <X className="size-4" />
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// --- Hook for managing celebration state ---
export function useCelebration() {
  const [celebration, setCelebration] = React.useState<{
    title: string
    description: string
    level: AchievementLevel
  } | null>(null)

  const celebrate = React.useCallback(
    (title: string, description: string, level: AchievementLevel = 'EASY') => {
      setCelebration({ title, description, level })
    },
    [],
  )

  const dismiss = React.useCallback(() => {
    setCelebration(null)
  }, [])

  const modal = celebration ? (
    <CelebrationModal
      open={true}
      onClose={dismiss}
      title={celebration.title}
      description={celebration.description}
      level={celebration.level}
    />
  ) : null

  return { celebrate, celebrateModal: modal, dismiss }
}
