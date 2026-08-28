# Relatório Layout Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restructure the report page (`/relatorio`) so each league is a background panel containing game cards in a 2-column grid, with strategies shown as compact chips and analyses always visible.

**Architecture:** Single-page template change in `app/pages/relatorio.vue`. League sections become panels (zinc-900 background) with a header (league name + "N jogos" pill); inside, a `md:grid-cols-2` grid of compact game cards (zinc-950, scanner-card style) containing time/teams/odds, leitura geral, strategy chips (colored dot: teal = entrar, amber = cautela), and the per-strategy analysis paragraphs.

**Tech Stack:** Nuxt 4, Vue 3 SPA, Tailwind CSS v4 (design tokens from `app/assets/css/main.css`), no new dependencies.

## Global Constraints

- No TypeScript — plain `<script setup>` JS only.
- No new components — all markup stays in `app/pages/relatorio.vue`.
- Tailwind token classes only; never arbitrary pixel values (`text-[10px]` is barred by lint; use `text-2xs`).
- Strategy names MUST render through `modelNameToNaturalName` (already imported).
- No unit tests: repo has no page-level tests; pages are verified visually via `pnpm run dev` (AGENTS.md).
- Dev server already runs on port 3000 — do NOT restart/kill it.
- Pre-commit hook runs Prettier + ESLint + arbitrary-value check; final commit may take a few seconds.

---

### Task 1: League panels + 2-column game grid

**Files:**
- Modify: `app/pages/relatorio.vue:75-92` (the `v-else-if="state.response"` block; exact current content below)

**Interfaces:**
- Consumes: existing `byLeague` computed (already returns `[{ league, jogos }]` grouped alphabetically, games sorted by time), `state` from `useDailyReport()`, `modelNameToNaturalName` from `~/utils/resolveModelName`.
- Produces: nothing new — no other file references this template.

- [ ] **Step 1: Replace the leagues/games block**

Replace the entire current block (from `<div v-else-if="state.response" class="flex flex-col gap-4">` through its matching `</div>` at the end of the template body):

```html
    <div v-else-if="state.response" class="flex flex-col gap-4">
      <section v-for="group in byLeague" :key="group.league" class="flex flex-col gap-2">
        <h2 class="text-2xs font-bold tracking-wide text-zinc-500 uppercase">{{ group.league }}</h2>

        <article v-for="j in group.jogos" :key="j.jogo_id" class="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
          <header class="mb-2 flex flex-wrap items-center gap-2">
            <span class="text-2xs font-bold text-zinc-500">{{ j.time }}</span>

            <h3 class="text-sm font-bold text-zinc-100">{{ j.home }} x {{ j.away }}</h3>

            <span v-if="j.odds?.h" class="text-2xs ml-auto text-zinc-500">
              {{ j.odds.h }} / {{ j.odds.d }} / {{ j.odds.a }}
            </span>
          </header>

          <p class="mb-3 text-xs leading-relaxed text-zinc-300">{{ j.leitura_geral }}</p>

          <div class="flex flex-col gap-1.5">
            <div
              v-for="e in j.estrategias"
              :key="e.estrategia"
              class="flex flex-wrap items-center justify-between gap-1 rounded-lg border border-zinc-800 bg-zinc-950 px-2.5 py-1.5"
            >
              <span class="text-xs font-bold text-zinc-100">{{ modelNameToNaturalName(e.estrategia) }}</span>

              <span class="text-xs font-bold" :class="e.recomendacao === 'entrar' ? 'text-teal-400' : 'text-amber-400'">
                {{ e.recomendacao }} · {{ e.confianca }}%
              </span>
            </div>

            <p v-for="e in j.estrategias" :key="e.estrategia + '-an'" class="text-xs leading-relaxed text-zinc-400">
              {{ e.analise }}
            </p>
          </div>
        </article>
      </section>
    </div>
```

with:

```html
    <div v-else-if="state.response" class="flex flex-col gap-4">
      <section v-for="group in byLeague" :key="group.league" class="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
        <header class="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 class="text-sm font-bold text-zinc-100">{{ group.league }}</h2>

          <span
            class="rounded-full border border-zinc-800 bg-zinc-950 px-2.5 py-0.5 text-2xs font-semibold whitespace-nowrap text-zinc-400"
          >
            {{ group.jogos.length }} {{ group.jogos.length === 1 ? 'jogo' : 'jogos' }}
          </span>
        </header>

        <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
          <article
            v-for="j in group.jogos"
            :key="j.jogo_id"
            class="flex flex-col gap-2 rounded-xl border border-zinc-700 bg-zinc-950 p-3"
          >
            <header class="flex flex-wrap items-center gap-2">
              <span class="text-2xs font-bold text-zinc-500">{{ j.time }}</span>

              <h3 class="text-sm font-bold text-zinc-100">{{ j.home }} x {{ j.away }}</h3>

              <span v-if="j.odds?.h" class="text-2xs ml-auto whitespace-nowrap text-zinc-500">
                {{ j.odds.h }} / {{ j.odds.d }} / {{ j.odds.a }}
              </span>
            </header>

            <p class="text-xs leading-relaxed text-zinc-300">{{ j.leitura_geral }}</p>

            <div class="flex flex-wrap gap-1.5">
              <span
                v-for="e in j.estrategias"
                :key="e.estrategia"
                class="inline-flex items-center gap-1.5 rounded-full border border-zinc-700 bg-zinc-900 px-2.5 py-1 text-xs font-bold whitespace-nowrap text-zinc-100"
              >
                <span
                  class="h-1.5 w-1.5 rounded-full"
                  :class="e.recomendacao === 'entrar' ? 'bg-teal-400' : 'bg-amber-400'"
                ></span>

                {{ modelNameToNaturalName(e.estrategia) }}

                <span class="font-semibold text-zinc-400">· {{ e.recomendacao }} {{ e.confianca }}%</span>
              </span>
            </div>

            <p
              v-for="e in j.estrategias"
              :key="e.estrategia + '-an'"
              class="border-l-2 border-zinc-700 pl-2 text-xs leading-relaxed text-zinc-400"
            >
              {{ e.analise }}
            </p>
          </article>
        </div>
      </section>
    </div>
```

Do NOT touch: PageHeader (title + right slots), loading/error/empty blocks, `<script setup>`, or the `import { modelNameToNaturalName }` line (already present).

- [ ] **Step 2: Confirm the page loads without errors**

Run: `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/relatorio`
Expected: `200` (dev server must already be running; do not start a second one).

Then in a headless browser open `http://localhost:3000/relatorio` and check the console has no Vue/Nuxt errors and the game cards render (wait ~3s for the report fetch).

- [ ] **Step 3: Verify desktop layout (1280px)**

In the same headless browser (viewport 1280 wide), run:

```js
const out = await tab.evaluate(() => {
  const panels = [...document.querySelectorAll('section.rounded-2xl')].filter(
    (s) => s.querySelector('.grid') && s.querySelector('h2'),
  )
  const cols = getComputedStyle(panels[0]?.querySelector('.grid')).gridTemplateColumns.split(' ').length
  const cards = [...document.querySelectorAll('article')].map((a) => {
    const r = a.getBoundingClientRect()
    return { w: Math.round(r.width), h: Math.round(r.height) }
  })
  return {
    panels: panels.length,
    cols,
    cardSample: cards.slice(0, 3),
    overflow: document.documentElement.scrollWidth > innerWidth,
    pillText: panels[0]?.querySelector('span.rounded-full')?.textContent.trim(),
  }
})
```

Expected: `panels > 0` (one per league, ~10+ for a real report), `cols === 2`, card widths roughly half the panel width (~600px at 1280 viewport), `overflow: false`, `pillText` matches `/\d+ jogos?/`.

- [ ] **Step 4: Verify mobile layout (375px)**

Set viewport to 375 wide (`page.setViewport({ width: 375, height: 800 })`) and re-run the same evaluation.

Expected: `cols === 1`, `overflow: false`, cards ~panel width (~300px).

- [ ] **Step 5: Commit**

```bash
git add app/pages/relatorio.vue
git commit -m "feat: relatório — painel por liga + cards em grid de 2 colunas (chips + análises visíveis)"
```

Pre-commit hook (Prettier, ESLint, arbitrary-value check) runs automatically; fix any reported formatting by running `pnpm exec prettier --write app/pages/relatorio.vue` and re-committing.
