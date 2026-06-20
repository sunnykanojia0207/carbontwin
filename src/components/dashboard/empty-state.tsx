import Link from 'next/link'
import { type LucideIcon, ArrowRight, Sparkles, Lock } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

// ============================================================================
// Empty state — consistent pattern with premium polish.
// Includes optional secondary CTA and achievement preview chips.
// ============================================================================

export type AchievementPreview = {
  icon: LucideIcon
  label: string
  description: string
  color: string
}

export function EmptyState({
  icon: Icon,
  title,
  body,
  ctaLabel,
  ctaHref,
  secondaryCta,
  achievements,
  className,
}: {
  icon: LucideIcon
  title: string
  body: string
  ctaLabel?: string
  ctaHref?: string
  secondaryCta?: { label: string; href: string }
  achievements?: AchievementPreview[]
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center px-6 py-12 text-center',
        className,
      )}
    >
      {/* Animated icon container */}
      <span className="relative mb-4 flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5 ring-1 ring-primary/20">
        <Icon className="size-6 text-primary" />
        <span className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-primary/10" />
      </span>

      <h3 className="text-lg font-semibold tracking-tight">{title}</h3>

      <p className="text-muted-foreground mt-1.5 max-w-sm text-sm leading-relaxed">
        {body}
      </p>

      {/* Primary CTA */}
      <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
        {ctaLabel && ctaHref && (
          <Button asChild size="sm">
            <Link href={ctaHref}>
              {ctaLabel}
              <ArrowRight className="size-3.5" />
            </Link>
          </Button>
        )}
        {secondaryCta && (
          <Button asChild size="sm" variant="outline">
            <Link href={secondaryCta.href}>
              <Sparkles className="size-3.5" />
              {secondaryCta.label}
            </Link>
          </Button>
        )}
      </div>

      {/* Achievement previews (locked badges showing what's earnable) */}
      {achievements && achievements.length > 0 && (
        <div className="mt-6 w-full max-w-sm">
          <div className="mb-2 flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground/60">
            <Lock className="size-3" />
            Achievements you can unlock
          </div>
          <div className="grid grid-cols-3 gap-2">
            {achievements.map((ach, i) => (
              <div
                key={i}
                className={cn(
                  'flex flex-col items-center gap-1 rounded-lg border border-dashed p-2.5 opacity-60 transition-opacity hover:opacity-80',
                  ach.color,
                )}
              >
                <ach.icon className="size-4.5" />
                <span className="text-[10px] font-medium leading-tight">
                  {ach.label}
                </span>
                <span className="text-[9px] leading-tight text-muted-foreground">
                  {ach.description}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
