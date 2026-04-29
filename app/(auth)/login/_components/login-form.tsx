'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { Loader2, AlertCircle } from 'lucide-react'
import { loginAction } from '../../actions'

export function LoginForm({ erroUrl }: { erroUrl?: string }) {
  const [erro, setErro] = useState<string | null>(erroUrl ?? null)
  const [pending, startTransition] = useTransition()

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErro(null)
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const res = await loginAction(fd)
      if (res?.erro) setErro(res.erro)
    })
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <label htmlFor="email" className="text-sm font-medium">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoFocus
          autoComplete="email"
          placeholder="seu@email.com"
          className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-foreground/20"
        />
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label htmlFor="senha" className="text-sm font-medium">
            Senha
          </label>
          <Link
            href="/recuperar-senha"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Esqueceu a senha?
          </Link>
        </div>
        <input
          id="senha"
          name="senha"
          type="password"
          required
          autoComplete="current-password"
          placeholder="••••••••"
          className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-foreground/20"
        />
      </div>

      {erro && (
        <div className="flex items-start gap-2 text-sm text-destructive">
          <AlertCircle className="size-4 mt-0.5 shrink-0" />
          <span>{erro}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full flex items-center justify-center gap-2 py-2 text-sm rounded-md bg-foreground text-background disabled:opacity-50 hover:opacity-90 transition-opacity"
      >
        {pending && <Loader2 className="size-4 animate-spin" />}
        Entrar
      </button>

      <p className="text-center text-sm text-muted-foreground">
        Não tem conta?{' '}
        <Link
          href="/cadastro"
          className="text-foreground underline-offset-4 hover:underline"
        >
          Criar conta
        </Link>
      </p>
    </form>
  )
}
