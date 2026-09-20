// Regras do "Perguntar à IA" compartilhadas (scannerCard + testes).
// Minuto tolera número ou string do Flashscore ("45+2'", "65'").
// Half: usa game.status quando indica o tempo, senão minuto ≤47 é 1ºT
// (acréscimo 46'–47' ainda é 1ºT). Sem hint de minutos: a janela real
// (gol_20min atravessa o intervalo) vive só no backend — o front só
// desabilita pergunta sem sentido.
import { AI_GOL_1T_MAX_MINUTE, AI_HALF_END, AI_QUESTIONS } from '~/utils/enums'

export function parseMinute(value) {
  if (typeof value === 'number' && Number.isFinite(value)) return Math.floor(value)
  if (typeof value !== 'string') return null
  const m = value.match(/(\d+)\s*(?:\+\s*(\d+))?/)
  if (!m) return null
  const base = Number(m[1])
  const extra = m[2] != null ? Number(m[2]) : 0
  if (!Number.isFinite(base) || !Number.isFinite(extra)) return null
  return base + extra
}

export function halfOf(game, minute) {
  const status = String(game?.status || '')
  if (/2\s*(nd|st)?\s*half|2º|segundo/i.test(status)) return 2
  if (/1\s*(st)?\s*half|1º|primeiro/i.test(status)) return 1
  // Fallback pelo minuto: 1ºT vai até 47' (acréscimo embutido).
  if (minute != null) return minute <= AI_HALF_END.FIRST ? 1 : 2
  return 1
}

// Restante real de jogo (p/ desabilitar): 1ºT conta até 47', 2ºT até 92'.
// Só zera no apito final — nunca no intervalo.
export function gameLeft(game) {
  const minute = parseMinute(game?.minute)
  if (minute == null) return null
  const half = halfOf(game, minute)
  if (half === 1) return Math.max(0, AI_HALF_END.FIRST - minute)
  return Math.max(0, AI_HALF_END.SECOND - minute)
}

export function aiQuestionState(game) {
  const minute = parseMinute(game?.minute)
  const left = gameLeft(game)
  return AI_QUESTIONS.map((q) => {
    if (q.id === 'gol_1t') {
      const disabled = minute != null && minute > AI_GOL_1T_MAX_MINUTE
      return { ...q, disabled, hint: '', title: disabled ? 'O 1º tempo já acabou' : q.label }
    }
    if (q.id === 'gol_20min') {
      const disabled = left != null && left <= 0
      return { ...q, disabled, hint: '', title: disabled ? 'O jogo já acabou' : q.label }
    }
    return { ...q, disabled: false, hint: '', title: q.label }
  })
}
