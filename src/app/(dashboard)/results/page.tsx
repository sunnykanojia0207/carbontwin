import Link from 'next/link'
import { Camera, ArrowRight, Inbox } from 'lucide-react'

import { getServerSession } from '@/lib/auth'

import { authOptions } from '@/lib/auth'
import { getResultsData } from '@/lib/services/results.service'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
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
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:py-10">
        <div className="space-y-1.5">
          <h1 className="text-2xl font-semibold tracking-tight">Results</h1>
          <p className="text-muted-foreground text-sm">
            No appliance scans yet. Upload a room photo to see your impact.
          </p>
        </div>
        <Card className="mt-6 border-primary/30 bg-primary/5">
          <CardContent className="flex flex-col items-center gap-5 py-12 text-center">
            <span className="bg-primary/15 text-primary flex size-14 items-center justify-center rounded-full">
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
