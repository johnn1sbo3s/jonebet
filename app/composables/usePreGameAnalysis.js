// Estado da análise pré-jogo por jogo (relatório do dia do scanner). Busca
// pontual: /report?date=...&game=<id> devolve só a análise daquele jogo —
// nada de baixar o relatório inteiro. Estado em nível de módulo (sobrevive a
// remontagens dos cards); sem Pinia (convenção do repo).
import { reactive } from 'vue'
import { DateTime } from 'luxon'
import { SP_TZ } from '~/utils/timezone'

const byGame = new Map() // id -> reactive { status, response, fetchedAt, error }
const inFlight = new Map() // id -> Promise

function reportUrl() {
  const base = useRuntimeConfig().public.SCANNER_SNAPSHOT_URL || ''
  return base.replace(/\/live\.json$/, '/report')
}

function dateIso(daysAgo = 0) {
  // Mesma lógica do /daily-report: data de hoje em America/Sao_Paulo (o
  // relatório do dia é gerado na noite anterior pelo pipeline).
  return DateTime.now().setZone(SP_TZ).minus({ days: daysAgo }).toFormat('yyyy-MM-dd')
}

function stateOf(id) {
  if (!byGame.has(id)) byGame.set(id, reactive({ status: 'idle', response: null, fetchedAt: 0, error: null }))
  return byGame.get(id)
}

// Busca a análise de um jogo numa data; devolve o item do relatório ou null.
async function fetchGame(fetchFn, id, daysAgo) {
  const url = `${reportUrl()}?date=${encodeURIComponent(dateIso(daysAgo))}&game=${encodeURIComponent(id)}`
  const data = await fetchFn(url)
  return (data?.jogos || [])[0] || null
}

// fetchFn injetável: o $fetch auto-importado do Nuxt não é mockável nos testes
// (stack Nuxt 4 + vitest 4), então o default é $fetch e o teste injeta um mock.
export function usePreGameAnalysis(fetchFn = $fetch) {
  async function load(id) {
    const s = stateOf(id)
    if (s.status === 'done') return s.response // relatório é imutável por data: cache permanente
    if (inFlight.has(id)) return inFlight.get(id) // já está rodando: junta
    s.status = 'loading'
    s.error = null
    const p = (async () => {
      try {
        // Hoje primeiro; jogo ao vivo passando da meia-noite pertence ao
        // relatório de ontem — cai no fallback quando hoje não o tem.
        let jogo = await fetchGame(fetchFn, id, 0)
        if (!jogo) jogo = await fetchGame(fetchFn, id, 1)
        s.status = 'done'
        s.response = jogo
        s.fetchedAt = Date.now()
        return s.response
      } catch (e) {
        s.status = 'error'
        s.error = e
        throw e
      } finally {
        inFlight.delete(id)
      }
    })()
    inFlight.set(id, p)
    return p
  }

  return { get: stateOf, load }
}
