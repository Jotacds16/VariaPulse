import type { TextItem } from 'pdfjs-dist/types/src/display/api'

// Tolerância em pontos para agrupar texto na mesma linha (coordenada Y do PDF)
const Y_TOLERANCIA = 3

// Cabeçalhos que indicam coluna de PAS — usados para encontrar a tabela de medições
const INDICADORES_CABECALHO = ['pas', 'sistolica', 'sistólica', 'sbp', 'sys']

export async function extrairCSVdoPDF(file: File): Promise<string> {
  const pdfjs = await import('pdfjs-dist')

  // Worker bundled pelo webpack do Next.js — servido da mesma origem (respeita CSP)
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
  ).toString()

  const buffer = await file.arrayBuffer()
  const pdf = await pdfjs.getDocument({ data: buffer }).promise

  const todasLinhas: string[][] = []

  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p)
    const content = await page.getTextContent()

    // Filtra apenas TextItem (descarta TextMarkedContent e itens vazios)
    const itens = content.items.filter(
      (item): item is TextItem => 'str' in item && item.str.trim() !== ''
    )

    if (itens.length === 0) continue

    // Agrupa itens pela coordenada Y arredondada (mesma linha visual)
    const grupos = new Map<number, TextItem[]>()
    for (const item of itens) {
      const y = Math.round(item.transform[5] / Y_TOLERANCIA) * Y_TOLERANCIA
      const grupo = grupos.get(y) ?? []
      grupo.push(item)
      grupos.set(y, grupo)
    }

    // Ordena linhas de cima para baixo (Y maior = mais alto na página)
    // e dentro de cada linha ordena da esquerda para direita (X crescente)
    const linhasPagina = [...grupos.entries()]
      .sort(([a], [b]) => b - a)
      .map(([, grupo]) =>
        grupo
          .sort((a, b) => a.transform[4] - b.transform[4])
          .map((i) => i.str.trim())
          .filter(Boolean)
      )
      .filter((l) => l.length >= 2) // descarta linhas decorativas de 1 célula

    todasLinhas.push(...linhasPagina)
  }

  if (todasLinhas.length === 0) {
    throw new Error(
      'Nenhum texto encontrado no PDF. O arquivo pode ser um escaneado sem OCR — exporte o relatório como CSV diretamente do software do monitor.'
    )
  }

  // Localiza a linha de cabeçalho pela presença de "PAS" ou sinônimos
  const idxCabecalho = todasLinhas.findIndex((linha) =>
    linha.some((cel) => INDICADORES_CABECALHO.includes(cel.toLowerCase()))
  )

  if (idxCabecalho === -1) {
    throw new Error(
      'Tabela de medições não encontrada no PDF. Verifique se o arquivo contém colunas de PAS e PAD, ou exporte como CSV.'
    )
  }

  const linhasTabela = todasLinhas.slice(idxCabecalho)

  // Converte para CSV — envolve em aspas células que contêm vírgula ou espaço
  return linhasTabela
    .map((linha) =>
      linha
        .map((cel) => (/[,\s"]/.test(cel) ? `"${cel.replace(/"/g, '""')}"` : cel))
        .join(',')
    )
    .join('\n')
}
