'use client'

import * as React from 'react'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Logo } from '@/components/shared/logo'
import { ThemeToggle } from '@/components/shared/theme-toggle'
import { cn } from '@/lib/utils'

// ============================================================================
// Marketing nav — sticky, translucent, blur-on-scroll. Section anchors match
// the landing page ids. CTA adapts to auth state.
// Includes responsive mobile hamburger menu.
// ============================================================================

const LINKS = [
  { href: '#features', label: 'Features' },
  { href: '#how', label: 'How it works' },
  { href: '#ai', label: 'AI' },
  { href: '#tech', label: 'Technology' },
  { href: '#faq', label: 'FAQ' },
]

export function SiteNav({ authenticated }: { authenticated: boolean }) {
  const [menuOpen, setMenuOpen] = React.useState(false)

  // Close menu on navigation (anchor clicks)
  const handleNav = () => setMenuOpen(false)

  return (
    <header className="bg-background/80 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 w-full border-b backdrop-blur-md">
      <nav
        className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6"
        aria-label="Main navigation"
      >
        <Logo href="/" />

        {/* Desktop links */}
        <div className="hidden items-center gap-1 md:flex">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-muted-foreground hover:text-foreground rounded-md px-3 py-2 text-sm font-medium transition-colors"
            >
              {l.label}
            </Link>
          ))}
        </div>

        {/* Desktop CTA */}
        <div className="hidden items-center gap-2 md:flex">
          <ThemeToggle />
          {authenticated ? (
            <Button asChild size="sm">
              <Link href="/dashboard">Dashboard</Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link href="/login">Log in</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/register">Sign up</Link>
              </Button>
            </>
          )}
        </div>

        {/* Mobile: theme toggle + hamburger */}
        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
          >
            {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </Button>
        </div>
      </nav>

      {/* Mobile menu panel */}
      <div
        className={cn(
          'overflow-hidden transition-all duration-300 ease-out md:hidden',
          menuOpen ? 'max-h-[480px] opacity-100' : 'max-h-0 opacity-0',
        )}
        aria-hidden={!menuOpen}
      >
        <div className="border-t px-4 pb-6 pt-4 sm:px-6">
          <ul className="space-y-1">
            {LINKS.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  onClick={handleNav}
                  className="text-muted-foreground hover:text-foreground hover:bg-accent block rounded-md px-3 py-2.5 text-sm font-medium transition-colors"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>

          <hr className="my-4 border-t" />

          <div className="flex flex-col gap-2">
            {authenticated ? (
              <Button asChild className="w-full" size="sm" onClick={handleNav}>
                <Link href="/dashboard">Dashboard</Link>
              </Button>
            ) : (
              <>
                <Button
                  asChild
                  variant="outline"
                  className="w-full"
                  size="sm"
                  onClick={handleNav}
                >
                  <Link href="/login">Log in</Link>
                </Button>
                <Button
                  asChild
                  className="w-full"
                  size="sm"
                  onClick={handleNav}
                >
                  <Link href="/register">Sign up</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
