'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { FileText, Loader2 } from 'lucide-react'
import { gerarRelatorio } from '../actions'

interface Props {
  analiseId: string
  relatorioGerado: boolean
}

export function BotaoRelatorio({ analiseId, relatorioGerado }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [erro, setErro] = useState<string | null>(null)

  function handleGerar() {
    setErro(null)
    startTransition(async () => {
      const resultado = await gerarRelatorio(analiseId)
      if ('erro' in resultado) {
        setErro(resultado.erro)
        return
      }
      router.push(`/relatorio/${resultado.id}`)
    })
  }

  return (
    <div className="space-y-1.5">
      <button
        type="button"
        onClick={handleGerar}
        disabled={isPending}
        className="flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors hover:bg-muted disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isPending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <FileText className="size-4" />
        )}
        {relatorioGerado ? 'Gerar novo relatório' : 'Gerar relatório'}
      </button>
      {erro && <p className="text-xs text-red-600">{erro}</p>}
    </div>
  )
}
