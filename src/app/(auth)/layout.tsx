import Link from 'next/link'
import { ThemeToggle } from '@/components/shared/theme-toggle'
import { AuthBrandPanel } from '@/components/auth/auth-brand-panel'

// ============================================================================
// Auth split-screen layout — shared by /login, /register, /forgot-password,
// /verify-request, /reset-password.
//
// Left: emerald brand panel (lg+ only). Right: form canvas with a top bar
// (logo on mobile + theme toggle). The footer is sticky to the bottom per
// the UI rules, though auth pages are short enough to rarely need it.
// ============================================================================

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="bg-background flex min-h-svh flex-col lg:grid lg:grid-cols-2">
      <AuthBrandPanel />
      <div className="relative flex flex-1 flex-col">
        {/* Mobile header — logo + theme toggle */}
        <header className="flex items-center justify-between border-b border-transparent px-6 py-5 lg:hidden">
          <span className="text-lg font-semibold tracking-tight">
            Carbon<span className="text-primary">Twin</span>
          </span>
          <ThemeToggle />
        </header>

        {/* Desktop header — theme toggle only */}
        <header className="hidden items-center justify-end px-10 py-6 lg:flex">
          <ThemeToggle />
        </header>

        {/* Main form area */}
        <main className="flex flex-1 items-center justify-center px-6 pb-10 pt-6 lg:px-10 lg:pt-0">
          <div className="w-full max-w-sm">{children}</div>
        </main>

        {/* Footer */}
        <footer className="text-muted-foreground mt-auto border-t border-border/50 px-6 py-4 text-center text-xs lg:px-10">
          By continuing, you agree to our{' '}
          <Link href="/terms" className="hover:text-foreground underline underline-offset-2 transition-colors">
            Terms
          </Link>
          {' & '}
          <Link href="/privacy" className="hover:text-foreground underline underline-offset-2 transition-colors">
            Privacy Policy
          </Link>
          .
        </footer>
      </div>
    </div>
  )
}
