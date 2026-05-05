export default function ImportarLoading() {
  return (
    <div className="space-y-6 max-w-3xl mx-auto w-full animate-pulse">
      <div className="space-y-2">
        <div className="h-5 w-32 rounded-md bg-muted" />
        <div className="h-4 w-full rounded-md bg-muted" />
        <div className="h-4 w-3/4 rounded-md bg-muted" />
      </div>

      {/* Aviso de privacidade */}
      <div className="rounded-lg border border-amber-200 bg-amber-50/60 px-4 py-3 space-y-1.5">
        <div className="h-3.5 w-48 rounded bg-amber-200/80" />
        <div className="h-3 w-full rounded bg-amber-200/60" />
        <div className="h-3 w-5/6 rounded bg-amber-200/60" />
      </div>

      {/* Fonte dos dados */}
      <div className="space-y-3">
        <div className="h-4 w-28 rounded bg-muted" />
        <div className="flex flex-wrap gap-2">
          {[72, 56, 80, 152].map((w) => (
            <div key={w} className="h-8 rounded-md bg-muted" style={{ width: `${w}px` }} />
          ))}
        </div>
      </div>

      {/* Dropzone */}
      <div className="border-2 border-dashed rounded-lg p-12 flex flex-col items-center gap-3">
        <div className="size-8 rounded-full bg-muted" />
        <div className="h-4 w-56 rounded bg-muted" />
        <div className="h-3 w-32 rounded bg-muted" />
      </div>
    </div>
  )
}
