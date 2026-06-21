export default function TwinLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:py-8 animate-pulse">
      {/* Tier badge + header */}
      <div className="mb-6 flex items-center gap-3">
        <div className="bg-muted size-12 rounded-full" />
        <div className="space-y-2">
          <div className="bg-muted h-6 w-40 rounded" />
          <div className="bg-muted h-4 w-24 rounded" />
        </div>
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

      {/* Charts */}
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="bg-muted h-56 rounded-xl" />
        <div className="bg-muted h-56 rounded-xl" />
      </div>
    </div>
  )
}
