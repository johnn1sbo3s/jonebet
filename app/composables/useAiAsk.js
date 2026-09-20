// Estado da pergunta à IA por jogo+pergunta (POST /ask-ai do scanner).
// Chave (game_id, question_id): cada pergunta tem seu próprio estado/cache.
// Estado em nível de módulo (sobrevive a remontagens dos cards); sem Pinia.
// Nota: POST com body não cabe no layer useModelApi (GET+LRU central) —
// este composable espelha o padrão useXgHistory/usePreGameAnalysis.
import { safeParse } from '~/utils/schemas'

const byGameQuestion = new Map() // `${id}|${qid}` -> reactive { status, response, error }
const inFlight = new Map() // `${id}|${qid}` -> Promise

function askAiUrl() {
  const base = useRuntimeConfig().public.SCANNER_SNAPSHOT_URL || ''
  if (!base) return '/ask-ai'
  if (base.endsWith('/live.json')) return base.replace(/\/live\.json$/, '/ask-ai')
  return `${base.replace(/\/$/, '')}/ask-ai`
}

function stateOf(id, questionId) {
  const key = `${id}|${questionId}`
  if (!byGameQuestion.has(key)) {
    byGameQuestion.set(key, reactive({ status: 'idle', response: null, error: null }))
  }
  return byGameQuestion.get(key)
}

function get(id, questionId) {
  return stateOf(id, questionId)
}

// fetchFn injetável: o $fetch auto-importado do Nuxt não é mockável nos testes
// (stack Nuxt 4 + vitest 4), então o default é $fetch e o teste injeta um mock.
export function useAiAsk(fetchFn = $fetch) {
  async function load(id, questionId) {
    const key = `${id}|${questionId}`
    const s = stateOf(id, questionId)
    if (inFlight.has(key)) return inFlight.get(key)
    s.status = 'loading'
    s.error = null
    const p = (async () => {
      try {
        const raw = await fetchFn(askAiUrl(), {
          method: 'POST',
          body: { game_id: id, question_id: questionId },
        })
        const data = safeParse('scannerAiAnswer', raw)
        s.status = 'done'
        s.response = data
        return data
      } catch (e) {
        s.status = 'error'
        s.error = e
        throw e
      } finally {
        inFlight.delete(key)
      }
    })()
    inFlight.set(key, p)
    return p
  }

  return { get, load }
}
