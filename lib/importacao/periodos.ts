import type { Medicao, FonteDados, Periodo } from '@/types'

export interface ConfigPeriodos {
  hora_acordar: number  // 0–23
  hora_deitar: number   // 0–23
}

export const CONFIG_PADRAO: ConfigPeriodos = {
  hora_acordar: 6,
  hora_deitar: 22,
}

const FONTES_COM_PERIODOS: FonteDados[] = ['mapa_24h', 'monitorizacao_continua']

export function precisaConfigPeriodos(fonte: FonteDados): boolean {
  return FONTES_COM_PERIODOS.includes(fonte)
}

/**
 * Atribui o período (diurno/noturno) a cada medição.
 * Para consultório e MRPA, todas as medições são "diurno" por convenção.
 * Para MAPA 24h e monitorização contínua, a classificação usa os horários
 * de acordar e deitar definidos pelo usuário (default: 06:00–22:00).
 */
export function atribuirPeriodos(
  medicoes: Medicao[],
  fonte: FonteDados,
  config: ConfigPeriodos = CONFIG_PADRAO
): Medicao[] {
  if (!FONTES_COM_PERIODOS.includes(fonte)) {
    return medicoes.map((m) => ({ ...m, periodo: 'diurno' as Periodo }))
  }

  return medicoes.map((m) => {
    const hora = m.timestamp.getHours()
    const periodo: Periodo = ehDiurno(hora, config) ? 'diurno' : 'noturno'
    return { ...m, periodo }
  })
}

/**
 * Determina quais períodos estão disponíveis para análise com base nas
 * medições válidas. 'total' é sempre incluído.
 */
export function inferirPeriodosDisponiveis(medicoes: Medicao[]): Periodo[] {
  const tem = (p: Periodo) => medicoes.some((m) => m.valida && m.periodo === p)
  const resultado: Periodo[] = ['total']
  if (tem('diurno')) resultado.push('diurno')
  if (tem('noturno')) resultado.push('noturno')
  return resultado
}

function ehDiurno(hora: number, config: ConfigPeriodos): boolean {
  if (config.hora_acordar <= config.hora_deitar) {
    return hora >= config.hora_acordar && hora < config.hora_deitar
  }
  // Caso invertido (ex: acordar 22h, deitar 6h)
  return hora >= config.hora_acordar || hora < config.hora_deitar
}
