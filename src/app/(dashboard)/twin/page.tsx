import Link from 'next/link'
import { Camera, ArrowRight, Sparkles, Home, Car, UtensilsCrossed, ShoppingBag, Zap } from 'lucide-react'

import { getSession } from '@/lib/auth'
import { getTwinData } from '@/lib/services/twin.service'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { TwinTabs } from '@/components/twin/twin-tabs'

// ============================================================================
// /twin — Climate Twin page.
// Server Component: fetches twin data, then delegates to TwinTabs (client
// component) for the tabbed layout.
//
// Tabs: Overview, Dimensions, Forecast, Comparison, Risks & Opportunities
// ============================================================================

export const metadata = {
  title: 'Climate Twin',
}

const DIMENSION_PREVIEWS = [
  { icon: Home, label: 'Home', desc: 'Energy, heating, water', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  { icon: Zap, label: 'Appliances', desc: 'Devices & electronics', color: 'text-amber-500', bg: 'bg-amber-500/10' },
  { icon: Car, label: 'Transport', desc: 'Cars, flights, transit', color: 'text-blue-500', bg: 'bg-blue-500/10' },
  { icon: ShoppingBag, label: 'Lifestyle', desc: 'Shopping, waste', color: 'text-violet-500', bg: 'bg-violet-500/10' },
  { icon: UtensilsCrossed, label: 'Diet', desc: 'Food & groceries', color: 'text-rose-500', bg: 'bg-rose-500/10' },
]

export default async function TwinPage() {
  const session = await getSession()
  const data = await getTwinData(session!.user!.id)

  // --- Empty state ---
  if (data.isEmpty) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:py-10">
        <div className="space-y-1.5">
          <h1 className="text-2xl font-semibold tracking-tight">Climate Twin</h1>
          <p className="text-muted-foreground text-sm">
            Your digital carbon persona is still forming.
          </p>
        </div>
        <Card className="mt-6 overflow-hidden border-primary/30 bg-gradient-to-br from-primary/5 to-primary/0">
          <CardContent className="flex flex-col items-center gap-6 p-8 text-center">
            {/* Icon */}
            <span className="bg-primary/15 text-primary flex size-16 items-center justify-center rounded-2xl ring-1 ring-primary/20">
              <Sparkles className="size-7" />
            </span>

            <div className="max-w-md space-y-2">
              <h2 className="text-xl font-semibold tracking-tight">
                Meet your Climate Twin
              </h2>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Your Twin is a digital model of your lifestyle across
                <strong className="text-foreground font-medium"> 5 dimensions</strong>.
                Upload a room photo or log activities to bring it to life.
              </p>
            </div>

            {/* Dimension preview chips */}
            <div className="grid w-full max-w-sm grid-cols-5 gap-2">
              {DIMENSION_PREVIEWS.map((dim) => (
                <div
                  key={dim.label}
                  className={cn(
                    'flex flex-col items-center gap-1.5 rounded-xl border p-2.5 transition-all hover:border-foreground/20',
                    'border-dashed border-muted-foreground/20',
                  )}
                >
                  <span className={cn('flex size-8 items-center justify-center rounded-lg', dim.bg)}>
                    <dim.icon className={cn('size-4', dim.color)} />
                  </span>
                  <span className="text-[10px] font-medium leading-tight">{dim.label}</span>
                  <span className="text-[9px] leading-tight text-muted-foreground">{dim.desc}</span>
                </div>
              ))}
            </div>

            {/* CTAs */}
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/upload">
                  <Camera className="size-4" />
                  Upload a room photo
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/dashboard">Go to dashboard</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // --- Populated twin ---
  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:py-8">
      <TwinTabs data={data} />
    </div>
  )
}
