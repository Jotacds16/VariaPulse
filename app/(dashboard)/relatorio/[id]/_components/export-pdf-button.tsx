'use client'

import { FileDown } from 'lucide-react'

export function ExportPdfButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="print:hidden flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium bg-white hover:bg-muted transition-colors shadow-sm"
    >
      <FileDown className="size-4" />
      Exportar em PDF
    </button>
  )
}
