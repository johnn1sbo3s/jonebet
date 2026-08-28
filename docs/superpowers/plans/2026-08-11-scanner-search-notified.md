# Scanner — Search + "Only notified" toggle — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a client-side search field and an "only notified" toggle to the Scanner screen, filtering the main game grid without touching the backend.

**Architecture:** A new pure filter util (`filterScannerGames.js`) combines text search (home/away/league, case- and accent-insensitive) with the existing 5-minute "recent notification" check (`isRecentNotification` from `app/utils/scanner.js` — the same window as the card's amber "Alerta" glow). The page applies it only to the non-favorite grid; the favorites section stays unfiltered.

**Tech Stack:** Vue 3 SPA (Nuxt 4), Nuxt UI v4 (`UInput`, `USwitch`), Vitest. Plain JS only.

**Spec:** `docs/superpowers/specs/2026-08-11-scanner-search-notified-design.md` (local only — `docs/superpowers/` is gitignored by repo policy; do NOT commit the spec or this plan).

## Global Constraints

- Plain `<script setup>` JS only — no TypeScript in source files.
- Prettier: no semicolons, single quotes, trailing commas, 120 char width, `prettier-plugin-tailwindcss` class sorting. Pre-commit hook (`pnpm lint-staged`) formats/lints staged files — do NOT run `npx eslint` / `pnpm build` after every edit.
- "Notificação ativa" = most recent notification within the last **5 minutes** — import and reuse `isRecentNotification` from `app/utils/scanner.js`; never reimplement the window.
- Favorites section must stay **unfiltered** (user decision): only `otherGames` (the main grid) is filtered.
- **No "Limpar" button** (user rule): the search input clears by editing its text; the toggle clears by clicking it. No element that appears/disappears with `v-if` in the toolbar (layout shift).
- Filters are transient — NO persistence (no localStorage, no query params).
- Header total ("N jogos") stays the unfiltered total.
- Copy pt-BR: placeholder "Buscar time ou liga…", switch label "Só notificados", empty-filter message "Nenhum jogo corresponde ao filtro." (exact strings).
- Dev server: user's runs on port 3000 (never kill). Use `pnpm run dev --port 3001` for verification.
- The scanner page fetches the production snapshot (`scanner.jonebet.xyz/live.json`) — if no games are live during verification, serve the real live.json through a local proxy injecting example games (skill `scanner-snapshot-proxy-preview`) and point `NUXT_PUBLIC_SCANNER_SNAPSHOT_URL` at it.
- The site has an 18+ age-gate modal that blocks interaction on load — close it ("Entendo e sou maior de 18 anos") before interacting in the browser.

---

### Task 1: Pure filter util + unit tests

**Files:**
- Create: `app/utils/filterScannerGames.js`
- Test: `tests/app/utils/filterScannerGames.spec.ts`

**Interfaces:**
- Consumes: `normalizeSearchText` from `app/utils/filterReportGames.js`; `isRecentNotification(notifications, now?, windowMin?)` from `app/utils/scanner.js`.
- Produces: `filterScannerGames(games, { query = '', onlyNotified = false, now } = {}) -> games[]` — used by Task 2. `now` is passed through to `isRecentNotification` for deterministic tests; omit in production (defaults to `Date.now()`).

- [ ] **Step 1: Write the failing test**

```js
// tests/app/utils/filterScannerGames.spec.ts
import { describe, it, expect } from 'vitest'
import { filterScannerGames } from '~/utils/filterScannerGames.js'

const NOW = Date.parse('2026-08-11T20:00:00-03:00')

const notif = (at) => [{ rule: 'regra_jogo_quente', label: 'Jogo quente', minute: 62, at }]

const games = [
  {
    id: 'g1',
    home: 'São Paulo',
    away: 'Corinthians',
    league: 'Brasileirão Série A',
    notifications: notif('2026-08-11T19:59:00-03:00'), // 1 min atrás — recente
  },
  {
    id: 'g2',
    home: 'Talleres Córdoba',
    away: 'Lanús',
    league: 'Argentina Liga Profesional',
    notifications: notif('2026-08-11T19:49:00-03:00'), // 11 min atrás — antiga
  },
  { id: 'g3', home: 'Avaí', away: 'CRB', league: 'Brasil Brasileirão Série B', notifications: [] },
  {
    id: 'g4',
    home: 'Real Madrid',
    away: 'Betis',
    league: 'Espanha La Liga',
    notifications: notif('2026-08-11T19:55:00-03:00'), // exatamente 5 min — na janela (<=)
  },
]

describe('filterScannerGames', () => {
  it('sem filtro devolve todos os jogos', () => {
    expect(filterScannerGames(games, {})).toHaveLength(4)
  })

  it('busca casa por nome com acento', () => {
    expect(filterScannerGames(games, { query: 'sao' }).map((g) => g.id)).toEqual(['g1'])
  })

  it('busca ignora maiúsculas', () => {
    expect(filterScannerGames(games, { query: 'SAO PAULO' }).map((g) => g.id)).toEqual(['g1'])
  })

  it('busca casa com a liga', () => {
    expect(filterScannerGames(games, { query: 'série' }).map((g) => g.id)).toEqual(['g1', 'g3'])
  })

  it('busca casa com o time visitante', () => {
    expect(filterScannerGames(games, { query: 'lanus' }).map((g) => g.id)).toEqual(['g2'])
  })

  it('busca sem correspondência devolve vazio', () => {
    expect(filterScannerGames(games, { query: 'flamengo' })).toHaveLength(0)
  })

  it('busca só com espaços não filtra', () => {
    expect(filterScannerGames(games, { query: '   ' })).toHaveLength(4)
  })

  it('só notificados mantém notificação recente (≤5 min) e exclui antiga/sem notificação', () => {
    const ids = filterScannerGames(games, { onlyNotified: true, now: NOW }).map((g) => g.id)
    expect(ids).toEqual(['g1', 'g4'])
  })

  it('fronteira de 5 min: exatamente 5 min entra, 5 min + 1s sai', () => {
    const only = (at) => [{ rule: 'r', label: 'l', minute: 1, at }]
    const onWindow = filterScannerGames(
      [{ id: 'a', home: 'A', away: 'B', league: 'L', notifications: only(new Date(NOW - 5 * 60_000).toISOString()) }],
      { onlyNotified: true, now: NOW },
    )
    const offWindow = filterScannerGames(
      [{ id: 'b', home: 'A', away: 'B', league: 'L', notifications: only(new Date(NOW - 5 * 60_000 - 1000).toISOString()) }],
      { onlyNotified: true, now: NOW },
    )
    expect(onWindow).toHaveLength(1)
    expect(offWindow).toHaveLength(0)
  })

  it('busca e só notificados combinam (interseção)', () => {
    expect(filterScannerGames(games, { query: 'avai', onlyNotified: true, now: NOW })).toHaveLength(0)
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm vitest run tests/app/utils/filterScannerGames.spec.ts`
Expected: FAIL — `Cannot find module '~/utils/filterScannerGames.js'`

- [ ] **Step 3: Write the minimal implementation**

```js
// app/utils/filterScannerGames.js
// Filtro client-side dos jogos do scanner ao vivo: busca textual (time da
// casa, visitante e liga — sem diferenciar caixa nem acentos) + toggle
// "só notificados" (notificação nos últimos 5 min — a mesma janela do selo
// "Alerta" do card). Função pura, testada em tests/app/utils/.
import { normalizeSearchText } from '~/utils/filterReportGames'
import { isRecentNotification } from '~/utils/scanner'

export function filterScannerGames(games = [], { query = '', onlyNotified = false, now } = {}) {
  const q = normalizeSearchText(query)
  return games.filter((game) => {
    if (q) {
      const haystack = [game.home, game.away, game.league]
      if (!haystack.some((field) => normalizeSearchText(field).includes(q))) return false
    }
    if (onlyNotified && !isRecentNotification(game.notifications, now)) return false
    return true
  })
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm vitest run tests/app/utils/filterScannerGames.spec.ts`
Expected: PASS — all 10 tests green.

- [ ] **Step 5: Commit**

```bash
git add app/utils/filterScannerGames.js tests/app/utils/filterScannerGames.spec.ts
git commit -m "feat: scanner search + only-notified filter util"
```

---

### Task 2: Page wiring — toolbar + filtered grid + empty state

**Files:**
- Modify: `app/pages/scanner.vue`

**Interfaces:**
- Consumes: `filterScannerGames(games, { query, onlyNotified })` from Task 1 (auto-imported from `app/utils/` — no explicit import needed, same as `safeParse`/`formatUpdatedAgo` already used bare in this file). `normalizeSearchText` also auto-imported.
- Produces: nothing consumed elsewhere. Page-level state `query`, `onlyNotified` (transient refs), `filtersActive` computed, rewritten `otherGames` computed.

- [ ] **Step 1: Add filter state to the script**

In `<script setup>`, after `const updatedAgo = ref('')` add:

```js
// Filtros client-side (busca + só notificados) — estado transitório de
// exploração, não persiste entre visitas. Favoritos seguem SEM filtro.
const query = ref('')
const onlyNotified = ref(false)
const filtersActive = computed(() => onlyNotified.value || normalizeSearchText(query.value) !== '')
```

Replace the existing `otherGames` computed with:

```js
const otherGames = computed(() =>
  filterScannerGames(
    games.value.filter((g) => !(!g.finished && isFavorite(g.id))),
    { query: query.value, onlyNotified: onlyNotified.value },
  ),
)
```

`favoriteGames` stays as-is (unfiltered).

- [ ] **Step 2: Add the toolbar and empty-filter state to the template**

Inside the `v-else` block (the one that starts `<div v-else class="flex flex-col gap-4">`), insert the toolbar as the first child:

```html
<div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
  <UInput v-model="query" icon="i-lucide-search" placeholder="Buscar time ou liga…" class="w-full md:w-72" />

  <div class="flex items-center justify-end gap-2">
    <USwitch
      v-model="onlyNotified"
      size="md"
      checked-icon="i-lucide-check"
      unchecked-icon="i-lucide-x"
      title="jogos com notificação nos últimos 5 min"
    />

    <span class="text-xs font-medium whitespace-nowrap text-zinc-400">Só notificados</span>
  </div>
</div>
```

Immediately after the main grid `<div v-if="otherGames.length" class="grid …">…</div>`, add the empty-filter state (sibling, before the closing `</div>` of the `v-else` block):

```html
<div
  v-else-if="filtersActive"
  class="rounded-2xl border border-zinc-800 bg-zinc-900 py-14 text-center text-sm text-zinc-500"
>
  Nenhum jogo corresponde ao filtro.
</div>
```

Do NOT add any "Limpar" button and do NOT change the favorites section or the PageHeader counter.

- [ ] **Step 3: Verify unit tests still pass**

Run: `pnpm test:unit`
Expected: PASS — existing suite (including the 10 new filter tests) green; the page has no tests by convention.

- [ ] **Step 4: Verify visually**

1. Start the dev server on your own port: `pnpm run dev --port 3001` (leave the user's 3000 alone).
2. Open `http://localhost:3001/scanner`. Close the age-gate modal ("Entendo e sou maior de 18 anos") — it blocks all input interaction until dismissed.
3. If no games are live, serve the real `live.json` via a local proxy that injects example games (`scanner-snapshot-proxy-preview` skill) and set `NUXT_PUBLIC_SCANNER_SNAPSHOT_URL` to it before starting the dev server.
4. Confirm:
   - Typing a team/league narrows the main grid; favorites section (if any live favorites) stays complete.
   - Typing gibberish shows "Nenhum jogo corresponde ao filtro." below the favorites section.
   - Toggling "Só notificados" leaves only cards with the amber "Alerta" glow in the main grid; favorites stay complete.
   - Clearing the search (select-all + delete) and toggling the switch off restores the full grid.
   - At ~375px width: search is full-width on top, switch row right-aligned below; no layout shift when the switch toggles.

- [ ] **Step 5: Commit**

```bash
git add app/pages/scanner.vue
git commit -m "feat: scanner search + only-notified toolbar"
```
