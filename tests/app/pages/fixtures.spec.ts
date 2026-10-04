// @vitest-environment nuxt
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import { ref } from 'vue'
import FixturesPage from '~/pages/fixtures.vue'

const INITIAL = {
  date: '2026-10-02',
  fixtures: [{ id: 'antigo', league: 'Série A', home: 'Casa', away: 'Fora' }],
  bets: [],
}

mockNuxtImport('useFetch', () => () => ({ data: ref(INITIAL) }))

// `$fetch` da página vem do auto-import do Nuxt (`#build/fetch.mjs`), então o
// controle de rede precisa entrar pelo import — `vi.stubGlobal` não alcança.
const net = vi.hoisted(() => ({ fetchMock: vi.fn() }))
mockNuxtImport('$fetch', () => net.fetchMock)

// A lista real não é o alvo: só interessa o que a página decide exibir.
const STUBS = {
  FixturesList: {
    name: 'FixturesList',
    props: ['fixtures', 'bets', 'loading'],
    template: '<div data-testid="fixtures-list" />',
  },
}

const flush = async () => {
  for (let i = 0; i < 5; i++) await Promise.resolve()
  await new Promise((r) => setTimeout(r, 0))
}

beforeEach(() => {
  net.fetchMock.mockReset()
})

describe('fixtures: erro na busca', () => {
  it('mostra erro, esconde a lista antiga e recupera no retry', async () => {
    net.fetchMock.mockRejectedValueOnce(new Error('rede caiu'))
    const wrapper = await mountSuspended(FixturesPage, { global: { stubs: STUBS } })
    await flush()

    // 1ª troca de data falha: a lista da data anterior não pode continuar
    // apresentada como se fosse da data nova, e o erro precisa ser visível.
    wrapper.findComponent({ name: 'DatePicker' }).vm.$emit('update:modelValue', '2026-10-03')
    await flush()

    expect(wrapper.find('[data-testid="fixtures-list"]').exists()).toBe(false)
    expect(wrapper.text()).toContain('Não foi possível carregar os jogos')

    // Retry: mesma data, agora respondendo.
    net.fetchMock.mockResolvedValueOnce({
      date: '2026-10-03',
      fixtures: [{ id: 'novo', league: 'Série B', home: 'Casa', away: 'Fora' }],
      bets: [],
    })
    await wrapper.find('[data-testid="fixtures-retry"]').trigger('click')
    await flush()

    expect(wrapper.text()).not.toContain('Não foi possível carregar os jogos')
    expect(wrapper.find('[data-testid="fixtures-list"]').exists()).toBe(true)
    // A lista que volta é a da data escolhida, não a da busca que falhou.
    expect(wrapper.findComponent({ name: 'FixturesList' }).props('fixtures')).toEqual([
      { id: 'novo', league: 'Série B', home: 'Casa', away: 'Fora' },
    ])
    wrapper.unmount()
  })

  it('erro na troca de origem também aparece', async () => {
    const wrapper = await mountSuspended(FixturesPage, { global: { stubs: STUBS } })
    await flush()

    net.fetchMock.mockRejectedValueOnce(new Error('rede caiu'))
    wrapper.findComponent({ name: 'FixturesList' }).vm.$emit('source-change', 'exchange')
    await flush()

    expect(wrapper.text()).toContain('Não foi possível carregar os jogos')
    expect(wrapper.find('[data-testid="fixtures-list"]').exists()).toBe(false)
    wrapper.unmount()
  })
})
