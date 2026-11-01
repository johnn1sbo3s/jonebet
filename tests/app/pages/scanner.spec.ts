// @vitest-environment nuxt
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { ref } from 'vue'
import ScannerPage from '~/pages/scanner.vue'
import { useFavorites } from '~/composables/useFavorites'

const unlockSound = vi.fn(async () => true)
vi.mock('~/utils/alertSound.js', () => ({
  unlockSound: (...args) => unlockSound(...args),
  playPreset: vi.fn(),
  previewPreset: vi.fn(),
  isSoundReady: () => false,
}))

vi.mock('~/composables/useModelApi.js', async () => ({
  useDailyBets: () => ({ data: ref({ bets: [] }) }),
}))

vi.mock('~/composables/useXgHistory.js', () => ({
  useXgHistory: () => ({ requestRefresh: vi.fn() }),
}))

// Long polling: a 1ª requisição entrega um snapshot (a página precisa de jogos);
// as seguintes ficam pendentes — nada de rede no teste.
const GAME = {
  id: 'g1',
  finished: false,
  league: 'Série A',
  home: 'Casa',
  away: 'Fora',
  score: { home: 0, away: 0 },
  minute: 10,
  status: "10'",
  stats: {},
  momentum: [],
}
const h = vi.hoisted(() => ({ fetchMock: vi.fn(), polls: 0 }))
h.fetchMock.mockImplementation(() =>
  h.polls++ === 0
    ? Promise.resolve({ version: 1, generated_at: '2026-10-03T20:00:00-03:00', games: [GAME] })
    : new Promise(() => {}),
)
mockNuxtImport('$fetch', () => h.fetchMock)

// O poll é assíncrono: dá um macroturno para o snapshot ser aplicado.
async function flushSnapshot() {
  for (let i = 0; i < 5; i++) await new Promise((r) => setTimeout(r, 0))
}

// O card não é o alvo: só a seção de favoritos da página interessa.
const STUBS = { ScannerCard: { template: '<div />' } }

const GESTURES = ['pointerdown', 'keydown']

// Espiona o par add/remove de window para saber quais handlers de gesto estão
// vivos: add conta, remove desconta por referência.
function spyGestureListeners() {
  const live = []
  const origAdd = window.addEventListener.bind(window)
  const origRemove = window.removeEventListener.bind(window)
  const added = []

  window.addEventListener = (type, handler, opts) => {
    if (GESTURES.includes(type)) {
      added.push({ type, handler })
      live.push({ type, handler })
    }
    return origAdd(type, handler, opts)
  }
  window.removeEventListener = (type, handler, opts) => {
    if (GESTURES.includes(type)) {
      const i = live.findIndex((l) => l.type === type && l.handler === handler)
      if (i >= 0) live.splice(i, 1)
    }
    return origRemove(type, handler, opts)
  }

  return {
    added,
    live,
    restore: () => {
      window.addEventListener = origAdd
      window.removeEventListener = origRemove
    },
  }
}

// localStorage "bloqueado" (política de privacidade / Safari restrito): todo
// acesso lança, como no navegador real nesse cenário.
function blockStorage() {
  const boom = () => {
    throw new Error('storage bloqueado')
  }
  const fake = { getItem: boom, setItem: boom, removeItem: boom, clear: boom, key: boom, length: 0 }
  const original = globalThis.localStorage
  Object.defineProperty(globalThis, 'localStorage', { value: fake, configurable: true, writable: true })
  return () =>
    Object.defineProperty(globalThis, 'localStorage', { value: original, configurable: true, writable: true })
}

beforeEach(() => {
  unlockSound.mockClear()
  h.polls = 0
  localStorage.clear()
})

describe('scanner: estilo do gráfico', () => {
  const CHART_STUBS = {
    ScannerCard: { props: ['chartStyle'], template: '<div class="card-stub" :data-style="chartStyle" />' },
  }

  async function mountTwoGames() {
    const original = h.fetchMock.getMockImplementation()
    h.fetchMock.mockImplementation(() =>
      h.polls++ === 0
        ? Promise.resolve({
            version: 1,
            generated_at: '2026-10-03T20:00:00-03:00',
            games: [GAME, { ...GAME, id: 'g2', home: 'Outro' }],
          })
        : new Promise(() => {}),
    )
    const wrapper = await mountSuspended(ScannerPage, { global: { stubs: CHART_STUBS } })
    await flushSnapshot()
    h.fetchMock.mockImplementation(original)
    return wrapper
  }

  it('abre em barras e troca todos os cards para área de uma vez', async () => {
    const wrapper = await mountTwoGames()
    const before = wrapper.findAll('.card-stub').map((card) => card.attributes('data-style'))
    expect(before.length).toBeGreaterThan(1)
    expect(new Set(before)).toEqual(new Set(['barras']))
    const areaButton = wrapper.findAll('button').find((button) => button.text() === 'Área')
    await areaButton.trigger('click')
    const after = wrapper.findAll('.card-stub').map((card) => card.attributes('data-style'))
    expect(new Set(after)).toEqual(new Set(['area']))
  })

  it('o estilo escolhido alcança favoritos e grade', async () => {
    const favorites = useFavorites()
    if (!favorites.isFavorite('g1')) favorites.toggleFavorite('g1', '2999-01-01')
    try {
      const wrapper = await mountTwoGames()
      expect(wrapper.find('section').findAll('.card-stub')).toHaveLength(1)
      const areaButton = wrapper.findAll('button').find((button) => button.text() === 'Área')
      await areaButton.trigger('click')
      const styles = wrapper.findAll('.card-stub').map((card) => card.attributes('data-style'))
      expect(styles).toHaveLength(2)
      expect(new Set(styles)).toEqual(new Set(['area']))
    } finally {
      if (favorites.isFavorite('g1')) favorites.toggleFavorite('g1')
    }
  })

  it('abre em área quando a preferência já está gravada', async () => {
    localStorage.setItem('dataPlay.scanner.chartStyle', 'area')
    const wrapper = await mountTwoGames()
    const styles = wrapper.findAll('.card-stub').map((card) => card.attributes('data-style'))
    expect(new Set(styles)).toEqual(new Set(['area']))
  })

  it('grava a preferência ao trocar o estilo', async () => {
    const wrapper = await mountTwoGames()
    const areaButton = wrapper.findAll('button').find((button) => button.text() === 'Área')
    await areaButton.trigger('click')
    expect(localStorage.getItem('dataPlay.scanner.chartStyle')).toBe('area')
    const barsButton = wrapper.findAll('button').find((button) => button.text() === 'Barras')
    await barsButton.trigger('click')
    expect(localStorage.getItem('dataPlay.scanner.chartStyle')).toBe('barras')
  })

  it('com storage bloqueado a tela monta e a troca vale na sessão', async () => {
    const restore = blockStorage()
    try {
      const wrapper = await mountTwoGames()
      const areaButton = wrapper.findAll('button').find((button) => button.text() === 'Área')
      await areaButton.trigger('click')
      const styles = wrapper.findAll('.card-stub').map((card) => card.attributes('data-style'))
      expect(new Set(styles)).toEqual(new Set(['area']))
    } finally {
      restore()
    }
  })
})

describe('scanner: listeners de window', () => {
  it('remove pointerdown/keydown no unmount, com a mesma referência', async () => {
    const spy = spyGestureListeners()
    const w = await mountSuspended(ScannerPage, { global: { stubs: STUBS } })

    // Registrados na montagem (comportamento atual, inalterado).
    expect(spy.added.map((l) => l.type)).toEqual(['pointerdown', 'keydown'])
    expect(spy.live).toHaveLength(2)

    w.unmount()

    expect(spy.live).toHaveLength(0)
    expect(spy.added.map((l) => l.type)).toEqual(['pointerdown', 'keydown'])
    spy.restore()
  })

  it('gesto na página continua destravando o áudio', async () => {
    localStorage.setItem('dataPlay.scanner.alertsSound', '1') // som ligado: o handler age
    const spy = spyGestureListeners()
    const w = await mountSuspended(ScannerPage, { global: { stubs: STUBS } })

    window.dispatchEvent(new Event('pointerdown'))
    window.dispatchEvent(new KeyboardEvent('keydown'))
    expect(unlockSound).toHaveBeenCalledTimes(2)

    unlockSound.mockClear()
    w.unmount()
    spy.restore()

    // Handler órfão não pode responder mais a gesto em outra página.
    window.dispatchEvent(new Event('pointerdown'))
    window.dispatchEvent(new KeyboardEvent('keydown'))
    expect(unlockSound).not.toHaveBeenCalled()
  })

  it('N idas/voltas não acumulam listeners', async () => {
    const spy = spyGestureListeners()
    for (let i = 0; i < 3; i++) {
      const w = await mountSuspended(ScannerPage, { global: { stubs: STUBS } })
      w.unmount()
    }
    expect(spy.live).toHaveLength(0)
    expect(spy.added).toHaveLength(6)
    spy.restore()
  })
})

describe('scanner: storage indisponível', () => {
  it('monta sem erro com storage bloqueado', async () => {
    const restore = blockStorage()
    try {
      const w = await mountSuspended(ScannerPage, { global: { stubs: STUBS } })
      expect(w.exists()).toBe(true)
      w.unmount()
    } finally {
      restore()
    }
  })

  it('favoritar e colapsar favoritos funcionam na sessão com storage bloqueado', async () => {
    const restore = blockStorage()
    try {
      const { useFavorites } = await import('~/composables/useFavorites')
      const f = useFavorites()
      f.toggleFavorite(GAME.id) // escrita bloqueada: erro não pode escapar
      expect(f.isFavorite(GAME.id)).toBe(true)

      const w = await mountSuspended(ScannerPage, { global: { stubs: STUBS } })
      await flushSnapshot()
      const header = w.find('header[aria-controls="favorites-collapse"]')
      expect(header.exists()).toBe(true)
      expect(header.attributes('aria-expanded')).toBe('true')

      await header.trigger('click') // persiste o colapso: idem, sem lançar
      expect(header.attributes('aria-expanded')).toBe('false')
      w.unmount()
    } finally {
      restore()
    }
  })
})
describe('scanner: relatório de amanhã reage ao relógio', () => {
  it('aba aberta às 22:59 ganha o link ao cruzar 23h, sem reload', async () => {
    vi.useFakeTimers()
    try {
      vi.setSystemTime(new Date('2026-10-03T22:59:00-03:00'))
      const w = await mountSuspended(ScannerPage, { global: { stubs: STUBS } })
      expect(w.find('a[href*="date=2026-10-04"]').exists()).toBe(false)

      await vi.advanceTimersByTimeAsync(90_000) // 23:00:30
      const link = w.find('a[href*="date=2026-10-04"]')
      expect(link.exists()).toBe(true)
      expect(link.text()).toContain('Relatório de amanhã')
      w.unmount()
    } finally {
      vi.useRealTimers()
    }
  })

  it('aba montada depois das 23h já mostra o link (comportamento inalterado)', async () => {
    vi.useFakeTimers()
    try {
      vi.setSystemTime(new Date('2026-10-03T23:30:00-03:00'))
      const w = await mountSuspended(ScannerPage, { global: { stubs: STUBS } })
      const link = w.find('a[href*="date=2026-10-04"]')
      expect(link.exists()).toBe(true)
      w.unmount()
    } finally {
      vi.useRealTimers()
    }
  })
})

describe('scanner: encoding do parâmetro v do long-polling', () => {
  it('codifica a version do snapshot sem injetar parâmetro na query', async () => {
    const original = h.fetchMock.getMockImplementation()
    h.fetchMock.mockClear()
    h.polls = 0
    // 1ª requisição entrega uma version com caracteres especiais; a 2ª fica
    // pendente, então a URL do 2º poll é a última chamada registrada.
    h.fetchMock.mockImplementation(() =>
      h.polls++ === 0
        ? Promise.resolve({ version: '7&evil=1 #x', generated_at: '2026-10-03T20:00:00-03:00', games: [GAME] })
        : Promise.withResolvers().promise,
    )
    try {
      const w = await mountSuspended(ScannerPage, { global: { stubs: STUBS } })
      await flushSnapshot()

      expect(h.fetchMock.mock.calls[0][0]).toBe('https://scanner.jonebet.xyz/live.json')
      const polled = h.fetchMock.mock.calls[1][0]
      expect(polled).toContain('v=7%26evil%3D1%20%23x')
      const parsed = new URL(polled)
      expect(parsed.searchParams.get('v')).toBe('7&evil=1 #x')
      expect(parsed.searchParams.get('evil')).toBeNull()
      w.unmount()
    } finally {
      h.fetchMock.mockImplementation(original)
    }
  })
})

// O bloco de status segura a largura no pior caso justamente para a idade do dado
// (que reescreve a cada segundo) nunca empurrar a bolinha nem os botões ao lado.
describe('scanner: bloco de status com largura reservada', () => {
  it('reserva largura fixa e usa dígitos tabulares na idade do dado', async () => {
    const w = await mountSuspended(ScannerPage, { global: { stubs: STUBS } })
    await flushSnapshot()

    const block = w.find('[data-status-block]')
    expect(block.classes()).toContain('w-[8.5rem]')

    const age = block.find('[data-age-seq]')
    expect(age.classes()).toContain('tabular-nums')
    // 6ch comporta "há 100:00" (3 dígitos de minuto), que a tabular sozinha não
    // segura — ela uniformiza os dígitos, não a contagem deles.
    const slot = block.find('[data-status-slot]')
    expect(slot.classes()).toContain('w-[6ch]')
    // O número anima ABSOLUTO dentro de um slot único: sem isso, durante os 200ms do
    // reset os dois valores coexistem no fluxo e o novo abre uma segunda coluna,
    // estourando a largura reservada antes de voltar.
    expect(slot.classes()).toContain('relative')
    expect(age.classes()).toContain('absolute')
    expect(age.element.closest('[data-status-slot]')).toBe(slot.element)
    w.unmount()
  })

  it('mantém a idade de 2 dígitos de minuto dentro do slot reservado', async () => {
    // 10 minutos de idade = "há 10:0x", o pior caso de 2 dígitos; o slot de 6ch é o
    // que também comporta o de 3. A largura reservada é o que impede o texto de sair.
    const original = h.fetchMock.getMockImplementation()
    h.fetchMock.mockImplementation(() => {
      if (h.polls++ === 0)
        return Promise.resolve({
          version: 1,
          generated_at: new Date(Date.now() - 600_000).toISOString(),
          games: [GAME],
        })
      return Promise.withResolvers().promise
    })
    try {
      const w = await mountSuspended(ScannerPage, { global: { stubs: STUBS } })
      await flushSnapshot()

      const age = w.find('[data-age-seq]')
      expect(age.text().trim()).toMatch(/^há 10:0\d$/)
      expect(w.find('[data-status-slot]').classes()).toContain('w-[6ch]')
      w.unmount()
    } finally {
      h.fetchMock.mockImplementation(original)
    }
  })

  it('não anima a cada tick: só quando entra snapshot novo', async () => {
    const original = h.fetchMock.getMockImplementation()
    h.fetchMock.mockImplementation(() => {
      const n = h.polls++
      if (n === 0) return Promise.resolve({ version: 1, generated_at: '2026-10-03T20:00:00-03:00', games: [GAME] })
      if (n === 1) return Promise.resolve({ version: 2, generated_at: '2026-10-03T20:00:05-03:00', games: [GAME] })
      return Promise.withResolvers().promise
    })
    try {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2026-10-03T20:00:10-03:00'))
      const w = await mountSuspended(ScannerPage, { global: { stubs: STUBS } })
      await vi.advanceTimersByTimeAsync(50)

      // 2º snapshot: a geração avança, e é ela que dispara o deslocamento vertical.
      const afterReset = w.find('[data-age-seq]')
      expect(afterReset.attributes('data-age-seq')).toBe('2')

      // Ticks seguintes reescrevem o texto no lugar — mesmo nó, mesma geração, sem animação.
      const seqBefore = afterReset.attributes('data-age-seq')
      await vi.advanceTimersByTimeAsync(5_000)
      expect(w.find('[data-age-seq]').attributes('data-age-seq')).toBe(seqBefore)
      w.unmount()
    } finally {
      vi.useRealTimers()
      h.fetchMock.mockImplementation(original)
    }
  })

  it('primeiro carregamento deixa o bloco vazio na largura reservada, sem skeleton', async () => {
    const original = h.fetchMock.getMockImplementation()
    h.fetchMock.mockImplementation(() => Promise.withResolvers().promise)
    try {
      const w = await mountSuspended(ScannerPage, { global: { stubs: STUBS } })

      const block = w.find('[data-status-block]')
      expect(block.classes()).toContain('w-[8.5rem]')
      expect(block.find('[data-status-age]').text()).toBe('')
      // USkeleton usa animate-pulse; o header não tem mais um esquelho próprio —
      // a página inteira já cobre o primeiro carregamento.
      expect(block.find('[class*="animate-pulse"]').exists()).toBe(false)
      w.unmount()
    } finally {
      h.fetchMock.mockImplementation(original)
    }
  })

  it('offline troca a bolinha para laranja e tira o texto visível', async () => {
    const original = h.fetchMock.getMockImplementation()
    // Snapshot chega, depois a rede cai: é o caso em que a idade do dado continua
    // aparecendo ao lado do sinal de offline.
    h.fetchMock.mockImplementation(() =>
      h.polls++ === 0
        ? Promise.resolve({ version: 1, generated_at: '2026-10-03T20:00:00-03:00', games: [GAME] })
        : Promise.reject(new Error('offline')),
    )
    try {
      const w = await mountSuspended(ScannerPage, { global: { stubs: STUBS } })
      await flushSnapshot()

      const block = w.find('[data-status-block]')
      const dot = block.find('[data-status-dot]')
      expect(dot.find('.bg-orange-400').exists()).toBe(true)
      expect(dot.find('.bg-teal-400').exists()).toBe(false)
      // A bolinha continua pulsando offline — só a cor mudou.
      expect(dot.find('.animate-ping').exists()).toBe(true)

      // O texto visível não menciona offline…
      const visible = block.find('[data-status-age]').text()
      expect(visible).not.toContain('sem conexão')
      // …e a idade do dado continua lá, que é quando ela mais importa.
      expect(visible).toMatch(/Atualizado\s*há\s*\d+:\d\d/)
      // Para o leitor de tela o estado segue disponível, sem aria-live para não
      // anunciar uma vez por segundo.
      expect(block.find('.sr-only').text()).toContain('sem conexão')
      expect(block.find('[aria-live]').exists()).toBe(false)
      w.unmount()
    } finally {
      h.fetchMock.mockImplementation(original)
    }
  })
})
