'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import type { Periodo, AnaliseLinear, AnaliseNaoLinear } from '@/types'

const PERIODO_LABEL: Record<Periodo, string> = {
  total: 'Total (24h)',
  diurno: 'Diurno',
  noturno: 'Noturno',
  manha_despertar: 'Manhã (despertar)',
}

const DESCENSO_LABEL: Record<string, string> = {
  dipper: 'Dipper normal',
  non_dipper: 'Non-dipper',
  riser: 'Riser',
  extreme_dipper: 'Extreme dipper',
}

const DESCENSO_COR: Record<string, string> = {
  dipper: 'text-green-600',
  non_dipper: 'text-amber-600',
  riser: 'text-red-600',
  extreme_dipper: 'text-amber-600',
}

function fmt1(v: number | null | undefined): string {
  if (v == null) return '—'
  return v.toFixed(1)
}

function MetricaLinha({ label, pas, pad, unidade = '' }: {
  label: string
  pas: string
  pad: string
  unidade?: string
}) {
  return (
    <tr className="border-t">
      <td className="px-3 py-2 text-muted-foreground text-xs">{label}</td>
      <td className="px-3 py-2 font-mono text-sm text-center">{pas}{unidade && <span className="text-xs text-muted-foreground ml-0.5">{unidade}</span>}</td>
      <td className="px-3 py-2 font-mono text-sm text-center">{pad}{unidade && <span className="text-xs text-muted-foreground ml-0.5">{unidade}</span>}</td>
    </tr>
  )
}

function CardLinear({ linear, periodo }: { linear: AnaliseLinear; periodo: Periodo }) {
  const descenso = linear.descenso_noturno

  return (
    <div className="rounded-lg border overflow-hidden hover:shadow-md transition-shadow duration-200">
      <div className="px-4 py-2.5 bg-muted/40 border-b">
        <p className="text-sm font-medium">{PERIODO_LABEL[periodo]}</p>
        <p className="text-xs text-muted-foreground">{linear.n} medições válidas</p>
      </div>
      <table className="w-full text-sm">
        <thead className="bg-muted/20">
          <tr>
            <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground w-1/3">Métrica</th>
            <th className="px-3 py-2 text-center text-xs font-medium text-muted-foreground">PAS (mmHg)</th>
            <th className="px-3 py-2 text-center text-xs font-medium text-muted-foreground">PAD (mmHg)</th>
          </tr>
        </thead>
        <tbody>
          <MetricaLinha label="Média" pas={fmt1(linear.media_pas)} pad={fmt1(linear.media_pad)} />
          <MetricaLinha label="DP" pas={fmt1(linear.dp_pas)} pad={fmt1(linear.dp_pad)} />
          <MetricaLinha label="CV" pas={fmt1(linear.cv_pas)} pad={fmt1(linear.cv_pad)} unidade="%" />
          <MetricaLinha label="ARV" pas={fmt1(linear.vrm_pas)} pad={fmt1(linear.vrm_pad)} />
          <MetricaLinha
            label="Mín / Máx"
            pas={`${linear.min_pas} / ${linear.max_pas}`}
            pad={`${linear.min_pad} / ${linear.max_pad}`}
          />
        </tbody>
      </table>

      {descenso && (
        <div className="px-4 py-3 border-t space-y-1.5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground">Descenso noturno</p>
            <span className={cn('text-sm font-medium', DESCENSO_COR[descenso.padrao])}>
              {DESCENSO_LABEL[descenso.padrao] ?? descenso.padrao}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            PAS: {fmt1(descenso.pas_percentual)}% &nbsp;·&nbsp; PAD: {fmt1(descenso.pad_percentual)}%
          </p>
          {descenso.alertas.length > 0 && (
            <ul className="space-y-1 mt-1">
              {descenso.alertas.map((a, i) => (
                <li key={i} className="text-xs text-amber-700 bg-amber-50 rounded px-2 py-1">
                  {a}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

function CardNaoLinear({ nl, periodo }: { nl: AnaliseNaoLinear; periodo: Periodo }) {
  const semDados = (v: number | null) =>
    v == null ? <span className="text-xs text-muted-foreground">Insuficiente</span> : <span className="font-mono">{v.toFixed(3)}</span>

  return (
    <div className="rounded-lg border overflow-hidden hover:shadow-md transition-shadow duration-200">
      <div className="px-4 py-2.5 bg-muted/40 border-b">
        <p className="text-sm font-medium">{PERIODO_LABEL[periodo]}</p>
        <p className="text-xs text-muted-foreground">{nl.n} medições válidas</p>
      </div>
      <div className="divide-y text-sm">
        {nl.poincare ? (
          <div className="px-4 py-3 grid grid-cols-3 gap-2">
            <div>
              <p className="text-xs text-muted-foreground">SD1</p>
              <p className="font-mono">{fmt1(nl.poincare.sd1)} <span className="text-xs text-muted-foreground">mmHg</span></p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">SD2</p>
              <p className="font-mono">{fmt1(nl.poincare.sd2)} <span className="text-xs text-muted-foreground">mmHg</span></p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">SD1/SD2</p>
              <p className="font-mono">{fmt1(nl.poincare.razao_sd1_sd2)}</p>
            </div>
          </div>
        ) : (
          <div className="px-4 py-3">
            <p className="text-xs text-muted-foreground">Poincaré — dados insuficientes</p>
          </div>
        )}

        <div className="px-4 py-3 grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">ApEn</p>
            {semDados(nl.entropia_aproximada)}
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">SampEn</p>
            {semDados(nl.entropia_amostral)}
          </div>
        </div>

        {nl.dfa ? (
          <div className="px-4 py-3 grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">DFA α1</p>
              <p className="font-mono">{fmt1(nl.dfa.alpha1)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">DFA α2</p>
              <p className="font-mono">{fmt1(nl.dfa.alpha2)}</p>
            </div>
          </div>
        ) : (
          <div className="px-4 py-3">
            <p className="text-xs text-muted-foreground">DFA — dados insuficientes</p>
          </div>
        )}
      </div>

      {nl.alertas.length > 0 && (
        <div className="px-4 py-3 border-t space-y-1">
          {nl.alertas.map((a, i) => (
            <p key={i} className="text-xs text-amber-700 bg-amber-50 rounded px-2 py-1">
              {a.metodo}: {a.motivo} (mín. {a.minimo_recomendado}, disponível: {a.disponivel})
            </p>
          ))}
        </div>
      )}
    </div>
  )
}

type Tab = 'linear' | 'nao_linear'

interface Props {
  analise: {
    periodos_disponiveis: Periodo[]
    linear: Record<Periodo, AnaliseLinear> | null
    nao_linear: Record<Periodo, AnaliseNaoLinear> | null
  }
}

export function AnaliseTabs({ analise }: Props) {
  const [tab, setTab] = useState<Tab>('linear')
  const periodos = analise.periodos_disponiveis

  return (
    <div className="space-y-6">
      <div className="flex gap-0 border-b">
        {(['linear', 'nao_linear'] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn(
              'px-5 py-3 text-sm font-medium touch-manipulation transition-colors duration-150 border-b-2 -mb-px active:opacity-60',
              tab === t
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
            )}
          >
            {t === 'linear' ? 'Linear' : 'Não linear'}
          </button>
        ))}
      </div>

      <div key={tab} className="space-y-4 animate-fade-in">
        {tab === 'linear' && (
          analise.linear
            ? periodos.map((p, i) => {
                const dados = analise.linear![p as Periodo]
                return dados ? (
                  <div key={p} className="animate-fade-in-up" style={{ animationDelay: `${i * 60}ms` }}>
                    <CardLinear linear={dados} periodo={p} />
                  </div>
                ) : null
              })
            : <p className="text-sm text-muted-foreground">Dados lineares não disponíveis.</p>
        )}
        {tab === 'nao_linear' && (
          analise.nao_linear
            ? periodos.map((p, i) => {
                const dados = analise.nao_linear![p as Periodo]
                return dados ? (
                  <div key={p} className="animate-fade-in-up" style={{ animationDelay: `${i * 60}ms` }}>
                    <CardNaoLinear nl={dados} periodo={p} />
                  </div>
                ) : null
              })
            : <p className="text-sm text-muted-foreground">Dados não lineares não disponíveis.</p>
        )}
      </div>
    </div>
  )
}
