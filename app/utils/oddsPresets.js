// app/utils/oddsPresets.js
// Faixas de odds pré-jogo (casa/fora) para os filtros do scanner e do
// relatório. A regra olha a MENOR das odds dos dois times (a odd do
// favorito): Super ≤ 1.40, Favoritos 1.41–2.05, Fav. por odd > 2.05.
// Faixas contíguas e mutuamente exclusivas para odds com 2 casas.
// Funções puras, testadas em tests/app/utils/oddsPresets.spec.ts.
export const ODDS_PRESETS = {
  todos: null,
  super: { max: 1.4 },
  favoritos: { min: 1.41, max: 2.05 },
  fav_por_odd: { min: 2.06 }, // 2.06 = primeiro representável acima de 2.05 (odds com 2 casas)
}

export const ODDS_PRESET_LABELS = {
  todos: 'Todos',
  super: 'Super',
  favoritos: 'Favoritos',
  fav_por_odd: 'Fav. por odd',
}

export const ODDS_PRESET_TITLES = {
  super: 'favorito esmagador',
  favoritos: 'favorito claro',
  fav_por_odd: 'Favorito por odd — os dois lados acima de 2.05',
}

// Opções prontas para o SegmentedControl das duas páginas (title undefined
// em "todos" → sem tooltip, como esperado).
export const ODDS_PRESET_OPTIONS = Object.keys(ODDS_PRESETS).map((value) => ({
  value,
  label: ODDS_PRESET_LABELS[value],
  title: ODDS_PRESET_TITLES[value],
}))

// Menor odd presente (> 0 e finita) entre casa/fora; null se nenhum lado
// tiver odd válida. Aceita null/undefined (odds ou prematch ausentes).
export function minTeamOdd(odds) {
  const values = [odds?.home, odds?.away].filter((n) => Number.isFinite(Number(n)) && Number(n) > 0).map(Number)
  return values.length ? Math.min(...values) : null
}

// Jogo passa no preset? 'todos' sempre passa; sem odd em nenhum lado não
// passa; preset desconhecido não passa.
export function matchesOddsPreset(preset, odds) {
  if (preset === 'todos') return true
  const min = minTeamOdd(odds)
  if (min === null) return false
  const band = ODDS_PRESETS[preset]
  if (!band) return false
  if (band.min != null && min < band.min) return false
  if (band.max != null && min > band.max) return false
  return true
}
