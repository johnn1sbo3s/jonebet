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
    expect(wrapper.findAll('rect.momentum-bar')).toHaveLength(2)
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
    const rects = wrapper.findAll('rect.momentum-bar')
    expect(rects[0].attributes('x')).toBe('0') // 1ºT minuto 1
    expect(rects[1].attributes('x')).toBe('320') // 2ºT 46' -> rel 1, divisor em 320 (45+45)
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
    // h1Len=45, h2Len=50, STEP=640/95≈6.7368, W1≈303.16; rel clampado em 50
    const cx = Number(wrapper.find('circle').attributes('cx'))
    expect(cx).toBeCloseTo(635.76, 1) // W1 + 49*STEP + 2.5
  })

  it('barra sem half cai no mapeamento legado', async () => {
    const wrapper = await mountSuspended(MomentumChart, {
      props: { bars: [{ minute: 60, home: 0.5, away: 0 }] },
    })
    // legado: h1Len=50 (clamp), h2Len=45, STEP=640/95≈6.7368
    const x = Number(wrapper.find('rect.momentum-bar').attributes('x'))
    expect(x).toBeCloseTo(397.47, 1) // (60-1)*STEP
  })

  it('ticks 15/30/45 no 1ºT e 50/75/90 no 2ºT', async () => {
    const wrapper = await mountSuspended(MomentumChart, {
      props: { bars: [{ minute: 1, half: 1, home: 0.5, away: 0 }] },
    })
    const labels = wrapper.findAll('text').map((t) => t.text())
    expect(labels).toEqual(["15'", "30'", "45'", "50'", "75'", "90'"])
  })

  it('fundo tintado: 1ºT zinc-950 e 2ºT zinc-800 na largura dos painéis', async () => {
    const wrapper = await mountSuspended(MomentumChart, {
      props: {
        bars: [
          { minute: 1, half: 1, home: 0.5, away: 0 },
          { minute: 46, half: 2, home: 0, away: 0.8 },
        ],
      },
    })
    const rects = wrapper.findAll('rect')
    // 0 e 1 são os fundos; barras têm class momentum-bar
    expect(rects[0].attributes('fill')).toBe('#09090b')
    expect(rects[0].attributes('x')).toBe('0')
    expect(rects[0].attributes('width')).toBe('320')
    expect(rects[1].attributes('fill')).toBe('#27272a')
    expect(rects[1].attributes('x')).toBe('320')
    expect(rects[1].attributes('width')).toBe('320')
    // guard da decisão visual central: a linha de 1ºT/2ºT não pode voltar tracejada
    expect(wrapper.html()).not.toContain('stroke-dasharray')
  })

  it('painéis flexíveis: 1ºT 47 e 2ºT 50 desloca divisor para ~310', async () => {
    const wrapper = await mountSuspended(MomentumChart, {
      props: {
        bars: [
          { minute: 47, half: 1, home: 0.5, away: 0 },
          { minute: 95, half: 2, home: 0, away: 0.8 },
        ],
      },
    })
    const rects = wrapper.findAll('rect')
    // h1Len=47, h2Len=50, STEP=640/97≈6.5979, W1≈310.10
    const divisor = Number(rects[1].attributes('x'))
    expect(divisor).toBeCloseTo((640 * 47) / 97, 1)
    expect(Number(rects[1].attributes('width'))).toBeCloseTo(640 - (640 * 47) / 97, 1)
  })

  it('jogo ao vivo no 1ºT (minuto 30): divisor fica em 320 (mínimo 45)', async () => {
    const wrapper = await mountSuspended(MomentumChart, {
      props: {
        bars: [{ minute: 30, half: 1, home: 0.5, away: 0 }],
      },
    })
    const rects = wrapper.findAll('rect')
    expect(rects[1].attributes('x')).toBe('320') // h1Len=45, h2Len=45
  })
})
