'use client'

import { signOutAction } from '../actions'
import { LogOut } from 'lucide-react'

export function SignOutButton() {
  return (
    <form action={signOutAction}>
      <button
        type="submit"
        className="flex items-center gap-2 w-full px-2 py-1.5 rounded-md text-xs text-muted-foreground hover:text-red-600 hover:bg-red-50 transition-colors"
      >
        <LogOut className="size-3.5" />
        Sair
      </button>
    </form>
  )
}
