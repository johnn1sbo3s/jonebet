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
    expect(wrapper.text()).toContain('2 - 1')
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

  it('sem glow e com verso vazio quando não há notificações', async () => {
    const wrapper = await mountSuspended(ScannerCard, { props: { game: game([]) } })
    expect(wrapper.find('.glow-card').exists()).toBe(false)
    expect(wrapper.text()).toContain('Sem notificações neste jogo ainda')
  })

  it('renderiza odds pré-live e live quando presentes', async () => {
    const wrapper = await mountSuspended(ScannerCard, {
      props: {
        game: {
          ...game(),
          odds: {
            prematch: { home: 1.67, draw: 4.4, away: 5.5, over25: 2.18, btts: 1.83 },
            live: { home: 1.7, draw: 3.75, away: 5.6, over25: 2.15, btts: 2.22 },
          },
        },
      },
    })
    expect(wrapper.text()).toContain('1.67')
    expect(wrapper.text()).toContain('O 2.18')
    expect(wrapper.text()).toContain('BTTS 1.83')
    expect(wrapper.text()).toContain('O 2.15')
    expect(wrapper.text()).toContain('BTTS 2.22')
  })

  it('sem odds não renderiza a seção', async () => {
    const wrapper = await mountSuspended(ScannerCard, { props: { game: game() } })
    expect(wrapper.find('.flex.flex-col.gap-1').exists()).toBe(false)
    expect(wrapper.findAllComponents({ name: 'UBadge' })).toHaveLength(0)
  })

  it('odds nulos pulam os badges', async () => {
    const wrapper = await mountSuspended(ScannerCard, {
      props: {
        game: {
          ...game(),
          odds: {
            prematch: { home: 1.67, draw: null, away: null, over25: null, btts: null },
            live: {},
          },
        },
      },
    })
    expect(wrapper.text()).toContain('1.67')
    expect(wrapper.text()).not.toContain('BTTS')
    expect(wrapper.text()).not.toContain('O 2.18')
  })
})
