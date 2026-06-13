import { vi } from 'vitest'
import { ref } from 'vue'

vi.stubGlobal('useRoute', () => ({ params: {} }))
vi.stubGlobal('useRuntimeConfig', () => ({ public: { API_URL: 'http://test' } }))
vi.stubGlobal('useModelsList', () => ({ data: ref({ items: [] }), status: ref('success') }))
vi.stubGlobal('useModelById', () => ({ data: ref(null), status: ref('success') }))
vi.stubGlobal('useModelResults', () => ({
  data: ref([]),
  status: ref('success'),
  pending: ref(false),
}))
vi.stubGlobal('useModelChart', () => ({
  data: ref({ labels: [], data: [], annotationIndex: 0 }),
  status: ref('success'),
  pending: ref(false),
}))
vi.stubGlobal('useModelTrend', () => ({
  data: ref({ slope: 0, intercept: 0, line: [], distance: 0 }),
  status: ref('success'),
  pending: ref(false),
}))
