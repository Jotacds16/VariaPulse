import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SidebarNav } from './_components/sidebar-nav'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  return (
    <div className="min-h-screen flex">
      <nav className="w-56 border-r bg-white flex flex-col px-3 py-6 gap-1 shrink-0">
        <p className="text-sm font-semibold text-foreground mb-4 px-2">VariaPulse</p>
        <SidebarNav />
      </nav>
      <main className="flex-1 p-8 bg-muted/30 min-w-0">{children}</main>
    </div>
  )
}
