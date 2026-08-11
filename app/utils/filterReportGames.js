// Filtro client-side dos jogos do relatório: busca textual (time da casa,
// visitante e liga — sem diferenciar caixa nem acentos) + seleção de
// estratégias (união OR; a sentinela ANY_STRATEGY representa "qualquer jogo
// com pelo menos 1 estratégia"). Função pura, testada em tests/app/utils/.
export const ANY_STRATEGY = '__any__'

export function normalizeSearchText(text) {
  return (text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

export function filterReportGames(jogos = [], { query = '', selected = [] } = {}) {
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
    return true
  })
}
