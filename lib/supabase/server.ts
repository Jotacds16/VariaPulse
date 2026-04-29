import { createServerClient, type CookieMethodsServer } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from './types'

// Usar apenas em Server Components, Route Handlers e Server Actions.
//
// Usa ANON_KEY + sessão do cookie — o Supabase aplica RLS com base no JWT do
// usuário autenticado. NUNCA usar SUPABASE_SERVICE_ROLE_KEY aqui: a service
// role bypassa toda a Row Level Security e exporia dados de todos os usuários.
// A service role só deve ser usada em scripts de migração ou funções Edge
// isoladas com escopo explicitamente administrativo.
export async function createClient() {
  const cookieStore = await cookies()

  const cookieMethods: CookieMethodsServer = {
    getAll: () => cookieStore.getAll(),
    setAll: (cookiesToSet) => {
      cookiesToSet.forEach(({ name, value, options }) =>
        cookieStore.set(name, value, {
          ...options,
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
        })
      )
    },
  }

  // @supabase/ssr 0.5.x usa o padrão antigo de generics (Database, SchemaName, Schema)
  // enquanto @supabase/supabase-js 2.105+ mudou a assinatura — passar <Database> faz
  // o terceiro generic ser interpretado como SchemaName (string), não como Schema, o
  // que resulta em Database[SchemaType] = never para todas as tables.
  // As operations de DB são tipadas manualmente via satisfies nas camadas de acesso.
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: cookieMethods }
  )
}
