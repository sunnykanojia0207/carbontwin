'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

// ============================================================================
// NavLink — a sidebar nav link that highlights when its route is active.
//
// Active rule: pathname starts with href (so /dashboard/... stays highlighted)
// Special case: /dashboard exact-matches only (avoids matching every route).
// ============================================================================

export function NavLink({
  href,
  icon,
  label,
  onClick,
}: {
  href: string
  icon: React.ReactNode
  label: string
  onClick?: () => void
}) {
  const pathname = usePathname()

  const isActive =
    href === '/dashboard'
      ? pathname === '/dashboard'
      : pathname.startsWith(href)

  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
        isActive
          ? 'bg-sidebar-accent text-sidebar-accent-foreground'
          : 'text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground',
      )}
    >
      {icon}
      {label}
    </Link>
  )
}
