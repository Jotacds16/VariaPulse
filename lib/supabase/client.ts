import { createBrowserClient } from '@supabase/ssr'

// @supabase/ssr 0.5.x usa o padrão antigo de generics (Database, SchemaName, Schema)
// enquanto @supabase/supabase-js 2.105+ mudou para (Database, SchemaNameOrClientOptions, SchemaName).
// O generic <Database> causa conflito de tipos — as operations de DB são tipadas
// manualmente via satisfies/cast nas camadas de acesso a dados.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
