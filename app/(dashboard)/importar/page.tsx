import { ImportarWizard } from './_components/importar-wizard'

export default function ImportarPage() {
  return (
    <div className="space-y-6 max-w-3xl mx-auto w-full">
      <div>
        <h1 className="text-lg font-semibold">Importar dados</h1>
        <p className="text-sm text-muted-foreground">
          Aceita CSV, XLSX, TXT e PDF. PDFs gerados por software de monitorização (MAPA, MRPA) são
          convertidos automaticamente. Os dados são validados antes de qualquer análise.
        </p>
      </div>
      <ImportarWizard />
    </div>
  )
}
