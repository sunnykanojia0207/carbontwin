import Link from 'next/link'
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

import { getServerSession } from '@/lib/auth'

import { authOptions } from '@/lib/auth'
import { Logo } from '@/components/shared/logo'
import { ThemeToggle } from '@/components/shared/theme-toggle'
import { SignOutButton } from '@/components/auth/sign-out-button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { MobileNav } from '@/components/dashboard/mobile-nav'

// ============================================================================
// Dashboard shell — sidebar (desktop) + topbar + sticky footer.
// Mobile renders a condensed topbar; full sidebar is lg+.
// All child routes under (dashboard) inherit this shell.
// ============================================================================

const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="size-4" /> },
  { href: '/upload', label: 'Upload & Detect', icon: <ScanLine className="size-4" /> },
  { href: '/results', label: 'Results', icon: <BarChart3 className="size-4" /> },
  { href: '/twin', label: 'Climate Twin', icon: <UsersRound className="size-4" /> },
  { href: '/simulator', label: 'What-If', icon: <SlidersHorizontal className="size-4" /> },
  { href: '/negotiator', label: 'AI Negotiator', icon: <MessageSquare className="size-4" /> },
  { href: '/goals', label: 'Goals', icon: <Target className="size-4" /> },
  { href: '/settings', label: 'Settings', icon: <Settings className="size-4" /> },
]

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)
  const name = session?.user?.name ?? session?.user?.email ?? 'You'
  const initials = name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <div className="bg-background flex min-h-svh flex-col">
      <div className="flex flex-1">
        {/* Sidebar — desktop only */}
        <aside className="bg-sidebar hidden w-60 shrink-0 flex-col border-r lg:flex">
          <div className="flex h-16 items-center border-b px-6">
            <Logo href="/dashboard" />
          </div>
          <nav className="flex-1 space-y-1 px-3 py-4">
            {NAV.map(({ href, label, icon }) => (
              <Link
                key={href}
                href={href}
                className="text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors"
              >
                {icon}
                {label}
              </Link>
            ))}
          </nav>
          <div className="border-t p-3">
            <div className="flex items-center gap-3 px-3 py-2">
              <Avatar className="size-8">
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
              <SignOutButton className="h-8 px-2" />
            </div>
          </div>
        </aside>

        {/* Main column */}
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="bg-background/80 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40 flex h-16 items-center justify-between gap-4 border-b px-4 backdrop-blur-md sm:px-6">
            <div className="flex items-center gap-3">
              <MobileNav nav={NAV} />
              <Logo href="/dashboard" showWordmark={false} className="lg:hidden" />
              <span className="text-sm font-medium">Dashboard</span>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <SignOutButton className="lg:hidden" />
            </div>
          </header>

          <main className="flex-1">{children}</main>
        </div>
      </div>
    </div>
  )
}
