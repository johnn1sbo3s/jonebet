# Scanner — Momentum-derived metrics on the card (pressão, controle, pico, tendência)

**Date:** 2026-08-11
**Status:** Draft — awaiting user review

## Context

The scanner card (`app/components/scannerCard.vue`) already renders the raw momentum chart (SVG, `momentumChart.vue`) and 5 cumulative stats (xG, posse, finalizações, chances claras, toques na área) as proportional "tug-of-war" bars. The backend momentum-scanner computes pressure derivatives (mean of last 5/10 bars per team — `monitor.py:extract_state`) but **never publishes them** in `live.json`; they only feed Telegram notification rules and the AI prompt.

This feature surfaces those metrics — plus two new ones derived from the same chart — **entirely in the frontend**, computed from the `momentum[]` array already present in the snapshot.

## Current State (grounded 2026-08-11)

- Snapshot fetched in `app/pages/scanner.vue` via `$fetch(runtimeConfig.public.SCANNER_SNAPSHOT_URL)`, validated by `safeParse('scannerSnapshot', …)` (`app/utils/schemas.js`) with a fully permissive passthrough schema (`FlexObject`) — unknown backend fields arrive intact. Game shape: `{ id, league, home, away, score, minute, status, momentum[], stats{…}, odds{prematch}, goals[], notifications[], finished }`.
- `momentum[]` shape (verified in `momentum-scanner/momentum/snapshot.py:52-55`): one entry per chart minute, **both `home` and `away` keys always present**, absent side = `0.0`. In practice each minute has exactly ONE side > 0 (the Flashscore chart draws a single bar per minute, above center = home, below = away) — `svg_parser.py:39-45` merges by minute with max, defaulting the other side to 0.0.
- Backend pressure semantics to mirror (`monitor.py:402-413`): `mean5`/`mean10` = arithmetic mean of the last 5/10 bars per side, counting 0.0 sides; fewer than N bars → mean of existing; empty → 0.0. Window = chart minutes (1 bar/minute), not clock minutes. Bars < 0.3 are NOT filtered out of the means (only the collapsed-chart guard uses them).
- Card stat block today (`scannerCard.vue:373-402`): `statRows` computed from `STAT_LABELS` (`[['xg','XG'], ['possession','POSSE'], ['shots','FINALIZAÇÕES'], ['big_chances','CHANCES CLARAS'], ['box_touches','TOQUES NA ÁREA']]`), each row = label line (home value | label | away value) + proportional bar (`pctHome = home/(home+away)`, teal left / blue right on zinc-800 track). Missing values → `'—'`, bar hidden (`pctHome null`).
- `formatPercent(n, decimals)` = `"<n>%"` — **does NOT scale ×100** (`app/utils/formatNumber.js:24-25`).
- `UTooltip` already used in the repo (`app/pages/performance/[[model]].vue:21`).
- Specs convention: pure utils → `tests/app/utils/*.spec.ts`; `scannerCard.spec.ts` exists with a `game()` factory that accepts `momentum`.
- `docs/superpowers/` is gitignored (local-only design docs, per repo convention).

## Decisions (user-confirmed)

1. **Route: frontend-only.** Compute all metrics from `momentum[]` already in `live.json`. Identical to backend numbers bit-for-bit (same merged array, same formula — verified: the payload serializes the exact array the backend windows over). No backend/VPS changes.
2. **Bars: proportional "tug-of-war" (existing pattern).** Because each minute has a single bar on one side, `mean5_home + mean5_away ≤ 1` — every new metric fits the existing split bar. No new bar mode. (User corrected an earlier "dual/absolute bar" proposal.)
3. **Controle** = % of minutes-with-a-bar won by each team: per minute, `home > away` → home wins the bar; `away > home` → away wins; tie (both 0.0, dead minute) → **excluded from the denominator** ("tirar os empates, % sobre minutos com barra").
4. **C10** = same computation over the last 10 entries.
5. **Pico (max10)** = highest bar of the last **10** per team. Bar = tug-of-war share; **text = raw peak value** (`formatNumber(max, 2)`, e.g. "0.69" — NOT percent: user review found "49%/13%" (not summing to 100) plus a dominant bar confusing; a 0..1 value with "máximo = 1" explained in its own info icon reads correctly). (User chose 10-minute window over 5.)
6. **Tendência** = chip ▲/▼ next to each team name in the header: `mean5` vs `meanTotal` (full-game mean). Delta > +0.05 → ▲ teal (heating up); < −0.05 → ▼ zinc (cooling); otherwise nothing.
7. **Popover** (`UPopover` — opens on CLICK, not hover) + `i-lucide-circle-help` icon on the **PICO, CONTROLE and C10** labels. UTooltip was rejected in review: hover-only (reka-ui Tooltip) + card flips on click → icon felt dead on touch/click. Content explains each metric (PICO includes "o valor vai de 0 a 1, máximo = 1").
8. All new rows are **stacked** in the same anatomy as the existing stat rows, placed directly under the momentum chart (before the 5 cumulative stats).
9. **Header team-name fix (enables the tendência chip):** team names currently wrap to 2 lines when long (e.g. "Universidad Católica (CHI)" → 40px row). Names become **one line with ellipsis** (`truncate`); the tendência chip sits inline after the name (`shrink-0`, never truncated). Row height drops 40→24px at narrow widths. This is an intentional behavior change — the 2-line wrap was flagged by the user as an existing bug. **Full name on hover via `UTooltip`** (native `title` was rejected in review: unreliable, not rendered on the icon). The trend icon also gets a `UTooltip` with the numbers.

## Computations — `app/utils/scannerPressure.js` (new pure util)

```js
export function computePressure(momentum) {
  // → { mean5:{home,away}, mean10:{home,away}, max10:{home,away}, meanTotal:{home,away} }
  // All values 0..1 (or null when momentum is empty/missing).
  // mean5/mean10/max10 mirror monitor.py extract_state: last 5 / last 10 entries,
  // arithmetic mean per side, 0.0 sides count; max10 = max of last 10 per side.
  // meanTotal = mean over ALL entries per side (for tendência).
}

export function computeControl(momentum) {
  // → { home, away } shares 0..1 (or null when no decided minute).
  // decided = entries where home !== away; home = #(home>away)/decided, away = #(away>home)/decided.
}
```

- Window helper: `computeControl(momentum.slice(-10))` → C10.
- Empty / missing `momentum` → all null → rows render `'—'` with no bar (same as stats today).
- Comment at the top pointing to `momentum-scanner/momentum/monitor.py` `extract_state` as canonical definition (mitigates future divergence if backend window semantics change).

## Card layout (`app/components/scannerCard.vue`)

`statRows` gains a `kind` per row so pressure/control rows can inject the info icon; rendering stays the same split-bar template. New rows (in order), all under `MomentumChart`:

| Label | Values (text) | Bar (`pctHome`) |
|---|---|---|
| `PRESSÃO 5'` | `formatNumber(mean5.home, 2)` / away (raw 0..1) | `mean5.home/(mean5.home+mean5.away)` |
| `PRESSÃO 10'` | `formatNumber(mean10.home, 2)` / away (raw 0..1) | `mean10.home/(mean10.home+mean10.away)` |
| `PICO 10'` ⓘ | `formatNumber(max10.home, 2)` / away (raw 0..1) | `max10.home/(max10.home+max10.away)` |
| `CONTROLE` ⓘ | `formatPercent(control.home×100, 0)` | `control.home` |
| `C10` ⓘ | `formatPercent(control10.home×100, 0)` | `control10.home` |

Notes:
- On pressure rows text and bar coincide in the common case (means sum ≤ 1); pico text/bar deliberately diverge (absolute vs share) — user-approved default.
- Denominators guarded: `x + y === 0` (or null input) → bar hidden, values `'—'`.
- Info icon: `UIcon i-lucide-circle-help` (h-3 w-3, text-zinc-500, hover:text-zinc-300) wrapped in `UTooltip` with `text` explaining CONTROLE / C10. Icon only on CONTROLE + C10 rows; pressão/pico are self-explanatory.

## Tendência — header chips

- In the header team-name row (home left, away right of the score), append after each name — **inline inside a truncating flex** (name = `min-w-0 truncate`, wrapped in `UTooltip :text="game.home|away"` for the full name on hover; icon = `shrink-0`):
  - `mean5 > meanTotal + 0.05` → `▲` (`i-lucide-trending-up`, `text-teal-400`), wrapped in `UTooltip :text="trendTitle(side)"` → "Pressão subindo: últimos 5' vs média do jogo (0.62 vs 0.48)".
  - `mean5 < meanTotal − 0.05` → `▼` (`i-lucide-trending-down`, `text-zinc-500`), same tooltip with numbers.
  - Otherwise no chip.
- Icon `h-3.5 w-3.5`, `shrink-0`. The truncate absorbs name overflow — the chip always renders at any width (verified headless at 375px: no overflow, badge stable, row 40→24px).

## Height

5 new rows ≈ +130px natural card height (measured 637px at 1440, 623px at 375). Cards have no fixed height (grid row stretch); `min-h-125` floor (500px) stays. **`scannerSkeleton.vue` raised `h-112` (448px) → `h-160` (640px)** so the loading shimmer matches the taller cards (was jarringly short after the metrics were added). Verified headless: skeleton 640px, cards 623–637px, no overflow at 1440/375, no height jump between filtered/unfiltered states.

## Files Touched

| File | Change |
|---|---|
| `app/utils/scannerPressure.js` | **New** — `computePressure`, `computeControl` (pure, comment → backend definition) |
| `app/components/scannerCard.vue` | New `statRows` entries (5), info icon + `UTooltip` on CONTROLE/C10, tendência chips in header |
| `tests/app/utils/scannerPressure.spec.ts` | **New** — unit tests mirroring backend semantics |
| `tests/app/components/scannerCard.spec.ts` | Extend: new labels render, `'—'` when no momentum, info tooltip present |

No changes to: `momentum-scanner` backend, `app/utils/schemas.js` (passthrough already delivers `momentum`), `scanner.vue`, `momentumChart.vue`.

## Testing

- `scannerPressure.spec.ts`: mean5/mean10/max10/meanTotal (exact 5 bars, 10+ bars, partial window, 0.0 sides counted, empty → null); controle (home-dominant, away-dominant, ties excluded from denominator, all-dead → null, slice(-10) for C10).
- `scannerCard.spec.ts`: new labels render with fixture momentum; no momentum → `'—'` and no bars; tendência chip shows ▲/▼/none per delta; UTooltip icon exists on CONTROLE and C10; long team name truncates to one line with full name in `title`.
- Visual: `pnpm run dev` against real `live.json` — card at desktop + mobile, filtered/unfiltered stability (headless DOM measurement, `headless-ui-layout-verification` workflow).

## Out of Scope

- No backend changes (metrics stay frontend-computed; a future backend-exposure migration is possible without UI changes — the render only consumes `momentum[]`).
- No `sum10`, no intensity-weighted control, no threshold tint (mean5 ≥ 0.40 rule highlight) — deferred.
- No persistence of any metric state (all derived).
