import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AnalisesCliente } from './_components/analises-cliente'
import type { AnaliseRow } from '@/lib/supabase/types'
import type { FonteDados } from '@/types'

export default async function AnalisesPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data, error } = await supabase
    .from('analises')
    .select('id, nome, fonte, medicoes_total, medicoes_validas, criada_em')
    .eq('usuario_id', user.id)
    .order('criada_em', { ascending: false })

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
        Não foi possível carregar as análises. Tente novamente em instantes.
      </div>
    )
  }

  const analises = (data ?? []) as Pick<
    AnaliseRow,
    'id' | 'nome' | 'fonte' | 'medicoes_total' | 'medicoes_validas' | 'criada_em'
  >[]

  return (
    <div className="max-w-3xl mx-auto w-full">
      <AnalisesCliente
        analises={analises.map((a) => ({
          id: a.id,
          nome: a.nome,
          fonte: a.fonte as FonteDados,
          medicoes_total: a.medicoes_total,
          medicoes_validas: a.medicoes_validas,
          criada_em: a.criada_em,
        }))}
      />
    </div>
  )
}
