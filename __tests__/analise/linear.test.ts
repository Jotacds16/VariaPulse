/**
 * Testes de validação matemática — Análise Linear de Variabilidade Pressórica
 *
 * Valores esperados calculados manualmente a partir das fórmulas publicadas:
 *   - Média aritmética, DP amostral (N-1), CV = DP/média × 100
 *   - ARV = (1/N-1) × Σ|BP_{i+1} − BP_i|  (Mena et al. Hypertens Res. 2005)
 *   - Descenso noturno ESH 2023 (§7.3)
 */

import { describe, it, expect } from 'vitest'
import { calcularAnaliseLinear, calcularDescensoNoturno, gerarAlertasLinear } from '@/lib/analise/linear'
import type { Medicao, AnaliseLinear, Periodo } from '@/types'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function medicao(pas: number, pad: number, periodo: Periodo = 'diurno'): Medicao {
  return {
    timestamp: new Date('2024-01-01T08:00:00'),
    pas,
    pad,
    periodo,
    valida: true,
    flags: [],
  }
}

function analiseLinearFake(
  media_pas: number,
  media_pad: number,
  n = 10,
  dp_pas = 10,
  dp_pad = 7,
  periodo: Periodo = 'diurno'
): AnaliseLinear {
  return {
    periodo,
    n,
    media_pas,
    media_pad,
    dp_pas,
    dp_pad,
    cv_pas: (dp_pas / media_pas) * 100,
    cv_pad: (dp_pad / media_pad) * 100,
    vrm_pas: 10,
    vrm_pad: 7,
    min_pas: media_pas - 15,
    max_pas: media_pas + 15,
    min_pad: media_pad - 10,
    max_pad: media_pad + 10,
  }
}

// ---------------------------------------------------------------------------
// calcularAnaliseLinear — estatísticas básicas
// ---------------------------------------------------------------------------

describe('calcularAnaliseLinear — estatísticas básicas', () => {
  /*
   * Serie PAS: [120, 130, 140, 150]
   *   Média  = 540/4 = 135.0
   *   SS     = (–15)²+(–5)²+(5)²+(15)² = 225+25+25+225 = 500
   *   DP     = sqrt(500/3) ≈ 12.9099
   *   CV     = (sqrt(500/3) / 135) × 100 ≈ 9.5629 %
   *   ARV    = (10+10+10)/3 = 10.0
   *
   * Serie PAD: [80, 85, 90, 95]
   *   Média  = 350/4 = 87.5
   *   SS     = (–7.5)²+(–2.5)²+(2.5)²+(7.5)² = 56.25+6.25+6.25+56.25 = 125
   *   DP     = sqrt(125/3) ≈ 6.4550
   *   CV     = (sqrt(125/3) / 87.5) × 100 ≈ 7.3771 %
   *   ARV    = (5+5+5)/3 = 5.0
   */
  const medicoes: Medicao[] = [
    medicao(120, 80, 'total'),
    medicao(130, 85, 'total'),
    medicao(140, 90, 'total'),
    medicao(150, 95, 'total'),
  ].map((m) => ({ ...m, periodo: undefined })) as Medicao[]

  const resultado = calcularAnaliseLinear(medicoes, 'total')

  it('n = 4', () => expect(resultado.n).toBe(4))

  it('média PAS = 135.0', () => expect(resultado.media_pas).toBeCloseTo(135.0, 5))
  it('média PAD = 87.5', () => expect(resultado.media_pad).toBeCloseTo(87.5, 5))

  it('DP PAS ≈ 12.910 (N-1)', () => expect(resultado.dp_pas).toBeCloseTo(Math.sqrt(500 / 3), 5))
  it('DP PAD ≈ 6.455 (N-1)', () => expect(resultado.dp_pad).toBeCloseTo(Math.sqrt(125 / 3), 5))

  it('CV PAS ≈ 9.563 %', () => expect(resultado.cv_pas).toBeCloseTo((Math.sqrt(500 / 3) / 135) * 100, 4))
  it('CV PAD ≈ 7.377 %', () => expect(resultado.cv_pad).toBeCloseTo((Math.sqrt(125 / 3) / 87.5) * 100, 4))

  it('ARV PAS = 10.0', () => expect(resultado.vrm_pas).toBeCloseTo(10.0, 5))
  it('ARV PAD = 5.0', () => expect(resultado.vrm_pad).toBeCloseTo(5.0, 5))

  it('min PAS = 120', () => expect(resultado.min_pas).toBe(120))
  it('max PAS = 150', () => expect(resultado.max_pas).toBe(150))
  it('min PAD = 80', () => expect(resultado.min_pad).toBe(80))
  it('max PAD = 95', () => expect(resultado.max_pad).toBe(95))
})

describe('calcularAnaliseLinear — filtro de período', () => {
  const medicoes: Medicao[] = [
    medicao(120, 80, 'diurno'),
    medicao(130, 85, 'diurno'),
    medicao(100, 65, 'noturno'),
    medicao(110, 70, 'noturno'),
  ]

  it('filtra apenas medições diurnas', () => {
    const r = calcularAnaliseLinear(medicoes, 'diurno')
    expect(r.n).toBe(2)
    expect(r.media_pas).toBeCloseTo(125.0, 5)
  })

  it('filtra apenas medições noturnas', () => {
    const r = calcularAnaliseLinear(medicoes, 'noturno')
    expect(r.n).toBe(2)
    expect(r.media_pas).toBeCloseTo(105.0, 5)
  })

  it('período total inclui todas as medições válidas', () => {
    const r = calcularAnaliseLinear(medicoes, 'total')
    expect(r.n).toBe(4)
  })

  it('exclui medições inválidas', () => {
    const comInvalidas = [
      ...medicoes,
      { ...medicao(200, 120, 'diurno'), valida: false },
    ]
    const r = calcularAnaliseLinear(comInvalidas, 'total')
    expect(r.n).toBe(4)
  })

  it('lança erro se não há medições válidas no período', () => {
    expect(() => calcularAnaliseLinear(medicoes, 'manha_despertar')).toThrow()
  })
})

describe('calcularAnaliseLinear — série constante', () => {
  // Série constante: DP = 0, ARV = 0, CV = 0
  const medicoes = Array.from({ length: 5 }, () => medicao(120, 80, 'total'))

  it('DP PAS = 0 para série constante', () => {
    const r = calcularAnaliseLinear(medicoes, 'total')
    expect(r.dp_pas).toBeCloseTo(0, 10)
  })

  it('ARV PAS = 0 para série constante', () => {
    const r = calcularAnaliseLinear(medicoes, 'total')
    expect(r.vrm_pas).toBeCloseTo(0, 10)
  })

  it('CV PAS = 0 para série constante', () => {
    const r = calcularAnaliseLinear(medicoes, 'total')
    expect(r.cv_pas).toBeCloseTo(0, 10)
  })
})

// ---------------------------------------------------------------------------
// calcularDescensoNoturno — classificação ESH 2023
// ---------------------------------------------------------------------------

describe('calcularDescensoNoturno — classificação ESH 2023', () => {
  /*
   * Classificação pelo percentual de queda da PAS noturna vs diurna:
   *   riser         : queda < 0%   (noturno > diurno)
   *   non_dipper    : 0% ≤ queda < 10%
   *   dipper        : 10% ≤ queda < 20%
   *   extreme_dipper: queda ≥ 20%
   */

  it('riser — noturno > diurno (queda negativa)', () => {
    // PAS diurna=120, noturna=130 → queda = (120-130)/120 × 100 = -8.33%
    const diurno = analiseLinearFake(120, 80, 10)
    const noturno = analiseLinearFake(130, 85, 7)
    const r = calcularDescensoNoturno(diurno, noturno)
    expect(r.padrao).toBe('riser')
    expect(r.pas_percentual).toBeCloseTo(-8.333, 2)
  })

  it('non_dipper — queda entre 0% e 10%', () => {
    // PAS diurna=130, noturna=124 → queda = (130-124)/130 × 100 ≈ 4.615%
    const diurno = analiseLinearFake(130, 85, 10)
    const noturno = analiseLinearFake(124, 82, 7)
    const r = calcularDescensoNoturno(diurno, noturno)
    expect(r.padrao).toBe('non_dipper')
    expect(r.pas_percentual).toBeCloseTo(4.615, 2)
  })

  it('dipper — queda entre 10% e 20%', () => {
    // PAS diurna=130, noturna=115 → queda = 15/130 × 100 ≈ 11.538%
    const diurno = analiseLinearFake(130, 87, 10)
    const noturno = analiseLinearFake(115, 80, 7)
    const r = calcularDescensoNoturno(diurno, noturno)
    expect(r.padrao).toBe('dipper')
    expect(r.pas_percentual).toBeCloseTo(11.538, 2)
  })

  it('extreme_dipper — queda ≥ 20%', () => {
    // PAS diurna=130, noturna=100 → queda = 30/130 × 100 ≈ 23.077%
    const diurno = analiseLinearFake(130, 87, 10)
    const noturno = analiseLinearFake(100, 70, 7)
    const r = calcularDescensoNoturno(diurno, noturno)
    expect(r.padrao).toBe('extreme_dipper')
    expect(r.pas_percentual).toBeCloseTo(23.077, 2)
  })

  it('fronteira dipper/non_dipper exata (10%)', () => {
    // PAS diurna=100, noturna=90 → queda = 10%
    const diurno = analiseLinearFake(100, 70, 10)
    const noturno = analiseLinearFake(90, 65, 7)
    const r = calcularDescensoNoturno(diurno, noturno)
    expect(r.padrao).toBe('dipper')
    expect(r.pas_percentual).toBeCloseTo(10.0, 5)
  })

  it('fronteira extreme/dipper exata (20%)', () => {
    // PAS diurna=100, noturna=80 → queda = 20%
    const diurno = analiseLinearFake(100, 70, 10)
    const noturno = analiseLinearFake(80, 60, 7)
    const r = calcularDescensoNoturno(diurno, noturno)
    expect(r.padrao).toBe('extreme_dipper')
    expect(r.pas_percentual).toBeCloseTo(20.0, 5)
  })

  it('alerta: riser gera alerta de risco cardiovascular', () => {
    const diurno = analiseLinearFake(120, 80, 10)
    const noturno = analiseLinearFake(130, 85, 7)
    const r = calcularDescensoNoturno(diurno, noturno)
    expect(r.alertas.some((a) => a.includes('riser'))).toBe(true)
  })

  it('alerta: extreme_dipper gera alerta de hipoperfusão', () => {
    const diurno = analiseLinearFake(130, 87, 10)
    const noturno = analiseLinearFake(100, 70, 7)
    const r = calcularDescensoNoturno(diurno, noturno)
    expect(r.alertas.some((a) => a.includes('hipoperfusão'))).toBe(true)
  })

  it('alerta: N insuficiente (< 7 diurno ou < 5 noturno)', () => {
    const diurno = analiseLinearFake(130, 87, 5)  // n=5, abaixo do mínimo (7)
    const noturno = analiseLinearFake(115, 80, 3) // n=3, abaixo do mínimo (5)
    const r = calcularDescensoNoturno(diurno, noturno)
    expect(r.alertas.some((a) => a.includes('insuficiente'))).toBe(true)
  })

  it('dipper normal sem alertas quando N suficiente', () => {
    const diurno = analiseLinearFake(130, 87, 10)
    const noturno = analiseLinearFake(115, 80, 7)
    const r = calcularDescensoNoturno(diurno, noturno)
    expect(r.alertas).toHaveLength(0)
  })
})

// ---------------------------------------------------------------------------
// gerarAlertasLinear — limiares clínicos (Parati et al. 2023 + ESH 2023)
// ---------------------------------------------------------------------------

describe('gerarAlertasLinear — limiares clínicos', () => {
  it('sem alertas quando todos os índices são normais', () => {
    const analise = analiseLinearFake(130, 85, 10, 10, 7) // dp_pas=10 < 15, cv_pas ≈ 7.7% < 10%
    // vrm_pas = 10 < 12
    const alertas = gerarAlertasLinear(analise)
    expect(alertas).toHaveLength(0)
  })

  it('alerta DP sistólico elevado (> 15 mmHg)', () => {
    const analise = analiseLinearFake(130, 85, 10, 16, 7)
    const alertas = gerarAlertasLinear(analise)
    expect(alertas.some((a) => a.includes('DP sistólico elevado'))).toBe(true)
  })

  it('alerta DP diastólico elevado (> 12 mmHg)', () => {
    const analise = analiseLinearFake(130, 85, 10, 10, 13)
    const alertas = gerarAlertasLinear(analise)
    expect(alertas.some((a) => a.includes('DP diastólico elevado'))).toBe(true)
  })

  it('alerta CV sistólico elevado (> 10%)', () => {
    // CV = dp/media * 100. Para cv_pas > 10%: dp > 130 × 0.1 = 13
    const analise = analiseLinearFake(130, 85, 10, 14, 7) // cv_pas ≈ 10.77%
    const alertas = gerarAlertasLinear(analise)
    expect(alertas.some((a) => a.includes('CV sistólico elevado'))).toBe(true)
  })

  it('alerta ARV sistólica elevada (> 12 mmHg)', () => {
    const analise = { ...analiseLinearFake(130, 85, 10, 10, 7), vrm_pas: 13 }
    const alertas = gerarAlertasLinear(analise)
    expect(alertas.some((a) => a.includes('ARV sistólica elevada'))).toBe(true)
  })
})
