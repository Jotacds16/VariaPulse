/**
 * Análise não linear de variabilidade pressórica.
 *
 * Referências:
 * - Poincaré: Tulppo MP. et al. "Quantitative beat-to-beat analysis of heart
 *   rate dynamics during exercise." Am J Physiol. 1996;271(1):H244-52
 *   Fórmulas SD1/SD2 conforme Brennan M. et al. IEEE Trans Biomed Eng. 2001
 *
 * - ApEn: Pincus SM. "Approximate entropy as a measure of system complexity."
 *   Proc Natl Acad Sci. 1991;88(6):2297-2301
 *   Parâmetros: m=2, r=0.20×DP  (recomendação original Pincus)
 *
 * - SampEn: Richman JS, Moorman JR. "Physiological time-series analysis using
 *   approximate entropy and sample entropy."
 *   Am J Physiol Heart Circ Physiol. 2000;278(6):H2039-49
 *   Parâmetros: m=2, r=0.20×DP  (Richman & Moorman 2000)
 *   Mínimo N recomendado: ≥ 200 (Lake DE et al. Am J Physiol. 2002)
 *
 * - DFA: Peng C-K. et al. "Quantification of scaling exponents and crossover
 *   phenomena in nonstationary heartbeat time series." Chaos. 1995;5(1):82-7
 *   α1 (escala 4–16), α2 (escala 16–64)
 *   Mínimo N recomendado: ≥ 128 (Eke A. et al. Pflugers Arch. 2002)
 */

import type {
  Medicao,
  AnaliseNaoLinear,
  Poincare,
  DFA,
  AlertaInsuficiencia,
  Periodo,
} from '@/types'

// Mínimos baseados em literatura peer-reviewed
const MINIMOS: Record<AlertaInsuficiencia['metodo'], number> = {
  poincare: 20,              // Tulppo et al. 1996 — mínimo prático
  entropia_aproximada: 100,  // Pincus 1991 — mínimo declarado pelo autor
  entropia_amostral: 200,    // Lake et al. Am J Physiol. 2002
  dfa: 128,                  // Eke et al. Pflugers Arch. 2002
}

export function calcularAnaliseNaoLinear(
  medicoes: Medicao[],
  periodo: Periodo
): AnaliseNaoLinear {
  const validas =
    periodo === 'total'
      ? medicoes.filter((m) => m.valida)
      : medicoes.filter((m) => m.valida && m.periodo === periodo)
  const n = validas.length
  const alertas: AlertaInsuficiencia[] = []
  const pas = validas.map((m) => m.pas)

  const poincare =
    n >= MINIMOS.poincare
      ? calcularPoincare(pas)
      : registrarInsuficiencia(alertas, 'poincare', n)

  const entropia_aproximada =
    n >= MINIMOS.entropia_aproximada
      ? calcularEntropiaAproximada(pas)
      : registrarInsuficiencia(alertas, 'entropia_aproximada', n)

  const entropia_amostral =
    n >= MINIMOS.entropia_amostral
      ? calcularEntropiaAmostral(pas)
      : registrarInsuficiencia(alertas, 'entropia_amostral', n)

  const dfa =
    n >= MINIMOS.dfa
      ? calcularDFA(pas)
      : registrarInsuficiencia(alertas, 'dfa', n)

  return {
    periodo,
    n,
    poincare: poincare ?? null,
    entropia_aproximada: entropia_aproximada ?? null,
    entropia_amostral: entropia_amostral ?? null,
    dfa: dfa ?? null,
    alertas,
  }
}

// ---------------------------------------------------------------------------
// Poincaré — SD1 e SD2
// ---------------------------------------------------------------------------
/**
 * Fórmulas derivadas de Brennan et al. 2001 (IEEE Trans Biomed Eng):
 *   SD1² = (1/2) × Var(Δ)          onde Δ_i = BP_{i+1} − BP_i
 *   SD2² = 2 × Var(BP) − (1/2) × Var(Δ)
 *
 * SD1 = variabilidade de curto prazo (beat-to-beat)
 * SD2 = variabilidade de longo prazo (tendência)
 */
function calcularPoincare(serie: number[]): Poincare {
  const n = serie.length
  const diferencas = Array.from({ length: n - 1 }, (_, i) => serie[i + 1]! - serie[i]!)

  const var_global = variancia(serie)
  const var_dif = variancia(diferencas)

  const sd1 = Math.sqrt(0.5 * var_dif)
  const sd2 = Math.sqrt(Math.max(0, 2 * var_global - 0.5 * var_dif))

  return {
    sd1,
    sd2,
    razao_sd1_sd2: sd2 > 0 ? sd1 / sd2 : 0,
  }
}

// ---------------------------------------------------------------------------
// Entropia Aproximada (ApEn)
// ---------------------------------------------------------------------------
/**
 * ApEn(m, r, N) — Pincus 1991
 * Parâmetros: m = 2, r = 0.20 × DP(série)
 *
 * Nota: inclui auto-comparação (j = 0..N-m), conforme definição original.
 * Para excluir auto-comparação use SampEn.
 */
function calcularEntropiaAproximada(
  serie: number[],
  m = 2,
  r_fator = 0.2
): number {
  const n = serie.length
  const r = r_fator * desvioPadrao(serie)

  function phi(dim: number): number {
    let soma = 0
    for (let i = 0; i <= n - dim - 1; i++) {
      let count = 0
      for (let j = 0; j <= n - dim - 1; j++) {
        if (distanciaMax(serie, i, j, dim) <= r) count++
      }
      if (count > 0) soma += Math.log(count / (n - dim))
    }
    return soma / (n - dim)
  }

  return phi(m) - phi(m + 1)
}

// ---------------------------------------------------------------------------
// Entropia Amostral (SampEn)
// ---------------------------------------------------------------------------
/**
 * SampEn(m, r, N) = −ln(A / B) — Richman & Moorman 2000
 * Parâmetros: m = 2, r = 0.20 × DP(série)
 *
 * B = pares de templates de comprimento m que correspondem (sem auto-match)
 * A = pares de templates de comprimento m+1 que correspondem
 */
function calcularEntropiaAmostral(
  serie: number[],
  m = 2,
  r_fator = 0.2
): number {
  const n = serie.length
  const r = r_fator * desvioPadrao(serie)

  let A = 0
  let B = 0

  for (let i = 0; i < n - m - 1; i++) {
    for (let j = i + 1; j < n - m; j++) {
      if (distanciaMax(serie, i, j, m) <= r) {
        B++
        if (Math.abs(serie[i + m]! - serie[j + m]!) <= r) {
          A++
        }
      }
    }
  }

  if (B === 0) return 0
  return -Math.log(A / B)
}

// ---------------------------------------------------------------------------
// DFA — Detrended Fluctuation Analysis
// ---------------------------------------------------------------------------
/**
 * Algoritmo Peng et al. 1995 (Chaos):
 * 1. Série integrada: y(k) = Σ_{i=1}^{k} [BP_i − BP̄]
 * 2. Para cada escala s: dividir y em segmentos não sobrepostos de tamanho s
 * 3. Em cada segmento: ajustar tendência linear, calcular resíduo RMS
 * 4. F(s) = sqrt(média dos resíduos²)
 * 5. α = inclinação de log(F(s)) vs log(s) por regressão linear
 *
 * α1 (4–16): correlações de curto prazo
 * α2 (16–64): correlações de longo prazo
 */
function calcularDFA(serie: number[]): DFA {
  const n = serie.length
  const mediaBP = serie.reduce((a, b) => a + b, 0) / n

  // Série integrada — O(n)
  const integrada = new Array<number>(n)
  let cumSum = 0
  for (let i = 0; i < n; i++) {
    cumSum += serie[i]! - mediaBP
    integrada[i] = cumSum
  }

  const alpha1 = expoenteDFA(integrada, 4, 16)
  const alpha2 = expoenteDFA(integrada, 16, Math.min(64, Math.floor(n / 4)))

  return { alpha1, alpha2 }
}

function expoenteDFA(
  integrada: number[],
  escala_min: number,
  escala_max: number
): number {
  const logEscalas: number[] = []
  const logFlut: number[] = []
  const n = integrada.length

  for (let s = escala_min; s <= escala_max; s++) {
    const numSegmentos = Math.floor(n / s)
    if (numSegmentos < 2) break

    let somaF2 = 0
    for (let k = 0; k < numSegmentos; k++) {
      const segmento = integrada.slice(k * s, (k + 1) * s)
      somaF2 += varianciaResidualLinear(segmento)
    }

    logEscalas.push(Math.log(s))
    logFlut.push(Math.log(Math.sqrt(somaF2 / numSegmentos)))
  }

  if (logEscalas.length < 2) return 0
  return regressaoLinear(logEscalas, logFlut)
}

/**
 * Variância dos resíduos após remoção de tendência linear no segmento.
 * Implementa o "detrending" local do DFA.
 */
function varianciaResidualLinear(segmento: number[]): number {
  const n = segmento.length
  if (n < 2) return 0

  const x = Array.from({ length: n }, (_, i) => i)
  const slope = regressaoLinear(x, segmento)
  const intercept =
    (segmento.reduce((a, b) => a + b, 0) - slope * x.reduce((a, b) => a + b, 0)) / n

  return (
    segmento.reduce((acc, y, i) => acc + (y - (slope * i + intercept)) ** 2, 0) / n
  )
}

// ---------------------------------------------------------------------------
// Funções auxiliares
// ---------------------------------------------------------------------------

/** Distância de Chebyshev (máximo das diferenças absolutas) entre dois templates */
function distanciaMax(serie: number[], i: number, j: number, m: number): number {
  let max = 0
  for (let k = 0; k < m; k++) {
    max = Math.max(max, Math.abs(serie[i + k]! - serie[j + k]!))
  }
  return max
}

/** Variância amostral (N-1) */
function variancia(valores: number[]): number {
  if (valores.length < 2) return 0
  const m = valores.reduce((a, b) => a + b, 0) / valores.length
  return valores.reduce((acc, v) => acc + (v - m) ** 2, 0) / (valores.length - 1)
}

/** Desvio-padrão amostral (N-1) */
function desvioPadrao(valores: number[]): number {
  return Math.sqrt(variancia(valores))
}

/** Regressão linear OLS — retorna o coeficiente angular */
function regressaoLinear(x: number[], y: number[]): number {
  const n = x.length
  const sx = x.reduce((a, b) => a + b, 0)
  const sy = y.reduce((a, b) => a + b, 0)
  const sxy = x.reduce((acc, xi, i) => acc + xi * y[i]!, 0)
  const sx2 = x.reduce((acc, xi) => acc + xi * xi, 0)
  const denom = n * sx2 - sx * sx
  if (denom === 0) return 0
  return (n * sxy - sx * sy) / denom
}

/** Registra alerta de insuficiência e retorna null para o método */
function registrarInsuficiencia(
  lista: AlertaInsuficiencia[],
  metodo: AlertaInsuficiencia['metodo'],
  disponivel: number
): null {
  lista.push({
    metodo,
    minimo_recomendado: MINIMOS[metodo]!,
    disponivel,
    motivo:
      `${nomeLegivel(metodo)} requer mínimo de ${MINIMOS[metodo]} medições válidas ` +
      `no período. Disponíveis: ${disponivel}. Resultado omitido.`,
  })
  return null
}

function nomeLegivel(metodo: AlertaInsuficiencia['metodo']): string {
  const nomes: Record<AlertaInsuficiencia['metodo'], string> = {
    poincare: 'Gráfico de Poincaré',
    entropia_aproximada: 'Entropia Aproximada (ApEn)',
    entropia_amostral: 'Entropia Amostral (SampEn)',
    dfa: 'DFA',
  }
  return nomes[metodo]
}
