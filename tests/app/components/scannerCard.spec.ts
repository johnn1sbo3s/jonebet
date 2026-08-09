// tests/app/components/scannerCard.spec.ts
// @vitest-environment nuxt
import { describe, it, expect } from 'vitest'
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

  it('aplica glow quando a notificação mais recente está na janela', async () => {
    const wrapper = await mountSuspended(ScannerCard, {
      props: {
        game: game([{ rule: 'regra_jogo_quente', label: 'Jogo quente', minute: 62, at: RECENT }]),
      },
    })
    expect(wrapper.find('.glow-card').exists()).toBe(true)
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

  it('sem glow e com verso vazio quando não há notificações', async () => {
    const wrapper = await mountSuspended(ScannerCard, { props: { game: game([]) } })
    expect(wrapper.find('.glow-card').exists()).toBe(false)
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
