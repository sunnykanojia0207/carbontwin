'use client'

import * as React from 'react'
import { Menu } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Logo } from '@/components/shared/logo'
import { NavLink } from '@/components/dashboard/nav-link'

// ============================================================================
// MobileNav — hamburger sheet for screens below lg breakpoint.
//
// Fixes:
//   • NavLink used for active highlighting (same as desktop sidebar)
//   • Sheet closes automatically when a link is tapped (onClick handler)
//   • Fixed height sheet: h-svh, flex column, user never sees overflow
// ============================================================================

export function MobileNav({
  nav,
}: {
  nav: { href: string; label: string; icon: React.ReactNode }[]
}) {
  const [open, setOpen] = React.useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
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

      <SheetContent side="left" className="flex w-60 flex-col p-0">
        <SheetTitle className="sr-only">Navigation</SheetTitle>

        {/* Logo */}
        <div className="flex h-16 shrink-0 items-center border-b px-6">
          <Logo href="/dashboard" />
        </div>

        {/* Nav — close sheet on tap */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
          {nav.map(({ href, label, icon }) => (
            <NavLink
              key={href}
              href={href}
              label={label}
              icon={icon}
              onClick={() => setOpen(false)}
            />
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  )
}
