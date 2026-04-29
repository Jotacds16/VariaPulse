'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BarChart2, Upload } from 'lucide-react'
import { cn } from '@/lib/utils'

const LINKS = [
  { href: '/analises', label: 'Análises', icon: BarChart2 },
  { href: '/importar', label: 'Importar', icon: Upload },
]

export function SidebarNav() {
  const pathname = usePathname()

  return (
    <>
      {LINKS.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className={cn(
            'flex items-center gap-2.5 px-2 py-1.5 rounded-md text-sm transition-colors',
            pathname.startsWith(href)
              ? 'bg-muted text-foreground font-medium'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
          )}
        >
          <Icon className="size-4" />
          {label}
        </Link>
      ))}
    </>
  )
}
