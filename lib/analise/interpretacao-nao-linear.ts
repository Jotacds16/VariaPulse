/**
 * Interpretação das métricas de análise não linear.
 */

import type { Poincare, DFA, ExplicacaoMetrica, Fonte } from '@/types'

// ---------------------------------------------------------------------------
// Fontes
// ---------------------------------------------------------------------------

const FONTES: Record<string, Fonte> = {
  tulppo1996: {
    autores: 'Tulppo MP, Mäkikallio TH, Takala TE, et al.',
    titulo:
      'Quantitative beat-to-beat analysis of heart rate dynamics during exercise',
    publicacao: 'American Journal of Physiology',
    ano: 1996,
    url: 'https://pubmed.ncbi.nlm.nih.gov/8760193/',
  },
  brennan2001: {
    autores: 'Brennan M, Palaniswami M, Kamen P.',
    titulo:
      'Do existing measures of Poincaré plot geometry reflect nonlinear features of heart rate variability?',
    publicacao: 'IEEE Transactions on Biomedical Engineering',
    ano: 2001,
    url: 'https://pubmed.ncbi.nlm.nih.gov/11686627/',
  },
  pincus1991: {
    autores: 'Pincus SM.',
    titulo: 'Approximate entropy as a measure of system complexity',
    publicacao: 'Proceedings of the National Academy of Sciences',
    ano: 1991,
    url: 'https://pubmed.ncbi.nlm.nih.gov/11607165/',
  },
  richman2000: {
    autores: 'Richman JS, Moorman JR.',
    titulo:
      'Physiological time-series analysis using approximate entropy and sample entropy',
    publicacao: 'American Journal of Physiology — Heart and Circulatory Physiology',
    ano: 2000,
    url: 'https://journals.physiology.org/doi/full/10.1152/ajpheart.2000.278.6.H2039',
  },
  lake2002: {
    autores: 'Lake DE, Richman JS, Griffin MP, Moorman JR.',
    titulo: 'Sample entropy analysis of neonatal heart rate variability',
    publicacao: 'American Journal of Physiology — Regulatory Physiology',
    ano: 2002,
    url: 'https://pubmed.ncbi.nlm.nih.gov/12183225/',
  },
  peng1995: {
    autores: 'Peng C-K, Havlin S, Stanley HE, Goldberger AL.',
    titulo:
      'Quantification of scaling exponents and crossover phenomena in nonstationary heartbeat time series',
    publicacao: 'Chaos',
    ano: 1995,
    url: 'https://pubmed.ncbi.nlm.nih.gov/11538314/',
  },
  eke2002: {
    autores: 'Eke A, Hermán P, Bassingthwaighte JB, et al.',
    titulo: 'Physiological time series: distinguishing fractal noises from motions',
    publicacao: 'Pflügers Archiv — European Journal of Physiology',
    ano: 2002,
    url: 'https://pubmed.ncbi.nlm.nih.gov/10928196/',
  },
  cardiac2020: {
    autores: 'Salles GF, Reboldi G, Parati G, et al.',
    titulo:
      'Cardiac surgical outcome prediction by blood pressure variability indices: Poincaré plot and coefficient of variation',
    publicacao: 'BMC Anesthesiology',
    ano: 2020,
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC7055104/',
  },
}

// ---------------------------------------------------------------------------
// Poincaré
// ---------------------------------------------------------------------------

export function explicarPoincare(
  resultado: Poincare,
  n: number
): ExplicacaoMetrica {
  const { sd1, sd2, razao_sd1_sd2 } = resultado
  const confianca = n >= 50 ? 'alta' : n >= 20 ? 'moderada' : 'baixa'
  const interpretacao = interpretarPoincare(sd1, sd2, razao_sd1_sd2)

  return {
    metrica: 'Gráfico de Poincaré — SD1 e SD2',
    valor_formatado: `SD1 = ${sd1.toFixed(2)} mmHg | SD2 = ${sd2.toFixed(2)} mmHg | SD1/SD2 = ${razao_sd1_sd2.toFixed(3)}`,
    metodo:
      'O gráfico de Poincaré representa cada medição BP_i em função da medição ' +
      'seguinte BP_{i+1}. Os parâmetros SD1 e SD2 são derivados das semi-axes ' +
      'da elipse ajustada ao padrão de dispersão. ' +
      'Fórmulas (Brennan et al. 2001):\n' +
      '  SD1² = ½ × Var(BP_{i+1} − BP_i)   → variabilidade beat-to-beat\n' +
      '  SD2² = 2 × Var(BP) − ½ × Var(BP_{i+1} − BP_i)   → tendência de longo prazo\n' +
      `Calculado a partir de ${n} medições, gerando ${n - 1} pares consecutivos.`,
    interpretacao,
    confianca,
    aviso_confianca:
      confianca !== 'alta'
        ? `N = ${n}. Mínimo de 50 medições recomendado para estabilidade de SD1/SD2.`
        : undefined,
    fontes: [FONTES.brennan2001!, FONTES.tulppo1996!, FONTES.cardiac2020!],
  }
}

function interpretarPoincare(sd1: number, sd2: number, razao: number): string {
  const partes: string[] = []

  // SD1 — variabilidade de curto prazo
  if (sd1 < 3) {
    partes.push(
      `SD1 = ${sd1.toFixed(2)} mmHg indica variabilidade beat-to-beat muito reduzida, ` +
        'sugerindo sistema autonómico com menor responsividade imediata.'
    )
  } else if (sd1 > 10) {
    partes.push(
      `SD1 = ${sd1.toFixed(2)} mmHg indica alta variabilidade de curto prazo, ` +
        'consistente com sistema autonómico responsivo.'
    )
  } else {
    partes.push(
      `SD1 = ${sd1.toFixed(2)} mmHg — variabilidade beat-to-beat dentro do intervalo habitual.`
    )
  }

  // SD2 — variabilidade de longo prazo
  if (sd2 < sd1) {
    partes.push(
      `SD2 (${sd2.toFixed(2)} mmHg) < SD1: padrão incomum. ` +
      'Em condições normais SD2 > SD1. Avaliar qualidade dos dados.'
    )
  } else {
    partes.push(
      `SD2 = ${sd2.toFixed(2)} mmHg — variabilidade de longo prazo ${sd2 > 15 ? 'elevada' : 'moderada'}.`
    )
  }

  // Razão SD1/SD2
  if (razao > 0.5) {
    partes.push(
      `Razão SD1/SD2 = ${razao.toFixed(3)}: predomínio de variabilidade de curto prazo.`
    )
  } else if (razao < 0.2) {
    partes.push(
      `Razão SD1/SD2 = ${razao.toFixed(3)}: predomínio marcado de variabilidade de longo prazo.`
    )
  }

  return partes.join(' ')
}

// ---------------------------------------------------------------------------
// Entropia Aproximada (ApEn)
// ---------------------------------------------------------------------------

export function explicarEntropiaAproximada(
  valor: number,
  n: number
): ExplicacaoMetrica {
  const confianca = n >= 200 ? 'alta' : n >= 100 ? 'moderada' : 'baixa'

  return {
    metrica: 'Entropia Aproximada (ApEn)',
    valor_formatado: valor.toFixed(4),
    metodo:
      'A ApEn quantifica a irregularidade da série temporal. ' +
      'Para cada sub-sequência de comprimento m, conta quantas outras sub-sequências ' +
      'são semelhantes (distância de Chebyshev ≤ r). ' +
      'ApEn = Φ(m) − Φ(m+1), onde Φ(m) é o logaritmo médio da frequência de ' +
      'correspondências. Parâmetros: m = 2, r = 0,20 × DP (Pincus 1991). ' +
      `Calculado sobre ${n} medições. Auto-comparação incluída conforme definição original.`,
    interpretacao: interpretarEntropia(valor, 'ApEn'),
    confianca,
    aviso_confianca:
      confianca !== 'alta'
        ? `N = ${n}. ApEn com N < 200 tem viés positivo conhecido — o valor pode estar sobreestimado. Interpretar com cautela.`
        : undefined,
    fontes: [FONTES.pincus1991!, FONTES.richman2000!],
  }
}

// ---------------------------------------------------------------------------
// Entropia Amostral (SampEn)
// ---------------------------------------------------------------------------

export function explicarEntropiaAmostral(
  valor: number,
  n: number
): ExplicacaoMetrica {
  const confianca = n >= 300 ? 'alta' : n >= 200 ? 'moderada' : 'baixa'

  return {
    metrica: 'Entropia Amostral (SampEn)',
    valor_formatado: valor.toFixed(4),
    metodo:
      'SampEn = −ln(A/B), onde:\n' +
      '  B = número de pares de templates de comprimento m com distância ≤ r\n' +
      '  A = número de pares que continuam similares no ponto m+1\n' +
      'Parâmetros: m = 2, r = 0,20 × DP (Richman & Moorman 2000). ' +
      'Ao contrário da ApEn, a SampEn exclui auto-comparações, eliminando o viés ' +
      `positivo em séries pequenas. Calculado sobre ${n} medições.`,
    interpretacao: interpretarEntropia(valor, 'SampEn'),
    confianca,
    aviso_confianca:
      confianca !== 'alta'
        ? `N = ${n}. Mínimo recomendado: 200 (Lake et al. 2002). ` +
          'Valores com N < 200 têm variância elevada.'
        : undefined,
    fontes: [FONTES.richman2000!, FONTES.lake2002!],
  }
}

function interpretarEntropia(valor: number, tipo: 'ApEn' | 'SampEn'): string {
  if (valor < 0.5) {
    return (
      `${tipo} = ${valor.toFixed(4)}: série com baixa complexidade — padrão altamente regular. ` +
      'Regularidade excessiva pode indicar perda da adaptabilidade do sistema cardiovascular, ' +
      'observada em condições patológicas como insuficiência cardíaca severa ou ' +
      'disautonomia. Interpretar no contexto clínico.'
    )
  }
  if (valor > 1.5) {
    return (
      `${tipo} = ${valor.toFixed(4)}: série com alta complexidade e irregularidade acentuada. ` +
      'Pode reflectir variabilidade fisiológica saudável ou, em contextos específicos, ' +
      'irregularidade patológica. Interpretar junto com os demais índices.'
    )
  }
  return (
    `${tipo} = ${valor.toFixed(4)}: complexidade moderada, compatível com variabilidade ` +
    'pressórica fisiológica habitual em adultos sem patologia severa.'
  )
}

// ---------------------------------------------------------------------------
// DFA
// ---------------------------------------------------------------------------

export function explicarDFA(resultado: DFA, n: number): ExplicacaoMetrica {
  const { alpha1, alpha2 } = resultado
  const confianca = n >= 256 ? 'alta' : n >= 128 ? 'moderada' : 'baixa'

  return {
    metrica: 'DFA — Análise de Flutuação Sem Tendência',
    valor_formatado: `α1 = ${alpha1.toFixed(3)} | α2 = ${alpha2.toFixed(3)}`,
    metodo:
      'O DFA quantifica correlações de longo alcance numa série temporal. ' +
      'Passos (Peng et al. 1995):\n' +
      '  1. Série integrada: y(k) = Σ[BP_i − BP̄]\n' +
      '  2. Para cada escala s: dividir em segmentos não sobrepostos\n' +
      '  3. Em cada segmento: remover tendência linear local, calcular resíduo RMS\n' +
      '  4. F(s) = √(média dos resíduos²)\n' +
      '  5. α = inclinação de log F(s) vs log s por regressão linear OLS\n' +
      `α1 calculado nas escalas 4–16 (${n} medições). ` +
      `α2 calculado nas escalas 16–64 ou até N/4 = ${Math.floor(n / 4)}.`,
    interpretacao: interpretarDFA(alpha1, alpha2),
    confianca,
    aviso_confianca:
      confianca !== 'alta'
        ? `N = ${n}. Mínimo recomendado: 128 para α1, 256 para α2 (Eke et al. 2002).`
        : undefined,
    fontes: [FONTES.peng1995!, FONTES.eke2002!],
  }
}

function interpretarDFA(alpha1: number, alpha2: number): string {
  const partes: string[] = []

  // Interpretação de α1
  if (alpha1 < 0.5) {
    partes.push(
      `α1 = ${alpha1.toFixed(3)}: anticorrelações de curto prazo — ` +
      'flutuações consecutivas tendem a ser opostas em magnitude.'
    )
  } else if (Math.abs(alpha1 - 0.5) < 0.1) {
    partes.push(
      `α1 = ${alpha1.toFixed(3)}: série próxima de ruído branco para escalas de curto prazo ` +
        '(ausência de correlação temporal local).'
    )
  } else if (alpha1 <= 1.0) {
    partes.push(
      `α1 = ${alpha1.toFixed(3)}: correlações positivas de curto prazo (ruído 1/f fraccionário). ` +
        'Padrão associado a regulação autonómica saudável em séries de pressão arterial.'
    )
  } else {
    partes.push(
      `α1 = ${alpha1.toFixed(3)} > 1.0: comportamento de Brownian motion para escalas curtas — ` +
        'não estacionariedade local marcada.'
    )
  }

  // Interpretação de α2
  if (alpha2 < 0.5) {
    partes.push(`α2 = ${alpha2.toFixed(3)}: anticorrelações de longo prazo.`)
  } else if (alpha2 <= 1.0) {
    partes.push(
      `α2 = ${alpha2.toFixed(3)}: correlações de longo prazo no intervalo fisiológico esperado.`
    )
  } else {
    partes.push(
      `α2 = ${alpha2.toFixed(3)} > 1.0: não estacionariedade de longo prazo — ` +
        'pode indicar tendências sistemáticas na série (ex.: efeito postural ou circadiano não removido).'
    )
  }

  // Crossover
  if (Math.abs(alpha1 - alpha2) > 0.3) {
    partes.push(
      `Diferença α1−α2 = ${Math.abs(alpha1 - alpha2).toFixed(3)}: ` +
        'crossover relevante entre escalas curtas e longas, indicando múltiplos mecanismos de regulação.'
    )
  }

  return partes.join(' ')
}
