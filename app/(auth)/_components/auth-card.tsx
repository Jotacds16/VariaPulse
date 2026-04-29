export function AuthCard({
  children,
  titulo,
  descricao,
}: {
  children: React.ReactNode
  titulo: string
  descricao: string
}) {
  return (
    <main className="min-h-screen flex items-center justify-center bg-muted px-4">
      <div className="w-full max-w-sm space-y-6 p-8 bg-white rounded-lg border shadow-sm">
        <div className="space-y-1">
          <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
            VariaPulse
          </p>
          <h1 className="text-xl font-semibold tracking-tight">{titulo}</h1>
          <p className="text-sm text-muted-foreground">{descricao}</p>
        </div>
        {children}
      </div>
    </main>
  )
}
