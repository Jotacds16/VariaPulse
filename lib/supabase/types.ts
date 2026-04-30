// Gerado automaticamente a partir do schema do Supabase.
// Não editar manualmente — regenerar com: npx supabase gen types typescript

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: '14.5'
  }
  public: {
    Tables: {
      analises: {
        Row: {
          criada_em: string
          fonte: string
          id: string
          linear: Json | null
          medicoes_total: number
          medicoes_validas: number
          nao_linear: Json | null
          nome: string
          periodos_disponiveis: string[]
          relatorio_gerado: boolean
          usuario_id: string
        }
        Insert: {
          criada_em?: string
          fonte: string
          id?: string
          linear?: Json | null
          medicoes_total: number
          medicoes_validas: number
          nao_linear?: Json | null
          nome: string
          periodos_disponiveis?: string[]
          relatorio_gerado?: boolean
          usuario_id: string
        }
        Update: {
          criada_em?: string
          fonte?: string
          id?: string
          linear?: Json | null
          medicoes_total?: number
          medicoes_validas?: number
          nao_linear?: Json | null
          nome?: string
          periodos_disponiveis?: string[]
          relatorio_gerado?: boolean
          usuario_id?: string
        }
        Relationships: []
      }
      medicoes: {
        Row: {
          analise_id: string
          fc: number | null
          flags: string[]
          id: string
          pad: number
          pas: number
          periodo: string | null
          timestamp: string
          usuario_id: string
          valida: boolean
        }
        Insert: {
          analise_id: string
          fc?: number | null
          flags?: string[]
          id?: string
          pad: number
          pas: number
          periodo?: string | null
          timestamp: string
          usuario_id: string
          valida?: boolean
        }
        Update: {
          analise_id?: string
          fc?: number | null
          flags?: string[]
          id?: string
          pad?: number
          pas?: number
          periodo?: string | null
          timestamp?: string
          usuario_id?: string
          valida?: boolean
        }
        Relationships: [
          {
            foreignKeyName: 'medicoes_analise_id_fkey'
            columns: ['analise_id']
            isOneToOne: false
            referencedRelation: 'analises'
            referencedColumns: ['id']
          },
        ]
      }
      relatorios: {
        Row: {
          analise_id: string
          conteudo: Json
          gerado_em: string
          id: string
          periodos_incluidos: string[]
          usuario_id: string
        }
        Insert: {
          analise_id: string
          conteudo?: Json
          gerado_em?: string
          id?: string
          periodos_incluidos?: string[]
          usuario_id: string
        }
        Update: {
          analise_id?: string
          conteudo?: Json
          gerado_em?: string
          id?: string
          periodos_incluidos?: string[]
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'relatorios_analise_id_fkey'
            columns: ['analise_id']
            isOneToOne: false
            referencedRelation: 'analises'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// ---------------------------------------------------------------------------
// Aliases convenientes — Row types das tabelas principais
// ---------------------------------------------------------------------------

export type AnaliseRow  = Database['public']['Tables']['analises']['Row']
export type MedicaoRow  = Database['public']['Tables']['medicoes']['Row']
export type RelatorioRow = Database['public']['Tables']['relatorios']['Row']
