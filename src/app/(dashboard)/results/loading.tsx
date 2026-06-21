export default function ResultsLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:py-8 animate-pulse">
      {/* Header */}
      <div className="mb-5 flex items-end justify-between gap-3">
        <div className="space-y-2">
          <div className="bg-muted h-7 w-48 rounded" />
          <div className="bg-muted h-4 w-64 rounded" />
        </div>
        <div className="bg-muted h-8 w-24 rounded" />
      </div>

      {/* Tab bar */}
      <div className="mb-4 flex gap-4 border-b pb-0">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="bg-muted mb-[-1px] h-9 w-20 rounded-t" />
        ))}
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-xl border p-4">
            <div className="bg-muted mb-3 h-3 w-20 rounded" />
            <div className="bg-muted h-6 w-16 rounded" />
          </div>
        ))}
      </div>

      {/* Appliance list */}
      <div className="mt-4 space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-xl border p-4">
            <div className="flex items-center gap-3">
              <div className="bg-muted size-10 rounded-lg" />
              <div className="flex-1 space-y-2">
                <div className="bg-muted h-4 w-32 rounded" />
                <div className="bg-muted h-3 w-48 rounded" />
              </div>
              <div className="bg-muted h-4 w-16 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
