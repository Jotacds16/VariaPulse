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
    <nav className="md:hidden print:hidden fixed bottom-0 left-0 right-0 z-50 h-16 bg-background border-t flex items-stretch justify-around">
      {LINKS.map(({ href, label, icon: Icon }) => {
        const active = isActive(pathname, href)
        return (
          <Link
            key={href}
            href={href}
            prefetch={true}
            className={cn(
              'relative flex flex-1 flex-col items-center justify-center gap-1 text-xs font-medium touch-manipulation active:opacity-50 transition-opacity duration-75',
              active ? 'text-blue-600' : 'text-muted-foreground'
            )}
          >
            {active && (
              <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[3px] rounded-full bg-blue-600" />
            )}
            <Icon className="size-6" />
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
