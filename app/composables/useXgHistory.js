// Estado por jogo em nível de módulo: sobrevive a remontagens dos cards.
import { reactive } from 'vue'
import { safeParse } from '~/utils/schemas'

const FRESH_MS = 5 * 60 * 1000
const byGame = new Map() // id -> { status, response, fetchedAt, error }
const inFlight = new Map() // id -> Promise

function stateOf(id) {
  if (!byGame.has(id)) {
    byGame.set(id, reactive({ status: 'idle', response: null, fetchedAt: 0, error: null }))
  }
  return byGame.get(id)
}

function xgHistoryUrl() {
  const base = useRuntimeConfig().public.SCANNER_SNAPSHOT_URL || ''
  return base.replace(/\/live\.json$/, '/xg-history')
}

export function useXgHistory(fetchFn = $fetch) {
  async function load(id) {
    const s = stateOf(id)
    if (inFlight.has(id)) return inFlight.get(id)
    if (s.status === 'done' && Date.now() - s.fetchedAt < FRESH_MS) return s.response
    s.status = 'loading'
    s.error = null
    const p = (async () => {
      try {
        const raw = await fetchFn(`${xgHistoryUrl()}?game=${encodeURIComponent(id)}`)
        const data = safeParse('scannerXgHistory', raw)
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

  return { get: stateOf, load }
}
