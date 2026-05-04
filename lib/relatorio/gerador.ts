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
    'O padrão dipper normal indica descenso noturno fisiológico adequado, com queda pressórica dentro do intervalo esperado de 10 a 20%. Este fenótipo está associado ao menor risco cardiovascular entre os quatro padrões de descenso descritos na literatura, refletindo uma resposta autonômica preservada durante o ciclo sono-vigília.',
  non_dipper:
    'O padrão non-dipper indica redução insuficiente da pressão arterial durante o período de sono, caracterizado por queda inferior a 10% em relação à média diurna. Este fenótipo está associado a maior incidência de acidente vascular cerebral, doença renal crônica e hipertrofia ventricular esquerda, independentemente dos valores médios diurnos, conforme demonstrado em estudos prospectivos de base populacional.',
  riser:
    'O padrão riser representa uma inversão do ritmo pressórico circadiano fisiológico, com a pressão noturna superando a média diurna (descenso negativo). Constitui o fenótipo de maior risco cardiovascular entre os quatro padrões e está frequentemente associado a síndrome de apneia obstrutiva do sono, nefropatia diabética avançada e disautonomia.',
  extreme_dipper:
    'O padrão extreme dipper é definido por uma redução noturna superior a 20% em relação à média diurna. Embora possa ser interpretado superficialmente como protetor, este fenótipo pode associar-se à hipoperfusão noturna de órgãos-alvo — em particular do sistema nervoso central — sendo de particular relevância em pacientes idosos, portadores de doença cerebrovascular estabelecida ou com estenose carotídea significativa.',
}

function fmt1(v: number): string {
  return v.toFixed(1)
}

function gerarSecaoDadosEstudo(analise: AnaliseRow): SecaoRelatorio {
  const fonte = FONTE_LABEL[analise.fonte as FonteDados] ?? analise.fonte
  const periodos = (analise.periodos_disponiveis as Periodo[])
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

  const qualidadeTaxa =
    taxaValidade >= 90
      ? 'excelente qualidade técnica'
      : taxaValidade >= 70
      ? 'qualidade técnica adequada'
      : 'qualidade técnica reduzida, o que pode comprometer a representatividade das estimativas'

  return {
    titulo: 'Dados do Estudo',
    conteudo:
      `O presente relatório foi gerado a partir de dados provenientes de ${fonte}, com análise realizada em ${data}. ` +
      `A série temporal incluiu ${analise.medicoes_total} medições no total, das quais ${analise.medicoes_validas} foram classificadas como válidas após aplicação dos critérios de validação clínica e estatística, ` +
      `correspondendo a uma taxa de aproveitamento de ${taxaValidade}% — indicativa de ${qualidadeTaxa}. ` +
      `Os períodos com dados disponíveis para análise foram: ${periodos}. ` +
      `A validação individual de cada medição seguiu critérios de plausibilidade fisiológica (limites pressóricos e de frequência cardíaca), ` +
      `detecção de duplicatas temporais e avaliação de intervalos entre medições, conforme recomendações das diretrizes da Sociedade Europeia de Hipertensão para monitorização ambulatorial.`,
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

  const limiteStr =
    periodo === 'noturno'
      ? '(referência < 120/70 mmHg para o período noturno)'
      : periodo === 'manha_despertar'
      ? '(referência < 135/85 mmHg para o despertar)'
      : '(referência < 130/80 mmHg conforme 7ª Diretriz Brasileira de Hipertensão)'

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
      'Variabilidade pelo desvio-padrão acima dos limiares de referência — considerar avaliação clínica complementar para investigação de causas estruturais ou autonômicas.'
    )
  }

  if (arvPasElevada || arvPadElevada) {
    alertas.push(
      'ARV elevada — variabilidade sequencial aumentada, associada a maior risco de lesão de órgão-alvo independentemente da pressão arterial média.'
    )
  }

  const interpretacaoMedia =
    !pasElevada && !padElevada
      ? `Os valores médios encontram-se dentro dos limiares de normalidade ${limiteStr}.`
      : `Os valores médios excedem os limiares de referência ${limiteStr}, indicando necessidade de avaliação clínica individualizada.`

  const interpretacaoVRM =
    arvPasElevada || arvPadElevada
      ? 'A Variabilidade Real Média (VRM ou ARV, do inglês Average Real Variability), calculada como a média das diferenças absolutas entre medições consecutivas, encontra-se elevada, o que é clinicamente relevante dado que sua associação com lesão de órgão-alvo é independente dos valores médios absolutos. '
      : 'A Variabilidade Real Média (VRM ou ARV), obtida pela média das diferenças absolutas entre medições consecutivas, situa-se dentro dos limites esperados para o período. '

  const conteudo =
    `No período ${label.toLowerCase()}, foram analisadas ${linear.n} medições válidas. ` +
    `A pressão arterial média obtida foi de ${fmt1(linear.media_pas)}/${fmt1(linear.media_pad)} mmHg ${limiteStr}. ` +
    `${interpretacaoMedia} ` +
    `A amplitude pressórica observada compreendeu valores entre ${linear.min_pas} e ${linear.max_pas} mmHg para a PAS, ` +
    `e entre ${linear.min_pad} e ${linear.max_pad} mmHg para a PAD, ` +
    `refletindo a dispersão total da série neste período. ` +
    `O desvio-padrão, indicador clássico de variabilidade intraindividual, foi de ${fmt1(linear.dp_pas)} mmHg${dpPasElevado ? ' (acima do limiar de referência de 15 mmHg para PAS)' : ''} ` +
    `para a PAS e ${fmt1(linear.dp_pad)} mmHg${dpPadElevado ? ' (acima do limiar de referência de 12 mmHg para PAD)' : ''} para a PAD. ` +
    `O coeficiente de variação, que expressa a dispersão relativa em função da média, foi de ${fmt1(linear.cv_pas)}% para a PAS e ${fmt1(linear.cv_pad)}% para a PAD. ` +
    interpretacaoVRM +
    `Os valores de VRM foram ${fmt1(linear.vrm_pas)} mmHg${arvPasElevada ? ' (elevado)' : ''} para a PAS ` +
    `e ${fmt1(linear.vrm_pad)} mmHg${arvPadElevada ? ' (elevado)' : ''} para a PAD.`

  return { titulo: `Pressão Arterial — ${label}`, conteudo, alertas }
}

function gerarSecaoDescensoNoturno(
  descenso: DescensoNoturno,
  n_diurno: number,
  n_noturno: number
): SecaoRelatorio {
  const alertas: string[] = []

  if (descenso.padrao !== 'dipper') {
    alertas.push(
      `Padrão ${descenso.padrao.replace('_', '-')} identificado — avaliação clínica recomendada para investigação etiológica e definição terapêutica.`
    )
  }

  const confiancaBaixa = n_diurno < 7 || n_noturno < 5
  if (confiancaBaixa) {
    alertas.push(
      `Confiança reduzida: recomendado mínimo de 7 medições diurnas e 5 noturnas para classificação confiável do padrão (disponíveis: ${n_diurno} diurnas, ${n_noturno} noturnas).`
    )
  }

  const conteudo =
    `O descenso noturno representa a redução percentual da pressão arterial durante o período de sono em relação ao período de vigília, ` +
    `sendo calculado pela fórmula: [(média diurna − média noturna) / média diurna] × 100. ` +
    `A classificação do padrão circadiano pressórico segue a nomenclatura proposta por Staessen et al. e adotada pelas diretrizes europeias de MAPA: ` +
    `dipper (redução de 10 a 20%), non-dipper (redução inferior a 10%), extreme dipper (redução superior a 20%) e riser (pressão noturna superior à diurna). ` +
    `Nesta análise, o descenso noturno observado foi de ${fmt1(descenso.pas_percentual)}% para a pressão sistólica ` +
    `e de ${fmt1(descenso.pad_percentual)}% para a pressão diastólica, ` +
    `classificando o perfil pressórico como padrão ${descenso.padrao.replace('_', '-')}. ` +
    DESCENSO_NARRATIVA[descenso.padrao]

  return { titulo: 'Descenso Noturno e Padrão Circadiano', conteudo, alertas }
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

  partes.push(
    `No período ${label.toLowerCase()} (n = ${nl.n} medições válidas), ` +
    `foram aplicadas técnicas de análise não linear para quantificação da complexidade e regularidade da série temporal pressórica. ` +
    `Esses métodos capturam dimensões da dinâmica pressórica inacessíveis às métricas lineares convencionais, ` +
    `sendo particularmente relevantes para a avaliação do tônus autonômico e da integridade dos mecanismos regulatórios cardiovasculares.`
  )

  if (nl.poincare) {
    const { sd1, sd2, razao_sd1_sd2 } = nl.poincare
    const interpretacaoRazao =
      razao_sd1_sd2 < 0.5
        ? 'indicando predominância de variabilidade de longo prazo'
        : razao_sd1_sd2 > 1.5
        ? 'indicando predominância de variabilidade de curto prazo'
        : 'compatível com equilíbrio entre variabilidades de curto e longo prazo'
    partes.push(
      `A análise do diagrama de Poincaré, representação geométrica da autocorrelação da série temporal, ` +
      `revelou SD1 de ${fmt1(sd1)} mmHg (variabilidade de curto prazo, análoga à modulação parassimpática) ` +
      `e SD2 de ${fmt1(sd2)} mmHg (variabilidade de longo prazo, refletindo regulação simpática e barorreflexa). ` +
      `A razão SD1/SD2 foi de ${razao_sd1_sd2.toFixed(3)}, ${interpretacaoRazao}.`
    )
  }

  if (nl.entropia_aproximada !== null || nl.entropia_amostral !== null) {
    const apen =
      nl.entropia_aproximada !== null
        ? `Entropia Aproximada (ApEn) de ${nl.entropia_aproximada.toFixed(3)}`
        : 'ApEn indisponível'
    const sampen =
      nl.entropia_amostral !== null
        ? `Entropia Amostral (SampEn) de ${nl.entropia_amostral.toFixed(3)}`
        : 'SampEn indisponível'
    partes.push(
      `As métricas de complexidade revelaram ${apen} e ${sampen}. ` +
      `Valores de entropia mais elevados refletem maior irregularidade e complexidade da série, ` +
      `enquanto valores reduzidos sugerem maior regularidade, potencialmente indicativa de comprometimento da regulação autonômica.`
    )
  }

  if (nl.dfa) {
    const interpretacaoAlpha1 =
      nl.dfa.alpha1 < 0.5
        ? 'indicativo de anticorrelações de curto prazo'
        : nl.dfa.alpha1 > 1.5
        ? 'sugestivo de dinâmica não estacionária de curto prazo'
        : nl.dfa.alpha1 >= 0.5 && nl.dfa.alpha1 <= 1.0
        ? 'compatível com correlações de longo alcance fisiológicas'
        : 'indicativo de dinâmica com correlações fortes de curto prazo'
    partes.push(
      `A Análise de Flutuações Destendenciadas (DFA) quantificou as correlações fractais da série temporal. ` +
      `O expoente α1 de ${fmt1(nl.dfa.alpha1)} avalia correlações de curto prazo (escalas 4–16), ` +
      `${interpretacaoAlpha1}. ` +
      `O expoente α2 de ${fmt1(nl.dfa.alpha2)} reflete correlações de longo prazo (escalas 16–64), ` +
      `avaliando a organização fractal global da série.`
    )
  }

  if (nl.alertas.length > 0) {
    for (const a of nl.alertas) {
      alertas.push(
        `${a.metodo}: número de observações insuficiente para estimativa confiável (mínimo recomendado: ${a.minimo_recomendado}; disponíveis: ${a.disponivel}).`
      )
    }
  }

  return {
    titulo: `Análise Não Linear — ${label}`,
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
      'As estimativas estatísticas devem ser interpretadas com cautela, pois a subrepresentação de determinados períodos pode introduzir viés nas médias e métricas de variabilidade.'
    )
  }

  if (analise.medicoes_validas < 20) {
    alertas.push(
      `Número de medições válidas reduzido (n = ${analise.medicoes_validas}). ` +
      'Com amostras inferiores a 20 observações, as estimativas de desvio-padrão, coeficiente de variação e métricas não lineares apresentam maior instabilidade estatística. Os resultados devem ser contextualizados clinicamente.'
    )
  }

  if (alertas.length === 0) return null

  return {
    titulo: 'Considerações Metodológicas e Limitações',
    conteudo:
      'A interpretação dos resultados deste relatório deve considerar as seguintes limitações identificadas na base de dados analisada:',
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
  const periodos = analise.periodos_disponiveis as Periodo[]
  const linear = analise.linear as unknown as Record<Periodo, AnaliseLinear> | null
  const nao_linear = analise.nao_linear as unknown as Record<Periodo, AnaliseNaoLinear> | null
  const secoes: SecaoRelatorio[] = []

  secoes.push(gerarSecaoDadosEstudo(analise))

  // Seções lineares por período
  if (linear) {
    const ordem: Periodo[] = ['total', 'diurno', 'noturno', 'manha_despertar']
    for (const periodo of ordem) {
      if (!periodos.includes(periodo)) continue
      const lin = linear[periodo]
      if (!lin) continue
      secoes.push(gerarSecaoPressaoArterial(lin, periodo))
    }

    // Descenso noturno — presente quando ambos os períodos diurno e noturno estão disponíveis
    const linearDiurno = linear['diurno']
    const linearNoturno = linear['noturno']
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
  if (nao_linear) {
    const ordem: Periodo[] = ['total', 'diurno', 'noturno', 'manha_despertar']
    for (const periodo of ordem) {
      if (!periodos.includes(periodo)) continue
      const nl = nao_linear[periodo]
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
