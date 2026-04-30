'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { gerarConteudoRelatorio } from '@/lib/relatorio/gerador'
import type { Database, AnaliseRow } from '@/lib/supabase/types'

type RelatorioInsert = Database['public']['Tables']['relatorios']['Insert']

export async function gerarRelatorio(
  analiseId: string
): Promise<{ id: string } | { erro: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data, error } = await supabase
    .from('analises')
    .select('*')
    .eq('id', analiseId)
    .eq('usuario_id', user.id)
    .single()

  if (error || !data) {
    return { erro: 'Análise não encontrada.' }
  }

  const analise = data as AnaliseRow
  const { periodos, secoes } = gerarConteudoRelatorio(analise)

  const relatorioInsert: RelatorioInsert = {
    analise_id: analiseId,
    usuario_id: user.id,
    periodos_incluidos: periodos,
    conteudo: secoes as unknown as RelatorioInsert['conteudo'],
  }

  const { data: relatorio, error: erroRel } = await supabase
    .from('relatorios')
    .insert(relatorioInsert)
    .select('id')
    .single()

  if (erroRel || !relatorio) {
    return { erro: erroRel?.message ?? 'Erro ao salvar relatório.' }
  }

  await supabase
    .from('analises')
    .update({ relatorio_gerado: true })
    .eq('id', analiseId)

  return { id: relatorio.id }
}
