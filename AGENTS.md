# Agent Notes

## Verification after edits

**Do NOT run `npx eslint`, `npx prettier --check`, or `pnpm build` after every edit.** Those are slow and noisy. They run automatically via `husky` + `lint-staged` on commit.

How to verify changes:

- The user runs `pnpm run dev` in their own terminal and checks the browser.
- Unit tests: run `pnpm test:unit` only when the change might affect test behavior, or when the plan/task explicitly asks for it.

When a subagent implementation finishes a task, the subagent's self-report (DONE / DONE_WITH_CONCERNS / BLOCKED) is enough — no need to re-run the full lint/test suite from the controller.

## User Preferences

- **Commit messages must always be in English**, even though the project UI is in Portuguese

## Project Overview

- **DataPlay Bets**: Dark-only sports betting performance dashboard
- **Stack**: Nuxt 4.4.7, Vue 3, NuxtUI v4, Tailwind CSS v4, Chart.js, Pinia, Vitest
- **API**: External at `https://api.jonebet.xyz` (Python backend, separate repo)
- **Language**: Portuguese (Brazilian) UI; mixed PT/EN comments
- **Theme**: Dark-only, teal primary, zinc surface hierarchy (950→900→800)

## Global Conventions

- **No TypeScript** in source files (all plain `<script setup>`)
- **camelCase** multi-word component filenames
- **Nuxt auto-imports**: components, composables auto-registered
- **No lodash**: use `utils/lodashHelpers.js` with `_` prefix
- **Profit coloring**: teal-500 positive, red-500 negative
- **No shadows**: depth via surface contrast only
- **Chart plugins** registered client-only in `plugins/chartjs.client.js`
- **Font sizes**: Tailwind v4 theme defines `text-2xs` (10px / 0.625rem) in `assets/css/main.css` for compact inline indicators. Use it instead of arbitrary `text-[10px]` (barred by lint).
- **Number formatting**: dot decimal, no thousands separator. Use helpers from `app/utils/formatNumber.js`:
  - `formatUnit(n)` → `"<n>u"` for stake-unit values (profit, invested, win/loss médio, EV, max DD, accumulated, std dev, etc.) — the dashboard's framing is "stake = 1% da banca", so these are multiples of stake, not BRL
  - `formatPercent(n)` → `"<n>%"` for percent fields (ROI, WR, Lucro efetivo, Kelly Criterion, edge probability, IC limits)
  - `formatNumber(n)` → bare number for odds (dimensionless), counts, and statistical scalars (R², Sharpe, slope, T-statistic, p-value — use raw `toFixed` for those)
  Do not use `toLocaleString('pt-BR')` or `toFixed(2)` for any of the above; reach for the helper.
