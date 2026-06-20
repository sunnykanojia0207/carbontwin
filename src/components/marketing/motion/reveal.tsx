'use client'

import * as React from 'react'
import { motion, useReducedMotion, type Variants } from 'framer-motion'

// ============================================================================
// Motion primitives — subtle, premium scroll-reveal animations.
// Inspired by Linear/Vercel: gentle fade + rise, never bouncy.
// All respect `prefers-reduced-motion`.
// ============================================================================

const EASE = [0.22, 1, 0.36, 1] as const

/** Fade + rise. The building block for most reveals. */
export function Reveal({
  children,
  delay = 0,
  y = 16,
  className,
  as = 'div',
}: {
  children: React.ReactNode
  delay?: number
  y?: number
  className?: string
  as?: 'div' | 'section' | 'li' | 'span'
}) {
  const reduce = useReducedMotion()
  const MotionTag = motion[as]
  return (
    <MotionTag
      className={className}
      initial={reduce ? { opacity: 0 } : { opacity: 0, y }}
      whileInView={reduce ? { opacity: 1 } : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.6, ease: EASE, delay }}
    >
      {children}
    </MotionTag>
  )
}

/** Stagger container — children fade in sequence as the group enters view. */
export function Stagger({
  children,
  className,
  stagger = 0.08,
  delay = 0,
}: {
  children: React.ReactNode
  className?: string
  stagger?: number
  delay?: number
}) {
  const reduce = useReducedMotion()
  const container: Variants = {
    hidden: {},
    show: {
      transition: { staggerChildren: reduce ? 0 : stagger, delayChildren: delay },
    },
  }
  return (
    <motion.div
      className={className}
      variants={container}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '-80px' }}
    >
      {children}
    </motion.div>
  )
}

/** Stagger child — pair with <Stagger>. */
export function StaggerItem({
  children,
  className,
  y = 16,
}: {
  children: React.ReactNode
  className?: string
  y?: number
}) {
  const reduce = useReducedMotion()
  const item: Variants = {
    hidden: reduce ? { opacity: 0 } : { opacity: 0, y },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.55, ease: EASE },
    },
  }
  return (
    <motion.div className={className} variants={item}>
      {children}
    </motion.div>
  )
}

/** A gentle infinite float for ambient visuals (orbs, glows). */
export function Float({
  children,
  className,
  duration = 6,
  y = 8,
}: {
  children: React.ReactNode
  className?: string
  duration?: number
  y?: number
}) {
  const reduce = useReducedMotion()
  if (reduce) return <div className={className}>{children}</div>
  return (
    <motion.div
      className={className}
      animate={{ y: [0, -y, 0] }}
      transition={{ duration, repeat: Infinity, ease: 'easeInOut' }}
    >
      {children}
    </motion.div>
  )
}

/** Animated number count-up that runs once on view. */
export function CountUp({
  to,
  suffix = '',
  prefix = '',
  decimals = 0,
  className,
}: {
  to: number
  suffix?: string
  prefix?: string
  decimals?: number
  className?: string
}) {
  const reduce = useReducedMotion()
  const ref = React.useRef<HTMLSpanElement>(null)
  const [val, setVal] = React.useState(reduce ? to : 0)
  const started = React.useRef(false)

  React.useEffect(() => {
    if (reduce) return
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !started.current) {
          started.current = true
          const start = performance.now()
          const dur = 1200
          const tick = (now: number) => {
            const p = Math.min((now - start) / dur, 1)
            const eased = 1 - Math.pow(1 - p, 3)
            setVal(to * eased)
            if (p < 1) requestAnimationFrame(tick)
          }
          requestAnimationFrame(tick)
        }
      },
      { threshold: 0.4 },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [to, reduce])

  return (
    <span ref={ref} className={className}>
      {prefix}
      {val.toFixed(decimals)}
      {suffix}
    </span>
  )
}
