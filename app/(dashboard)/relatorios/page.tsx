import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight, FileText } from 'lucide-react'
import type { RelatorioRow } from '@/lib/supabase/types'
import type { Route } from 'next'

type RelatorioComAnalise = RelatorioRow & {
  analise_nome: string | null
}

function formatarData(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default async function RelatoriosPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data, error } = await supabase
    .from('relatorios')
    .select('*, analises(nome)')
    .eq('usuario_id', user.id)
    .order('gerado_em', { ascending: false })

  const itens: RelatorioComAnalise[] = (data ?? []).map((r) => {
    const { analises, ...rest } = r as RelatorioRow & { analises: { nome: string } | null }
    return { ...rest, analise_nome: analises?.nome ?? null }
  })

  return (
    <div className="max-w-3xl mx-auto w-full space-y-6">
      <div className="animate-fade-in">
        <h1 className="text-lg font-semibold">Relatórios</h1>
        <p className="text-sm text-muted-foreground">
          Relatórios de pesquisa gerados a partir das análises
        </p>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Não foi possível carregar os relatórios.
        </div>
      ) : itens.length === 0 ? (
        <div className="rounded-xl border border-dashed p-12 text-center">
          <FileText className="size-8 mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-sm text-muted-foreground">Nenhum relatório gerado ainda.</p>
          <Link
            href={'/analises' as Route}
            className="mt-3 inline-flex items-center gap-1.5 text-sm text-blue-600 hover:underline underline-offset-4"
          >
            Ver análises
            <ChevronRight className="size-4" />
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {itens.map((item, index) => (
            <div
              key={item.id}
              className="rounded-xl border bg-white p-5 space-y-3 animate-fade-in-up hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
              style={{ animationDelay: `${index * 70}ms` }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="size-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                    <FileText className="size-5 text-blue-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-[15px] truncate">
                      {item.analise_nome ?? 'Análise removida'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {item.periodos_incluidos.length} período{item.periodos_incluidos.length !== 1 ? 's' : ''} &middot; Gerado em {formatarData(item.gerado_em)}
                    </p>
                  </div>
                </div>
              </div>

              <Link
                href={`/relatorio/${item.id}` as Route}
                className="group flex items-center justify-center gap-2 w-full py-3 rounded-xl border text-sm font-medium touch-manipulation hover:bg-muted active:opacity-60 transition-colors duration-100"
              >
                Ver relatório
                <ChevronRight className="size-4 group-hover:translate-x-0.5 transition-transform duration-150" />
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
