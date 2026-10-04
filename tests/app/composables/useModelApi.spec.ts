// @vitest-environment nuxt
import { describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { useModelBets } from '~/composables/useModelApi.js'

// The global setup mocks this module for component tests; the real LRU is the
// subject here.
vi.mock('~/composables/useModelApi.js', async (importOriginal) => await importOriginal())

interface Pending {
  url: string
  resolve: (response: Response) => void
}

const pending: Pending[] = []

// `ofetch` must be imported inside the factory: vi.mock is hoisted above the
// static imports, so a top-level specifier would not be initialized yet.
vi.mock('#build/fetch', async () => {
  const { createFetch } = await import('ofetch')
  const $fetch = createFetch({
    fetch: ((request: RequestInfo | URL) => {
      const { promise, resolve } = Promise.withResolvers<Response>()
      pending.push({ url: String(request), resolve })
      return promise
    }) as unknown as typeof globalThis.fetch,
    Headers: globalThis.Headers,
  })
  return { $fetch }
})

const betsPayload = (page: number) => ({ items: [{ id: `bet-${page}` }], total: page, page, size: 25 })

function settle(page: number) {
  pending
    .find((request) => request.url.includes(`page=${page}`))
    ?.resolve(
      new Response(JSON.stringify(betsPayload(page)), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    )
}

const flush = () => new Promise((resolve) => setTimeout(resolve, 0))

// Each test uses its own model id: the LRU lives in `useState` for the whole
// Nuxt app instance, so a shared id would leak entries across tests.
const setup = async (id: string) => {
  pending.length = 0
  const model = ref(id)
  const page = ref(1)
  const { data } = useModelBets(model, {
    page,
    size: ref(25),
    sort: ref('date'),
    order: ref('desc'),
  })
  await flush()
  return { page, data }
}

describe('useModelApi cache LRU', () => {
  it('stores an out-of-order response under the key of its own request', async () => {
    const { page } = await setup('model-a')

    page.value = 2
    await flush()
    expect(pending).toHaveLength(2)

    // B answers first; A only lands after the active key already moved to B.
    settle(2)
    await flush()
    settle(1)
    await flush()

    const cache = useState('model-api-cache').value
    expect(cache['model-bets-model-a-1-25-date-desc']).toEqual(betsPayload(1))
    expect(cache['model-bets-model-a-2-25-date-desc']).toEqual(betsPayload(2))
  })

  it('never serves one key the payload cached under another', async () => {
    const { page, data } = await setup('model-b')

    page.value = 2
    await flush()
    settle(2)
    await flush()
    settle(1)
    await flush()

    page.value = 3
    await flush()
    // Page 3 was never requested: it must not be served from the LRU.
    expect(pending).toHaveLength(3)

    page.value = 1
    await flush()
    expect(data.value.items[0].id).toBe('bet-1')
    page.value = 2
    await flush()
    expect(data.value.items[0].id).toBe('bet-2')
  })

  it('still skips the refetch when the active key has its own cache entry', async () => {
    const { page, data } = await setup('model-c')

    settle(1)
    await flush()
    page.value = 2
    await flush()
    settle(2)
    await flush()
    expect(pending).toHaveLength(2)

    // Back to page 1: served from the LRU, no third request.
    page.value = 1
    await flush()
    await flush()
    expect(pending).toHaveLength(2)
    expect(data.value.items[0].id).toBe('bet-1')
  })
})
