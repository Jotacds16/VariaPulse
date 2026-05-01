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

      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800 leading-relaxed">
        <span className="font-semibold">Aviso de privacidade:</span> Não insira dados que
        identifiquem diretamente o paciente (nome, CPF, data de nascimento). Utilize apenas
        séries temporais de pressão arterial. O sistema destina-se exclusivamente a pesquisa
        e ensino acadêmico, conforme LGPD art. 11.
      </div>

      <ImportarWizard />
    </div>
  )
}
