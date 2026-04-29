import type { Medicao, FlagValidacao, FonteDados } from '@/types'

const LIMITES = {
  pas: { min: 60, max: 300 },
  pad: { min: 30, max: 200 },
  fc: { min: 30, max: 220 },
  intervalo_longo_min: 60,
} as const

// MAPA e monitorização contínua têm intervalos curtos esperados por protocolo.
// Consultório e MRPA: < 5 min entre leituras é suspeito (duplicata ou erro de registro).
const FONTES_SEM_RESTRICAO_INTERVALO: FonteDados[] = ['mapa_24h', 'monitorizacao_continua']

export function validarSerie(medicoes: Medicao[], fonte: FonteDados): Medicao[] {
  const verificarIntervalo = !FONTES_SEM_RESTRICAO_INTERVALO.includes(fonte)

  const ordenadas = [...medicoes].sort(
    (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
  )

  return ordenadas.map((medicao, i) => {
    const flags: FlagValidacao[] = []

    if (medicao.pas < LIMITES.pas.min || medicao.pas > LIMITES.pas.max) {
      flags.push('valor_improvavel')
    }
    if (medicao.pad < LIMITES.pad.min || medicao.pad > LIMITES.pad.max) {
      flags.push('valor_improvavel')
    }
    if (medicao.pad >= medicao.pas) {
      flags.push('pulso_negativo')
    }
    if (medicao.fc !== undefined) {
      if (medicao.fc < LIMITES.fc.min || medicao.fc > LIMITES.fc.max) {
        flags.push('fc_improvavel')
      }
    }

    if (i > 0) {
      const anterior = ordenadas[i - 1]!
      const diff_min =
        (medicao.timestamp.getTime() - anterior.timestamp.getTime()) / 60000

      if (diff_min === 0) {
        flags.push('duplicata')
      } else if (verificarIntervalo && diff_min < 5) {
        flags.push('intervalo_curto')
      } else if (diff_min > LIMITES.intervalo_longo_min) {
        flags.push('intervalo_longo')
      }
    }

    return {
      ...medicao,
      flags,
      // Inválida se tiver qualquer flag além de intervalo_longo (lacuna não invalida a medição)
      valida: !flags.some((f) => f !== 'intervalo_longo'),
    }
  })
}

export function resumoValidacao(medicoes: Medicao[]) {
  const total = medicoes.length
  const validas = medicoes.filter((m) => m.valida).length
  const invalidas = total - validas

  const contagem_flags = medicoes
    .flatMap((m) => m.flags)
    .reduce<Record<string, number>>((acc, flag) => {
      acc[flag] = (acc[flag] ?? 0) + 1
      return acc
    }, {})

  return { total, validas, invalidas, contagem_flags }
}
