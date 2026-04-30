'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BarChart2, Upload, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Route } from 'next'

const LINKS: { href: Route; label: string; icon: React.ElementType }[] = [
  { href: '/analises', label: 'Análises', icon: BarChart2 },
  { href: '/importar', label: 'Importar', icon: Upload },
  { href: '/relatorios', label: 'Relatórios', icon: FileText },
]

function isActive(pathname: string, href: Route): boolean {
  if (pathname.startsWith(href)) return true
  // /analise/[id] → destacar "Análises"
  if (href === '/analises' && pathname.startsWith('/analise/')) return true
  // /relatorio/[id] → destacar "Relatórios"
  if (href === '/relatorios' && pathname.startsWith('/relatorio/')) return true
  return false
}

export function SidebarNav() {
  const pathname = usePathname()

  return (
    <nav className="space-y-1">
      {LINKS.map(({ href, label, icon: Icon }) => {
        const active = isActive(pathname, href)
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'group flex items-center gap-3 px-3 py-2.5 rounded-xl text-[15px] font-medium transition-all duration-150',
              active
                ? 'bg-blue-50 text-blue-600'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/70 hover:translate-x-0.5'
            )}
          >
            <Icon
              className={cn(
                'size-5 shrink-0 transition-transform duration-150',
                active ? 'text-blue-600' : 'group-hover:scale-110'
              )}
            />
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
