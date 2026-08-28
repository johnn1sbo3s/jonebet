# Design — Relatório: painel por liga + grid de 2 colunas

**Date:** 2026-08-10
**Status:** Approved by user (mockup at `/tmp/relatorio-mock/index.html`, served on localhost:8380)

## Problem

The report page (`app/pages/relatorio.vue`) renders one full-width card per game:
strategies are stacked as large per-strategy boxes (each with its analysis text
below), and the league division is only a small uppercase label between sections.

Result:
- Cards are extremely wide and tall (a game with 3 strategies dominates the page).
- League hierarchy is visually weak — no grouping container.

## Decision

Restructure the page as **one background panel per league**, with **game cards
inside a 2-column grid** (1 column on mobile, same rhythm as the scanner page).
Strategy treatment: **chips + analyses always visible** (user's Option B), chosen
because the analysis text is the justification for each recommendation (user asked
to enlarge it earlier in this session); 2 columns instead of 3 so cards stay wide
and shorter.

## Layout

```
PageHeader (unchanged — title + "N jogos analisados")
loading / error / empty states (unchanged)
┌ league panel (rounded-2xl border zinc-800 bg-zinc-900 p-4)
│  header: league name (font-bold)  +  badge "N jogos" (rounded-full pill)
│  grid: grid grid-cols-1 gap-3 md:grid-cols-2
│   ┌ game card (rounded-xl border zinc-700 bg-zinc-950 p-3)
│   │  row: time (text-2xs zinc-500) · "Home x Away" (text-sm font-bold) · odds (text-2xs, ml-auto)
│   │  leitura_geral: text-xs leading-relaxed text-zinc-300
│   │  strategy chips (static, no interaction):
│   │    rounded-full border zinc-700 bg-zinc-900 px-2.5 py-1 text-xs font-bold
│   │    colored dot: bg-teal-400 (entrar) / bg-amber-400 (cautela)
│   │    text: <modelNameToNaturalName(estrategia)> · <recomendacao> <confianca>%
│   │  analyses (one per strategy, all visible):
│   │    text-xs leading-relaxed text-zinc-400, border-l-2 border-zinc-700 pl-2
│   └──
└──
```

## Details

- **File touched:** `app/pages/relatorio.vue` only. No new component (card is used
  once; repo convention keeps page-local markup in the page).
- **Grid breakpoints:** `md:grid-cols-2` (2 columns from 768px up; 1 below).
- **Strategy name:** keep the `modelNameToNaturalName(e.estrategia)` conversion
  already in place (Lay 1x0, Gol 20min...).
- **Recommendation colors:** `entrar` → teal dot; `cautela` → amber dot. Confidence
  shown as `<rec> <confianca>%` in zinc-400 next to the strategy name.
- **Grouping/sorting:** unchanged (group by `league`, alphabetical; games sorted by
  time within league; league fallback key "Outras").
- **Not changing:** header slots, `useDailyReport` flow, `todayIso` logic, error
  retry button, empty state copy.

## Verification

- `pnpm run dev` + headless browser with real data (report exists for 2026-08-10):
  - At 1280px: game grid resolves to 2 columns; no horizontal overflow.
  - At 375px: grid resolves to 1 column; no horizontal overflow.
  - Measure card heights via `getBoundingClientRect` (target ~160–220px vs the
    previous full-width stacked cards).
  - League panels render one per league with name + count badge.
