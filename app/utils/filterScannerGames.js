// app/utils/filterScannerGames.js
// Filtro client-side dos jogos do scanner ao vivo: busca textual (time da
// casa, visitante e liga — sem diferenciar caixa nem acentos) + toggle
// "só notificados" (notificação nos últimos 5 min — a mesma janela do selo
// "Alerta" do card) + preset de odds (menor odd casa/fora, faixas em
// oddsPresets.js). Função pura, testada em tests/app/utils/.
import { normalizeSearchText } from '~/utils/filterReportGames'
import { isRecentNotification } from '~/utils/scanner'
import { matchesOddsPreset } from '~/utils/oddsPresets'

export function filterScannerGames(games = [], { query = '', onlyNotified = false, oddsPreset = 'todos', now } = {}) {
  const q = normalizeSearchText(query)
  return games.filter((game) => {
    if (q) {
      const haystack = [game.home, game.away, game.league]
      if (!haystack.some((field) => normalizeSearchText(field).includes(q))) return false
    }
    if (onlyNotified && !isRecentNotification(game.notifications, now)) return false
    // prematch já tem as chaves home/away; undefined (sem odds) → não passa.
    if (oddsPreset !== 'todos' && !matchesOddsPreset(oddsPreset, game.odds?.prematch)) return false
    return true
  })
}
