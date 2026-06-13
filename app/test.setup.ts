import { vi } from 'vitest'
import { ref } from 'vue'

// Stub Nuxt auto-imports that components touch in tests.
// Note: stubs here cover only the composables called by the new child
// components; useAsyncData and $fetch are not stubbed because the
// children receive their data via props.
function useFetchStub(value) {
  const obj = {
    data: ref(value),
    status: ref('success'),
    pending: ref(false),
    error: ref(null),
    refresh: vi.fn(),
    execute: vi.fn(),
  }
  // Match real useFetch thenability (page does `await useModelsList(...)`)
  return Object.assign(Promise.resolve(obj), obj)
}

vi.stubGlobal('useRoute', () => ({ params: {} }))
vi.stubGlobal('useRuntimeConfig', () => ({ public: { API_URL: 'http://test' } }))
vi.stubGlobal('useModelsList', () => useFetchStub({ items: [] }))
vi.stubGlobal('useModelById', () => useFetchStub(null))
vi.stubGlobal('useModelResults', () => useFetchStub([]))
vi.stubGlobal('useModelChart', () => useFetchStub({ labels: [], data: [], annotationIndex: 0 }))
vi.stubGlobal('useModelTrend', () => useFetchStub({ slope: 0, intercept: 0, line: [], distance: 0 }))
