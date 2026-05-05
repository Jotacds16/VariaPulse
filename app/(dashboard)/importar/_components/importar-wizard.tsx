'use client'

import { useState, useCallback, useTransition, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, AlertCircle, ChevronLeft, Loader2 } from 'lucide-react'
import { parseArquivo } from '@/lib/importacao/parser'
import { validarSerie, resumoValidacao } from '@/lib/importacao/validacao'
import { precisaConfigPeriodos } from '@/lib/importacao/periodos'
import { salvarAnalise } from '../actions'
import type { ArquivoImportado, FonteDados, Medicao } from '@/types'
import { cn } from '@/lib/utils'

const FONTES: { value: FonteDados; label: string }[] = [
  { value: 'consultorio', label: 'Consultório' },
  { value: 'mrpa', label: 'MRPA' },
  { value: 'mapa_24h', label: 'MAPA 24h' },
  { value: 'monitorizacao_continua', label: 'Monitorização contínua' },
]

const DESCRICAO_FLAG: Record<string, string> = {
  valor_improvavel: 'Valor improvável (PAS/PAD fora de limites fisiológicos)',
  intervalo_curto: 'Intervalo curto entre medições (< 5 min)',
  intervalo_longo: 'Lacuna na série (> 60 min)',
  fc_improvavel: 'FC improvável (< 30 ou > 220 bpm)',
  pulso_negativo: 'Pressão de pulso negativa (PAD ≥ PAS)',
  duplicata: 'Medição duplicada (mesmo timestamp)',
}

type Passo = 'upload' | 'validacao' | 'confirmar'

interface Estado {
  passo: Passo
  arquivo: ArquivoImportado | null
  fonte: FonteDados
  medicoes: Medicao[]
  nome: string
  horaAcordar: number
  horaDeitar: number
  erroUpload: string | null
  erroSalvar: string | null
  arrastando: boolean
}

const ESTADO_INICIAL: Estado = {
  passo: 'upload',
  arquivo: null,
  fonte: 'mapa_24h',
  medicoes: [],
  nome: '',
  horaAcordar: 6,
  horaDeitar: 22,
  erroUpload: null,
  erroSalvar: null,
  arrastando: false,
}

export function ImportarWizard() {
  const [estado, setEstado] = useState<Estado>(ESTADO_INICIAL)
  const [processando, setProcessando] = useState(false)
  const [mensagemProcessando, setMensagemProcessando] = useState('A processar...')
  const [salvando, startSalvando] = useTransition()
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)

  const processarArquivo = useCallback(
    async (file: File) => {
      const extensao = file.name.split('.').pop()?.toLowerCase()
      setMensagemProcessando(
        extensao === 'pdf' ? 'A extrair dados do PDF...' : 'A processar...'
      )
      setProcessando(true)
      setEstado((s) => ({ ...s, erroUpload: null }))
      try {
        const arquivo = await parseArquivo(file)
        const validadas = validarSerie(arquivo.medicoes_parseadas, estado.fonte)
        const nomeSemExt = file.name.replace(/\.[^.]+$/, '')
        setEstado((s) => ({
          ...s,
          arquivo,
          medicoes: validadas,
          nome: nomeSemExt,
          passo: 'validacao',
        }))
      } catch (e) {
        setEstado((s) => ({
          ...s,
          erroUpload: e instanceof Error ? e.message : 'Erro ao processar arquivo.',
        }))
      } finally {
        setProcessando(false)
      }
    },
    [estado.fonte]
  )

  const onSoltar = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setEstado((s) => ({ ...s, arrastando: false }))
      const file = e.dataTransfer.files[0]
      if (file) processarArquivo(file)
    },
    [processarArquivo]
  )

  const onSelecionar = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) processarArquivo(file)
    },
    [processarArquivo]
  )

  const salvar = useCallback(() => {
    startSalvando(async () => {
      setEstado((s) => ({ ...s, erroSalvar: null }))
      const resultado = await salvarAnalise({
        nome: estado.nome.trim(),
        fonte: estado.fonte,
        medicoes: estado.medicoes.map((m) => ({
          timestamp: m.timestamp.toISOString(),
          pas: m.pas,
          pad: m.pad,
          fc: m.fc,
        })),
        config_periodos: precisaConfigPeriodos(estado.fonte)
          ? { hora_acordar: estado.horaAcordar, hora_deitar: estado.horaDeitar }
          : undefined,
      })

      if ('erro' in resultado) {
        setEstado((s) => ({ ...s, erroSalvar: resultado.erro }))
        return
      }

      router.push(`/analise/${resultado.id}`)
    })
  }, [estado, router])

  const resumo = estado.medicoes.length > 0 ? resumoValidacao(estado.medicoes) : null

  // ---------------------------------------------------------------------------
  // Passo 1 — Upload
  // ---------------------------------------------------------------------------
  if (estado.passo === 'upload') {
    return (
      <div className="space-y-6 animate-fade-in-up">
        <div className="space-y-2">
          <label className="text-sm font-medium">Fonte dos dados</label>
          <div className="flex flex-wrap gap-2">
            {FONTES.map((f) => (
              <button
                key={f.value}
                type="button"
                onClick={() =>
                  setEstado((s) =>
                    s.fonte === f.value
                      ? s
                      : { ...s, fonte: f.value, arquivo: null, medicoes: [], erroUpload: null, passo: 'upload' }
                  )
                }
                className={cn(
                  'px-3 py-1.5 text-sm rounded-md border touch-manipulation transition-colors duration-150 active:opacity-60',
                  estado.fonte === f.value
                    ? 'bg-foreground text-background border-foreground'
                    : 'border-border hover:border-foreground/40'
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div
          onDragOver={(e) => {
            e.preventDefault()
            setEstado((s) => ({ ...s, arrastando: true }))
          }}
          onDragLeave={() => setEstado((s) => ({ ...s, arrastando: false }))}
          onDrop={onSoltar}
          onClick={() => inputRef.current?.click()}
          className={cn(
            'border-2 border-dashed rounded-lg p-12 text-center cursor-pointer touch-manipulation transition-colors duration-150 select-none',
            estado.arrastando
              ? 'border-foreground bg-muted/50'
              : 'border-border hover:border-foreground/40 active:bg-muted/30'
          )}
        >
          {processando ? (
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <Loader2 className="size-8 animate-spin" />
              <p className="text-sm">{mensagemProcessando}</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <Upload className="size-8" />
              <p className="text-sm font-medium">Solte o arquivo ou clique para selecionar</p>
              <p className="text-xs">CSV, XLSX, TXT ou PDF</p>
            </div>
          )}
        </div>

        <input
          ref={inputRef}
          type="file"
          accept=".csv,.xlsx,.txt,.pdf"
          className="hidden"
          onChange={onSelecionar}
        />

        {estado.erroUpload && (
          <div className="flex gap-2 text-sm text-destructive items-start">
            <AlertCircle className="size-4 mt-0.5 shrink-0" />
            <span>{estado.erroUpload}</span>
          </div>
        )}
      </div>
    )
  }

  // ---------------------------------------------------------------------------
  // Passo 2 — Validação
  // ---------------------------------------------------------------------------
  if (estado.passo === 'validacao' && resumo) {
    const erros = estado.arquivo?.erros_parse ?? []
    const temFlags = Object.keys(resumo.contagem_flags).length > 0

    return (
      <div className="space-y-6 animate-fade-in-up">
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total', valor: resumo.total, cor: '' },
            { label: 'Válidas', valor: resumo.validas, cor: 'text-green-600' },
            { label: 'Inválidas', valor: resumo.invalidas, cor: resumo.invalidas > 0 ? 'text-red-600' : '' },
          ].map(({ label, valor, cor }) => (
            <div key={label} className="rounded-lg border p-4">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className={cn('text-2xl font-semibold', cor)}>{valor}</p>
            </div>
          ))}
        </div>

        {erros.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium flex items-center gap-1.5">
              <AlertCircle className="size-4 text-amber-500" />
              Erros de leitura ({erros.length})
            </p>
            <div className="rounded-md border overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">Linha</th>
                    <th className="px-3 py-2 text-left font-medium">Coluna</th>
                    <th className="px-3 py-2 text-left font-medium">Motivo</th>
                  </tr>
                </thead>
                <tbody>
                  {erros.slice(0, 10).map((e, i) => (
                    <tr key={i} className="border-t">
                      <td className="px-3 py-2 font-mono">{e.linha}</td>
                      <td className="px-3 py-2 text-muted-foreground">{e.coluna ?? '—'}</td>
                      <td className="px-3 py-2">{e.motivo}</td>
                    </tr>
                  ))}
                  {erros.length > 10 && (
                    <tr className="border-t">
                      <td colSpan={3} className="px-3 py-2 text-muted-foreground">
                        ... e mais {erros.length - 10} erros
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {temFlags && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Medições com problemas</p>
            <div className="rounded-md border divide-y text-sm">
              {Object.entries(resumo.contagem_flags).map(([flag, count]) => (
                <div key={flag} className="px-3 py-2 flex justify-between">
                  <span className="text-muted-foreground">
                    {DESCRICAO_FLAG[flag] ?? flag}
                  </span>
                  <span className="font-medium">{count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {precisaConfigPeriodos(estado.fonte) && (
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium">Configuração de períodos</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Classifica medições como diurnas ou noturnas. Padrão ESH 2023: 06:00–22:00 diurno.
              </p>
            </div>
            <div className="flex gap-4">
              {[
                { label: 'Horário de acordar', key: 'horaAcordar' as const },
                { label: 'Horário de deitar', key: 'horaDeitar' as const },
              ].map(({ label, key }) => (
                <div key={key} className="space-y-1">
                  <label className="text-xs text-muted-foreground">{label}</label>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min={0}
                      max={23}
                      value={estado[key]}
                      onChange={(e) =>
                        setEstado((s) => ({ ...s, [key]: Number(e.target.value) || 0 }))
                      }
                      className="w-16 rounded-md border px-2 py-1.5 text-sm text-center"
                    />
                    <span className="text-xs text-muted-foreground">h</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {resumo.validas === 0 && (
          <div className="flex gap-2 text-sm text-destructive items-start">
            <AlertCircle className="size-4 mt-0.5 shrink-0" />
            <span>
              Nenhuma medição válida encontrada. Verifique o formato do arquivo ou as colunas
              presentes.
            </span>
          </div>
        )}

        <div className="flex justify-between">
          <button
            type="button"
            onClick={() => setEstado((s) => ({ ...s, passo: 'upload' }))}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground active:opacity-60 touch-manipulation transition-colors duration-150"
          >
            <ChevronLeft className="size-4" />
            Voltar
          </button>
          <button
            type="button"
            onClick={() => setEstado((s) => ({ ...s, passo: 'confirmar' }))}
            disabled={resumo.validas === 0}
            className="px-4 py-2 text-sm rounded-md bg-foreground text-background hover:opacity-90 active:opacity-60 touch-manipulation transition-opacity duration-150 disabled:opacity-40"
          >
            Continuar
          </button>
        </div>
      </div>
    )
  }

  // ---------------------------------------------------------------------------
  // Passo 3 — Confirmar
  // ---------------------------------------------------------------------------
  if (estado.passo === 'confirmar' && resumo) {
    const fonteLabel = FONTES.find((f) => f.value === estado.fonte)?.label ?? estado.fonte

    return (
      <div className="space-y-6 animate-fade-in-up">
        <div className="space-y-1.5">
          <label className="text-sm font-medium" htmlFor="nome-analise">
            Nome da análise
          </label>
          <input
            id="nome-analise"
            type="text"
            value={estado.nome}
            onChange={(e) => setEstado((s) => ({ ...s, nome: e.target.value }))}
            className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-foreground/20"
            placeholder="Nome para identificar esta análise"
            autoFocus
          />
        </div>

        <div className="rounded-lg border divide-y text-sm">
          <div className="px-4 py-3 flex justify-between">
            <span className="text-muted-foreground">Fonte</span>
            <span className="font-medium">{fonteLabel}</span>
          </div>
          <div className="px-4 py-3 flex justify-between">
            <span className="text-muted-foreground">Medições válidas</span>
            <span className="font-medium">
              {resumo.validas} / {resumo.total}
            </span>
          </div>
          {estado.arquivo && (
            <div className="px-4 py-3 flex justify-between">
              <span className="text-muted-foreground">Arquivo</span>
              <span className="font-mono text-xs">{estado.arquivo.nome_original}</span>
            </div>
          )}
          {precisaConfigPeriodos(estado.fonte) && (
            <div className="px-4 py-3 flex justify-between">
              <span className="text-muted-foreground">Períodos</span>
              <span className="font-medium">
                Diurno {String(estado.horaAcordar).padStart(2, '0')}:00 –{' '}
                {String(estado.horaDeitar).padStart(2, '0')}:00 / Noturno
              </span>
            </div>
          )}
        </div>

        {estado.erroSalvar && (
          <div className="flex gap-2 text-sm text-destructive items-start">
            <AlertCircle className="size-4 mt-0.5 shrink-0" />
            <span>{estado.erroSalvar}</span>
          </div>
        )}

        <div className="flex justify-between">
          <button
            type="button"
            onClick={() => setEstado((s) => ({ ...s, passo: 'validacao' }))}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground active:opacity-60 touch-manipulation transition-colors duration-150"
          >
            <ChevronLeft className="size-4" />
            Voltar
          </button>
          <button
            type="button"
            onClick={salvar}
            disabled={salvando || !estado.nome.trim()}
            className="flex items-center gap-2 px-4 py-2 text-sm rounded-md bg-foreground text-background hover:opacity-90 active:opacity-60 touch-manipulation transition-opacity duration-150 disabled:opacity-40"
          >
            {salvando && <Loader2 className="size-4 animate-spin" />}
            Salvar análise
          </button>
        </div>
      </div>
    )
  }

  return null
}
