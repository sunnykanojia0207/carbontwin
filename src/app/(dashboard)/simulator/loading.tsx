export default function SimulatorLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:py-8 animate-pulse">
      {/* Header */}
      <div className="mb-5 space-y-2">
        <div className="bg-muted h-7 w-40 rounded" />
        <div className="bg-muted h-4 w-64 rounded" />
      </div>

      {/* Tab bar */}
      <div className="mb-4 flex gap-4 border-b pb-0">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-muted mb-[-1px] h-9 w-24 rounded-t" />
        ))}
      </div>

      {/* Levers panel */}
      <div className="grid gap-4 lg:grid-cols-12">
        <div className="lg:col-span-4 space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="rounded-xl border p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-muted size-8 rounded-lg" />
                <div className="bg-muted h-4 w-28 rounded" />
              </div>
              <div className="bg-muted h-2 w-full rounded-full" />
            </div>
          ))}
        </div>
        <div className="lg:col-span-8 space-y-3">
          <div className="bg-muted h-48 rounded-xl" />
          <div className="bg-muted h-36 rounded-xl" />
        </div>
      </div>
    </div>
  )
}
