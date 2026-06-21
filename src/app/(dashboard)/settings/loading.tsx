export default function SettingsLoading() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:py-8 animate-pulse">
      {/* Header */}
      <div className="mb-6 space-y-2">
        <div className="bg-muted h-7 w-28 rounded" />
        <div className="bg-muted h-4 w-56 rounded" />
      </div>

      {/* Vertical tab layout */}
      <div className="flex gap-6">
        {/* Sidebar tabs */}
        <div className="w-48 shrink-0 space-y-1">
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div key={i} className="bg-muted h-10 rounded-lg" />
          ))}
        </div>

        {/* Content area */}
        <div className="flex-1 space-y-4">
          <div className="rounded-xl border p-5 space-y-4">
            <div className="bg-muted h-5 w-32 rounded" />
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-1.5">
                  <div className="bg-muted h-3 w-20 rounded" />
                  <div className="bg-muted h-9 w-full rounded-lg" />
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-xl border p-5 space-y-3">
            <div className="bg-muted h-5 w-40 rounded" />
            {[1, 2].map((i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="bg-muted h-4 w-32 rounded" />
                  <div className="bg-muted h-3 w-48 rounded" />
                </div>
                <div className="bg-muted h-6 w-10 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
