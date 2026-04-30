import type {
  AnaliseLinear,
  AnaliseNaoLinear,
  Periodo,
  SecaoRelatorio,
  FonteDados,
  DescensoNoturno,
} from '@/types'
import type { AnaliseRow } from '@/lib/supabase/types'

const FONTE_LABEL: Record<FonteDados, string> = {
  consultorio: 'Consultório',
  mrpa: 'MRPA (Monitorização Residencial da Pressão Arterial)',
  mapa_24h: 'MAPA de 24 horas',
  monitorizacao_continua: 'Monitorização contínua',
}

const PERIODO_LABEL: Record<Periodo, string> = {
  total: 'Total (24 horas)',
  diurno: 'Diurno',
  noturno: 'Noturno',
  manha_despertar: 'Manhã (despertar)',
}

const DESCENSO_NARRATIVA: Record<DescensoNoturno['padrao'], string> = {
  dipper:
    'O padrão dipper normal indica descenso noturno fisiológico adequado, com queda pressórica dentro do intervalo esperado (10 a 20%). Este padrão está associado ao menor risco cardiovascular entre os quatro fenótipos de descenso.',
  non_dipper:
    'O padrão non-dipper indica redução insuficiente da pressão arterial durante o sono (queda abaixo de 10%). Este fenótipo está associado a maior risco de acidente vascular cerebral, doença renal crónica e hipertrofia ventricular esquerda, independentemente dos valores médios diurnos.',
  riser:
    'O padrão riser representa uma inversão do padrão fisiológico, com a pressão noturna superando a diurna. É o fenótipo de maior risco cardiovascular e está frequentemente associado a síndrome de apneia obstrutiva do sono, diabetes e insuficiência renal avançada.',
  extreme_dipper:
    'O padrão extreme dipper indica descenso noturno excessivo (superior a 20%). Embora possa parecer favorável, este fenótipo pode associar-se a hipoperfusão noturna de órgãos-alvo, sendo de particular relevância em idosos e pacientes com doença cerebrovascular estabelecida.',
}

function fmt1(v: number): string {
  return v.toFixed(1)
}

function gerarSecaoDadosEstudo(analise: AnaliseRow): SecaoRelatorio {
  const fonte = FONTE_LABEL[analise.fonte] ?? analise.fonte
  const periodos = analise.periodos_disponiveis
    .map((p) => PERIODO_LABEL[p] ?? p)
    .join(', ')
  const data = new Date(analise.criada_em).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
  const taxaValidade =
    analise.medicoes_total > 0
      ? Math.round((analise.medicoes_validas / analise.medicoes_total) * 100)
      : 0

  return {
    titulo: 'Dados do estudo',
    conteudo:
      `Fonte de dados: ${fonte}. ` +
      `Análise realizada em ${data}. ` +
      `Total de medições: ${analise.medicoes_total}, das quais ${analise.medicoes_validas} foram consideradas válidas (${taxaValidade}% de aproveitamento). ` +
      `Períodos com dados disponíveis: ${periodos}.`,
  }
}

function gerarSecaoPressaoArterial(
  linear: AnaliseLinear,
  periodo: Periodo
): SecaoRelatorio {
  const label = PERIODO_LABEL[periodo] ?? periodo
  const alertas: string[] = []

  const pasElevada = linear.media_pas >= 130
  const padElevada = linear.media_pad >= 80
  const dpPasElevado = linear.dp_pas > 15
  const dpPadElevado = linear.dp_pad > 12
  const arvPasElevada = linear.vrm_pas > 12
  const arvPadElevada = linear.vrm_pad > 9

  if (pasElevada || padElevada) {
    const componentes = [
      pasElevada ? `PAS média de ${fmt1(linear.media_pas)} mmHg (referência < 130 mmHg)` : null,
      padElevada ? `PAD média de ${fmt1(linear.media_pad)} mmHg (referência < 80 mmHg)` : null,
    ]
      .filter((x): x is string => x !== null)
      .join(' e ')
    alertas.push(`Média pressórica acima do limiar de referência: ${componentes}.`)
  }

  if (dpPasElevado || dpPadElevado) {
    alertas.push(
      'Variabilidade elevada pelo desvio-padrão — considerar avaliação clínica complementar.'
    )
  }

  if (arvPasElevada || arvPadElevada) {
    alertas.push(
      'ARV elevada — variabilidade sequencial aumentada, associada a maior risco de lesão de órgão-alvo.'
    )
  }

  const conteudo =
    `Período ${label.toLowerCase()} (n = ${linear.n} medições válidas). ` +
    `Pressão arterial média: ${fmt1(linear.media_pas)}/${fmt1(linear.media_pad)} mmHg. ` +
    `Amplitude: PAS ${linear.min_pas}–${linear.max_pas} mmHg; PAD ${linear.min_pad}–${linear.max_pad} mmHg. ` +
    `Desvio-padrão: PAS ${fmt1(linear.dp_pas)} mmHg${dpPasElevado ? ' (elevado)' : ''}, ` +
    `PAD ${fmt1(linear.dp_pad)} mmHg${dpPadElevado ? ' (elevado)' : ''}. ` +
    `Coeficiente de variação: PAS ${fmt1(linear.cv_pas)}%, PAD ${fmt1(linear.cv_pad)}%. ` +
    `ARV: PAS ${fmt1(linear.vrm_pas)} mmHg${arvPasElevada ? ' (elevado)' : ''}, ` +
    `PAD ${fmt1(linear.vrm_pad)} mmHg${arvPadElevada ? ' (elevado)' : ''}.`

  return { titulo: `Pressão arterial — ${label}`, conteudo, alertas }
}

function gerarSecaoDescensoNoturno(
  descenso: DescensoNoturno,
  n_diurno: number,
  n_noturno: number
): SecaoRelatorio {
  const alertas: string[] = []

  if (descenso.padrao !== 'dipper') {
    alertas.push(
      `Padrão ${descenso.padrao.replace('_', '-')} identificado — avaliação clínica recomendada.`
    )
  }

  if (descenso.alertas.length > 0) {
    alertas.push(...descenso.alertas)
  }

  const confiancaBaixa = n_diurno < 7 || n_noturno < 5
  if (confiancaBaixa) {
    alertas.push(
      `Confiança reduzida: recomendado mínimo de 7 medições diurnas e 5 nocturnas (disponíveis: ${n_diurno} diurnas, ${n_noturno} nocturnas).`
    )
  }

  const conteudo =
    `Padrão de descenso: ${descenso.padrao.replace('_', '-')}. ` +
    `Redução percentual noturna: PAS ${fmt1(descenso.pas_percentual)}%, PAD ${fmt1(descenso.pad_percentual)}%. ` +
    DESCENSO_NARRATIVA[descenso.padrao]

  return { titulo: 'Descenso noturno', conteudo, alertas }
}

function gerarSecaoNaoLinear(
  nl: AnaliseNaoLinear,
  periodo: Periodo
): SecaoRelatorio | null {
  const label = PERIODO_LABEL[periodo] ?? periodo
  const alertas: string[] = []
  const partes: string[] = []

  const semDados =
    !nl.poincare && !nl.dfa && nl.entropia_aproximada === null && nl.entropia_amostral === null

  if (semDados && nl.alertas.length === 0) return null

  partes.push(`Período ${label.toLowerCase()} (n = ${nl.n} medições válidas).`)

  if (nl.poincare) {
    const { sd1, sd2, razao_sd1_sd2 } = nl.poincare
    partes.push(
      `Análise de Poincaré: SD1 = ${fmt1(sd1)} mmHg (variabilidade de curto prazo), ` +
      `SD2 = ${fmt1(sd2)} mmHg (variabilidade de longo prazo), ` +
      `razão SD1/SD2 = ${razao_sd1_sd2.toFixed(3)}.`
    )
  }

  if (nl.entropia_aproximada !== null || nl.entropia_amostral !== null) {
    const apen =
      nl.entropia_aproximada !== null ? `ApEn = ${nl.entropia_aproximada.toFixed(3)}` : 'ApEn indisponível'
    const sampen =
      nl.entropia_amostral !== null ? `SampEn = ${nl.entropia_amostral.toFixed(3)}` : 'SampEn indisponível'
    partes.push(`Entropias: ${apen}; ${sampen}.`)
  }

  if (nl.dfa) {
    partes.push(
      `DFA: α1 = ${fmt1(nl.dfa.alpha1)} (correlações de curto prazo), ` +
      `α2 = ${fmt1(nl.dfa.alpha2)} (correlações de longo prazo).`
    )
  }

  if (nl.alertas.length > 0) {
    for (const a of nl.alertas) {
      alertas.push(`${a.metodo}: dados insuficientes (mín. ${a.minimo_recomendado}, disponíveis: ${a.disponivel}).`)
    }
  }

  return {
    titulo: `Variabilidade não linear — ${label}`,
    conteudo: partes.join(' '),
    alertas,
  }
}

function gerarSecaoConsideracoes(analise: AnaliseRow): SecaoRelatorio | null {
  const alertas: string[] = []

  const taxaValidade =
    analise.medicoes_total > 0
      ? analise.medicoes_validas / analise.medicoes_total
      : 1

  if (taxaValidade < 0.7) {
    alertas.push(
      `Taxa de validade das medições abaixo de 70% (${Math.round(taxaValidade * 100)}%). ` +
      'Interpretar os resultados com cautela.'
    )
  }

  if (analise.medicoes_validas < 20) {
    alertas.push(
      `Número de medições válidas reduzido (n = ${analise.medicoes_validas}). ` +
      'Estimativas estatísticas menos estáveis — resultados devem ser contextualizados clinicamente.'
    )
  }

  if (alertas.length === 0) return null

  return {
    titulo: 'Considerações e limitações',
    conteudo:
      'Os seguintes pontos devem ser considerados na interpretação deste relatório:',
    alertas,
  }
}

// ---------------------------------------------------------------------------
// Função principal exportada
// ---------------------------------------------------------------------------

export function gerarConteudoRelatorio(analise: AnaliseRow): {
  periodos: Periodo[]
  secoes: SecaoRelatorio[]
} {
  const periodos = analise.periodos_disponiveis
  const secoes: SecaoRelatorio[] = []

  secoes.push(gerarSecaoDadosEstudo(analise))

  // Seções lineares por período
  if (analise.linear) {
    const ordem: Periodo[] = ['total', 'diurno', 'noturno', 'manha_despertar']
    for (const periodo of ordem) {
      if (!periodos.includes(periodo)) continue
      const linear = analise.linear[periodo]
      if (!linear) continue
      secoes.push(gerarSecaoPressaoArterial(linear, periodo))
    }

    // Descenso noturno — está no resultado diurno quando ambos períodos disponíveis
    const linearDiurno = analise.linear['diurno']
    const linearNoturno = analise.linear['noturno']
    if (linearDiurno?.descenso_noturno && linearNoturno) {
      secoes.push(
        gerarSecaoDescensoNoturno(
          linearDiurno.descenso_noturno,
          linearDiurno.n,
          linearNoturno.n
        )
      )
    }
  }

  // Seções não lineares por período
  if (analise.nao_linear) {
    const ordem: Periodo[] = ['total', 'diurno', 'noturno', 'manha_despertar']
    for (const periodo of ordem) {
      if (!periodos.includes(periodo)) continue
      const nl = analise.nao_linear[periodo]
      if (!nl) continue
      const secao = gerarSecaoNaoLinear(nl, periodo)
      if (secao) secoes.push(secao)
    }
  }

  // Considerações finais
  const consideracoes = gerarSecaoConsideracoes(analise)
  if (consideracoes) secoes.push(consideracoes)

  return { periodos, secoes }
}
