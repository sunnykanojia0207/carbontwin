export default function NegotiatorLoading() {
  return (
    <div className="flex h-[calc(100svh-4rem)] animate-pulse">
      {/* Sidebar */}
      <div className="hidden w-64 shrink-0 flex-col border-r lg:flex">
        <div className="border-b p-4">
          <div className="bg-muted h-9 w-full rounded-lg" />
        </div>
        <div className="flex-1 space-y-1 p-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-muted h-14 rounded-lg" />
          ))}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex flex-1 flex-col">
        {/* Header */}
        <div className="border-b px-4 py-3">
          <div className="bg-muted h-5 w-40 rounded" />
        </div>

        {/* Messages */}
        <div className="flex-1 space-y-4 p-4">
          {/* Assistant bubble */}
          <div className="flex gap-3 max-w-xl">
            <div className="bg-muted size-8 shrink-0 rounded-full" />
            <div className="bg-muted h-24 flex-1 rounded-2xl rounded-tl-sm" />
          </div>
          {/* User bubble */}
          <div className="flex gap-3 max-w-md ml-auto">
            <div className="bg-muted h-12 flex-1 rounded-2xl rounded-tr-sm" />
          </div>
          {/* Assistant bubble */}
          <div className="flex gap-3 max-w-lg">
            <div className="bg-muted size-8 shrink-0 rounded-full" />
            <div className="bg-muted h-16 flex-1 rounded-2xl rounded-tl-sm" />
          </div>
        </div>

        {/* Input bar */}
        <div className="border-t p-4">
          <div className="bg-muted h-12 w-full rounded-xl" />
        </div>
      </div>
    </div>
  )
}
