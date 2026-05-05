export default function AnalisesLoading() {
  return (
    <div className="max-w-3xl mx-auto w-full space-y-0 animate-pulse">
      {/* Hero skeleton */}
      <div className="bg-blue-600/20 rounded-2xl px-6 pt-6 pb-8 space-y-5">
        <div className="flex items-center justify-between">
          <div className="h-7 w-24 rounded-lg bg-blue-600/30" />
          <div className="h-9 w-20 rounded-xl bg-blue-600/30" />
        </div>
        <div className="h-11 w-full rounded-xl bg-blue-600/30" />
        <div className="grid grid-cols-5 gap-2">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 rounded-xl bg-blue-600/30" />
          ))}
        </div>
      </div>

      {/* Lista skeleton */}
      <div className="pt-6 space-y-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="rounded-xl border bg-white p-5 space-y-4">
            <div className="flex items-center gap-4">
              <div className="size-12 rounded-2xl bg-muted shrink-0" />
              <div className="space-y-2 flex-1">
                <div className="h-4 w-36 rounded bg-muted" />
                <div className="h-3 w-48 rounded bg-muted" />
              </div>
            </div>
            <div className="h-3 w-48 rounded bg-muted" />
            <div className="h-11 w-full rounded-xl bg-muted" />
          </div>
        ))}
      </div>
    </div>
  )
}
