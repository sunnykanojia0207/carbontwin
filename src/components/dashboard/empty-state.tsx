import Link from 'next/link'
import { type LucideIcon, ArrowRight } from 'lucide-react'

import { Button } from '@/components/ui/button'

// ============================================================================
// Empty state — consistent pattern: illustration icon, headline, body, CTA.
// Used by every dashboard section when there's no data.
// ============================================================================

export function EmptyState({
  icon: Icon,
  title,
  body,
  ctaLabel,
  ctaHref,
  className,
}: {
  icon: LucideIcon
  title: string
  body: string
  ctaLabel?: string
  ctaHref?: string
  className?: string
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center px-6 py-10 text-center ${className ?? ''}`}
    >
      <span className="bg-muted text-muted-foreground mb-3 flex size-11 items-center justify-center rounded-full">
        <Icon className="size-5" />
      </span>
      <p className="text-sm font-medium">{title}</p>
      <p className="text-muted-foreground mt-1 max-w-xs text-xs leading-relaxed">
        {body}
      </p>
      {ctaLabel && ctaHref && (
        <Button asChild size="sm" variant="ghost" className="mt-3 -mx-2">
          <Link href={ctaHref}>
            {ctaLabel}
            <ArrowRight className="size-3.5" />
          </Link>
        </Button>
      )}
    </div>
  )
}
