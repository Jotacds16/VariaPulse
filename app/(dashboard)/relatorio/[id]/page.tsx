import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { ExportPdfButton } from './_components/export-pdf-button'
import type { RelatorioRow, AnaliseRow } from '@/lib/supabase/types'
import type { SecaoRelatorio } from '@/types'

interface PageProps {
  params: Promise<{ id: string }>
}

const REFERENCIAS = [
  'Malachias MVB, Souza WKSB, Plavnik FL et al. 7ª Diretriz Brasileira de Hipertensão Arterial. Arq Bras Cardiol. 2016;107(3 Supl 3):1–83.',
  'O\'Brien E, Parati G, Stergiou G et al. European Society of Hypertension position paper on ambulatory blood pressure monitoring. J Hypertens. 2013;31(9):1731–1768.',
  'Parati G, Stergiou G, O\'Brien E et al. European Society of Hypertension practice guidelines for ambulatory blood pressure monitoring. J Hypertens. 2014;32(7):1359–1366.',
  'Palatini P, Mormino P, Dorigatti F et al. Glomerular hyperfiltration predicts the development of microalbuminuria in stage 1 hypertension. Kidney Int. 2006;70(3):578–584.',
  'Staessen JA, Thijs L, Fagard R et al. Predicting cardiovascular risk using conventional vs ambulatory blood pressure in older patients with systolic hypertension. JAMA. 1999;282(6):539–546.',
  'Hansen TW, Li Y, Boggia J et al. Predictive role of the nighttime blood pressure. Hypertension. 2011;57(1):3–10.',
  'Palatini P, Dorigatti F, Zaetta V et al. Heart rate as a predictor of development of sustained hypertension in subjects screened for stage 1 hypertension. J Hypertens. 2006;24(9):1873–1880.',
  'Richman JS, Moorman JR. Physiological time-series analysis using approximate entropy and sample entropy. Am J Physiol Heart Circ Physiol. 2000;278(6):H2039–H2049.',
  'Brennan M, Palaniswami M, Kamen P. Do existing measures of Poincaré plot geometry reflect nonlinear features of heart rate variability? IEEE Trans Biomed Eng. 2001;48(11):1342–1347.',
  'Peng CK, Havlin S, Stanley HE, Goldberger AL. Quantification of scaling exponents and crossover phenomena in nonstationary heartbeat time series. Chaos. 1995;5(1):82–87.',
]

function SecaoItem({ secao, numero }: { secao: SecaoRelatorio; numero: number }) {
  const temAlertas = secao.alertas && secao.alertas.length > 0

  return (
    <section>
      <h2 className="text-[0.8rem] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
        {numero}. {secao.titulo}
      </h2>
      <p className="text-sm leading-7 text-foreground text-justify">
        {secao.conteudo}
      </p>
      {temAlertas && (
        <div className="mt-3 pl-4 border-l-2 border-amber-400 space-y-1.5">
          {secao.alertas!.map((alerta, i) => (
            <p key={i} className="text-xs leading-relaxed text-amber-800 italic">
              <span className="not-italic font-medium">Nota clínica:</span> {alerta}
            </p>
          ))}
        </div>
      )}
    </section>
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

  const relData_ = relData as RelatorioRow
  const relatorio = {
    ...relData_,
    conteudo: relData_.conteudo as unknown as SecaoRelatorio[],
  }

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

  const dataRelatorioISO = new Date(relatorio.gerado_em).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })

  return (
    <div className="max-w-2xl mx-auto w-full">
      {/* Navegação — oculta na impressão */}
      <div className="print:hidden flex items-center justify-between mb-8">
        <Link
          href={analise ? `/analise/${analise.id}` : '/relatorios'}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="size-4" />
          {analise ? analise.nome : 'Relatórios'}
        </Link>
        <ExportPdfButton />
      </div>

      {/* Documento */}
      <div className="bg-white rounded-xl border shadow-sm print:shadow-none print:border-none print:rounded-none">
        {/* Cabeçalho do documento */}
        <div className="px-10 pt-10 pb-6 border-b">
          {/* Topo: identificação + data */}
          <div className="flex items-start justify-between gap-6 mb-5">
            <div>
              <p className="text-[0.65rem] font-semibold uppercase tracking-widest text-muted-foreground mb-1">
                Relatório clínico
              </p>
              <h1 className="text-lg font-bold leading-snug">
                Análise de Pressão Arterial
              </h1>
              {analise?.nome && (
                <p className="text-sm text-muted-foreground mt-1">{analise.nome}</p>
              )}
            </div>
            <div className="text-right shrink-0">
              <p className="text-xs text-muted-foreground">Gerado em</p>
              <p className="text-sm font-medium">{dataRelatorioISO}</p>
            </div>
          </div>

          {/* Metadados */}
          <div className="flex flex-wrap gap-x-6 gap-y-1">
            <span className="text-xs text-muted-foreground">
              <span className="font-medium text-foreground/70">Gerado em</span>{' '}
              {dataRelatorio}
            </span>
            <span className="text-xs text-muted-foreground">
              <span className="font-medium text-foreground/70">Sistema</span>{' '}
              VariaPulse — Análise computacional de variabilidade pressórica
            </span>
          </div>
        </div>

        {/* Corpo do relatório */}
        <div className="px-10 py-8 space-y-8 divide-y divide-border">
          {relatorio.conteudo.map((secao, i) => (
            <div key={i} className={i > 0 ? 'pt-8' : undefined}>
              <SecaoItem secao={secao} numero={i + 1} />
            </div>
          ))}
        </div>

        {/* Referências bibliográficas */}
        <div className="px-10 py-8 border-t bg-muted/20 print:bg-transparent">
          <h2 className="text-[0.8rem] font-semibold uppercase tracking-wider text-muted-foreground mb-4">
            Referências Bibliográficas
          </h2>
          <ol className="space-y-2">
            {REFERENCIAS.map((ref, i) => (
              <li key={i} className="text-xs leading-relaxed text-muted-foreground flex gap-3">
                <span className="shrink-0 font-medium text-foreground/50 w-4 text-right">
                  {i + 1}.
                </span>
                <span>{ref}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* Rodapé — nota clínica */}
        <div className="px-10 py-5 border-t">
          <p className="text-[0.7rem] leading-relaxed text-muted-foreground italic">
            Este relatório é gerado automaticamente com base nos dados importados e nas análises
            calculadas pelo VariaPulse. Os resultados têm caráter auxiliar e informativo,
            não substituindo a avaliação clínica individualizada realizada por profissional de
            saúde habilitado. A interpretação definitiva dos achados deve considerar o contexto
            clínico completo do paciente.
          </p>
        </div>
      </div>
    </div>
  )
}
