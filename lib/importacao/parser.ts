import Papa from 'papaparse'
import * as XLSX from 'xlsx'
import type { ArquivoImportado, Medicao, ErroParse } from '@/types'

// Nomes de coluna aceitos (case-insensitive)
const MAPA_COLUNAS = {
  timestamp: ['data', 'datetime', 'timestamp', 'hora', 'data_hora', 'date'],
  pas: ['pas', 'sistolica', 'sistólica', 'sbp', 'sys'],
  pad: ['pad', 'diastolica', 'diastólica', 'dbp', 'dia'],
  fc: ['fc', 'hr', 'frequencia', 'frequência', 'heart_rate', 'pulse'],
} as const

export async function parseArquivo(file: File): Promise<ArquivoImportado> {
  const nome_original = file.name
  const extensao = nome_original.split('.').pop()?.toLowerCase()

  if (!extensao || !['csv', 'xlsx', 'txt'].includes(extensao)) {
    throw new Error(`Formato não suportado: .${extensao}. Use CSV, XLSX ou TXT.`)
  }

  const tipo = extensao as 'csv' | 'xlsx' | 'txt'
  const linhas = await lerLinhas(file, tipo)

  const { medicoes, erros } = parsearLinhas(linhas)

  return {
    nome_original,
    tipo,
    total_linhas: linhas.length,
    medicoes_parseadas: medicoes,
    erros_parse: erros,
  }
}

async function lerLinhas(
  file: File,
  tipo: 'csv' | 'xlsx' | 'txt'
): Promise<Record<string, string>[]> {
  if (tipo === 'xlsx') {
    return lerXLSX(file)
  }
  return lerCSV(file)
}

async function lerCSV(file: File): Promise<Record<string, string>[]> {
  const texto = await file.text()
  const resultado = Papa.parse<Record<string, string>>(texto, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim().toLowerCase(),
  })
  return resultado.data
}

async function lerXLSX(file: File): Promise<Record<string, string>[]> {
  const buffer = await file.arrayBuffer()
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: true })
  const sheet = workbook.Sheets[workbook.SheetNames[0]!]!
  return XLSX.utils.sheet_to_json<Record<string, string>>(sheet, {
    defval: '',
    raw: false,
  })
}

function parsearLinhas(linhas: Record<string, string>[]): {
  medicoes: Medicao[]
  erros: ErroParse[]
} {
  if (linhas.length === 0) {
    return { medicoes: [], erros: [] }
  }

  const cabecalho = Object.keys(linhas[0]!)
  const mapeamento = mapearColunas(cabecalho)

  const medicoes: Medicao[] = []
  const erros: ErroParse[] = []

  linhas.forEach((linha, i) => {
    const num_linha = i + 2 // +2 porque linha 1 é o cabeçalho

    if (!mapeamento.timestamp || !mapeamento.pas || !mapeamento.pad) {
      if (i === 0) {
        erros.push({
          linha: num_linha,
          motivo:
            'Colunas obrigatórias não encontradas. Necessário: data/hora, PAS e PAD.',
        })
      }
      return
    }

    const raw_ts = linha[mapeamento.timestamp]
    const raw_pas = linha[mapeamento.pas]
    const raw_pad = linha[mapeamento.pad]
    const raw_fc = mapeamento.fc ? linha[mapeamento.fc] : undefined

    const timestamp = parsearTimestamp(raw_ts ?? '')
    if (!timestamp) {
      erros.push({
        linha: num_linha,
        coluna: mapeamento.timestamp,
        valor: raw_ts,
        motivo: 'Data/hora inválida ou formato não reconhecido.',
      })
      return
    }

    const pas = Number(raw_pas?.replace(',', '.'))
    if (isNaN(pas)) {
      erros.push({
        linha: num_linha,
        coluna: mapeamento.pas,
        valor: raw_pas,
        motivo: 'Valor de PAS não é numérico.',
      })
      return
    }

    const pad = Number(raw_pad?.replace(',', '.'))
    if (isNaN(pad)) {
      erros.push({
        linha: num_linha,
        coluna: mapeamento.pad,
        valor: raw_pad,
        motivo: 'Valor de PAD não é numérico.',
      })
      return
    }

    const fc =
      raw_fc && raw_fc.trim() !== ''
        ? Number(raw_fc.replace(',', '.'))
        : undefined

    medicoes.push({
      timestamp,
      pas,
      pad,
      fc: fc && !isNaN(fc) ? fc : undefined,
      valida: true,
      flags: [],
    })
  })

  return { medicoes, erros }
}

function mapearColunas(
  cabecalho: string[]
): Partial<Record<keyof typeof MAPA_COLUNAS, string>> {
  const resultado: Partial<Record<keyof typeof MAPA_COLUNAS, string>> = {}

  for (const [campo, sinonimos] of Object.entries(MAPA_COLUNAS) as [
    keyof typeof MAPA_COLUNAS,
    readonly string[],
  ][]) {
    const encontrado = cabecalho.find((col) =>
      sinonimos.includes(col.toLowerCase())
    )
    if (encontrado) resultado[campo] = encontrado
  }

  return resultado
}

function parsearTimestamp(valor: string): Date | null {
  if (!valor.trim()) return null

  // Tenta formatos comuns: ISO, DD/MM/YYYY HH:mm, DD-MM-YYYY HH:mm
  const formatos = [
    /^(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2}(:\d{2})?)/, // ISO
    /^(\d{2})\/(\d{2})\/(\d{4}) (\d{2}:\d{2})/,         // DD/MM/YYYY HH:mm
    /^(\d{2})-(\d{2})-(\d{4}) (\d{2}:\d{2})/,           // DD-MM-YYYY HH:mm
  ]

  // ISO direto
  const iso = new Date(valor)
  if (!isNaN(iso.getTime()) && formatos[0]!.test(valor)) return iso

  // DD/MM/YYYY HH:mm
  const mSlash = valor.match(/^(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2})/)
  if (mSlash) {
    const d = new Date(`${mSlash[3]}-${mSlash[2]}-${mSlash[1]}T${mSlash[4]}:${mSlash[5]}:00`)
    if (!isNaN(d.getTime())) return d
  }

  // DD-MM-YYYY HH:mm
  const mHyphen = valor.match(/^(\d{2})-(\d{2})-(\d{4}) (\d{2}):(\d{2})/)
  if (mHyphen) {
    const d = new Date(`${mHyphen[3]}-${mHyphen[2]}-${mHyphen[1]}T${mHyphen[4]}:${mHyphen[5]}:00`)
    if (!isNaN(d.getTime())) return d
  }

  return null
}
