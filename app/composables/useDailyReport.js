// Estado da página /daily-report (relatório pré-live com IA). Sem cache: o
// endpoint do scanner já cacheia; cada abertura busca o relatório do dia.
import { reactive } from 'vue'

function reportUrl() {
  const base = useRuntimeConfig().public.SCANNER_SNAPSHOT_URL || ''
  return base.replace(/\/live\.json$/, '/report')
}

// fetchFn injetável: o $fetch auto-importado do Nuxt não é mockável nos testes
// (stack Nuxt 4 + vitest 4), então o default é $fetch e o teste injeta um mock.
export function useDailyReport(fetchFn = $fetch) {
  const state = reactive({ status: 'idle', response: null, error: null })

  async function load(dateIso) {
    state.status = 'loading'
    state.error = null
    try {
      const data = await fetchFn(`${reportUrl()}?date=${encodeURIComponent(dateIso)}`)
      state.status = 'done'
      state.response = data
      return data
    } catch (e) {
      state.status = 'error'
      state.error = e
      throw e
    }
  }

  return { state, load }
}
