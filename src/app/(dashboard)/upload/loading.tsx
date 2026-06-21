export default function UploadLoading() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:py-10 animate-pulse">
      {/* Header */}
      <div className="mb-6 space-y-2">
        <div className="bg-muted h-7 w-40 rounded" />
        <div className="bg-muted h-4 w-64 rounded" />
      </div>

      {/* Upload zone */}
      <div className="bg-muted rounded-2xl border-2 border-dashed h-56 w-full" />

      {/* Mode toggles */}
      <div className="mt-4 flex gap-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-muted h-9 w-24 rounded-full" />
        ))}
      </div>

      {/* Recent scans */}
      <div className="mt-8 space-y-2">
        <div className="bg-muted h-4 w-28 rounded" />
        <div className="space-y-2 mt-3">
          {[1, 2].map((i) => (
            <div key={i} className="rounded-xl border p-3 flex items-center gap-3">
              <div className="bg-muted size-10 rounded-lg shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="bg-muted h-4 w-32 rounded" />
                <div className="bg-muted h-3 w-24 rounded" />
              </div>
              <div className="bg-muted h-4 w-16 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
