import Link from 'next/link'
import { Camera, ArrowRight, Inbox, DollarSign, Leaf, Lightbulb, BarChart4 } from 'lucide-react'

import { getServerSession } from '@/lib/auth'

import { authOptions } from '@/lib/auth'
import { getResultsData } from '@/lib/services/results.service'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { ResultsTabs } from '@/components/results/results-tabs'

// ============================================================================
// /results — Results page showing appliance detections + environmental impact.
// Server Component: fetches results data, then delegates to ResultsTabs
// (client component) for the tabbed layout.
//
// Tabs: Overview, Appliances, Impact, Savings, AI Insights
// ============================================================================

export const metadata = {
  title: 'Results',
}

const RESULTS_FEATURES = [
  { icon: Lightbulb, label: 'Appliance detection', desc: 'AI identifies every device', color: 'text-amber-500', bg: 'bg-amber-500/10' },
  { icon: Leaf, label: 'Carbon impact', desc: 'Kg CO₂e per appliance', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  { icon: DollarSign, label: 'Cost analysis', desc: 'Annual energy cost estimates', color: 'text-blue-500', bg: 'bg-blue-500/10' },
  { icon: BarChart4, label: 'Improvements', desc: 'Upgrade recommendations', color: 'text-violet-500', bg: 'bg-violet-500/10' },
]

export default async function ResultsPage({
  searchParams,
}: {
  searchParams: Promise<{ scanId?: string }>
}) {
  const session = await getServerSession(authOptions)
  const { scanId } = await searchParams
  const data = await getResultsData(session!.user!.id, scanId)

  // --- Empty state ---
  if (data.isEmpty) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:py-10">
        <div className="space-y-1.5">
          <h1 className="text-2xl font-semibold tracking-tight">Results</h1>
          <p className="text-muted-foreground text-sm">
            No appliance scans yet. Upload a room photo to see your impact.
          </p>
        </div>
        <Card className="mt-6 overflow-hidden border-primary/30 bg-gradient-to-br from-primary/5 to-primary/0">
          <CardContent className="flex flex-col items-center gap-6 p-8 text-center">
            {/* Icon */}
            <span className="bg-primary/15 text-primary flex size-16 items-center justify-center rounded-2xl ring-1 ring-primary/20">
              <Inbox className="size-7" />
            </span>

            <div className="max-w-md space-y-2">
              <h2 className="text-xl font-semibold tracking-tight">
                No results to show yet
              </h2>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Upload a photo of any room and the AI will detect appliances,
                estimate their carbon and cost impact, and suggest improvements.
              </p>
            </div>

            {/* Feature preview chips */}
            <div className="grid w-full max-w-sm grid-cols-2 gap-2 sm:grid-cols-4">
              {RESULTS_FEATURES.map((feature) => (
                <div
                  key={feature.label}
                  className="flex flex-col items-center gap-1.5 rounded-xl border border-dashed border-muted-foreground/20 p-2.5 transition-all hover:border-foreground/20"
                >
                  <span className={cn('flex size-8 items-center justify-center rounded-lg', feature.bg)}>
                    <feature.icon className={cn('size-4', feature.color)} />
                  </span>
                  <span className="text-[10px] font-medium leading-tight">{feature.label}</span>
                  <span className="text-[9px] leading-tight text-muted-foreground">{feature.desc}</span>
                </div>
              ))}
            </div>

            <Button asChild size="lg">
              <Link href="/upload">
                <Camera className="size-4" />
                Upload a room photo
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // --- Populated results ---
  const scanDate = data.scan!.createdAt.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  })

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:py-8">
      {/* Header */}
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">
              {data.scan!.roomType}
            </h1>
            <span className="bg-primary/10 text-primary rounded-md px-2 py-0.5 text-xs font-medium">
              {data.scan!.aiModel ?? 'AI'}
            </span>
          </div>
          <p className="text-muted-foreground mt-0.5 text-sm">
            {scanDate} · {data.scan!.summary}
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/upload">
            <Camera className="size-3.5" />
            New scan
          </Link>
        </Button>
      </div>

      <ResultsTabs data={data} scanId={data.scan!.id} />
    </div>
  )
}
