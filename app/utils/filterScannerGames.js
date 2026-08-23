// app/utils/filterScannerGames.js
// Filtro client-side dos jogos do scanner ao vivo: busca textual (time da
// casa, visitante e liga — sem diferenciar caixa nem acentos) + toggle
// "só notificados" (já recebeu qualquer alerta — game.notifications acumula
// todos os alertas do jogo enquanto ele está ao vivo, então a janela de 5 min
// do selo "Alerta" do card não se aplica aqui) + preset de odds (menor odd
// casa/fora, faixas em oddsPresets.js). Função pura, testada em tests/app/utils/.
import { normalizeSearchText } from '~/utils/filterReportGames'
import { matchesOddsPreset } from '~/utils/oddsPresets'

export function filterScannerGames(
  games = [],
  { query = '', onlyNotified = false, oddsPreset = 'todos', onlyPreLive = false, preLiveGameIds = null } = {},
) {
  const q = normalizeSearchText(query)
  return games.filter((game) => {
    if (q) {
      const haystack = [game.home, game.away, game.league]
      if (!haystack.some((field) => normalizeSearchText(field).includes(q))) return false
    }
    // "só notificados" = já teve algum alerta (qualquer idade); o array de
    // notificações do jogo acumula todos os alertas enquanto ele está ao vivo.
    if (onlyNotified && !(game.notifications && game.notifications.length > 0)) return false
    // prematch já tem as chaves home/away; undefined (sem odds) → não passa.
    if (oddsPreset !== 'todos' && !matchesOddsPreset(oddsPreset, game.odds?.prematch)) return false
    // só jogo com ≥1 aposta pré-live (Set de ids vindos do scanner).
    if (onlyPreLive && !(preLiveGameIds && preLiveGameIds.has(game.id))) return false
    return true
  })
}
