// tests/app/components/momentumChart.spec.ts
// @vitest-environment nuxt
import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import MomentumChart from '~/components/momentumChart.vue'

// Geometria: viewBox 640, PAD=10 lateral (ícones do minuto 1/limite não
// cortam), GAP=8 entre painéis, STEP=(640-20-8)/(h1Len+h2Len).
// Caso simétrico 45+45: STEP=612/90≈6.8, P2=10+306+8=324.
const P2_SYMMETRIC = 10 + 45 * (612 / 90) + 8 // = 324

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

  it('faixa: gol vira bola e chute C2 vira bola numerada', async () => {
    const wrapper = await mountSuspended(MomentumChart, {
      props: {
        bars: [{ minute: 43, home: 0.5, away: 0 }],
        goals: [{ minute: 43, stoppage_time: 0, team: 'home', player: 'x' }],
        shots: [{ minute: 35, team: 'home', tier: 'C2', xg_delta: 0.3, label: 'Boa chance' }],
        notifications: [],
      },
    })
    expect(wrapper.findAll('.lane-shot').length).toBe(1)
    expect(wrapper.find('.lane-shot text').text()).toBe('C2')
  })

  it('gol e chute do mesmo minuto vão pra trilhas separadas', async () => {
    const wrapper = await mountSuspended(MomentumChart, {
      props: {
        bars: [{ minute: 43, home: 0.5, away: 0 }],
        goals: [{ minute: 43, stoppage_time: 0, team: 'home', player: 'x' }],
        shots: [{ minute: 43, team: 'home', tier: 'C2', xg_delta: 0.3, label: 'Boa chance' }],
        notifications: [],
      },
    })
    expect(wrapper.find('.lane-goal').exists()).toBe(true)
    expect(wrapper.find('.lane-shot').exists()).toBe(true)
    expect(wrapper.find('.lane-more').exists()).toBe(false)
  })

  it('casa em cima, fora embaixo', async () => {
    const wrapper = await mountSuspended(MomentumChart, {
      props: {
        bars: [{ minute: 10, home: 0.5, away: 0.2 }],
        goals: [],
        shots: [
          { minute: 10, team: 'home', tier: 'C2', xg_delta: 0.3, label: 'Boa chance' },
          { minute: 30, team: 'away', tier: 'C1', xg_delta: 0.6, label: 'Grande chance' },
        ],
        notifications: [],
      },
    })
    const homeCy = Number(wrapper.find('.lane-shot circle[r="10"]').attributes('cy'))
    const awayCy = Number(wrapper.findAll('.lane-shot circle[r="10"]')[1].attributes('cy'))
    expect(homeCy).toBeLessThan(100)
    expect(awayCy).toBeGreaterThan(150)
  })

  it('vizinhos da mesma trilha fundem num marcador só com os dois minutos no popover', async () => {
    const wrapper = await mountSuspended(MomentumChart, {
      props: {
        bars: [
          { minute: 42, home: 0.5, away: 0 },
          { minute: 43, home: 0.6, away: 0 },
        ],
        goals: [],
        shots: [
          { minute: 42, team: 'home', tier: 'C2', xg_delta: 0.3, label: 'Boa chance' },
          { minute: 43, team: 'home', tier: 'C2', xg_delta: 0.3, label: 'Boa chance' },
        ],
        notifications: [],
      },
    })
    expect(wrapper.findAll('.lane-shot')).toHaveLength(1)
    await wrapper.find('.lane-shot').trigger('mouseenter')
    expect(wrapper.find('.lane-pop').text()).toContain("42'")
    expect(wrapper.find('.lane-pop').text()).toContain("43'")
  })

  it('faixa 0.4: tracejados do limiar', async () => {
    const wrapper = await mountSuspended(MomentumChart, {
      props: { bars: [{ minute: 10, home: 0.5, away: 0 }] },
    })
    expect(wrapper.findAll('.lane-threshold')).toHaveLength(2)
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
    expect(rects[0].attributes('x')).toBe('10') // 1ºT minuto 1 (após o PAD)
    expect(Number(rects[1].attributes('x'))).toBeCloseTo(P2_SYMMETRIC, 1) // 2ºT 46' -> rel 1, após W1+gap
  })

  it('barra sem half cai no mapeamento legado', async () => {
    const wrapper = await mountSuspended(MomentumChart, {
      props: { bars: [{ minute: 60, home: 0.5, away: 0 }] },
    })
    // legado: h1Len=50 (clamp), h2Len=45, STEP=612/95≈6.4421
    const x = Number(wrapper.find('rect.momentum-bar').attributes('x'))
    expect(x).toBeCloseTo(10 + 59 * (612 / 95), 1) // PAD + (60-1)*STEP
  })

  it('ticks 15/30/45 no 1ºT e 60/75/90 no 2ºT', async () => {
    const wrapper = await mountSuspended(MomentumChart, {
      props: { bars: [{ minute: 1, half: 1, home: 0.5, away: 0 }] },
    })
    const labels = wrapper.findAll('text').map((t) => t.text())
    expect(labels).toEqual(["15'", "30'", "45'", "60'", "75'", "90'"])
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
    expect(Number(rects[0].attributes('width'))).toBeCloseTo(10 + 45 * (612 / 90), 1) // PAD+W1
    expect(rects[1].attributes('fill')).toBe('#27272a')
    expect(Number(rects[1].attributes('x'))).toBeCloseTo(P2_SYMMETRIC, 1) // após o gap
    expect(Number(rects[1].attributes('width'))).toBeCloseTo(640 - P2_SYMMETRIC, 1) // até a borda
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
    // h1Len=47, h2Len=50, STEP=612/97≈6.3093, P2=10+W1+8≈314.54
    // (índice 0: fundo full-bleed; 1: 2º painel)
    const p2 = Number(rects[1].attributes('x'))
    expect(p2).toBeCloseTo(10 + 47 * (612 / 97) + 8, 1)
    expect(Number(rects[1].attributes('width'))).toBeCloseTo(640 - (10 + 47 * (612 / 97) + 8), 1) // até a borda
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

  it('hover no marcador abre o popover do minuto', async () => {
    const wrapper = await mountSuspended(MomentumChart, {
      props: {
        bars: [{ minute: 35, home: 0.79, away: 0.12 }],
        goals: [],
        shots: [{ minute: 35, team: 'home', tier: 'C2', xg_delta: 0.3, label: 'Boa chance' }],
        notifications: [],
      },
    })
    expect(wrapper.find('.lane-pop').exists()).toBe(false)
    await wrapper.find('.lane-shot').trigger('mouseenter')
    expect(wrapper.find('.lane-pop').exists()).toBe(true)
    expect(wrapper.find('.lane-pop').text()).toContain("35'")
    expect(wrapper.find('.lane-pop').text()).toContain('xG: 0.30')
    // PAD=10 → x=10+(35-1)*STEP=241.2, pct=37.69%
    expect(parseFloat(wrapper.find('.lane-pop').element.style.left)).toBeCloseTo(37.69, 1)
    await wrapper.find('.lane-shot').trigger('mouseleave')
    expect(wrapper.find('.lane-pop').exists()).toBe(false)
  })

  it('popover mostra título curto do alerta, não o label longo do backend', async () => {
    const wrapper = await mountSuspended(MomentumChart, {
      props: {
        bars: [{ minute: 35, home: 0.79, away: 0.12 }],
        goals: [],
        shots: [{ minute: 35, team: 'home', tier: 'C2', xg_delta: 0.3, label: 'Boa chance' }],
        notifications: [
          { rule: 'entrada_gol_ht', label: 'Gol HT — entrada pra gol antes do intervalo', minute: 35, at: 't' },
        ],
      },
    })
    await wrapper.find('.lane-alert').trigger('mouseenter')
    const pop = wrapper.find('.lane-pop')
    expect(pop.exists()).toBe(true)
    expect(pop.text()).toContain('Gol HT')
    expect(pop.text()).not.toContain('antes do intervalo')
  })

  it('chute+alerta desenha losango com +1, sem bolinha de chute', async () => {
    const wrapper = await mountSuspended(MomentumChart, {
      props: {
        bars: [{ minute: 35, home: 0.79, away: 0.12 }],
        goals: [],
        shots: [{ minute: 35, team: 'home', tier: 'C2', xg_delta: 0.3, label: 'Boa chance' }],
        notifications: [
          { rule: 'entrada_gol_ht', label: 'Gol HT — entrada pra gol antes do intervalo', minute: 35, at: 't' },
        ],
      },
    })
    expect(wrapper.find('.lane-alert').exists()).toBe(true)
    expect(wrapper.find('.lane-shot').exists()).toBe(false)
    expect(wrapper.find('.lane-more').exists()).toBe(true)
    expect(wrapper.find('.lane-more').text()).toBe('+1')
  })

  it('toque no marcador alterna o popover sem propagar o clique', async () => {
    const wrapper = await mountSuspended(MomentumChart, {
      props: {
        bars: [{ minute: 35, home: 0.79, away: 0.12 }],
        goals: [],
        shots: [{ minute: 35, team: 'home', tier: 'C2', xg_delta: 0.3, label: 'Boa chance' }],
        notifications: [],
      },
    })
    await wrapper.find('.lane-shot').trigger('click')
    expect(wrapper.find('.lane-pop').exists()).toBe(true)
    await wrapper.find('.lane-shot').trigger('click')
    expect(wrapper.find('.lane-pop').exists()).toBe(false)
  })

  it('hover na faixa de baixo abre o popover embaixo com conteúdo de fora', async () => {
    const wrapper = await mountSuspended(MomentumChart, {
      props: {
        bars: [{ minute: 30, home: 0.1, away: 0.7 }],
        goals: [],
        shots: [{ minute: 30, team: 'away', tier: 'C1', xg_delta: 0.6, label: 'Grande chance' }],
        notifications: [],
      },
    })
    await wrapper.find('.lane-shot').trigger('mouseenter')
    const pop = wrapper.find('.lane-pop')
    expect(pop.exists()).toBe(true)
    expect(pop.text()).toContain("30' Chute C1 - xG: 0.60")
    expect(pop.element.style.top).toBe('auto')
    expect(pop.element.style.bottom).toBe('18%')
    expect(pop.classes()).toContain('pointer-events-none')
  })

  it('chute desalinhado do gol gruda no minuto do gol', async () => {
    const wrapper = await mountSuspended(MomentumChart, {
      props: {
        bars: [
          { minute: 42, home: 0.5, away: 0 },
          { minute: 43, home: 0.6, away: 0 },
        ],
        goals: [{ minute: 43, stoppage_time: 0, team: 'home', player: 'x' }],
        shots: [{ minute: 42, team: 'home', tier: 'C2', xg_delta: 0.3, label: 'Boa chance' }],
        notifications: [],
      },
    })
    const goalCx = wrapper.find('.lane-goal circle[r="10"]').attributes('cx')
    const shotCx = wrapper.find('.lane-shot circle[r="10"]').attributes('cx')
    expect(shotCx).toBe(goalCx)
  })
})

describe('MomentumChart: estilo de área', () => {
  function yCoords(path) {
    const numbers = (path.match(/-?\d+(\.\d+)?/g) || []).map(Number)
    return numbers.filter((_, index) => index % 2 === 1)
  }

  it('desenha uma banda por trecho de domínio no lugar das barras', async () => {
    const wrapper = await mountSuspended(MomentumChart, {
      props: {
        chartStyle: 'area',
        bars: [
          { minute: 1, half: 1, home: 0.5, away: 0 },
          { minute: 2, half: 1, home: 0.6, away: 0 },
          { minute: 3, half: 1, home: 0, away: 0.7 },
          { minute: 4, half: 1, home: 0.4, away: 0 },
        ],
      },
    })
    expect(wrapper.findAll('rect.momentum-bar')).toHaveLength(0)
    const bands = wrapper.findAll('path.momentum-area')
    expect(bands).toHaveLength(3)
    expect(bands.map((band) => band.attributes('data-side'))).toEqual(['home', 'away', 'home'])
  })

  it('a banda começa já no valor do primeiro minuto do trecho', async () => {
    const wrapper = await mountSuspended(MomentumChart, {
      props: {
        chartStyle: 'area',
        bars: [
          { minute: 1, half: 1, home: 0.2, away: 0 },
          { minute: 2, half: 1, home: 0.9, away: 0 },
        ],
      },
    })
    const numbers = (
      wrapper
        .find('path.momentum-area')
        .attributes('d')
        .match(/-?\d+(\.\d+)?/g) || []
    ).map(Number)
    expect(numbers[1]).toBe(55)
    expect(numbers[3]).toBeCloseTo(55 - 0.2 * 55, 1)
  })

  it('banda de casa fica acima da central e a de fora abaixo, sem cruzar', async () => {
    const wrapper = await mountSuspended(MomentumChart, {
      props: {
        chartStyle: 'area',
        bars: [
          { minute: 1, half: 1, home: 0.95, away: 0 },
          { minute: 2, half: 1, home: 0, away: 0.95 },
        ],
      },
    })
    const [homeBand, awayBand] = wrapper.findAll('path.momentum-area')
    expect(Math.max(...yCoords(homeBand.attributes('d')))).toBeLessThanOrEqual(55)
    expect(Math.min(...yCoords(awayBand.attributes('d')))).toBeGreaterThanOrEqual(55)
    expect(homeBand.attributes('fill')).toBe('#2dd4bf')
    expect(awayBand.attributes('fill')).toBe('#3b82f6')
  })

  it('minuto sem domínio corta a banda em duas', async () => {
    const wrapper = await mountSuspended(MomentumChart, {
      props: {
        chartStyle: 'area',
        bars: [
          { minute: 1, half: 1, home: 0.5, away: 0 },
          { minute: 2, half: 1, home: 0, away: 0 },
          { minute: 3, half: 1, home: 0.6, away: 0 },
        ],
      },
    })
    expect(wrapper.findAll('path.momentum-area')).toHaveLength(2)
  })

  it('a banda termina no último minuto lido, sem ocupar o painel inteiro', async () => {
    const wrapper = await mountSuspended(MomentumChart, {
      props: {
        chartStyle: 'area',
        bars: [
          { minute: 1, half: 1, home: 0.5, away: 0 },
          { minute: 2, half: 1, home: 0.6, away: 0 },
        ],
      },
    })
    const d = wrapper.find('path.momentum-area').attributes('d')
    const xs = (d.match(/-?\d+(\.\d+)?/g) || []).map(Number).filter((_, index) => index % 2 === 0)
    expect(Math.max(...xs)).toBeLessThan(60)
  })

  it('banda do 2º tempo fica no painel direito', async () => {
    const wrapper = await mountSuspended(MomentumChart, {
      props: {
        chartStyle: 'area',
        bars: [{ minute: 46, half: 2, home: 0, away: 0.8 }],
      },
    })
    const d = wrapper.find('path.momentum-area').attributes('d')
    const xs = (d.match(/-?\d+(\.\d+)?/g) || []).map(Number).filter((_, index) => index % 2 === 0)
    expect(Math.min(...xs)).toBeGreaterThanOrEqual(P2_SYMMETRIC)
  })

  it('marcadores de gol e chute continuam na mesma posição no estilo de área', async () => {
    const props = {
      bars: [{ minute: 10, half: 1, home: 0.5, away: 0 }],
      goals: [{ minute: 10, half: 1, stoppage_time: 0, team: 'home', player: 'x' }],
      shots: [{ minute: 10, half: 1, team: 'home', tier: 'C2', xg_delta: 0.3, label: 'Boa chance' }],
    }
    const bars = await mountSuspended(MomentumChart, { props })
    const area = await mountSuspended(MomentumChart, { props: { ...props, chartStyle: 'area' } })
    expect(area.findAll('.lane-goal')).toHaveLength(1)
    expect(area.findAll('.lane-shot')).toHaveLength(1)
    expect(area.find('.lane-goal circle[r="10"]').attributes('cx')).toBe(
      bars.find('.lane-goal circle[r="10"]').attributes('cx'),
    )
  })

  it('sem minutos não desenha gráfico', async () => {
    const wrapper = await mountSuspended(MomentumChart, { props: { chartStyle: 'area', bars: [] } })
    expect(wrapper.find('svg').exists()).toBe(false)
    expect(wrapper.text()).toContain('aguardando dados do gráfico')
  })
})
