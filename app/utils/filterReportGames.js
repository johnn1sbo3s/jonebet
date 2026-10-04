// Filtro client-side dos jogos do relatório: busca textual (time da casa,
// visitante e liga — sem diferenciar caixa nem acentos) + preset de odds
// (menor odd casa/fora, faixas em oddsPresets.js). Função pura, testada em
// tests/app/utils/.
import { matchesOddsPreset } from '~/utils/oddsPresets'

export function normalizeSearchText(text) {
  return (text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

export function filterReportGames(jogos = [], { query = '', oddsPreset = 'todos' } = {}) {
  const q = normalizeSearchText(query)
  return jogos.filter((jogo) => {
    if (q) {
      const haystack = [jogo.home, jogo.away, jogo.league]
      if (!haystack.some((field) => normalizeSearchText(field).includes(q))) return false
    }
    // Odds do relatório usam chaves h/a (não prematch) — mapeia para
    // { home, away } esperado pelo matcher; null/undefined → não passa.
    if (oddsPreset !== 'todos' && !matchesOddsPreset(oddsPreset, { home: jogo.odds?.h, away: jogo.odds?.a }))
      return false
    return true
  })
}
