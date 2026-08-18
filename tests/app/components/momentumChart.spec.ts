// tests/app/components/momentumChart.spec.ts
// @vitest-environment nuxt
import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import MomentumChart from '~/components/momentumChart.vue'

// Geometria: viewBox 640, GAP=8 entre painéis, STEP=(640-8)/(h1Len+h2Len).
// Caso simétrico 45+45: STEP=632/90≈7.0222, W1=316, P2=324.
const P2_SYMMETRIC = 45 * (632 / 90) + 8 // ≈ 324

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
    expect(circles[1].attributes('cy')).toBe('101')
  })

  it('sem gols, sem marcadores', async () => {
    const wrapper = await mountSuspended(MomentumChart, {
      props: { bars: [{ minute: 1, home: 0.5, away: 0 }] },
    })
    expect(wrapper.findAll('circle')).toHaveLength(0)
  })

  it('posiciona barras do 2º tempo no painel direito (após o gap)', async () => {
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
    expect(Number(rects[1].attributes('x'))).toBeCloseTo(P2_SYMMETRIC, 1) // 2ºT 46' -> rel 1, após W1+gap
  })

  it('gol do 2º tempo posiciona no painel direito', async () => {
    const wrapper = await mountSuspended(MomentumChart, {
      props: {
        bars: [{ minute: 46, half: 2, home: 0.5, away: 0 }],
        goals: [{ minute: 46, half: 2, stoppage_time: 0, team: 'home', player: 'X' }],
      },
    })
    expect(Number(wrapper.find('circle').attributes('cx'))).toBeCloseTo(P2_SYMMETRIC + 2.5, 1)
  })

  it("clampa gol além do painel (90+6')", async () => {
    const wrapper = await mountSuspended(MomentumChart, {
      props: {
        bars: [{ minute: 96, half: 2, home: 0.5, away: 0 }],
        goals: [{ minute: 96, half: 2, stoppage_time: 0, team: 'home', player: 'X' }],
      },
    })
    // h1Len=45, h2Len=50, STEP=632/95≈6.6526, W1≈299.37, P2≈307.37; rel clampado em 50
    const cx = Number(wrapper.find('circle').attributes('cx'))
    expect(cx).toBeCloseTo(45 * (632 / 95) + 8 + 49 * (632 / 95) + 2.5, 1) // P2 + 49*STEP + 2.5
  })

  it('barra sem half cai no mapeamento legado', async () => {
    const wrapper = await mountSuspended(MomentumChart, {
      props: { bars: [{ minute: 60, home: 0.5, away: 0 }] },
    })
    // legado: h1Len=50 (clamp), h2Len=45, STEP=632/95≈6.6526
    const x = Number(wrapper.find('rect.momentum-bar').attributes('x'))
    expect(x).toBeCloseTo(59 * (632 / 95), 1) // (60-1)*STEP
  })

  it('ticks 15/30/45 no 1ºT e 50/75/90 no 2ºT', async () => {
    const wrapper = await mountSuspended(MomentumChart, {
      props: { bars: [{ minute: 1, half: 1, home: 0.5, away: 0 }] },
    })
    const labels = wrapper.findAll('text').map((t) => t.text())
    expect(labels).toEqual(["15'", "30'", "45'", "50'", "75'", "90'"])
  })

  it('fundo zinc-800 nos dois painéis, separados pelo gap', async () => {
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
    expect(rects[0].attributes('fill')).toBe('#27272a')
    expect(rects[0].attributes('x')).toBe('0')
    expect(Number(rects[0].attributes('width'))).toBeCloseTo(45 * (632 / 90), 1) // W1
    expect(rects[1].attributes('fill')).toBe('#27272a')
    expect(Number(rects[1].attributes('x'))).toBeCloseTo(P2_SYMMETRIC, 1) // após o gap
    expect(Number(rects[1].attributes('width'))).toBeCloseTo(45 * (632 / 90), 1) // W2
    expect(wrapper.html()).not.toContain('stroke-dasharray')
  })

  it('painéis flexíveis: 1ºT 47 e 2ºT 50 desloca o gap para ~314', async () => {
    const wrapper = await mountSuspended(MomentumChart, {
      props: {
        bars: [
          { minute: 47, half: 1, home: 0.5, away: 0 },
          { minute: 95, half: 2, home: 0, away: 0.8 },
        ],
      },
    })
    const rects = wrapper.findAll('rect')
    // h1Len=47, h2Len=50, STEP=632/97≈6.5155, W1≈306.23, P2≈314.23
    const p2 = Number(rects[1].attributes('x'))
    expect(p2).toBeCloseTo(47 * (632 / 97) + 8, 1)
    expect(Number(rects[1].attributes('width'))).toBeCloseTo(50 * (632 / 97), 1) // W2
  })

  it('jogo ao vivo no 1ºT (minuto 30): gap fica no meio (mínimo 45)', async () => {
    const wrapper = await mountSuspended(MomentumChart, {
      props: {
        bars: [{ minute: 30, half: 1, home: 0.5, away: 0 }],
      },
    })
    const rects = wrapper.findAll('rect')
    expect(Number(rects[1].attributes('x'))).toBeCloseTo(P2_SYMMETRIC, 1) // h1Len=45, h2Len=45
  })
})
