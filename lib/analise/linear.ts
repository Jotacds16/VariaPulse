/**
 * Análise linear de variabilidade pressórica.
 *
 * Índices e limiares baseados em:
 * - ESH Guidelines 2023 (J Hypertens. 2023;41(12):1874-2071)
 * - Parati G. et al. "Blood pressure variability: methodological aspects,
 *   clinical relevance and practical indications." J Hypertens. 2023
 * - Rothwell PM. "Limitations of the usual blood-pressure hypothesis and
 *   importance of variability, instability, and episodic hypertension."
 *   Lancet. 2010;375(9718):938-948  [VIM]
 * - Mena L. et al. "An approach for the assessment of blood pressure
 *   variability using ARV." Hypertens Res. 2005  [ARV]
 */

import type { Medicao, AnaliseLinear, DescensoNoturno, Periodo } from '@/types'

// Limites fisiológicos usados como referência de alerta clínico (ESH 2023)
const LIMITES_ALERTA = {
  dp_pas_alto: 15,     // mmHg — DP > 15 indica VBP elevada (MAPA 24h)
  dp_pad_alto: 12,     // mmHg
  cv_elevado: 10,      // % — CV > 10% clinicamente relevante
  arv_elevada_pas: 12, // mmHg — ARV sistólica elevada
  arv_elevada_pad: 9,  // mmHg — ARV diastólica elevada
} as const

export function calcularAnaliseLinear(
  medicoes: Medicao[],
  periodo: Periodo
): AnaliseLinear {
  const validas =
    periodo === 'total'
      ? medicoes.filter((m) => m.valida)
      : medicoes.filter((m) => m.valida && m.periodo === periodo)
  const n = validas.length

  if (n === 0) {
    throw new Error(`Nenhuma medição válida para o período: ${periodo}`)
  }

  const pas = validas.map((m) => m.pas)
  const pad = validas.map((m) => m.pad)

  const media_pas = media(pas)
  const media_pad = media(pad)
  const dp_pas = desvioPadrao(pas)
  const dp_pad = desvioPadrao(pad)
  const arv_pas = arv(pas)
  const arv_pad = arv(pad)

  return {
    periodo,
    n,
    media_pas,
    media_pad,
    dp_pas,
    dp_pad,
    cv_pas: cv(dp_pas, media_pas),
    cv_pad: cv(dp_pad, media_pad),
    vrm_pas: arv_pas,
    vrm_pad: arv_pad,
    min_pas: Math.min(...pas),
    max_pas: Math.max(...pas),
    min_pad: Math.min(...pad),
    max_pad: Math.max(...pad),
  }
}

/**
 * Descenso noturno — classificação conforme ESH 2023 (Tabela recomendada):
 *   Dipper normal   : queda ≥ 10% e < 20% (PAS)
 *   Non-dipper      : queda ≥ 0% e < 10%
 *   Riser           : queda < 0% (pressão noturna > diurna)
 *   Extreme dipper  : queda ≥ 20%
 *
 * Classificação baseada em PAS (primária) e PAD (secundária).
 * Referência: ESH 2023 § 7.3 — Nocturnal blood pressure and dipping.
 */
export function calcularDescensoNoturno(
  diurno: AnaliseLinear,
  noturno: AnaliseLinear
): DescensoNoturno {
  const pas_percentual = percentualDescenso(diurno.media_pas, noturno.media_pas)
  const pad_percentual = percentualDescenso(diurno.media_pad, noturno.media_pad)

  const padrao = classificarDescenso(pas_percentual)
  const alertas: string[] = []

  if (padrao === 'riser') {
    alertas.push(
      'Padrão riser: pressão noturna superior à diurna. ' +
        'Associado a risco cardiovascular aumentado (ESH 2023).'
    )
  }
  if (padrao === 'extreme_dipper') {
    alertas.push(
      'Descenso excessivo (≥ 20%): risco de hipoperfusão noturna, ' +
        'especialmente em idosos e pacientes com doença cerebrovascular.'
    )
  }
  if (padrao === 'non_dipper') {
    alertas.push(
      'Padrão non-dipper: associado a lesão de órgão-alvo e risco ' +
        'cardiovascular elevado independente dos valores diurnos.'
    )
  }
  if (diurno.n < 7 || noturno.n < 5) {
    // ESH 2023 recomenda pelo menos 7 medições diurnas e 5 noturnas (MAPA)
    alertas.push(
      `Número de medições insuficiente para classificação confiável ` +
        `(diurno: ${diurno.n}/7 recomendado; noturno: ${noturno.n}/5 recomendado).`
    )
  }
  if (pad_percentual < 0 && padrao !== 'riser') {
    alertas.push(
      'PAD noturna superior à diurna apesar de descenso sistólico presente. ' +
        'Avaliar individualmente.'
    )
  }

  return { pas_percentual, pad_percentual, padrao, alertas }
}

/**
 * Gera alertas clínicos sobre VBP elevada a partir de uma análise linear.
 * Limiares de referência: Parati et al. J Hypertens. 2023 + ESH 2023.
 */
export function gerarAlertasLinear(analise: AnaliseLinear): string[] {
  const alertas: string[] = []

  if (analise.dp_pas > LIMITES_ALERTA.dp_pas_alto) {
    alertas.push(
      `DP sistólico elevado (${analise.dp_pas.toFixed(1)} mmHg > ${LIMITES_ALERTA.dp_pas_alto} mmHg): ` +
        'variabilidade pressórica aumentada com relevância clínica.'
    )
  }
  if (analise.dp_pad > LIMITES_ALERTA.dp_pad_alto) {
    alertas.push(
      `DP diastólico elevado (${analise.dp_pad.toFixed(1)} mmHg > ${LIMITES_ALERTA.dp_pad_alto} mmHg).`
    )
  }
  if (analise.cv_pas > LIMITES_ALERTA.cv_elevado) {
    alertas.push(
      `CV sistólico elevado (${analise.cv_pas.toFixed(1)}% > ${LIMITES_ALERTA.cv_elevado}%): ` +
        'instabilidade pressórica desproporcional ao nível médio.'
    )
  }
  if (analise.vrm_pas > LIMITES_ALERTA.arv_elevada_pas) {
    alertas.push(
      `ARV sistólica elevada (${analise.vrm_pas.toFixed(1)} mmHg > ${LIMITES_ALERTA.arv_elevada_pas} mmHg): ` +
        'variabilidade sequencial aumentada.'
    )
  }

  return alertas
}

// ---------------------------------------------------------------------------
// Funções matemáticas — todas usam variância amostral (N-1)
// ---------------------------------------------------------------------------

/** Média aritmética */
function media(valores: number[]): number {
  return valores.reduce((acc, v) => acc + v, 0) / valores.length
}

/** Desvio-padrão amostral (N-1) */
function desvioPadrao(valores: number[]): number {
  if (valores.length < 2) return 0
  const m = media(valores)
  const soma = valores.reduce((acc, v) => acc + (v - m) ** 2, 0)
  return Math.sqrt(soma / (valores.length - 1))
}

/** Coeficiente de Variação (%) — CV = DP/média × 100 */
function cv(dp: number, m: number): number {
  if (m === 0) return 0
  return (dp / m) * 100
}

/**
 * ARV — Average Real Variability
 * ARV = (1 / N-1) × Σ |BP_{i+1} − BP_i|
 *
 * Índice recomendado pela ESH 2023 para MAPA de 24h.
 * Captura variabilidade sequencial sem sensibilidade ao nível médio.
 * Mais robusto que DP para detecção de variações clínicas transitórias.
 */
function arv(valores: number[]): number {
  if (valores.length < 2) return 0
  let soma = 0
  for (let i = 1; i < valores.length; i++) {
    soma += Math.abs(valores[i]! - valores[i - 1]!)
  }
  return soma / (valores.length - 1)
}

/** Queda percentual noturna em relação ao valor diurno */
function percentualDescenso(diurno: number, noturno: number): number {
  if (diurno === 0) return 0
  return ((diurno - noturno) / diurno) * 100
}

/** Classificação ESH 2023 */
function classificarDescenso(queda_pas_pct: number): DescensoNoturno['padrao'] {
  if (queda_pas_pct < 0) return 'riser'
  if (queda_pas_pct < 10) return 'non_dipper'
  if (queda_pas_pct < 20) return 'dipper'
  return 'extreme_dipper'
}
