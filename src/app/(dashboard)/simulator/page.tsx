import Link from 'next/link'
import { SlidersHorizontal, ArrowRight, Sparkles } from 'lucide-react'

import { getServerSession } from '@/lib/auth'

import { authOptions } from '@/lib/auth'
import { getTwinData } from '@/lib/services/twin.service'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { SimulatorTabs } from '@/components/simulator/simulator-tabs'

// ============================================================================
// /simulator — What-If Simulator page.
// Server Component: loads the user's twin dimensions server-side, then
// delegates to SimulatorTabs (client component) for the tabbed layout.
//
// Tabs: Scenarios, Results, Timeline, Comparison
// ============================================================================

export const metadata = {
  title: 'What-If Simulator',
}

export default async function SimulatorPage() {
  const session = await getServerSession(authOptions)
  const data = await getTwinData(session!.user!.id)

  // --- Empty state ---
  if (data.isEmpty) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:py-10">
        <div className="space-y-1.5">
          <h1 className="text-2xl font-semibold tracking-tight">
            What-If Simulator
          </h1>
          <p className="text-muted-foreground text-sm">
            Model the impact of future decisions — needs your data first.
          </p>
        </div>
        <Card className="mt-6 border-primary/30 bg-primary/5">
          <CardContent className="flex flex-col items-center gap-5 py-12 text-center">
            <span className="bg-primary/15 text-primary flex size-14 items-center justify-center rounded-full">
              <Sparkles className="size-7" />
            </span>
            <div className="max-w-md space-y-2">
              <h2 className="text-xl font-semibold tracking-tight">
                Build your Climate Twin first
              </h2>
              <p className="text-muted-foreground text-sm leading-relaxed">
                The simulator models changes against your real footprint.
                Upload a room photo and log a few activities to form your Twin,
                then come back here to experiment.
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/upload">
                  <SlidersHorizontal className="size-4" />
                  Upload a room photo
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/twin">View Climate Twin</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // --- Populated simulator ---
  return <SimulatorTabs dimensions={data.dimensions} />
}
