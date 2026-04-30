'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Stethoscope,
  Home,
  Clock,
  Activity,
  LayoutGrid,
  ChevronRight,
  Search,
  Plus,
  CheckCircle2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { FonteDados } from '@/types'
import type { Route } from 'next'

type AnaliseItem = {
  id: string
  nome: string
  fonte: FonteDados
  medicoes_total: number
  medicoes_validas: number
  criada_em: string
}

const FONTE_META: Record<FonteDados, { label: string; icon: React.ElementType }> = {
  consultorio: { label: 'Consultório', icon: Stethoscope },
  mrpa: { label: 'MRPA', icon: Home },
  mapa_24h: { label: 'MAPA 24h', icon: Clock },
  monitorizacao_continua: { label: 'Monitorização', icon: Activity },
}

const FILTROS: { value: FonteDados | 'todas'; label: string; icon: React.ElementType }[] = [
  { value: 'todas', label: 'Todas', icon: LayoutGrid },
  { value: 'consultorio', label: 'Consultório', icon: Stethoscope },
  { value: 'mrpa', label: 'MRPA', icon: Home },
  { value: 'mapa_24h', label: 'MAPA 24h', icon: Clock },
  { value: 'monitorizacao_continua', label: 'Monitorização', icon: Activity },
]

function formatarData(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function AnalisesCliente({ analises }: { analises: AnaliseItem[] }) {
  const [busca, setBusca] = useState('')
  const [filtro, setFiltro] = useState<FonteDados | 'todas'>('todas')

  const visiveis = analises.filter((a) => {
    const buscaOk = a.nome.toLowerCase().includes(busca.toLowerCase())
    const filtroOk = filtro === 'todas' || a.fonte === filtro
    return buscaOk && filtroOk
  })

  return (
    <div className="space-y-0">
      {/* Hero: fundo azul com busca e filtros */}
      <div className="bg-blue-600 rounded-2xl px-6 pt-6 pb-8 space-y-5 animate-fade-in">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">Análises</h1>
          <Link
            href={'/importar' as Route}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/15 text-white text-sm font-semibold hover:bg-white/30 active:scale-95 transition-all duration-150"
          >
            <Plus className="size-4" />
            Nova
          </Link>
        </div>

        {/* Busca */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4.5 text-blue-400" />
          <input
            type="text"
            placeholder="Buscar análise..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-white text-[15px] placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-white/60 transition-shadow duration-150"
          />
        </div>

        {/* Filtros por fonte */}
        <div className="grid grid-cols-5 gap-2">
          {FILTROS.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => setFiltro(value)}
              className={cn(
                'flex flex-col items-center gap-2 py-3 px-2 rounded-xl text-xs font-semibold transition-all duration-150 active:scale-95',
                filtro === value
                  ? 'bg-white text-blue-600 scale-105 shadow-md'
                  : 'bg-white/15 text-white hover:bg-white/30 hover:scale-105'
              )}
            >
              <Icon className="size-5" />
              <span className="leading-tight text-center">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Lista de análises */}
      <div className="pt-6 space-y-4">
        <div className="flex items-center justify-between animate-fade-in">
          <p className="text-[15px] font-semibold">
            {filtro === 'todas' ? 'Todas as análises' : FONTE_META[filtro as FonteDados].label}
          </p>
          <span className="text-sm text-muted-foreground">
            {visiveis.length} resultado{visiveis.length !== 1 ? 's' : ''}
          </span>
        </div>

        {visiveis.length === 0 ? (
          <div className="rounded-xl border border-dashed p-12 text-center animate-fade-in-up">
            <p className="text-[15px] text-muted-foreground">Nenhuma análise encontrada.</p>
            {analises.length === 0 && (
              <Link
                href={'/importar' as Route}
                className="mt-3 inline-flex items-center gap-1.5 text-sm text-blue-600 hover:underline underline-offset-4 hover:gap-2.5 transition-all duration-150"
              >
                Importar a primeira análise
                <ChevronRight className="size-4" />
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {visiveis.map((a, index) => {
              const { label, icon: Icon } = FONTE_META[a.fonte] ?? {
                label: a.fonte,
                icon: Activity,
              }
              const taxaValidade = Math.round((a.medicoes_validas / a.medicoes_total) * 100)

              return (
                <div
                  key={a.id}
                  className="rounded-xl border bg-white p-5 space-y-4 animate-fade-in-up hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-default"
                  style={{ animationDelay: `${index * 0.07}s` }}
                >
                  {/* Linha superior: ícone + nome */}
                  <div className="flex items-center gap-4">
                    <div className="size-12 rounded-2xl bg-blue-50 flex items-center justify-center shrink-0">
                      <Icon className="size-6 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-[15px] truncate">{a.nome}</p>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {label} &middot; {formatarData(a.criada_em)}
                      </p>
                    </div>
                  </div>

                  {/* Linha de métricas */}
                  <div className="flex items-center gap-5 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="size-4 text-green-600" />
                      {a.medicoes_validas} válidas
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="size-4" />
                      {a.medicoes_total} total
                    </span>
                    <span
                      className={cn(
                        'ml-auto font-semibold text-sm',
                        taxaValidade >= 90
                          ? 'text-green-600'
                          : taxaValidade >= 70
                          ? 'text-amber-600'
                          : 'text-red-600'
                      )}
                    >
                      {taxaValidade}% válidas
                    </span>
                  </div>

                  {/* Botão */}
                  <Link
                    href={`/analise/${a.id}` as Route}
                    className="group flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-foreground text-background text-[15px] font-semibold hover:opacity-90 active:scale-[0.98] transition-all duration-150"
                  >
                    Ver análise
                    <ChevronRight className="size-4 group-hover:translate-x-0.5 transition-transform duration-150" />
                  </Link>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
