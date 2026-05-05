'use client'

import { signOutAction } from '../actions'
import { Activity, LogOut, User } from 'lucide-react'

export function MenuBar({ email }: { email: string }) {
  return (
    <header className="h-14 border-b bg-background flex items-center px-4 md:px-6 shrink-0 gap-4">
      {/* Marca — visível só no mobile (sidebar está oculto) */}
      <div className="flex md:hidden items-center gap-2.5 flex-1">
        <div className="flex items-center justify-center size-8 rounded-lg bg-blue-600 shrink-0 shadow-sm">
          <Activity className="size-4 text-white" strokeWidth={2.5} />
        </div>
        <span className="font-bold text-[15px] leading-none">VariaPulse</span>
      </div>

      {/* Email — visível só no desktop */}
      <div className="hidden md:flex items-center gap-2 text-[15px] text-muted-foreground flex-1 justify-end">
        <User className="size-4 shrink-0" />
        <span className="max-w-[220px] truncate">{email}</span>
      </div>
      <div className="hidden md:block w-px h-5 bg-border" />

      <form action={signOutAction}>
        <button
          type="submit"
          className="flex items-center gap-1.5 text-[15px] text-muted-foreground hover:text-red-600 active:opacity-60 touch-manipulation transition-colors duration-150"
        >
          <LogOut className="size-4" />
          <span className="hidden md:inline">Sair</span>
        </button>
      </form>
    </header>
  )
}
