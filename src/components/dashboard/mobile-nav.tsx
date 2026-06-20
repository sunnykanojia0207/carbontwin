'use client'

import Link from 'next/link'
import { Menu } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Logo } from '@/components/shared/logo'

// ============================================================================
// MobileNav — hamburger-triggered sheet that mirrors the sidebar nav links.
// Only visible on screens below the lg breakpoint.
// ============================================================================

export function MobileNav({
  nav,
}: {
  nav: { href: string; label: string; icon: React.ReactNode }[]
}) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          aria-label="Open navigation menu"
        >
          <Menu className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-60 p-0">
        <SheetTitle className="sr-only">Navigation</SheetTitle>
        <div className="flex h-16 items-center border-b px-6">
          <Logo href="/dashboard" />
        </div>
        <nav className="flex-1 space-y-1 px-3 py-4">
          {nav.map(({ href, label, icon }) => (
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
      </SheetContent>
    </Sheet>
  )
}
