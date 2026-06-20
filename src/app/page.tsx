import { getServerSession } from '@/lib/auth'

import { authOptions } from '@/lib/auth'
import { SiteNav } from '@/components/marketing/site-nav'
import { Hero } from '@/components/marketing/hero'
import { Problem } from '@/components/marketing/problem'
import { Solution } from '@/components/marketing/solution'
import { FeatureHighlights } from '@/components/marketing/feature-highlights'
import { HowItWorks } from '@/components/marketing/how-it-works'
import { AIFeatures } from '@/components/marketing/ai-features'
import { Technology } from '@/components/marketing/technology'
import { FAQ } from '@/components/marketing/faq'
import { FinalCTA } from '@/components/marketing/final-cta'
import { SiteFooter } from '@/components/marketing/site-footer'

// ============================================================================
// Landing page (/) — the only user-visible marketing route.
// Sticky-footer layout: min-h-screen + flex-col + mt-auto on the footer.
// Auth state checked server-side to adapt nav CTAs.
// ============================================================================

export default async function Home() {
  const session = await getServerSession(authOptions)
  const authenticated = !!session

  return (
    <div className="bg-background flex min-h-svh flex-col">
      <SiteNav authenticated={authenticated} />
      <main id="main-content" className="flex-1">
        <Hero />
        <Problem />
        <Solution />
        <FeatureHighlights />
        <HowItWorks />
        <AIFeatures />
        <Technology />
        <FAQ />
        <FinalCTA />
      </main>
      <SiteFooter />
    </div>
  )
}
