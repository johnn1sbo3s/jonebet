// Estado por jogo em nível de módulo: sobrevive a remontagens dos cards da
// grade e é compartilhado por todos os cards. Sem Pinia (convenção do repo).
import { reactive } from 'vue'

const FRESH_MS = 5 * 60 * 1000
const byGame = new Map() // id -> { status, response, fetchedAt, error }
const inFlight = new Map() // id -> Promise

function stateOf(id) {
  if (!byGame.has(id)) {
    byGame.set(id, reactive({ status: 'idle', response: null, fetchedAt: 0, error: null }))
  }
  return byGame.get(id)
}

function evaluateUrl() {
  const base = useRuntimeConfig().public.SCANNER_SNAPSHOT_URL || ''
  return base.replace(/\/live\.json$/, '/evaluate')
}

// fetchFn injetável: o $fetch auto-importado do Nuxt não é mockável nos testes
// (stack Nuxt 4 + vitest 4), então o default é $fetch e o teste injeta um mock.
export function useAiEvaluation(fetchFn = $fetch) {
  async function evaluate(id) {
    const s = stateOf(id)
    if (inFlight.has(id)) return inFlight.get(id) // já está rodando: junta
    if (s.status === 'done' && Date.now() - s.fetchedAt < FRESH_MS) return s.response
    s.status = 'loading'
    s.error = null
    const p = (async () => {
      try {
        const data = await fetchFn(`${evaluateUrl()}?game=${encodeURIComponent(id)}`)
        s.status = 'done'
        s.response = data
        s.fetchedAt = Date.now()
        return data
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

  return { get: stateOf, evaluate }
}
