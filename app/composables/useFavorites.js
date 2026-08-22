// Jogos favoritados — estado compartilhado entre /daily-report e /scanner via
// localStorage (as páginas abrem em abas diferentes; o evento 'storage'
// sincroniza entre abas). A chave guarda { [matchId]: 'yyyy-mm-dd' }: a data
// serve de limpeza automática — quando o dia acaba, os jogos já acabaram e os
// favoritos são purgados na próxima abertura (não entope o localStorage).
// matchId é o mesmo namespace nas duas telas: jogo_id no relatório e id no
// scanner (id do Flashscore — o relatório casa por ele na busca pré-jogo).
import { reactive } from 'vue'
import { DateTime } from 'luxon'
import { SP_TZ } from '~/utils/timezone'

const STORAGE_KEY = 'dataPlay.favorites'

// Singleton reativo (lazy): os cards chamam o composable por instância, então
// um estado por módulo evita N listeners de 'storage' e N cópias do mapa.
let favorites = null

function todayIso() {
  return DateTime.now().setZone(SP_TZ).toFormat('yyyy-MM-dd')
}

function readStored() {
  if (!import.meta.client) return {}
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
  } catch {
    return {} // storage corrompido: começa vazio
  }
}

// Espelha o storage no estado reativo, purgando favoritos de dias anteriores
// e re-escrevendo o storage quando algo foi removido (limpeza de verdade).
function syncFromStorage() {
  const stored = readStored()
  const today = todayIso()
  const limpo = {}
  for (const [id, date] of Object.entries(stored)) {
    if (date >= today) limpo[id] = date
  }
  for (const id of Object.keys(favorites)) {
    if (!(id in limpo)) delete favorites[id]
  }
  for (const [id, date] of Object.entries(limpo)) {
    favorites[id] = date
  }
  if (import.meta.client && Object.keys(limpo).length !== Object.keys(stored).length) {
    if (Object.keys(limpo).length === 0) localStorage.removeItem(STORAGE_KEY)
    else localStorage.setItem(STORAGE_KEY, JSON.stringify(limpo))
  }
}

function ensureState() {
  if (favorites) return
  favorites = reactive({})
  syncFromStorage()
  if (import.meta.client) {
    window.addEventListener('storage', (e) => {
      if (e.key === STORAGE_KEY) syncFromStorage()
    })
  }
}

export function useFavorites() {
  ensureState()

  const idOf = (game) => game?.jogo_id ?? game?.id

  return {
    isFavorite: (id) => Boolean(favorites[id]),
    // reportDate: data do relatório sendo exibido (yyyy-MM-dd). Quando o
    // usuário visualiza o relatório de amanhã (à noite), o favorito deve
    // armazenar a data de amanhã — caso contrário, à meia-noite a limpeza
    // purgaria o favorito porque "data < hoje". Quando omitted, usa todayIso().
    toggleFavorite: (id, reportDate) => {
      if (favorites[id]) {
        delete favorites[id]
      } else {
        favorites[id] = reportDate || todayIso()
      }
      if (import.meta.client) {
        if (Object.keys(favorites).length === 0) localStorage.removeItem(STORAGE_KEY)
        else localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites))
      }
    },
    // Preserva a ordem original (a API já vem ordenada por tier).
    favoritesOf: (games) => games.filter((g) => Boolean(favorites[idOf(g)])),
  }
}
