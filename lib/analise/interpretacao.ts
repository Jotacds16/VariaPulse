/**
 * Interpretação das métricas de análise linear.
 * Cada função recebe os valores calculados e devolve uma ExplicacaoMetrica
 * com método, significado clínico do resultado e fontes.
 */

import type { AnaliseLinear, DescensoNoturno, ExplicacaoMetrica, Fonte } from '@/types'

// ---------------------------------------------------------------------------
// Fontes bibliográficas reutilizadas
// ---------------------------------------------------------------------------

const FONTES: Record<string, Fonte> = {
  esh2023: {
    autores: 'Mancia G, Kreutz R, Brunström M, et al.',
    titulo: '2023 ESH Guidelines for the management of arterial hypertension',
    publicacao: 'Journal of Hypertension',
    ano: 2023,
    url: 'https://journals.lww.com/jhypertension/fulltext/2023/12000/2023_esh_guidelines_for_the_management_of_arterial.2.aspx',
  },
  parati2023: {
    autores: 'Parati G, Bilo G, Kollias A, et al.',
    titulo:
      'Blood pressure variability: methodological aspects, clinical relevance and practical indications for management',
    publicacao: 'Journal of Hypertension',
    ano: 2023,
    url: 'https://journals.lww.com/jhypertension/fulltext/2023/04000/blood_pressure_variability__methodological.1.aspx',
  },
  rothwell2010: {
    autores: 'Rothwell PM, Howard SC, Dolan E, et al.',
    titulo:
      'Prognostic significance of visit-to-visit variability, maximum systolic blood pressure, and episodic hypertension',
    publicacao: 'Lancet',
    ano: 2010,
    url: 'https://pubmed.ncbi.nlm.nih.gov/20226988/',
  },
  mena2005: {
    autores: 'Mena L, Pintos S, Queipo NV, et al.',
    titulo:
      'A reliable index for the prognostic significance of blood pressure variability',
    publicacao: 'Journal of Hypertension',
    ano: 2005,
    url: 'https://pubmed.ncbi.nlm.nih.gov/16148603/',
  },
  hypertens2024: {
    autores: 'Salles GF, Reboldi G, Parati G, et al.',
    titulo:
      'Prognostic relevance of short-term blood pressure variability. The Spanish ABPM Registry',
    publicacao: 'Hypertension',
    ano: 2024,
    url: 'https://www.ahajournals.org/doi/10.1161/HYPERTENSIONAHA.124.22716',
  },
}

// ---------------------------------------------------------------------------
// Interpretações das métricas lineares
// ---------------------------------------------------------------------------

export function explicarDP(
  dp: number,
  componente: 'PAS' | 'PAD',
  n: number
): ExplicacaoMetrica {
  const limiar = componente === 'PAS' ? 15 : 12
  const elevado = dp > limiar
  const confianca = n >= 20 ? 'alta' : n >= 10 ? 'moderada' : 'baixa'

  return {
    metrica: `Desvio-padrão (DP) ${componente}`,
    valor_formatado: `${dp.toFixed(1)} mmHg`,
    metodo:
      'O desvio-padrão (DP) é calculado como a raiz quadrada da variância amostral ' +
      'de todas as medições válidas no período. ' +
      `Fórmula: DP = √[ Σ(BP_i − BP̄)² / (N−1) ], onde BP̄ é a média das ${n} medições.`,
    interpretacao: elevado
      ? `O DP de ${dp.toFixed(1)} mmHg supera o limiar de referência de ${limiar} mmHg ` +
        `para ${componente} em MAPA de 24h. Variabilidade pressórica aumentada com ` +
        'relevância prognóstica — associada a maior risco de lesão de órgão-alvo ' +
        'independente dos valores médios.'
      : `O DP de ${dp.toFixed(1)} mmHg está dentro do intervalo de referência (< ${limiar} mmHg) ` +
        `para ${componente} em MAPA de 24h, indicando variabilidade pressórica não elevada.`,
    confianca,
    aviso_confianca:
      confianca !== 'alta'
        ? `N = ${n} medições. Estimativa de DP menos estável com amostras pequenas.`
        : undefined,
    fontes: [FONTES.parati2023!, FONTES.esh2023!],
  }
}

export function explicarCV(
  cv: number,
  componente: 'PAS' | 'PAD',
  media: number,
  dp: number,
  n: number
): ExplicacaoMetrica {
  const elevado = cv > 10
  const confianca = n >= 20 ? 'alta' : n >= 10 ? 'moderada' : 'baixa'

  return {
    metrica: `Coeficiente de Variação (CV) ${componente}`,
    valor_formatado: `${cv.toFixed(1)}%`,
    metodo:
      'O CV normaliza o desvio-padrão pela média, permitindo comparar variabilidade ' +
      'entre indivíduos com diferentes níveis pressóricos. ' +
      `Fórmula: CV = (DP / Média) × 100 = (${dp.toFixed(1)} / ${media.toFixed(1)}) × 100.`,
    interpretacao: elevado
      ? `CV de ${cv.toFixed(1)}% indica variabilidade desproporcional ao nível médio de ` +
        `${media.toFixed(0)} mmHg. Valores > 10% são considerados clinicamente relevantes.`
      : `CV de ${cv.toFixed(1)}% é compatível com variabilidade normal para um nível ` +
        `médio de ${media.toFixed(0)} mmHg.`,
    confianca,
    fontes: [FONTES.parati2023!, FONTES.rothwell2010!],
  }
}

export function explicarARV(
  arv: number,
  componente: 'PAS' | 'PAD',
  n: number
): ExplicacaoMetrica {
  const limiar = componente === 'PAS' ? 12 : 9
  const elevada = arv > limiar
  const confianca = n >= 20 ? 'alta' : n >= 10 ? 'moderada' : 'baixa'

  return {
    metrica: `ARV — Variabilidade Real Média ${componente}`,
    valor_formatado: `${arv.toFixed(1)} mmHg`,
    metodo:
      'A ARV (Average Real Variability) mede a variabilidade sequencial da pressão ' +
      'arterial calculando a média das diferenças absolutas entre medições consecutivas. ' +
      `Fórmula: ARV = (1/N−1) × Σ|BP_{i+1} − BP_i|, aplicada às ${n} medições. ` +
      'Ao contrário do DP, a ARV captura mudanças reais de uma medição para a seguinte ' +
      'sem ser influenciada pela distância em relação à média global.',
    interpretacao: elevada
      ? `ARV de ${arv.toFixed(1)} mmHg supera o limiar de ${limiar} mmHg para ${componente}. ` +
        'Variabilidade sequencial elevada — associada a maior risco cardiovascular e ' +
        'lesão de órgão-alvo, particularmente renal e cerebrovascular.'
      : `ARV de ${arv.toFixed(1)} mmHg está dentro do intervalo esperado (< ${limiar} mmHg) ` +
        `para ${componente}, sugerindo variabilidade sequencial não aumentada.`,
    confianca,
    aviso_confianca:
      confianca !== 'alta'
        ? `N = ${n} medições. A ARV é sensível a valores atípicos em séries pequenas.`
        : undefined,
    fontes: [FONTES.mena2005!, FONTES.parati2023!, FONTES.hypertens2024!],
  }
}

export function explicarDescensoNoturno(
  descenso: DescensoNoturno,
  n_diurno: number,
  n_noturno: number
): ExplicacaoMetrica {
  const confianca =
    n_diurno >= 7 && n_noturno >= 5
      ? 'alta'
      : n_diurno >= 4 && n_noturno >= 3
        ? 'moderada'
        : 'baixa'

  const descricaoPadrao: Record<DescensoNoturno['padrao'], string> = {
    dipper:
      `Padrão dipper normal (queda sistólica de ${descenso.pas_percentual.toFixed(1)}%): ` +
      'descenso noturno fisiológico adequado, associado ao menor risco cardiovascular.',
    non_dipper:
      `Padrão non-dipper (queda sistólica de ${descenso.pas_percentual.toFixed(1)}%): ` +
      'redução insuficiente da pressão durante o sono. Associado a maior risco de ' +
      'AVC, doença renal crónica e hipertrofia ventricular esquerda.',
    riser:
      `Padrão riser (pressão noturna ${Math.abs(descenso.pas_percentual).toFixed(1)}% ` +
      'superior à diurna): inversão do padrão fisiológico. Associado ao maior risco ' +
      'cardiovascular entre os quatro padrões de descenso.',
    extreme_dipper:
      `Padrão extreme dipper (queda sistólica de ${descenso.pas_percentual.toFixed(1)}%): ` +
      'descenso excessivo. Pode indicar hipoperfusão noturna, especialmente em ' +
      'idosos e pacientes com doença cerebrovascular estabelecida.',
  }

  return {
    metrica: 'Descenso Noturno',
    valor_formatado: `${descenso.pas_percentual.toFixed(1)}% PAS / ${descenso.pad_percentual.toFixed(1)}% PAD`,
    metodo:
      'O descenso noturno é calculado como a redução percentual da pressão média ' +
      'nocturna em relação à diurna: Descenso (%) = [(Média diurna − Média nocturna) ' +
      '/ Média diurna] × 100. A classificação é baseada na componente sistólica, ' +
      `calculada a partir de ${n_diurno} medições diurnas e ${n_noturno} nocturnas. ` +
      'Os limiares adoptados seguem a recomendação da ESH 2023: ' +
      'dipper ≥ 10% e < 20%; non-dipper ≥ 0% e < 10%; riser < 0%; extreme dipper ≥ 20%.',
    interpretacao: descricaoPadrao[descenso.padrao],
    confianca,
    aviso_confianca:
      confianca !== 'alta'
        ? `Recomendado mínimo de 7 medições diurnas e 5 nocturnas (ESH 2023). ` +
          `Disponíveis: ${n_diurno} diurnas, ${n_noturno} nocturnas.`
        : undefined,
    fontes: [FONTES.esh2023!, FONTES.parati2023!],
  }
}

export function explicarMedia(
  media: number,
  componente: 'PAS' | 'PAD',
  n: number
): ExplicacaoMetrica {
  return {
    metrica: `Média ${componente}`,
    valor_formatado: `${media.toFixed(1)} mmHg`,
    metodo:
      `Média aritmética de todas as ${n} medições válidas no período: ` +
      `Média = (1/N) × Σ BP_i.`,
    interpretacao:
      `Valor médio de ${media.toFixed(0)} mmHg obtido a partir de ${n} medições válidas. ` +
      'A média isolada não quantifica variabilidade — deve ser interpretada sempre ' +
      'em conjunto com DP e ARV.',
    confianca: n >= 20 ? 'alta' : n >= 10 ? 'moderada' : 'baixa',
    fontes: [FONTES.esh2023!],
  }
}
