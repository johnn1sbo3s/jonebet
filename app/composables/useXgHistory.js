// Estado por jogo em nível de módulo: sobrevive a remontagens dos cards.
import { reactive, ref } from 'vue'
import { safeParse } from '~/utils/schemas'

const FETCH_TIMEOUT_MS = 10_000
const RETRY_MIN_MS = 15_000
const byGame = new Map() // id -> { status, response, fetchedAt, attemptedAt, error }
const inFlight = new Map() // id -> Promise
const refreshTick = ref(0)

function stateOf(id) {
  if (!byGame.has(id)) {
    byGame.set(id, reactive({ status: 'idle', response: null, fetchedAt: 0, attemptedAt: 0, error: null }))
  }
  return byGame.get(id)
}

function xgHistoryUrl() {
  const base = useRuntimeConfig().public.SCANNER_SNAPSHOT_URL || ''
  return base.replace(/\/live\.json$/, '/xg-history')
}

function fetchOptions() {
  if (typeof AbortSignal === 'undefined' || typeof AbortSignal.timeout !== 'function') return {}
  return { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) }
}

export function useXgHistory(fetchFn = $fetch) {
  async function load(id) {
    const s = stateOf(id)
    if (inFlight.has(id)) return inFlight.get(id)
    if (s.status === 'error' && Date.now() - s.attemptedAt < RETRY_MIN_MS) {
      return Promise.reject(s.error)
    }
    s.attemptedAt = Date.now()
    s.status = 'loading'
    s.error = null
    const p = (async () => {
      try {
        const raw = await fetchFn(`${xgHistoryUrl()}?game=${encodeURIComponent(id)}`, fetchOptions())
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

  return {
    get: stateOf,
    load,
    refreshTick,
    requestRefresh: () => {
      refreshTick.value += 1
    },
  }
}
