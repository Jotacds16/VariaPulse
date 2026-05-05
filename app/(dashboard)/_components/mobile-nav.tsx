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
  if (href === '/analises' && pathname.startsWith('/analise/')) return true
  if (href === '/relatorios' && pathname.startsWith('/relatorio/')) return true
  return false
}

export function MobileNav() {
  const pathname = usePathname()

  return (
    <nav className="md:hidden print:hidden fixed bottom-0 left-0 right-0 z-50 h-16 bg-background border-t flex items-center justify-around px-2">
      {LINKS.map(({ href, label, icon: Icon }) => {
        const active = isActive(pathname, href)
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex flex-col items-center gap-1 px-5 py-2 rounded-xl text-xs font-medium transition-all duration-150',
              active ? 'text-blue-600' : 'text-muted-foreground'
            )}
          >
            <Icon className={cn('size-6 transition-transform duration-150', active && 'scale-110')} />
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
