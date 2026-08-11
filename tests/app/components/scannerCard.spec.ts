// tests/app/components/scannerCard.spec.ts
// @vitest-environment nuxt
import { describe, it, expect, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import ScannerCard from '~/components/scannerCard.vue'

// Relativo ao relógio real: sempre "recente" (1 min atrás) em qualquer horário.
const RECENT = new Date(Date.now() - 60_000).toISOString()

function game(notifications = [], momentum = [{ minute: 1, home: 0.5, away: 0 }]) {
  return {
    id: 'abc123',
    flashscore_url: 'https://www.flashscore.com/match/abc123/',
    league: 'Brasileirão',
    home: 'Palmeiras',
    away: 'Flamengo',
    score: { home: 2, away: 1 },
    minute: 65,
    status: "65'",
    momentum,
    stats: {
      xg: { home: 1.8, away: 1.2 },
      possession: { home: 58, away: 42 },
      shots: { home: 14, away: 9 },
      big_chances: { home: 3, away: 2 },
      box_touches: { home: 11, away: 7 },
    },
    notifications,
  }
}

describe('ScannerCard', () => {
  it('renderiza times, placar, minuto e stats', async () => {
    const wrapper = await mountSuspended(ScannerCard, { props: { game: game() } })
    expect(wrapper.text()).toContain('Palmeiras')
    expect(wrapper.text()).toContain('Flamengo')
    expect(wrapper.text()).toContain('2 x 1')
    expect(wrapper.text()).toContain("65'")
    expect(wrapper.text()).toContain('POSSE')
  })

  it('aplica contorno âmbar + selo Alerta quando a notificação é recente', async () => {
    const wrapper = await mountSuspended(ScannerCard, {
      props: {
        game: game([{ rule: 'regra_jogo_quente', label: 'Jogo quente', minute: 62, at: RECENT }]),
      },
    })
    expect(wrapper.find('.alert-recent').exists()).toBe(true)
    expect(wrapper.find('.alert-tag').text()).toBe('Alerta')
  })

  it('esconde o selo Alerta ao virar o card (verso)', async () => {
    const wrapper = await mountSuspended(ScannerCard, {
      props: {
        game: game([{ rule: 'regra_jogo_quente', label: 'Jogo quente', minute: 62, at: RECENT }]),
      },
    })
    expect(wrapper.find('.alert-tag').exists()).toBe(true)
    await wrapper.find('.perspective-distant').trigger('click')
    expect(wrapper.find('.alert-tag').exists()).toBe(false)
  })

  it('aplica luz viajante (hl-travel) quando highlighted (clique do Telegram)', async () => {
    const wrapper = await mountSuspended(ScannerCard, {
      props: { game: game([]), highlighted: true },
    })
    expect(wrapper.find('.hl-travel').exists()).toBe(true)
  })

  it('sem hl-travel quando highlighted é false', async () => {
    const wrapper = await mountSuspended(ScannerCard, {
      props: { game: game([]), highlighted: false },
    })
    expect(wrapper.find('.hl-travel').exists()).toBe(false)
  })

  it('mostra badge Encerrado para jogo finalizado', async () => {
    const wrapper = await mountSuspended(ScannerCard, {
      props: { game: { ...game(), finished: true } },
    })
    expect(wrapper.text()).toContain('Encerrado')
  })

  it.each(['HALF TIME', 'Half time', 'HT', 'Halftime', 'Intervalo', ' half-time '])(
    'mostra badge Intervalo em vez do minuto no halftime (status=%s)',
    async (status) => {
      const wrapper = await mountSuspended(ScannerCard, {
        props: { game: { ...game(), status } },
      })
      expect(wrapper.text()).toContain('Intervalo')
      expect(wrapper.text()).not.toContain("65'")
    },
  )

  it.each(['1ST HALF', '2nd Half', '2ND HALF'])('mantém o minuto em %s (não é intervalo)', async (status) => {
    const wrapper = await mountSuspended(ScannerCard, {
      props: { game: { ...game(), status } },
    })
    expect(wrapper.text()).toContain("65'")
    expect(wrapper.text()).not.toContain('Intervalo')
  })

  it('precedência: Encerrado ganha do Intervalo; status vazio mostra o minuto', async () => {
    const finished = await mountSuspended(ScannerCard, {
      props: { game: { ...game(), finished: true, status: 'Half time' } },
    })
    expect(finished.text()).toContain('Encerrado')
    expect(finished.text()).not.toContain('Intervalo')

    const noStatus = await mountSuspended(ScannerCard, {
      props: { game: { ...game(), status: undefined } },
    })
    expect(noStatus.text()).toContain("65'")
  })

  it('sem alerta e com verso vazio quando não há notificações', async () => {
    const wrapper = await mountSuspended(ScannerCard, { props: { game: game([]) } })
    expect(wrapper.find('.alert-recent').exists()).toBe(false)
    expect(wrapper.find('.alert-tag').exists()).toBe(false)
    expect(wrapper.text()).toContain('Sem notificações neste jogo ainda')
  })

  it('renderiza odds pré-live com labels em todas as colunas', async () => {
    const wrapper = await mountSuspended(ScannerCard, {
      props: {
        game: {
          ...game(),
          odds: {
            prematch: { home: 1.67, draw: 4.4, away: 5.5, over25: 2.18, btts: 1.83 },
          },
        },
      },
    })
    expect(wrapper.text()).toContain('1.67')
    expect(wrapper.text()).toContain('2.18')
    expect(wrapper.text()).toContain('1.83')
    expect(wrapper.text()).toContain('Casa')
    expect(wrapper.text()).toContain('Empate')
    expect(wrapper.text()).toContain('Fora')
    expect(wrapper.text()).toContain('O2.5')
    expect(wrapper.text()).toContain('BTTS')
    // 6 = 5 colunas de odds + badge de minuto (também UBadge)
    const badges = wrapper.findAllComponents({ name: 'UBadge' })
    expect(badges).toHaveLength(6)
  })

  it('sem odds não renderiza a seção', async () => {
    const wrapper = await mountSuspended(ScannerCard, { props: { game: game() } })
    expect(wrapper.find('.grid.grid-cols-\\[1fr_1fr_1fr_0\\.85fr_0\\.85fr\\]').exists()).toBe(false)
    // só a badge de minuto — as de odds não existem sem dados
    expect(wrapper.findAllComponents({ name: 'UBadge' })).toHaveLength(1)
  })

  it('sem secundários mostra O2.5/BTTS com "-" nas colunas fixas', async () => {
    const wrapper = await mountSuspended(ScannerCard, {
      props: {
        game: {
          ...game(),
          odds: {
            prematch: { home: 1.67, draw: 4.4, away: 5.5, over25: null, btts: null },
          },
        },
      },
    })
    expect(wrapper.text()).toContain('1.67')
    expect(wrapper.text()).toContain('Casa')
    expect(wrapper.text()).toContain('Empate')
    expect(wrapper.text()).toContain('Fora')
    expect(wrapper.text()).toContain('O2.5')
    expect(wrapper.text()).toContain('BTTS')
    // 6 = 5 colunas de odds + badge de minuto; O2.5/BTTS são as 2 últimas
    const badges = wrapper.findAllComponents({ name: 'UBadge' })
    expect(badges).toHaveLength(6)
    expect(badges[4].text()).toBe('-')
    expect(badges[5].text()).toBe('-')
  })
})

// Mock do composable com estado REATIVO (objeto plano não invalida computed).
vi.mock('~/composables/useAiEvaluation', async () => {
  const { reactive } = await import('vue')
  const state = reactive({ status: 'idle', response: null, fetchedAt: 0, error: null })
  return {
    useAiEvaluation: () => ({
      get: () => state,
      evaluate: vi.fn(async () => {
        state.status = 'done'
        state.response = {
          jogo_id: 'abc123',
          leitura_geral: 'O Palmeiras pressiona.',
          estrategias: [{ estrategia: 'gol_20min', recomendacao: 'entrar', confianca: 60, analise: 'ação alta' }],
        }
        return state.response
      }),
    }),
  }
})

describe('ScannerCard avaliação com IA', () => {
  it('mostra botão Avaliar apenas em jogos ao vivo', async () => {
    const live = await mountSuspended(ScannerCard, { props: { game: game() } })
    expect(live.text()).toContain('Avaliar com IA')
    const fin = await mountSuspended(ScannerCard, { props: { game: { ...game(), finished: true } } })
    expect(fin.text()).not.toContain('Avaliar com IA')
  })

  it('abre o popover com a resposta ao clicar', async () => {
    const w = await mountSuspended(ScannerCard, { props: { game: game() } })
    const btn = w.findAll('button').find((b) => b.text().includes('Avaliar com IA'))!
    await btn.trigger('click')
    await new Promise((r) => setTimeout(r, 0))
    expect(w.text()).toContain('O Palmeiras pressiona.')
    expect(w.text()).toContain('Gol 20min')
  })
})

// Cenário mutável para o mock do composable de pré-jogo (vi.mock é hoisted —
// não pode referenciar variáveis do escopo; vi.hoisted resolve isso).
const preGameScenario = vi.hoisted(() => ({ response: null, error: null }))

vi.mock('~/composables/usePreGameAnalysis', async () => {
  const { reactive } = await import('vue')
  return {
    usePreGameAnalysis: () => {
      const state = reactive({ status: 'idle', response: null, fetchedAt: 0, error: null })
      return {
        get: () => state,
        load: vi.fn(async () => {
          state.error = null
          if (preGameScenario.error) {
            state.status = 'error'
            state.error = new Error(preGameScenario.error)
            throw state.error
          }
          state.status = 'done'
          state.response = preGameScenario.response
          return state.response
        }),
      }
    },
  }
})

describe('ScannerCard análise pré-jogo', () => {
  it('mostra o botão Análise pré-jogo apenas em jogos ao vivo', async () => {
    const live = await mountSuspended(ScannerCard, { props: { game: game() } })
    expect(live.text()).toContain('Análise pré-jogo')
    const fin = await mountSuspended(ScannerCard, { props: { game: { ...game(), finished: true } } })
    expect(fin.text()).not.toContain('Análise pré-jogo')
  })

  it('abre o modal com a análise pré-jogo ao clicar', async () => {
    preGameScenario.response = {
      time: '16:30',
      leitura_geral: 'Jogo equilibrado, poucos gols esperados.',
      estrategias: [
        { estrategia: 'lay_1x0', recomendacao: 'entrar', confianca: 78, analise: '1-0 é raridade no histórico' },
      ],
    }
    const w = await mountSuspended(ScannerCard, { props: { game: game() } })
    const btn = w.findAll('button').find((b) => b.text().includes('Análise pré-jogo'))!
    await btn.trigger('click')
    await new Promise((r) => setTimeout(r, 0))
    expect(w.text()).toContain('Análise pré-jogo · 16:30')
    expect(w.text()).toContain('Jogo equilibrado, poucos gols esperados.')
    expect(w.text()).toContain('Lay 1x0')
    expect(w.text()).toContain('entrar · 78%')
  })

  it('fecha o modal pelo botão ✕', async () => {
    preGameScenario.response = { time: '16:30', leitura_geral: 'Conteúdo X', estrategias: [] }
    const w = await mountSuspended(ScannerCard, { props: { game: game() } })
    const btn = w.findAll('button').find((b) => b.text().includes('Análise pré-jogo'))!
    await btn.trigger('click')
    await new Promise((r) => setTimeout(r, 0))
    expect(w.text()).toContain('Conteúdo X')
    const close = w.findAll('button').find((b) => b.text() === '✕')!
    await close.trigger('click')
    expect(w.text()).not.toContain('Conteúdo X')
  })

  it('mostra estado vazio quando o jogo não tem análise pré-jogo', async () => {
    preGameScenario.response = null
    const w = await mountSuspended(ScannerCard, { props: { game: game() } })
    const btn = w.findAll('button').find((b) => b.text().includes('Análise pré-jogo'))!
    await btn.trigger('click')
    await new Promise((r) => setTimeout(r, 0))
    expect(w.text()).toContain('Sem análise pré-jogo para este jogo.')
  })

  it('mostra erro com Tentar de novo; retry carrega a análise', async () => {
    preGameScenario.response = null
    preGameScenario.error = 'offline'
    const w = await mountSuspended(ScannerCard, { props: { game: game() } })
    const btn = w.findAll('button').find((b) => b.text().includes('Análise pré-jogo'))!
    await btn.trigger('click')
    await new Promise((r) => setTimeout(r, 0))
    expect(w.text()).toContain('Não foi possível carregar a análise pré-jogo.')

    preGameScenario.error = null
    preGameScenario.response = { time: '16:30', leitura_geral: 'Recuperou', estrategias: [] }
    const retry = w.findAll('button').find((b) => b.text().includes('Tentar de novo'))!
    await retry.trigger('click')
    await new Promise((r) => setTimeout(r, 0))
    expect(w.text()).toContain('Recuperou')
  })
})
