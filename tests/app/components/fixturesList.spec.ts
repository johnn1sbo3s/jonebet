// @vitest-environment nuxt
import { describe, it, expect, afterEach, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import FixturesList from '~/components/fixturesList.vue'

function makeFixtures() {
  return [
    { _id: 'b', League: 'Liga B', Home: 'Time B', Away: 'Adversário B', Time: '20:00' },
    { _id: 'a', League: 'Liga A', Home: 'Time A', Away: 'Adversário A', Time: '10:00' },
    { _id: 'c', League: 'Liga C', Home: 'Time C', Away: 'Adversário C', Time: '15:00' },
  ]
}

const FixtureCardStub = defineComponent({
  name: 'FixtureCard',
  props: { fixtures: { type: Array, default: () => [] } },
  emits: ['click'],
  setup(props, { emit }) {
    return () =>
      h(
        'ul',
        { 'data-testid': 'fixture-list' },
        props.fixtures.map((fixture: { Time: string }) =>
          h('li', { onClick: () => emit('click', fixture) }, fixture.Time),
        ),
      )
  },
})

const FixtureDetailsCardStub = defineComponent({
  name: 'FixtureDetailsCard',
  props: { fixture: { type: Object, default: () => ({}) } },
  setup(props) {
    return () => h('div', { 'data-testid': 'chosen-game' }, props.fixture._id || '')
  },
})

const UDrawerStub = defineComponent({
  name: 'UDrawer',
  props: { open: Boolean },
  emits: ['update:open'],
  setup(_props, { slots }) {
    return () => h('div', { 'data-testid': 'drawer' }, slots.content?.())
  },
})

const stubs = { FixtureCard: FixtureCardStub, FixtureDetailsCard: FixtureDetailsCardStub, UDrawer: UDrawerStub }

const mountList = (fixtures: unknown[]) =>
  mountSuspended(FixturesList, { props: { fixtures, bets: [], loading: false }, global: { stubs } })

const setViewportWidth = (width: number) =>
  Object.defineProperty(window, 'innerWidth', { value: width, configurable: true })

describe('fixturesList', () => {
  it('ordena por hora sem mutar o array recebido via prop', async () => {
    const fixtures = makeFixtures()
    const originalOrder = fixtures.map((f) => f._id)

    const wrapper = await mountList(fixtures)

    expect(wrapper.findAll('[data-testid="fixture-list"] li').map((li) => li.text())).toEqual([
      '10:00',
      '15:00',
      '20:00',
    ])
    expect(fixtures.map((f) => f._id)).toEqual(originalOrder)
  })
})

describe('fixturesList — timers do modal mobile', () => {
  afterEach(() => {
    vi.useRealTimers()
    setViewportWidth(1024)
  })

  it('reseta o jogo escolhido 300ms após fechar o modal', async () => {
    setViewportWidth(480)
    const wrapper = await mountList(makeFixtures())
    vi.useFakeTimers()

    await wrapper.findAll('[data-testid=\"fixture-list\"] li')[0].trigger('click')
    expect(wrapper.find('[data-testid="chosen-game"]').text()).toBe('a')

    await wrapper
      .findAll('button')
      .find((b) => b.text() === 'Fechar')!
      .trigger('click')
    await vi.advanceTimersByTimeAsync(299)
    expect(wrapper.find('[data-testid="chosen-game"]').text()).toBe('a')

    await vi.advanceTimersByTimeAsync(1)
    expect(wrapper.find('[data-testid="chosen-game"]').exists()).toBe(false)
  })

  it('cancela o reset pendente quando o componente é desmontado antes dos 300ms', async () => {
    setViewportWidth(480)
    const wrapper = await mountList(makeFixtures())
    vi.useFakeTimers()

    await wrapper.findAll('[data-testid=\"fixture-list\"] li')[0].trigger('click')
    await wrapper
      .findAll('button')
      .find((b) => b.text() === 'Fechar')!
      .trigger('click')
    expect(vi.getTimerCount()).toBe(1)

    wrapper.unmount()
    expect(vi.getTimerCount()).toBe(0)

    await vi.advanceTimersByTimeAsync(300)
    expect(vi.getTimerCount()).toBe(0)
  })

  it('descarta o reset antigo quando o modal fecha de novo, executando só o último', async () => {
    setViewportWidth(480)
    const wrapper = await mountList(makeFixtures())
    vi.useFakeTimers()

    await wrapper.findAll('[data-testid=\"fixture-list\"] li')[0].trigger('click')
    await wrapper
      .findAll('button')
      .find((b) => b.text() === 'Fechar')!
      .trigger('click')

    await vi.advanceTimersByTimeAsync(100)
    await wrapper.findAll('[data-testid=\"fixture-list\"] li')[1].trigger('click')
    await wrapper
      .findAll('button')
      .find((b) => b.text() === 'Fechar')!
      .trigger('click')
    expect(vi.getTimerCount()).toBe(1)

    await vi.advanceTimersByTimeAsync(250)
    expect(wrapper.find('[data-testid="chosen-game"]').text()).toBe('c')

    await vi.advanceTimersByTimeAsync(50)
    expect(wrapper.find('[data-testid="chosen-game"]').exists()).toBe(false)
  })
})
