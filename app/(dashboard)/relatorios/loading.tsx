export default function RelatoriosLoading() {
  return (
    <div className="max-w-3xl mx-auto w-full space-y-6 animate-pulse">
      <div className="space-y-2">
        <div className="h-5 w-28 rounded-md bg-muted" />
        <div className="h-4 w-64 rounded-md bg-muted" />
      </div>

      <div className="space-y-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="rounded-xl border bg-white p-5 space-y-3">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-muted shrink-0" />
              <div className="space-y-2 flex-1">
                <div className="h-4 w-40 rounded bg-muted" />
                <div className="h-3 w-56 rounded bg-muted" />
              </div>
            </div>
            <div className="h-9 w-full rounded-xl bg-muted" />
          </div>
        ))}
      </div>
    </div>
  )
}
