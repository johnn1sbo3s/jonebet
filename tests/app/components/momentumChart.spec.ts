// tests/app/components/momentumChart.spec.ts
// @vitest-environment nuxt
import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import MomentumChart from '~/components/momentumChart.vue'

describe('MomentumChart', () => {
  it('renderiza uma barra por minuto com dados', async () => {
    const wrapper = await mountSuspended(MomentumChart, {
      props: {
        bars: [
          { minute: 1, home: 0.5, away: 0 },
          { minute: 2, home: 0, away: 0.8 },
        ],
      },
    })
    expect(wrapper.find('svg').exists()).toBe(true)
    expect(wrapper.findAll('rect')).toHaveLength(2)
  })

  it('mostra placeholder sem barras', async () => {
    const wrapper = await mountSuspended(MomentumChart, { props: { bars: [] } })
    expect(wrapper.text()).toContain('aguardando dados do gráfico')
    expect(wrapper.find('svg').exists()).toBe(false)
  })

  it('renderiza marcadores de gol', async () => {
    const wrapper = await mountSuspended(MomentumChart, {
      props: {
        bars: [{ minute: 1, home: 0.5, away: 0 }],
        goals: [
          { minute: 23, stoppage_time: 0, team: 'home', player: 'Rony' },
          { minute: 45, stoppage_time: 2, team: 'away', player: 'Suárez' },
        ],
      },
    })
    const circles = wrapper.findAll('circle')
    expect(circles).toHaveLength(2)
    expect(circles[0].attributes('cy')).toBe('9')
    expect(circles[1].attributes('cy')).toBe('146')
  })

  it('sem gols, sem marcadores', async () => {
    const wrapper = await mountSuspended(MomentumChart, {
      props: { bars: [{ minute: 1, home: 0.5, away: 0 }] },
    })
    expect(wrapper.findAll('circle')).toHaveLength(0)
  })

  it('posiciona barras do 2º tempo no painel direito', async () => {
    const wrapper = await mountSuspended(MomentumChart, {
      props: {
        bars: [
          { minute: 1, half: 1, home: 0.5, away: 0 },
          { minute: 46, half: 2, home: 0, away: 0.8 },
        ],
      },
    })
    const rects = wrapper.findAll('rect')
    expect(rects[0].attributes('x')).toBe('0') // 1ºT minuto 1
    expect(rects[1].attributes('x')).toBe('320') // 2ºT 46' -> rel 1
  })

  it('gol do 2º tempo posiciona no painel direito', async () => {
    const wrapper = await mountSuspended(MomentumChart, {
      props: {
        bars: [{ minute: 46, half: 2, home: 0.5, away: 0 }],
        goals: [{ minute: 46, half: 2, stoppage_time: 0, team: 'home', player: 'X' }],
      },
    })
    expect(wrapper.find('circle').attributes('cx')).toBe('322.5') // 320 + 0 + 2.5
  })

  it("clampa gol além do painel (90+6')", async () => {
    const wrapper = await mountSuspended(MomentumChart, {
      props: {
        bars: [{ minute: 96, half: 2, home: 0.5, away: 0 }],
        goals: [{ minute: 96, half: 2, stoppage_time: 0, team: 'home', player: 'X' }],
      },
    })
    expect(wrapper.find('circle').attributes('cx')).toBe('636.1') // rel clampado em 50
  })

  it('barra sem half cai no mapeamento legado', async () => {
    const wrapper = await mountSuspended(MomentumChart, {
      props: { bars: [{ minute: 60, home: 0.5, away: 0 }] },
    })
    expect(wrapper.find('rect').attributes('x')).toBe('377.6') // (60-1)*6.4
  })

  it('ticks 15/30/45 no 1ºT e 50/75/90 no 2ºT', async () => {
    const wrapper = await mountSuspended(MomentumChart, {
      props: { bars: [{ minute: 1, half: 1, home: 0.5, away: 0 }] },
    })
    const labels = wrapper.findAll('text').map((t) => t.text())
    expect(labels).toEqual(["15'", "30'", "45'", "50'", "75'", "90'"])
  })
})
