'use client'

import { signOutAction } from '../actions'
import { LogOut, User } from 'lucide-react'

export function MenuBar({ email }: { email: string }) {
  return (
    <header className="h-14 border-b bg-background flex items-center justify-end px-6 shrink-0 gap-4">
      <div className="flex items-center gap-2 text-[15px] text-muted-foreground">
        <User className="size-4 shrink-0" />
        <span className="max-w-[220px] truncate">{email}</span>
      </div>
      <div className="w-px h-5 bg-border" />
      <form action={signOutAction}>
        <button
          type="submit"
          className="flex items-center gap-2 text-[15px] text-muted-foreground hover:text-red-600 transition-all duration-150 hover:gap-2.5"
        >
          <LogOut className="size-4" />
          Sair
        </button>
      </form>
    </header>
  )
}
