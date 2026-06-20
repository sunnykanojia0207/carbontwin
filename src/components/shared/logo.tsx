import Link from 'next/link'

import { cn } from '@/lib/utils'

// ============================================================================
// CarbonTwin brand mark — a sprout formed from two leaves, symbolizing the
// "twin" (the user + their climate persona). Inline SVG so it scales crisply
// and inherits the emerald brand color.
// ============================================================================

export function Logo({
  className,
  showWordmark = true,
  href = '/',
  size = 28,
}: {
  className?: string
  showWordmark?: boolean
  href?: string | null
  size?: number
}) {
  const mark = (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className="shrink-0"
      >
        <rect
          x="1"
          y="1"
          width="30"
          height="30"
          rx="8"
          className="fill-primary"
        />
        {/* Two leaves forming a sprout — the "twin" */}
        <path
          d="M16 24c0-4.4 3.6-8 8-8 0 4.4-3.6 8-8 8z"
          className="fill-primary-foreground"
          opacity="0.95"
        />
        <path
          d="M16 24c0-4.4-3.6-8-8-8 0 4.4 3.6 8 8 8z"
          className="fill-primary-foreground"
          opacity="0.7"
        />
        <rect
          x="15"
          y="13"
          width="2"
          height="11"
          rx="1"
          className="fill-primary-foreground"
        />
      </svg>
      {showWordmark && (
        <span className="text-lg font-semibold tracking-tight">
          Carbon<span className="text-primary">Twin</span>
        </span>
      )}
    </span>
  )

  if (href === null) return mark

  return (
    <Link href={href} className="inline-flex" aria-label="CarbonTwin home">
      {mark}
    </Link>
  )
}
