import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { AnaliseTabs } from './_components/analise-tabs'
import { SumarioKpi } from './_components/sumario-kpi'
import { BotaoRelatorio } from './_components/botao-relatorio'
import type { AnaliseRow } from '@/lib/supabase/types'
import type { FonteDados } from '@/types'

const FONTE_LABEL: Record<FonteDados, string> = {
  consultorio: 'Consultório',
  mrpa: 'MRPA',
  mapa_24h: 'MAPA 24h',
  monitorizacao_continua: 'Monitorização contínua',
}

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function AnalisePage({ params }: PageProps) {
  const { id } = await params

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data, error } = await supabase
    .from('analises')
    .select('*')
    .eq('id', id)
    .eq('usuario_id', user.id)
    .single()

  if (error?.code === 'PGRST116') notFound()
  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-sm text-red-700">
        Não foi possível carregar a análise. Tente novamente em instantes.
      </div>
    )
  }

  const analise = data as AnaliseRow

  const dataFormatada = new Date(analise.criada_em).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="space-y-6 max-w-3xl mx-auto w-full">
      <div>
        <Link
          href="/analises"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ChevronLeft className="size-4" />
          Análises
        </Link>

        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-lg font-semibold">{analise.nome}</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {FONTE_LABEL[analise.fonte] ?? analise.fonte} &middot; {dataFormatada}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2 shrink-0">
            <div className="text-right">
              <p className="text-sm font-medium">{analise.medicoes_validas}</p>
              <p className="text-xs text-muted-foreground">de {analise.medicoes_total} medições</p>
            </div>
            <BotaoRelatorio
              analiseId={analise.id}
              relatorioGerado={analise.relatorio_gerado}
            />
          </div>
        </div>
      </div>

      <SumarioKpi linear={analise.linear} />

      <AnaliseTabs
        analise={{
          periodos_disponiveis: analise.periodos_disponiveis,
          linear: analise.linear,
          nao_linear: analise.nao_linear,
        }}
      />
    </div>
  )
}
