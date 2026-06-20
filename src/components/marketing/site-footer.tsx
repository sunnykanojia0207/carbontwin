import Link from 'next/link'

import { Logo } from '@/components/shared/logo'

// ============================================================================
// Site footer — minimal, sticky-to-bottom (handled by page layout). Links to
// auth pages + a methodology note. No fake social proof.
// ============================================================================

export function SiteFooter() {
  return (
    <footer className="border-t">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-3">
            <Logo href="/" />
            <p className="text-muted-foreground max-w-xs text-sm leading-relaxed">
              Understand your footprint. Decide what to change. AI-powered
              carbon intelligence for individuals.
            </p>
          </div>

          <div>
            <p className="text-sm font-semibold">Product</p>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <Link
                  href="#features"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Features
                </Link>
              </li>
              <li>
                <Link
                  href="#how"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  How it works
                </Link>
              </li>
              <li>
                <Link
                  href="#ai"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  AI approach
                </Link>
              </li>
              <li>
                <Link
                  href="#faq"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="text-sm font-semibold">Account</p>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <Link
                  href="/login"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Log in
                </Link>
              </li>
              <li>
                <Link
                  href="/register"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Sign up
                </Link>
              </li>
              <li>
                <Link
                  href="/forgot-password"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Reset password
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="text-sm font-semibold">Methodology</p>
            <ul className="mt-3 space-y-2 text-sm">
              <li className="text-muted-foreground">EPA emission factors</li>
              <li className="text-muted-foreground">DEFRA emission factors</li>
              <li className="text-muted-foreground">IPCC AR6 guidelines</li>
              <li className="text-muted-foreground">Paris 1.5°C alignment</li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t pt-6 sm:flex-row">
          <p className="text-muted-foreground text-xs">
            © {new Date().getFullYear()} CarbonTwin. Built for individuals who
            want to do something, not everything.
          </p>
          <p className="text-muted-foreground text-xs">
            Privacy-first · Your data is yours
          </p>
        </div>
      </div>
    </footer>
  )
}
