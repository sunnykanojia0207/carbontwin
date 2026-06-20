import { Loader2 } from 'lucide-react'

// ============================================================================
// Dashboard loading state — shown while RSC data is fetching.
// A calm, branded skeleton that matches the dashboard layout.
// ============================================================================

export default function DashboardLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:py-8">
      {/* Header skeleton */}
      <div className="mb-5 space-y-2">
        <div className="bg-muted h-7 w-48 animate-pulse rounded" />
        <div className="bg-muted h-4 w-32 animate-pulse rounded" />
      </div>

      {/* KPI skeleton */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-xl border p-4">
            <div className="bg-muted mb-3 h-3 w-20 animate-pulse rounded" />
            <div className="bg-muted h-6 w-16 animate-pulse rounded" />
          </div>
        ))}
      </div>

      {/* Chart skeleton */}
      <div className="mt-4 grid gap-4 lg:grid-cols-12">
        <div className="bg-muted lg:col-span-4 h-48 animate-pulse rounded-xl" />
        <div className="bg-muted lg:col-span-8 h-48 animate-pulse rounded-xl" />
      </div>

      {/* Center spinner */}
      <div className="mt-8 flex items-center justify-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        Loading your dashboard…
      </div>
    </div>
  )
}
