// Filtro client-side dos jogos do relatório: busca textual (time da casa,
// visitante e liga — sem diferenciar caixa nem acentos) + seleção de
// estratégias (união OR; a sentinela ANY_STRATEGY representa "qualquer jogo
// com pelo menos 1 estratégia") + preset de odds (menor odd casa/fora,
// faixas em oddsPresets.js). Função pura, testada em tests/app/utils/.
import { matchesOddsPreset } from '~/utils/oddsPresets'

export const ANY_STRATEGY = '__any__'

export function normalizeSearchText(text) {
  return (text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

export function filterReportGames(jogos = [], { query = '', selected = [], oddsPreset = 'todos' } = {}) {
  const q = normalizeSearchText(query)
  const sel = selected.filter(Boolean)
  return jogos.filter((jogo) => {
    if (q) {
      const haystack = [jogo.home, jogo.away, jogo.league]
      if (!haystack.some((field) => normalizeSearchText(field).includes(q))) return false
    }
    if (sel.length) {
      const keys = (jogo.estrategias || []).map((e) => e.estrategia)
      if (sel.includes(ANY_STRATEGY) ? keys.length === 0 : !keys.some((k) => sel.includes(k))) {
        return false
      }
    }
    // Odds do relatório usam chaves h/a (não prematch) — mapeia para
    // { home, away } esperado pelo matcher; null/undefined → não passa.
    if (oddsPreset !== 'todos' && !matchesOddsPreset(oddsPreset, { home: jogo.odds?.h, away: jogo.odds?.a }))
      return false
    return true
  })
}
