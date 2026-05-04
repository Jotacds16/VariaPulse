'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { calcularAnaliseLinear, calcularDescensoNoturno } from '@/lib/analise/linear'
import { calcularAnaliseNaoLinear } from '@/lib/analise/nao-linear'
import { validarSerie } from '@/lib/importacao/validacao'
import {
  atribuirPeriodos,
  inferirPeriodosDisponiveis,
} from '@/lib/importacao/periodos'
import type { Medicao, FonteDados, Periodo, AnaliseLinear, AnaliseNaoLinear } from '@/types'
import type { ConfigPeriodos } from '@/lib/importacao/periodos'
import type { Database } from '@/lib/supabase/types'

type AnaliseInsert = Database['public']['Tables']['analises']['Insert']
type MedicaoInsert = Database['public']['Tables']['medicoes']['Insert']

// Apenas os campos brutos — validação e períodos são atribuídos no servidor
export interface MedicaoInput {
  timestamp: string // ISO string
  pas: number
  pad: number
  fc?: number
}

export interface SalvarAnaliseInput {
  nome: string
  fonte: FonteDados
  medicoes: MedicaoInput[]
  config_periodos?: ConfigPeriodos
}

export async function salvarAnalise(
  input: SalvarAnaliseInput
): Promise<{ id: string } | { erro: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Deserializar + validar no servidor (não confia nos dados do cliente)
  const brutas: Medicao[] = input.medicoes.map((m) => ({
    timestamp: new Date(m.timestamp),
    pas: m.pas,
    pad: m.pad,
    fc: m.fc,
    valida: true,
    flags: [],
  }))

  const validadas = validarSerie(brutas, input.fonte)
  const comPeriodos = atribuirPeriodos(validadas, input.fonte, input.config_periodos)
  const periodos_disponiveis = inferirPeriodosDisponiveis(comPeriodos)

  const linear: Partial<Record<Periodo, AnaliseLinear>> = {}
  const nao_linear: Partial<Record<Periodo, AnaliseNaoLinear>> = {}

  for (const periodo of periodos_disponiveis) {
    try {
      linear[periodo] = calcularAnaliseLinear(comPeriodos, periodo)
    } catch (e) {
      if (process.env.NODE_ENV === 'development') console.error(`linear[${periodo}]`, e)
    }
    try {
      nao_linear[periodo] = calcularAnaliseNaoLinear(comPeriodos, periodo)
    } catch (e) {
      if (process.env.NODE_ENV === 'development') console.error(`nao_linear[${periodo}]`, e)
    }
  }

  // Descenso noturno — anexado ao resultado diurno quando ambos disponíveis
  if (linear.diurno && linear.noturno) {
    linear.diurno = {
      ...linear.diurno,
      descenso_noturno: calcularDescensoNoturno(linear.diurno, linear.noturno),
    }
  }

  const analiseInsert: AnaliseInsert = {
    usuario_id: user.id,
    nome: input.nome,
    fonte: input.fonte,
    medicoes_total: comPeriodos.length,
    medicoes_validas: comPeriodos.filter((m) => m.valida).length,
    periodos_disponiveis,
    linear: linear as unknown as AnaliseInsert['linear'],
    nao_linear: nao_linear as unknown as AnaliseInsert['nao_linear'],
    relatorio_gerado: false,
  }

  const { data: analise, error: erroAnalise } = await supabase
    .from('analises')
    .insert(analiseInsert)
    .select('id')
    .single()

  if (erroAnalise || !analise) {
    return { erro: erroAnalise?.message ?? 'Erro desconhecido ao salvar análise.' }
  }

  const analiseId = analise.id
  const BATCH = 500
  const rows: MedicaoInsert[] = comPeriodos.map((m) => ({
    analise_id: analiseId,
    usuario_id: user.id,
    timestamp: m.timestamp.toISOString(),
    pas: m.pas,
    pad: m.pad,
    fc: m.fc != null && m.fc >= 20 && m.fc <= 300 ? m.fc : null,
    periodo: m.periodo ?? null,
    valida: m.valida,
    flags: m.flags,
  }))

  for (let i = 0; i < rows.length; i += BATCH) {
    const { error: errMed } = await supabase
      .from('medicoes')
      .insert(rows.slice(i, i + BATCH))
    if (errMed) {
      await supabase.from('analises').delete().eq('id', analiseId)
      return { erro: errMed.message }
    }
  }

  return { id: analiseId }
}
