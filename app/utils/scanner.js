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

// "atualizado há 12s" / "há 1m 20s" a partir de generated_at (ISO).
export function formatUpdatedAgo(generatedAt, now = Date.now()) {
  if (!generatedAt) return ''
  const at = Date.parse(generatedAt)
  if (Number.isNaN(at)) return ''
  const seconds = Math.max(0, Math.floor((now - at) / 1000))
  if (seconds < 60) return `há ${seconds}s`
  const minutes = Math.floor(seconds / 60)
  return `há ${minutes}m ${seconds % 60}s`
}
