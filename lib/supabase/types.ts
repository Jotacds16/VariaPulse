import type {
  FonteDados,
  Periodo,
  AnaliseLinear,
  AnaliseNaoLinear,
  SecaoRelatorio,
  FlagValidacao,
} from '@/types'

// ---------------------------------------------------------------------------
// Linhas do banco — refletem exatamente as colunas de cada tabela
// ---------------------------------------------------------------------------

export interface AnaliseRow {
  id: string
  usuario_id: string
  criada_em: string
  nome: string
  fonte: FonteDados
  medicoes_total: number
  medicoes_validas: number
  periodos_disponiveis: Periodo[]
  linear: Record<Periodo, AnaliseLinear> | null
  nao_linear: Record<Periodo, AnaliseNaoLinear> | null
  relatorio_gerado: boolean
}

export interface MedicaoRow {
  id: string
  analise_id: string
  usuario_id: string
  timestamp: string
  pas: number
  pad: number
  fc: number | null
  periodo: Periodo | null
  valida: boolean
  flags: FlagValidacao[]
}

export interface RelatorioRow {
  id: string
  analise_id: string
  usuario_id: string
  gerado_em: string
  periodos_incluidos: Periodo[]
  conteudo: SecaoRelatorio[]
}

// ---------------------------------------------------------------------------
// Mapa de tabelas para o cliente tipado do Supabase
// ---------------------------------------------------------------------------

// Tipo JSON genérico aceito pelo Supabase para colunas jsonb
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      analises: {
        Row: AnaliseRow
        Insert: Omit<AnaliseRow, 'id' | 'criada_em'>
        Update: Partial<Omit<AnaliseRow, 'id' | 'usuario_id' | 'criada_em'>>
        Relationships: []
      }
      medicoes: {
        Row: MedicaoRow
        Insert: Omit<MedicaoRow, 'id'>
        Update: Partial<Omit<MedicaoRow, 'id' | 'analise_id' | 'usuario_id'>>
        Relationships: []
      }
      relatorios: {
        Row: RelatorioRow
        Insert: Omit<RelatorioRow, 'id' | 'gerado_em'>
        Update: Partial<Omit<RelatorioRow, 'id' | 'analise_id' | 'usuario_id' | 'gerado_em'>>
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}