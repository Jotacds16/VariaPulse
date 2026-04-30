import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, AlertTriangle } from 'lucide-react'
import { PrintButton } from './_components/print-button'
import type { RelatorioRow, AnaliseRow } from '@/lib/supabase/types'
import type { SecaoRelatorio } from '@/types'

interface PageProps {
  params: Promise<{ id: string }>
}

function SecaoCard({ secao }: { secao: SecaoRelatorio }) {
  const temAlertas = secao.alertas && secao.alertas.length > 0

  return (
    <div className="rounded-lg border bg-white overflow-hidden">
      <div className="px-5 py-3.5 border-b bg-muted/30">
        <h2 className="text-sm font-semibold">{secao.titulo}</h2>
      </div>
      <div className="px-5 py-4 space-y-3">
        <p className="text-sm leading-relaxed text-foreground/90">{secao.conteudo}</p>
        {temAlertas && (
          <ul className="space-y-1.5">
            {secao.alertas!.map((alerta, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2"
              >
                <AlertTriangle className="size-3.5 mt-0.5 shrink-0" />
                {alerta}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

export default async function RelatorioPage({ params }: PageProps) {
  const { id } = await params

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: relData, error: relError } = await supabase
    .from('relatorios')
    .select('*')
    .eq('id', id)
    .eq('usuario_id', user.id)
    .single()

  if (relError?.code === 'PGRST116') notFound()
  if (relError || !relData) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-sm text-red-700">
        Não foi possível carregar o relatório. Tente novamente em instantes.
      </div>
    )
  }

  const relatorio = relData as RelatorioRow

  const { data: analiseData } = await supabase
    .from('analises')
    .select('id, nome, fonte, criada_em')
    .eq('id', relatorio.analise_id)
    .eq('usuario_id', user.id)
    .single()

  const analise = analiseData as Pick<AnaliseRow, 'id' | 'nome' | 'fonte' | 'criada_em'> | null

  const dataRelatorio = new Date(relatorio.gerado_em).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <div className="space-y-6 max-w-3xl mx-auto w-full">
      <div>
        <Link
          href={analise ? `/analise/${analise.id}` : '/relatorios'}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ChevronLeft className="size-4" />
          {analise ? analise.nome : 'Relatórios'}
        </Link>

        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-lg font-semibold">Relatório clínico</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {analise?.nome && `${analise.nome} · `}Gerado em {dataRelatorio}
            </p>
          </div>

          <PrintButton />
        </div>
      </div>

      <div className="space-y-4">
        {relatorio.conteudo.map((secao, i) => (
          <SecaoCard key={i} secao={secao} />
        ))}
      </div>

      <div className="print:hidden border-t pt-4">
        <p className="text-xs text-muted-foreground">
          Este relatório é gerado automaticamente com base nos dados importados e nas análises
          calculadas pelo VariaPulse. Os resultados têm caráter auxiliar e devem ser interpretados
          por profissional de saúde habilitado, em conjunto com a avaliação clínica completa do
          paciente.
        </p>
      </div>
    </div>
  )
}
