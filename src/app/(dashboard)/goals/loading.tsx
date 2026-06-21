export default function GoalsLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:py-8 animate-pulse">
      {/* Header */}
      <div className="mb-5 flex items-end justify-between gap-3">
        <div className="space-y-2">
          <div className="bg-muted h-7 w-24 rounded" />
          <div className="bg-muted h-4 w-56 rounded" />
        </div>
        <div className="bg-muted h-9 w-32 rounded" />
      </div>

      {/* Tab bar */}
      <div className="mb-4 flex gap-4 border-b pb-0">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-muted mb-[-1px] h-9 w-20 rounded-t" />
        ))}
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 mb-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-xl border p-4">
            <div className="bg-muted mb-3 h-3 w-20 rounded" />
            <div className="bg-muted h-6 w-16 rounded" />
          </div>
        ))}
      </div>

      {/* Goal cards */}
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-xl border p-5">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="space-y-2 flex-1">
                <div className="bg-muted h-5 w-48 rounded" />
                <div className="bg-muted h-3 w-32 rounded" />
              </div>
              <div className="bg-muted h-6 w-20 rounded-full" />
            </div>
            <div className="bg-muted h-2 w-full rounded-full" />
            <div className="mt-2 flex justify-between">
              <div className="bg-muted h-3 w-16 rounded" />
              <div className="bg-muted h-3 w-16 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
