/**
 * Testes de validação matemática — Análise Não Linear de Variabilidade Pressórica
 *
 * Valores esperados calculados manualmente ou via propriedades matemáticas
 * conhecidas das fórmulas publicadas:
 *
 *   - Poincaré SD1/SD2: Brennan et al. IEEE Trans Biomed Eng. 2001
 *       SD1² = (1/2) × Var(Δ)
 *       SD2² = 2 × Var(BP) − (1/2) × Var(Δ)
 *   - ApEn: Pincus 1991 (m=2, r=0.2×DP)
 *   - SampEn: Richman & Moorman 2000 (m=2, r=0.2×DP)
 *   - DFA: Peng et al. Chaos. 1995 (α1 escala 4–16, α2 escala 16–64)
 *
 * Mínimos de N baseados em literatura (registrados em MINIMOS do módulo):
 *   poincare: 20 | apEn: 100 | sampEn: 200 | dfa: 128
 */

import { describe, it, expect } from 'vitest'
import { calcularAnaliseNaoLinear } from '@/lib/analise/nao-linear'
import type { Medicao, Periodo } from '@/types'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function medicoes(pas: number[], periodo: Periodo = 'total'): Medicao[] {
  return pas.map((p, i) => ({
    timestamp: new Date(2024, 0, 1, 8 + Math.floor(i / 4), (i % 4) * 15),
    pas: p,
    pad: Math.round(p * 0.6),
    periodo: periodo === 'total' ? undefined : periodo,
    valida: true,
    flags: [],
  })) as Medicao[]
}

/** Série aritmética crescente: [inicio, inicio+passo, inicio+2*passo, ...] */
function serieAritmetica(inicio: number, passo: number, n: number): number[] {
  return Array.from({ length: n }, (_, i) => inicio + i * passo)
}

/** Série constante */
function serieConstante(valor: number, n: number): number[] {
  return Array.from({ length: n }, () => valor)
}

// ---------------------------------------------------------------------------
// Limiares de N — alertas de insuficiência
// ---------------------------------------------------------------------------

describe('alertas de insuficiência de dados', () => {
  it('N=5: todos os métodos geram alerta (nenhum computa)', () => {
    const r = calcularAnaliseNaoLinear(medicoes(serieConstante(120, 5)), 'total')
    expect(r.poincare).toBeNull()
    expect(r.entropia_aproximada).toBeNull()
    expect(r.entropia_amostral).toBeNull()
    expect(r.dfa).toBeNull()
    expect(r.alertas).toHaveLength(4)
  })

  it('N=19: poincaré ainda insuficiente (mínimo 20)', () => {
    const r = calcularAnaliseNaoLinear(medicoes(serieAritmetica(100, 1, 19)), 'total')
    expect(r.poincare).toBeNull()
    expect(r.alertas.some((a) => a.metodo === 'poincare')).toBe(true)
  })

  it('N=20: poincaré computa, outros alertas', () => {
    const r = calcularAnaliseNaoLinear(medicoes(serieAritmetica(100, 1, 20)), 'total')
    expect(r.poincare).not.toBeNull()
    expect(r.alertas.some((a) => a.metodo === 'entropia_aproximada')).toBe(true)
    expect(r.alertas.some((a) => a.metodo === 'entropia_amostral')).toBe(true)
    expect(r.alertas.some((a) => a.metodo === 'dfa')).toBe(true)
  })

  it('N=100: poincaré + apEn computam; sampEn e dfa ainda alertas', () => {
    const r = calcularAnaliseNaoLinear(medicoes(serieAritmetica(100, 0.5, 100)), 'total')
    expect(r.poincare).not.toBeNull()
    expect(r.entropia_aproximada).not.toBeNull()
    expect(r.entropia_amostral).toBeNull()
    expect(r.dfa).toBeNull()
    expect(r.alertas.some((a) => a.metodo === 'entropia_amostral')).toBe(true)
    expect(r.alertas.some((a) => a.metodo === 'dfa')).toBe(true)
  })

  it('N=128: poincaré + apEn + dfa computam; sampEn ainda alerta', () => {
    const r = calcularAnaliseNaoLinear(medicoes(serieAritmetica(100, 0.5, 128)), 'total')
    expect(r.poincare).not.toBeNull()
    expect(r.entropia_aproximada).not.toBeNull()
    expect(r.dfa).not.toBeNull()
    expect(r.entropia_amostral).toBeNull()
  })

  it('N=200: todos os métodos computam, nenhum alerta', () => {
    const r = calcularAnaliseNaoLinear(medicoes(serieAritmetica(100, 0.5, 200)), 'total')
    expect(r.poincare).not.toBeNull()
    expect(r.entropia_aproximada).not.toBeNull()
    expect(r.entropia_amostral).not.toBeNull()
    expect(r.dfa).not.toBeNull()
    expect(r.alertas).toHaveLength(0)
  })

  it('alerta registra N disponível correto', () => {
    const n = 15
    const r = calcularAnaliseNaoLinear(medicoes(serieAritmetica(100, 1, n)), 'total')
    const alerta = r.alertas.find((a) => a.metodo === 'poincare')
    expect(alerta?.disponivel).toBe(n)
    expect(alerta?.minimo_recomendado).toBe(20)
  })
})

// ---------------------------------------------------------------------------
// Poincaré — propriedades matemáticas (Brennan et al. 2001)
// ---------------------------------------------------------------------------

describe('Poincaré SD1/SD2', () => {
  /*
   * Série aritmética com passo constante p:
   *   Todas as diferenças Δ_i = p (constante)
   *   → Var(Δ) = 0
   *   → SD1² = (1/2) × 0 = 0    → SD1 = 0
   *   → SD2² = 2 × Var(BP)      → SD2 = sqrt(2 × Var(BP)) > 0
   *
   * Propriedade: série com puro trend linear não tem variabilidade
   * beat-to-beat (SD1=0), apenas variabilidade de longo prazo (SD2>0).
   */

  it('série aritmética: SD1 = 0 (sem variabilidade beat-to-beat)', () => {
    const r = calcularAnaliseNaoLinear(medicoes(serieAritmetica(100, 2, 20)), 'total')
    expect(r.poincare!.sd1).toBeCloseTo(0, 8)
  })

  it('série aritmética: SD2 > 0 (variabilidade de longo prazo presente)', () => {
    const r = calcularAnaliseNaoLinear(medicoes(serieAritmetica(100, 2, 20)), 'total')
    expect(r.poincare!.sd2).toBeGreaterThan(0)
  })

  it('série aritmética (N=20, passo=2): SD2 = sqrt(2 × Var_BP)', () => {
    /*
     * Serie: [100, 102, 104, ..., 138]  (20 valores, passo=2)
     * Média = 119
     * Desvios: -19,-17,-15,...,-1,1,...,17,19
     * SS = 2 × (1²+3²+5²+...+19²) = 2 × Σ_{k=1}^{10}(2k-1)²
     *    = 2 × 1330 = 2660
     * Var(BP) = 2660 / 19 = 140.0
     * SD2 = sqrt(2 × 140) = sqrt(280) ≈ 16.7332
     */
    const r = calcularAnaliseNaoLinear(medicoes(serieAritmetica(100, 2, 20)), 'total')
    expect(r.poincare!.sd2).toBeCloseTo(Math.sqrt(280), 3)
  })

  it('série constante: SD1 = SD2 = 0', () => {
    const r = calcularAnaliseNaoLinear(medicoes(serieConstante(120, 20)), 'total')
    expect(r.poincare!.sd1).toBeCloseTo(0, 8)
    expect(r.poincare!.sd2).toBeCloseTo(0, 8)
  })

  it('série constante: razao_sd1_sd2 = 0 (guarda divisão por zero)', () => {
    const r = calcularAnaliseNaoLinear(medicoes(serieConstante(120, 20)), 'total')
    expect(r.poincare!.razao_sd1_sd2).toBe(0)
  })

  it('razao SD1/SD2 coerente com os valores calculados', () => {
    const r = calcularAnaliseNaoLinear(medicoes(serieAritmetica(110, 1, 50)), 'total')
    const { sd1, sd2, razao_sd1_sd2 } = r.poincare!
    if (sd2 > 0) {
      expect(razao_sd1_sd2).toBeCloseTo(sd1 / sd2, 5)
    }
  })
})

// ---------------------------------------------------------------------------
// Entropia Aproximada (ApEn)
// ---------------------------------------------------------------------------

describe('Entropia Aproximada (ApEn)', () => {
  it('ApEn é não-negativa', () => {
    const pas = Array.from({ length: 100 }, (_, i) => 120 + Math.sin(i * 0.5) * 10)
    const r = calcularAnaliseNaoLinear(medicoes(pas), 'total')
    expect(r.entropia_aproximada).toBeGreaterThanOrEqual(0)
  })

  it('série menos regular tem ApEn maior do que série mais regular (N=100)', () => {
    /*
     * Série senoidal (alta regularidade) vs série com ruído (baixa regularidade).
     * Propriedade central da ApEn: maior regularidade → menor entropia.
     */
    const senoidal = Array.from({ length: 100 }, (_, i) => 120 + Math.sin(i * 0.3) * 5)
    const ruido = Array.from({ length: 100 }, (_, i) => {
      const base = senoidal[i]!
      // Adiciona perturbações alternadas maiores
      return base + (i % 3 === 0 ? 8 : i % 3 === 1 ? -6 : 3)
    })

    const r_sen = calcularAnaliseNaoLinear(medicoes(senoidal), 'total')
    const r_rui = calcularAnaliseNaoLinear(medicoes(ruido), 'total')
    expect(r_rui.entropia_aproximada!).toBeGreaterThan(r_sen.entropia_aproximada!)
  })
})

// ---------------------------------------------------------------------------
// Entropia Amostral (SampEn)
// ---------------------------------------------------------------------------

describe('Entropia Amostral (SampEn)', () => {
  it('SampEn é não-negativa', () => {
    const pas = Array.from({ length: 200 }, (_, i) => 120 + Math.cos(i * 0.4) * 8)
    const r = calcularAnaliseNaoLinear(medicoes(pas), 'total')
    expect(r.entropia_amostral).toBeGreaterThanOrEqual(0)
  })

  it('série menos regular tem SampEn maior', () => {
    const senoidal = Array.from({ length: 200 }, (_, i) => 120 + Math.sin(i * 0.3) * 5)
    const ruido = Array.from({ length: 200 }, (_, i) => {
      const base = senoidal[i]!
      return base + (i % 4 === 0 ? 10 : i % 4 === 2 ? -8 : 2)
    })

    const r_sen = calcularAnaliseNaoLinear(medicoes(senoidal), 'total')
    const r_rui = calcularAnaliseNaoLinear(medicoes(ruido), 'total')
    expect(r_rui.entropia_amostral!).toBeGreaterThan(r_sen.entropia_amostral!)
  })
})

// ---------------------------------------------------------------------------
// DFA — Detrended Fluctuation Analysis
// ---------------------------------------------------------------------------

describe('DFA', () => {
  /*
   * Propriedades esperadas (Peng et al. 1995):
   *   α ≈ 0.5 → ruído branco (sem correlação)
   *   α ≈ 1.0 → ruído 1/f (correlação de longo alcance)
   *   α ≈ 1.5 → movimento browniano (random walk)
   *
   * Para séries fisiológicas de PA, valores típicos: α1 ∈ [0.5, 1.5]
   */

  it('α1 e α2 são números finitos (não NaN, não ±Inf)', () => {
    const pas = Array.from({ length: 128 }, (_, i) => 120 + Math.sin(i * 0.2) * 10)
    const r = calcularAnaliseNaoLinear(medicoes(pas), 'total')
    expect(Number.isFinite(r.dfa!.alpha1)).toBe(true)
    expect(Number.isFinite(r.dfa!.alpha2)).toBe(true)
  })

  it('α1 e α2 estão em intervalo fisiologicamente plausível [0, 3]', () => {
    const pas = Array.from({ length: 200 }, (_, i) => 120 + Math.sin(i * 0.2) * 10)
    const r = calcularAnaliseNaoLinear(medicoes(pas), 'total')
    expect(r.dfa!.alpha1).toBeGreaterThanOrEqual(0)
    expect(r.dfa!.alpha1).toBeLessThanOrEqual(3)
    expect(r.dfa!.alpha2).toBeGreaterThanOrEqual(0)
    expect(r.dfa!.alpha2).toBeLessThanOrEqual(3)
  })

  it('random walk (integração de ruído branco) tem α1 próximo de 1.5', () => {
    /*
     * Um random walk puro tem α = 1.5 teoricamente.
     * Usando semente determinística para reprodutibilidade.
     */
    let v = 120
    const randomWalk = Array.from({ length: 200 }, (_, i) => {
      // Pseudo-random determinístico (LCG simples)
      v += ((i * 1664525 + 1013904223) % 100 - 50) / 50 * 5
      return Math.max(80, Math.min(200, v))
    })

    const r = calcularAnaliseNaoLinear(medicoes(randomWalk), 'total')
    // α próximo de 1.5 com tolerância ampla — comportamento estatístico, não exato
    expect(r.dfa!.alpha1).toBeGreaterThan(0.5)
    expect(r.dfa!.alpha1).toBeLessThan(2.5)
  })
})

// ---------------------------------------------------------------------------
// Filtro de período
// ---------------------------------------------------------------------------

describe('calcularAnaliseNaoLinear — filtro de período', () => {
  it('filtra medições pelo período informado', () => {
    const diurnas = medicoes(serieAritmetica(130, 1, 30), 'diurno')
    const noturnas = medicoes(serieAritmetica(110, 1, 20), 'noturno')
    const todas = [...diurnas, ...noturnas]

    const r_diurno = calcularAnaliseNaoLinear(todas, 'diurno')
    const r_noturno = calcularAnaliseNaoLinear(todas, 'noturno')

    expect(r_diurno.n).toBe(30)
    expect(r_noturno.n).toBe(20)
  })
})
