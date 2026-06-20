import Link from 'next/link'
import { Camera, ArrowRight, Sparkles } from 'lucide-react'

import { getServerSession } from '@/lib/auth'

import { authOptions } from '@/lib/auth'
import { getTwinData } from '@/lib/services/twin.service'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
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

export default async function TwinPage() {
  const session = await getServerSession(authOptions)
  const data = await getTwinData(session!.user!.id)

  // --- Empty state ---
  if (data.isEmpty) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:py-10">
        <div className="space-y-1.5">
          <h1 className="text-2xl font-semibold tracking-tight">Climate Twin</h1>
          <p className="text-muted-foreground text-sm">
            Your digital carbon persona is still forming.
          </p>
        </div>
        <Card className="mt-6 border-primary/30 bg-primary/5">
          <CardContent className="flex flex-col items-center gap-5 py-12 text-center">
            <span className="bg-primary/15 text-primary flex size-14 items-center justify-center rounded-full">
              <Sparkles className="size-7" />
            </span>
            <div className="max-w-md space-y-2">
              <h2 className="text-xl font-semibold tracking-tight">
                Meet your Climate Twin
              </h2>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Your Twin is a digital model of your lifestyle — home, appliances,
                transport, shopping, and diet. Upload a room photo and log a few
                activities to bring it to life.
              </p>
            </div>
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
