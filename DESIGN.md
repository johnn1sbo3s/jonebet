# DataPlay Design System

## Overview

Dark-only dashboard para análise de performance de apostas esportivas. Canvas near-black (`#09090b`) com teal (`#14B8A6`) como cor primária e azul (`#3B82F6`) como secundária. Profundidade via contraste de superfícies — sem drop shadows.

Identidade visual: **teal + preto**. Números de profit positivo em teal, negativo em vermelho. Plus Jakarta Sans como família tipográfica única.

---

## Colors

### Canvas & Surface

| Token | Hex | Tailwind | Uso |
|-------|-----|----------|-----|
| Canvas | `#09090b` | `zinc-950` | Fundo da página (`bg-zinc-950`) |
| Surface Soft | `#18181b` | `zinc-900` | Cards, fundos secundários |
| Surface Card | `#18181b` | `zinc-900` | UCard background padrão |
| Surface Elevated | `#27272a` | `zinc-800` | Cards nested dentro de cards |

### Brand

| Token | Hex | Tailwind | Uso |
|-------|-----|----------|-----|
| Primary | `#14B8A6` | `teal-500` | CTAs, stats positivos, nav ativo, linha de gráfico |
| Primary Active | `#0D9488` | `teal-600` | Hover/pressed em botões primários |
| Primary Disabled | `#1a2a2a` | — | Teal dessaturado para estados desabilitados |
| Secondary | `#3B82F6` | `blue-500` | Botões secundários, links, badges |

### Borders

| Token | Hex | Tailwind | Uso |
|-------|-----|----------|-----|
| Hairline | `#27272a` | `zinc-800` | Bordas de cards, tabelas, rows de detalhe |
| Hairline Strong | `#3f3f46` | `zinc-700` | Bordas mais fortes, scrollbar thumbs |

### Text

| Token | Hex | Tailwind | Uso |
|-------|-----|----------|-----|
| On Dark | `#ffffff` | `text-white` | Títulos, texto primário em cards |
| Body | `#d4d4d8` | `zinc-300` | Labels de detalhe, texto corrido |
| Body Strong | `#e4e4e7` | `zinc-200` | Texto enfatizado |
| Muted | `#a1a1aa` | `zinc-400` | Labels, captions, nav inativo |
| Muted Soft | `#71717a` | `zinc-500` | Texto terciário, footers |
| On Primary | `#09090b` | `zinc-950` | Texto em fundos teal |

### Semantic

| Token | Hex | Tailwind | Uso |
|-------|-----|----------|-----|
| Success / Positive | `#22c55e` | `emerald-500` | Estados de sucesso |
| Danger / Negative | `#ef4444` | `red-500` | Profit negativo (`text-red-500`) |
| Info / Secondary Accent | `#3B82F6` | `blue-500` | Estados info |
| Warning | `#F59E0B` | `amber-500` | UAlert, alertas importantes |

### NuxtUI Color Mapping

```ts
// app.config.ts
ui: {
  colors: {
    primary: 'teal',
    secondary: 'blue',
    neutral: 'slate'
  }
}
```

### Chart.js Colors

| Uso | Valor |
|-----|-------|
| Linha capital (dashboard) | `#14B8A6` |
| Linha capital (performance) | `#25D88B` |
| Linha tendência | `rgb(30, 158, 244, 0.6)` |
| Fill do gráfico (dashboard) | `rgba(20, 184, 166, 0.1)` |
| Grid do gráfico | `#27272a` |
| Labels do eixo | `#a1a1aa` |
| Zoom drag border | `#14B8A6` |
| Zoom drag fill | `rgba(20, 184, 166, 0.15)` |

---

## Typography

### Font Family

- **Primária:** Plus Jakarta Sans (`--font-sans: 'Plus Jakarta Sans', system-ui, sans-serif`)
- Via `@nuxt/fonts`, fallback automático

### Type Scale

| Tailwind | px | Uso |
|----------|-----|-----|
| `text-xs` | 12px | Subtítulos, datas, captions (`text-zinc-400`/`500`) |
| `text-sm` | 14px | Body em cards, labels de stats, valores de detalhe |
| `text-base` | 16px | Body padrão |
| `text-lg` | 18px | Títulos de partidas, valores de métrica |
| `text-xl` | 20px | PageHeader h1, valores de métrica |
| `text-2xl` | 24px | PageHeader h1 (sm+), botões de zoom, headings de estado vazio |

### Font Weight

| Classe | Valor | Uso |
|--------|-------|-----|
| `font-normal` | 400 | Body padrão |
| `font-medium` | 500 | Mensagens de erro |
| `font-semibold` | 600 | Títulos de seção, headers de card, labels de stat |
| `font-bold` | 700 | Valores de profit, títulos de página |
| `font-black` | 900 | Valores de métrica grandes (yesterdayMetricsCard) |

### Text Colors

| Classe | Hex | Uso |
|--------|-----|-----|
| `text-white` | `#ffffff` | Headers de card, valores de detalhe, títulos |
| `text-zinc-300` | `#d4d4d8` | Labels de detalhe |
| `text-zinc-400` | `#a1a1aa` | Nav inativo, nomes de métrica, footnotes |
| `text-zinc-500` | `#71717a` | Texto terciário, footer |
| `text-teal-500` | `#14B8A6` | Profit positivo, nav ativo |
| `text-red-500` | `#ef4444` | Profit negativo |
| `text-slate-500` | `#64748b` | Descrição do PageHeader |

---

## Spacing

### Base Unit: 4px

| Classe | px | Uso principal |
|--------|-----|---------------|
| `gap-1` | 4px | Espaçamento interno de rows, ícones |
| `gap-2` | 8px | Grupos de conteúdo dentro de cards |
| `gap-3` | 12px | Entre cards na página |
| `gap-5` | 20px | Header, Within fixture cards |

### Padding

| Classe | px | Uso |
|--------|-----|-----|
| `py-8` | 32px | UContainer vertical (layout) |
| `py-12` | 48px | Error card vertical |
| `px-3` / `py-2` | 12px / 8px | Rows de stat detalhe |
| `px-4` / `py-4` | 16px | Fixture cards |

### Page Structure

- **Gap entre cards:** `gap-3` (12px)
- **Gap header/content:** `gap-3` (12px) + `mt-2` (8px) = 20px
- **Container padding:** `py-8` (32px)

---

## Border Radius

| Classe | px | Uso |
|--------|-----|-----|
| `rounded-md` | 6px | Rows de stat detalhe |
| `rounded-lg` | 8px | Fixture cards, nav items, modais mobile |
| `rounded-xl` | 12px | UTable wrapper |
| `rounded-2xl` | 16px | UCard padrão (global via app.config.ts), USkeleton |
| `rounded-full` | 9999px | Indicador de status (performance) |

### Global Config

```ts
// app.config.ts
card: {
  slots: {
    root: 'rounded-2xl'
  }
}
```

---

## Borders & Elevation

### Sem Drop Shadows

O sistema **não usa** drop shadows. Profundidade vem do contraste entre superfícies:
- Canvas `#09090b` → Card `#18181b` → Elevated `#27272a`
- Bordas `border-zinc-800` (`#27272a`) marcam limites

### Bordas

| Classe | Uso |
|--------|-----|
| `border border-zinc-800` | Cards, tabelas, rows |
| `border border-zinc-800/50` | Header inferior |
| `border border-teal-400` | Fixture card hover/selecionado |
| `border border-teal-500` | Modal mobile |

### Outros Efeitos

| Efeito | Classe | Uso |
|--------|--------|-----|
| Header glass | `backdrop-blur-xl bg-zinc-950/60` | UHeader |
| Gradient fade-out | `bg-linear-to-t from-zinc-900 to-transparent` | Scroll containers |
| Outline hover | `hover:outline hover:outline-teal-500` | Batch cards |

---

## Animations

| Efeito | Implementação | Local |
|--------|---------------|-------|
| Ranking shimmer | `::after` pseudo-element com gradient translateX em 0.6s | rankingModels.vue |
| Skeleton pulse | `animate-pulse` | USkeleton |
| Chart zoom | `duration: 1000, easing: 'easeOutCubic'` | Chart.js |
| Fade-in | `opacity 0→1 + translateY(10px→0)`, 300ms ease-out | main.css |
| Glow pulse | `box-shadow` oscillation teal | main.css (definido, não usado) |
| Loading bar | Gradient teal→blue | NuxtLoadingIndicator |

---

## Component Patterns

### Card (UCard)

```
border border-zinc-800 + bg-zinc-900
rounded-2xl (global)
header: font-semibold text-white
```

### Input (UInput)

```
rounded-xl bg-transparent border-zinc-800
text-white placeholder:text-zinc-500
focus: border-teal-500 ring-teal-500/20
```

### Detail Stat Row

```
rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2
label: text-zinc-300
value: font-semibold text-white
```

### Ranking Item

```
border border-zinc-800 bg-zinc-900 px-3 py-2
cursor-pointer relative overflow-hidden
shimmer hover effect (::after gradient slide)
profit: text-teal-500 (positivo) / text-red-500 (negativo)
```

### Metric Display

```
label: text-sm text-zinc-400
value: text-xl font-black + text-teal-500/text-red-500
footer: text-xs text-zinc-500
```

### Page Header

```
flex gap-5
h1: text-xl font-semibold sm:text-2xl
description: text-sm text-slate-500
```

### Navigation

```
active: text-teal-500 bg-zinc-900 rounded-lg
inactive: text-zinc-400 hover:text-white
container: bg-zinc-950/60 backdrop-blur-xl border-b border-zinc-800/50
```

### Error/Empty State

```
centered flex-col py-12
icon: h-12 w-12 text-gray-400
message: font-medium text-gray-500
```

### Table (UTable)

```
wrapper: border border-zinc-800 rounded-xl
header: bg-zinc-950 text-zinc-400 text-xs uppercase
cell: border-t border-zinc-800 text-zinc-300
```

### Skeleton

```
animate-pulse rounded-2xl bg-zinc-800
height: h-60 (240px) padrão
```

---

## Do's and Don'ts

### Do
- Use `text-teal-500` para profit positivo e `text-red-500` para negativo — sempre.
- Cards usam `border border-zinc-800` para definir limites, nunca shadow.
- Mantenha `rounded-2xl` para todos os UCard.
- Use `gap-3` (12px) entre cards e `gap-2` (8px) dentro de cards.
- Prefira `font-semibold` para headers de card e `font-black` para métricas grandes.

### Don't
- Não introduza drop shadows — a profundidade é por contraste de superfície.
- Não use `text-teal-500` para texto corpo ou labels grandes.
- Não misture paletas zinc e slate no mesmo contexto (fixture pages usam slate, o resto usa zinc — manter separado).
- Não crie variações de border radius para cards — todos são `rounded-2xl`.
- Não use mais de 2 cores de profit (teal positivo, vermelho negativo).

---

## Known Gaps

- **Fixtures pages** usam paleta slate (`bg-slate-900`, `border-gray-700`) enquanto o resto usa zinc. Consistência pendente.
- **Glow-pulse** e **animate-fade-in** estão definidos em main.css mas não usados em componentes.
- **JetBrains Mono** não está configurada — code blocks usam fallback do sistema.
- **Breakpoints responsivos** não estão documentados por componente.
