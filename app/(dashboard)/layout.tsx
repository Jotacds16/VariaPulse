import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Activity } from 'lucide-react'
import { SidebarNav } from './_components/sidebar-nav'
import { MenuBar } from './_components/menu-bar'
import { MobileNav } from './_components/mobile-nav'

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
      {/* Sidebar — oculto no mobile */}
      <nav className="print:hidden hidden md:flex w-64 border-r bg-background flex-col shrink-0">
        {/* Logo */}
        <div className="px-5 py-6 border-b">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center size-9 rounded-xl bg-blue-600 shrink-0 shadow-sm">
              <Activity className="size-5 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-base font-bold leading-none tracking-tight">VariaPulse</p>
              <p className="text-xs text-muted-foreground leading-none mt-1">
                Análise pressórica
              </p>
            </div>
          </div>
        </div>

        {/* Links */}
        <div className="flex-1 px-3 py-5">
          <SidebarNav />
        </div>
      </nav>

      {/* Coluna direita */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="print:hidden"><MenuBar email={user.email ?? ''} /></div>
        <main className="flex-1 p-4 md:p-8 pb-20 md:pb-8 bg-muted/30">{children}</main>
        <MobileNav />
      </div>
    </div>
  )
}
