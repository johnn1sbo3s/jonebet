// @vitest-environment nuxt
import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import TeamHistoryPopover from '~/components/teamHistoryPopover.vue'

const history = {
  home_metrics: {
    form5: 'LWWWW',
    points5: 12,
    avg_total_goals: 2.3,
    btts_rate: 0.4,
    over25_rate: 0.4,
    ht_scored_rate: 0.4,
  },
  away_metrics: {
    form5: 'WLDLL',
    points5: 4,
    avg_total_goals: 2.4,
    btts_rate: 0.5,
    over25_rate: 0.4,
    ht_scored_rate: 0.2,
  },
  h2h: { count: 3, home_wins: 2, draws: 0, away_wins: 1, avg_goals: 2.0, btts_rate: 0 },
}

const UPopoverStub = {
  name: 'UPopover',
  template: '<div><slot /><div><slot name="content" /></div></div>',
}

async function mount(props) {
  return mountSuspended(TeamHistoryPopover, {
    props,
    global: { stubs: { UPopover: UPopoverStub } },
  })
}

describe('teamHistoryPopover', () => {
  it('renderiza o botão gatilho', async () => {
    const wrapper = await mount({ history, home: 'Lok. Plovdiv', away: 'Arda' })
    expect(wrapper.find('button').text()).toContain('Histórico')
  })

  it('renderiza métricas espelhadas formatadas', async () => {
    const wrapper = await mount({ history, home: 'Lok. Plovdiv', away: 'Arda' })
    const html = wrapper.html()
    expect(html).toContain('12') // pontos casa
    expect(html).toContain('4') // pontos fora
    expect(html).toContain('2.3') // gols/jogo casa
    expect(html).toContain('40%') // BTTS/over/gol 1ºT casa
    expect(html).toContain('20%') // gol 1ºT fora
  })

  it('mostra faixa H2H quando presente', async () => {
    const wrapper = await mount({ history, home: 'Lok. Plovdiv', away: 'Arda' })
    const html = wrapper.html()
    expect(html).toContain('H2H')
    expect(html).toContain('2 × 1')
  })

  it('omite faixa H2H quando ausente', async () => {
    const { h2h: _omitted, ...semH2h } = history
    const wrapper = await mount({ history: semH2h, home: 'A', away: 'B' })
    expect(wrapper.html()).not.toContain('H2H')
  })

  it('omite linhas de métricas ausentes sem quebrar', async () => {
    const parcial = {
      home_metrics: { form5: 'WWW', points5: 9 },
      away_metrics: {},
    }
    const wrapper = await mount({ history: parcial, home: 'A', away: 'B' })
    const html = wrapper.html()
    expect(html).toContain('9')
    expect(html).not.toContain('BTTS')
  })
})
