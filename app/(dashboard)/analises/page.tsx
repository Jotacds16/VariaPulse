import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus, ChevronRight } from 'lucide-react'
import type { AnaliseRow } from '@/lib/supabase/types'
import type { FonteDados } from '@/types'

const FONTE_LABEL: Record<FonteDados, string> = {
  consultorio: 'Consultório',
  mrpa: 'MRPA',
  mapa_24h: 'MAPA 24h',
  monitorizacao_continua: 'Monitorização contínua',
}

function formatarData(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export default async function AnalisesPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data, error } = await supabase
    .from('analises')
    .select('id, nome, fonte, medicoes_total, medicoes_validas, criada_em')
    .eq('usuario_id', user.id)
    .order('criada_em', { ascending: false })

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-sm text-destructive">
        Não foi possível carregar as análises. Tente novamente em instantes.
      </div>
    )
  }

  const analises = (data ?? []) as Pick<
    AnaliseRow,
    'id' | 'nome' | 'fonte' | 'medicoes_total' | 'medicoes_validas' | 'criada_em'
  >[]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">Análises</h1>
          <p className="text-sm text-muted-foreground">
            Histórico de análises de variabilidade pressórica
          </p>
        </div>
        <Link
          href="/importar"
          className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-md bg-foreground text-background hover:opacity-90 transition-opacity"
        >
          <Plus className="size-4" />
          Nova análise
        </Link>
      </div>

      {analises.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <p className="text-sm text-muted-foreground">Nenhuma análise ainda.</p>
          <Link
            href="/importar"
            className="mt-3 inline-flex items-center gap-1.5 text-sm text-foreground underline-offset-4 hover:underline"
          >
            Importar a primeira análise
          </Link>
        </div>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Nome</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Fonte</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Medições</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Data</th>
                <th className="w-8" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {analises.map((a) => (
                <tr key={a.id} className="relative hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-medium">
                    <Link
                      href={`/analise/${a.id}`}
                      className="after:absolute after:inset-0 focus-visible:outline-none"
                      aria-label={`Ver análise ${a.nome}`}
                    />
                    {a.nome}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {FONTE_LABEL[a.fonte] ?? a.fonte}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {a.medicoes_validas}{' '}
                    <span className="text-xs">/ {a.medicoes_total}</span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatarData(a.criada_em)}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground" aria-hidden>
                    <ChevronRight className="size-4" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
