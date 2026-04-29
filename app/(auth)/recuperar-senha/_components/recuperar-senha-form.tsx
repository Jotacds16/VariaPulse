'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { Loader2, AlertCircle, CheckCircle } from 'lucide-react'
import { recuperarSenhaAction } from '../../actions'

export function RecuperarSenhaForm() {
  const [estado, setEstado] = useState<
    { tipo: 'erro'; msg: string } | { tipo: 'sucesso'; msg: string } | null
  >(null)
  const [pending, startTransition] = useTransition()

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setEstado(null)
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const res = await recuperarSenhaAction(fd)
      if ('erro' in res) setEstado({ tipo: 'erro', msg: res.erro })
      else setEstado({ tipo: 'sucesso', msg: res.sucesso })
    })
  }

  if (estado?.tipo === 'sucesso') {
    return (
      <div className="space-y-4">
        <div className="flex items-start gap-2 text-sm text-green-700 bg-green-50 rounded-md px-3 py-2">
          <CheckCircle className="size-4 mt-0.5 shrink-0" />
          <span>{estado.msg}</span>
        </div>
        <p className="text-center text-sm text-muted-foreground">
          <Link href="/login" className="text-foreground underline-offset-4 hover:underline">
            Voltar ao login
          </Link>
        </p>
      </div>
    )
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

      {estado?.tipo === 'erro' && (
        <div className="flex items-start gap-2 text-sm text-destructive">
          <AlertCircle className="size-4 mt-0.5 shrink-0" />
          <span>{estado.msg}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full flex items-center justify-center gap-2 py-2 text-sm rounded-md bg-foreground text-background disabled:opacity-50 hover:opacity-90 transition-opacity"
      >
        {pending && <Loader2 className="size-4 animate-spin" />}
        Enviar link de recuperação
      </button>

      <p className="text-center text-sm text-muted-foreground">
        <Link href="/login" className="text-foreground underline-offset-4 hover:underline">
          Voltar ao login
        </Link>
      </p>
    </form>
  )
}
