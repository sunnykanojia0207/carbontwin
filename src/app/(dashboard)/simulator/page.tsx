import Link from 'next/link'
import { SlidersHorizontal, ArrowRight, Lightbulb, Leaf, Car, ShoppingBag, Zap } from 'lucide-react'

import { getSession } from '@/lib/auth'
import { getTwinData } from '@/lib/services/twin.service'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
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

const EXAMPLE_SCENARIOS = [
  { icon: Lightbulb, label: 'LED Upgrade', savings: '120 kg/yr', color: 'text-amber-500', bg: 'bg-amber-500/10' },
  { icon: Leaf, label: 'Plant-Based', savings: '400 kg/yr', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  { icon: Car, label: 'Carpool', savings: '350 kg/yr', color: 'text-blue-500', bg: 'bg-blue-500/10' },
  { icon: ShoppingBag, label: 'Less Waste', savings: '90 kg/yr', color: 'text-violet-500', bg: 'bg-violet-500/10' },
  { icon: Zap, label: 'Smart Thermostat', savings: '200 kg/yr', color: 'text-rose-500', bg: 'bg-rose-500/10' },
]

export default async function SimulatorPage() {
  const session = await getSession()
  const data = await getTwinData(session!.user!.id)

  // --- Empty state ---
  if (data.isEmpty) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:py-10">
        <div className="space-y-1.5">
          <h1 className="text-2xl font-semibold tracking-tight">
            What-If Simulator
          </h1>
          <p className="text-muted-foreground text-sm">
            Model the impact of future decisions — needs your data first.
          </p>
        </div>
        <Card className="mt-6 overflow-hidden border-primary/30 bg-gradient-to-br from-primary/5 to-primary/0">
          <CardContent className="flex flex-col items-center gap-6 p-8 text-center">
            {/* Icon */}
            <span className="bg-primary/15 text-primary flex size-16 items-center justify-center rounded-2xl ring-1 ring-primary/20">
              <SlidersHorizontal className="size-7" />
            </span>

            <div className="max-w-md space-y-2">
              <h2 className="text-xl font-semibold tracking-tight">
                Build your Climate Twin first
              </h2>
              <p className="text-muted-foreground text-sm leading-relaxed">
                The simulator models changes against your real footprint.
                Once your Twin is ready, you&apos;ll be able to ask
                &ldquo;what happens if I&hellip;&rdquo; and see the impact instantly.
              </p>
            </div>

            {/* Example scenario previews */}
            <div className="w-full max-w-md">
              <p className="mb-2.5 text-left text-[10px] font-medium uppercase tracking-wider text-muted-foreground/60">
                Example scenarios you&apos;ll be able to model
              </p>
              <div className="grid grid-cols-5 gap-2">
                {EXAMPLE_SCENARIOS.map((scenario) => (
                  <div
                    key={scenario.label}
                    className={cn(
                      'flex flex-col items-center gap-1.5 rounded-xl border border-dashed border-muted-foreground/20 p-2 transition-all hover:border-foreground/20',
                    )}
                  >
                    <span className={cn('flex size-7 items-center justify-center rounded-lg', scenario.bg)}>
                      <scenario.icon className={cn('size-3.5', scenario.color)} />
                    </span>
                    <span className="text-[10px] font-medium leading-tight">{scenario.label}</span>
                    <span className={cn('text-[9px] font-medium leading-tight', scenario.color)}>
                      {scenario.savings}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* CTAs */}
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
