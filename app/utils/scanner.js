// app/utils/scanner.js
// Helpers da tela Scanner — dados do snapshot do momentum-scanner
// (scanner.jonebet.xyz/live.json). Funções puras, testáveis.

// Notificação "recente" = a mais recente do histórico dentro da janela (min).
export function isRecentNotification(notifications, now = Date.now(), windowMin = 5) {
  const latest = notifications?.[0]
  if (!latest?.at) return false
  const at = Date.parse(latest.at)
  if (Number.isNaN(at)) return false
  return now - at <= windowMin * 60_000
}

// "atualizado há 0:12" / "há 1:20" a partir de generated_at (ISO), no
// formato mm:ss — leitura imediata de quanto tempo passou desde o snapshot.
export function formatUpdatedAgo(generatedAt, now = Date.now()) {
  if (!generatedAt) return ''
  const at = Date.parse(generatedAt)
  if (Number.isNaN(at)) return ''
  const seconds = Math.max(0, Math.floor((now - at) / 1000))
  const minutes = Math.floor(seconds / 60)
  return `há ${minutes}:${String(seconds % 60).padStart(2, '0')}`
}

const HISTORY_KEY = 'scanner.notifications.v1'

// Une o histórico do backend (autoritativo) com o cache local (sobrevive a
// restart do scanner): dedupe por regra+horário, mais recente primeiro, máx 10.
export function mergeHistories(backend = [], local = []) {
  const seen = new Set()
  const merged = []
  for (const n of [...backend, ...local]) {
    const key = `${n.rule}|${n.at}`
    if (!seen.has(key)) {
      seen.add(key)
      merged.push(n)
    }
  }
  return merged.sort((a, b) => Date.parse(b.at) - Date.parse(a.at)).slice(0, 10)
}

export function loadLocalHistory() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

export function saveLocalHistory(byGame) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(byGame))
  } catch {
    // storage indisponível — segue sem cache local
  }
}

// Poda do cache local: só jogos visíveis agora (ao vivo + janela "Encerrado").
// O histórico de um jogo só é exibido enquanto o card existe na tela; ids de
// jogo não reaparecem — o resto seria dado invisível acumulando sem limite.
export function pruneLocalHistory(games = []) {
  const visible = {}
  for (const g of games) visible[g.id] = g.notifications || []
  return visible
}
