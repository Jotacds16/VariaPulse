import { cn } from '@/lib/utils'
import type { AnaliseLinear } from '@/types'
import type { Periodo } from '@/types'

const DESCENSO_INFO: Record<string, { label: string; classe: string }> = {
  dipper: { label: 'Dipper normal', classe: 'text-green-700 bg-green-50 border-green-200' },
  non_dipper: { label: 'Non-dipper', classe: 'text-amber-700 bg-amber-50 border-amber-200' },
  riser: { label: 'Riser', classe: 'text-red-700 bg-red-50 border-red-200' },
  extreme_dipper: { label: 'Extreme dipper', classe: 'text-amber-700 bg-amber-50 border-amber-200' },
}

function CardKpi({
  rotulo,
  valor,
  unidade,
  cor = 'text-foreground',
  sublabel,
}: {
  rotulo: string
  valor: string
  unidade?: string
  cor?: string
  sublabel?: string
}) {
  return (
    <div className="rounded-lg border bg-white px-4 py-3.5 space-y-1 min-w-0">
      <p className="text-xs text-muted-foreground leading-none">{rotulo}</p>
      <p className={cn('text-2xl font-semibold font-mono tracking-tight leading-none', cor)}>
        {valor}
        {unidade && (
          <span className="text-sm font-normal text-muted-foreground ml-1">{unidade}</span>
        )}
      </p>
      {sublabel && <p className="text-xs text-muted-foreground">{sublabel}</p>}
    </div>
  )
}

export function SumarioKpi({
  linear,
}: {
  linear: Record<Periodo, AnaliseLinear> | null
}) {
  if (!linear?.total) return null

  const t = linear.total
  const pasCor = t.media_pas >= 130 ? 'text-red-600' : 'text-green-700'
  const padCor = t.media_pad >= 80 ? 'text-red-600' : 'text-green-700'
  const descenso = t.descenso_noturno
  const descInfo = descenso ? DESCENSO_INFO[descenso.padrao] : null

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <CardKpi
        rotulo="Média PAS (24h)"
        valor={t.media_pas.toFixed(1)}
        unidade="mmHg"
        cor={pasCor}
        sublabel={t.media_pas >= 130 ? 'Acima da referência' : 'Dentro da referência'}
      />
      <CardKpi
        rotulo="Média PAD (24h)"
        valor={t.media_pad.toFixed(1)}
        unidade="mmHg"
        cor={padCor}
        sublabel={t.media_pad >= 80 ? 'Acima da referência' : 'Dentro da referência'}
      />

      {descInfo ? (
        <div className="rounded-lg border bg-white px-4 py-3.5 space-y-1.5 min-w-0">
          <p className="text-xs text-muted-foreground leading-none">Descenso noturno</p>
          <span
            className={cn(
              'inline-block text-xs font-medium px-2 py-0.5 rounded border',
              descInfo.classe
            )}
          >
            {descInfo.label}
          </span>
          {descenso && (
            <p className="text-xs text-muted-foreground">
              {descenso.pas_percentual.toFixed(1)}% PAS &middot;{' '}
              {descenso.pad_percentual.toFixed(1)}% PAD
            </p>
          )}
        </div>
      ) : (
        <div className="rounded-lg border bg-white px-4 py-3.5 space-y-1 min-w-0">
          <p className="text-xs text-muted-foreground leading-none">Descenso noturno</p>
          <p className="text-xs text-muted-foreground mt-1">Período noturno não disponível</p>
        </div>
      )}

      <CardKpi
        rotulo="Medições válidas"
        valor={String(t.n)}
        sublabel={`de ${t.n} do período total`}
      />
    </div>
  )
}
