import {
  LayoutDashboard,
  ScanLine,
  UsersRound,
  SlidersHorizontal,
  Target,
  Settings,
  BarChart3,
  MessageSquare,
} from 'lucide-react'

import { getSession } from '@/lib/auth'
import { Logo } from '@/components/shared/logo'
import { ThemeToggle } from '@/components/shared/theme-toggle'
import { SignOutButton } from '@/components/auth/sign-out-button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { MobileNav } from '@/components/dashboard/mobile-nav'
import { NavLink } from '@/components/dashboard/nav-link'

// ============================================================================
// Dashboard shell — fixed sidebar (desktop) + sticky topbar.
//
// Layout fixes:
//   • Outer wrapper: h-svh overflow-hidden — viewport-locked, never scrolls
//   • Sidebar: h-full flex flex-col — always exactly viewport height
//   • Main column: flex-1 overflow-y-auto — only this area scrolls
//   • Bottom user row: shrink-0 — always visible, never pushed off screen
//   • Nav links: use NavLink (client) for active state highlighting
// ============================================================================

export const NAV = [
  { href: '/dashboard',  label: 'Dashboard',     icon: <LayoutDashboard className="size-4" /> },
  { href: '/upload',     label: 'Upload & Detect',icon: <ScanLine className="size-4" /> },
  { href: '/results',    label: 'Results',        icon: <BarChart3 className="size-4" /> },
  { href: '/twin',       label: 'Climate Twin',   icon: <UsersRound className="size-4" /> },
  { href: '/simulator',  label: 'What-If',        icon: <SlidersHorizontal className="size-4" /> },
  { href: '/negotiator', label: 'AI Negotiator',  icon: <MessageSquare className="size-4" /> },
  { href: '/goals',      label: 'Goals',          icon: <Target className="size-4" /> },
  { href: '/settings',   label: 'Settings',       icon: <Settings className="size-4" /> },
]

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()
  const name = session?.user?.name ?? session?.user?.email ?? 'You'
  const initials = name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    // h-svh + overflow-hidden = entire shell is exactly the viewport.
    // Nothing outside this can grow the page height.
    <div className="flex h-svh overflow-hidden bg-background">

      {/* ================================================================
          Sidebar — desktop only, fixed height, flex column.
          Logo at top, nav in middle (scrollable if needed), user at bottom.
          ================================================================ */}
      <aside className="hidden w-60 shrink-0 flex-col border-r bg-sidebar lg:flex">
        {/* Logo */}
        <div className="flex h-16 shrink-0 items-center border-b px-6">
          <Logo href="/dashboard" />
        </div>

        {/* Nav — flex-1 + overflow-y-auto so it scrolls before pushing user row */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
          {NAV.map(({ href, label, icon }) => (
            <NavLink key={href} href={href} label={label} icon={icon} />
          ))}
        </nav>

        {/* User row — shrink-0 = always pinned at the bottom */}
        <div className="shrink-0 border-t p-3">
          <div className="flex items-center gap-3 rounded-lg px-3 py-2">
            <Avatar className="size-8 shrink-0">
              <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{name}</p>
              <p className="text-muted-foreground truncate text-xs">
                {session?.user?.plan ?? 'FREE'} plan
              </p>
            </div>
            <SignOutButton className="h-8 shrink-0 px-2" />
          </div>
        </div>
      </aside>

      {/* ================================================================
          Main column — flex-1, flex column.
          Topbar is sticky (shrink-0), content area scrolls independently.
          ================================================================ */}
      <div className="flex min-w-0 flex-1 flex-col">

        {/* Topbar */}
        <header className="flex h-16 shrink-0 items-center justify-between gap-4 border-b bg-background/80 px-4 backdrop-blur-md sm:px-6">
          <div className="flex items-center gap-3">
            <MobileNav nav={NAV} />
            <Logo href="/dashboard" showWordmark={false} className="lg:hidden" />
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <SignOutButton className="lg:hidden" />
          </div>
        </header>

        {/* Scrollable page content */}
        <main id="main-content" className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
