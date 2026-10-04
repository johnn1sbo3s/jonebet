// @vitest-environment nuxt
import { describe, it, expect } from 'vitest'
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
  setup(props) {
    return () =>
      h(
        'ul',
        { 'data-testid': 'fixture-list' },
        props.fixtures.map((f: { Time: string }) => h('li', f.Time)),
      )
  },
})

function mountList(fixtures: unknown[]) {
  return mountSuspended(FixturesList, {
    props: { fixtures, bets: [], loading: false },
    global: { stubs: { FixtureCard: FixtureCardStub } },
  })
}

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
