// Fontes de dados aceitas pelo sistema
export type FonteDados =
  | 'consultorio'
  | 'mrpa'
  | 'mapa_24h'
  | 'monitorizacao_continua'

// Períodos de análise
export type Periodo = 'total' | 'diurno' | 'noturno' | 'manha_despertar'

// Uma medição individual de pressão arterial
export interface Medicao {
  timestamp: Date
  pas: number   // Pressão Arterial Sistólica (mmHg)
  pad: number   // Pressão Arterial Diastólica (mmHg)
  fc?: number   // Frequência Cardíaca (bpm), opcional
  periodo?: Periodo
  valida: boolean
  flags: FlagValidacao[]
}

// Flags de qualidade dos dados
export type FlagValidacao =
  | 'valor_improvavel'       // PAS < 60 ou > 300, PAD < 30 ou > 200
  | 'intervalo_curto'        // < 5 min entre medições (exceto MAPA/contínua)
  | 'intervalo_longo'        // > 60 min — possível lacuna na série
  | 'fc_improvavel'          // FC < 30 ou > 220 bpm
  | 'pulso_negativo'         // PAD >= PAS
  | 'duplicata'              // Timestamp repetido

// Resultado das análises lineares
export interface AnaliseLinear {
  periodo: Periodo
  n: number             // Número de medições válidas
  media_pas: number
  media_pad: number
  dp_pas: number        // Desvio-padrão PAS
  dp_pad: number        // Desvio-padrão PAD
  cv_pas: number        // Coeficiente de Variação PAS (%)
  cv_pad: number        // Coeficiente de Variação PAD (%)
  vrm_pas: number       // Variabilidade Real Média PAS
  vrm_pad: number       // Variabilidade Real Média PAD
  min_pas: number
  max_pas: number
  min_pad: number
  max_pad: number
  descenso_noturno?: DescensoNoturno
}

export interface DescensoNoturno {
  pas_percentual: number  // Redução percentual da PAS noturna
  pad_percentual: number
  padrao: 'dipper' | 'non_dipper' | 'riser' | 'extreme_dipper'
  alertas: string[]
}

// Resultado das análises não lineares
export interface AnaliseNaoLinear {
  periodo: Periodo
  n: number
  poincare: Poincare | null
  entropia_aproximada: number | null   // ApEn
  entropia_amostral: number | null     // SampEn
  dfa: DFA | null
  alertas: AlertaInsuficiencia[]
}

export interface Poincare {
  sd1: number   // Variabilidade de curto prazo
  sd2: number   // Variabilidade de longo prazo
  razao_sd1_sd2: number
}

export interface DFA {
  alpha1: number   // Correlações de curto prazo (escala 4–16)
  alpha2: number   // Correlações de longo prazo (escala 16–64)
}

// Alertas de insuficiência de dados para análises não lineares
export interface AlertaInsuficiencia {
  metodo: 'entropia_aproximada' | 'entropia_amostral' | 'dfa' | 'poincare'
  motivo: string
  minimo_recomendado: number
  disponivel: number
}

// Análise completa — agrega linear + não linear por período
export interface Analise {
  id: string
  usuario_id: string
  criada_em: Date
  nome: string
  fonte: FonteDados
  medicoes_total: number
  medicoes_validas: number
  periodos_disponiveis: Periodo[]
  linear: Record<Periodo, AnaliseLinear>
  nao_linear: Record<Periodo, AnaliseNaoLinear>
  relatorio_gerado: boolean
}

// Arquivo importado (antes de virar Analise)
export interface ArquivoImportado {
  nome_original: string
  tipo: 'csv' | 'xlsx' | 'txt'
  total_linhas: number
  medicoes_parseadas: Medicao[]
  erros_parse: ErroParse[]
}

export interface ErroParse {
  linha: number
  coluna?: string
  valor?: string
  motivo: string
}

// ---------------------------------------------------------------------------
// Interpretação e rastreabilidade metodológica
// ---------------------------------------------------------------------------

export interface Fonte {
  autores: string
  titulo: string
  publicacao: string
  ano: number
  url?: string
}

/** Explicação completa de uma métrica — como foi calculada, o que significa e quais as fontes */
export interface ExplicacaoMetrica {
  /** Nome técnico da métrica (ex: "ARV sistólica") */
  metrica: string
  /** Valor formatado (ex: "12.4 mmHg") */
  valor_formatado: string
  /** Descrição do método de cálculo em linguagem acessível */
  metodo: string
  /** Interpretação clínica do valor específico obtido */
  interpretacao: string
  /** Nível de confiança baseado no N disponível */
  confianca: 'alta' | 'moderada' | 'baixa'
  /** Motivo da confiança reduzida, se aplicável */
  aviso_confianca?: string
  /** Referências bibliográficas que fundamentam a métrica */
  fontes: Fonte[]
}

// Relatório clínico final
export interface Relatorio {
  id: string
  analise_id: string
  usuario_id: string
  gerado_em: Date
  periodos_incluidos: Periodo[]
  conteudo: SecaoRelatorio[]
}

export interface SecaoRelatorio {
  titulo: string
  conteudo: string
  alertas?: string[]
}