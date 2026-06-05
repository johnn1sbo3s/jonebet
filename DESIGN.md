## Overview

O design system do DataPlay usa uma base **near-pure black canvas** (`{colors.canvas}` — #0a0a0a) com **teal elétrico** (`{colors.primary}` — #14B8A6) como cor primária e **azul** (`{colors.secondary}` — #3B82F6) como secundária. O teal é usado em CTAs primários, números de stats, badges e destaques. Tipografia branca em peso 700 sans-serif ancora o corpo editorial.

A combinação teal + preto é a identidade visual do DataPlay. Code blocks, terminal output e fragmentos de UI do produto são incorporados diretamente em cards `{colors.surface-card}` (#1a1a1a) escuros.

A voz tipográfica usa **Inter** em pesos confiáveis — 700 para headlines display (com letter-spacing negativo -1 a -2.5px), 600 para subtítulos e botões, 400 para corpo. O sistema não usa contraparte serif/display; tudo é uma família geométrica humanist sans, escalada e pesada para hierarquia.

**Características Principais:**
- Near-pure black canvas (`{colors.canvas}` — #0a0a0a) com texto branco. Sem surface de light-mode.
- Teal primário (`{colors.primary}` — #14B8A6). Usado em CTAs primários, números de stats grandes ("2.8k+", "74k+"), e bands CTA teal full-bleed.
- Blue secundário (`{colors.secondary}` — #3B82F6). Usado em links, badges secundários e destaques de suporte.
- Inter em peso 700 para display, peso 600 para subtítulos + botões, peso 400 para corpo. Sem contraparte serif.
- Dark surface cards (`{colors.surface-card}` — #1a1a1a) para feature cards, code windows e product mockups. Cards pouco mais claros que o canvas — contraste sutil.
- Code blocks renderizados em JetBrains Mono dentro de `{colors.surface-card}`.
- Stat numbers em teal + sans-700 + tamanho grande transmitem credibilidade.
- Border radius hierárquico: `{rounded.md}` (8px) para botões, `{rounded.lg}` (12px) para content cards.
- Ritmo de seção `{spacing.section}` (96px) entre bands editoriais.

## Colors

### Brand & Accent
- **Primary (Teal)** (`{colors.primary}` — #14B8A6): Cor principal da marca. Todos os CTAs primários, números de stats grandes, cards CTA teal full-bleed.
- **Primary Active** (`{colors.primary-active}` — #0D9488): Variante hover/pressed mais escura.
- **Primary Disabled** (`{colors.primary-disabled}` — #1a2a2a): Teal dessaturado em canvas escuro.
- **Secondary (Blue)** (`{colors.secondary}` — #3B82F6): Cor secundária para links, badges e destaques de suporte.

### Surface
- **Canvas** (`{colors.canvas}` — #0a0a0a): Piso padrão da página. Preto puro.
- **Surface Soft** (`{colors.surface-soft}` — #121212): Divisores de seção, tintas band suaves.
- **Surface Card** (`{colors.surface-card}` — #1a1a1a): Feature cards, code windows, product mockups, pricing tier cards.
- **Surface Elevated** (`{colors.surface-elevated}` — #242424): Cards nested dentro de cards maiores.
- **Surface Teal Band** (`{colors.surface-teal-band}` — #14B8A6): Card/band CTA teal full-bleed — mesmo hex do primary.
- **Hairline** (`{colors.hairline}` — #2a2a2a): Bordas 1px nos cards.
- **Hairline Strong** (`{colors.hairline-strong}` — #3a3a3a): Divisor mais pesado em underlines de input e ênfase.

### Text
- **Ink / On Dark** (`{colors.on-dark}` — #ffffff): Todo headline e texto primário.
- **Body** (`{colors.body}` — #cccccc): Cor de texto running-text padrão.
- **Body Strong** (`{colors.body-strong}` — #e6e6e6): Parágrafos enfatizados.
- **Muted** (`{colors.muted}` — #888888): Links de footer, captions, breadcrumbs.
- **Muted Soft** (`{colors.muted-soft}` — #5a5a5a): Texto terciário — letra miúda.
- **On Primary / On Teal** (`{colors.on-primary}` / `{colors.on-teal}` — #0a0a0a): Texto preto em CTAs teal e bands CTA teal. A combinação teal + preto de alto contraste é o sinal de ação da marca.

### Semantic / Accent
- **Accent Emerald** (`{colors.accent-emerald}` — #22c55e): Estados de sucesso, indicadores "ativo" na UI do produto.
- **Accent Rose** (`{colors.accent-rose}` — #ef4444): Estados de erro, indicadores "queda".
- **Accent Blue** (`{colors.accent-blue}` — #3B82F6): Estados info, highlighting de syntax de código.
- **Warning** (`{colors.warning}` — #F59E0B): Estados de aviso, alertas importantes.

---

## Tailwind CSS Tokens

> Estes tokens são usados tanto no Pencil (mockups) quanto no projeto (CSS variables).
> Mapeamento direto entre o design system visual e o código.

### CSS Variables (main.css)

```css
@theme {
  /* Canvas & Surface */
  --color-canvas: #0a0a0a;
  --color-surface-soft: #121212;
  --color-surface-card: #1a1a1a;
  --color-surface-elevated: #242424;

  /* Brand */
  --color-primary: #14B8A6;
  --color-primary-active: #0D9488;
  --color-primary-disabled: #1a2a2a;
  --color-secondary: #3B82F6;

  /* Borders */
  --color-hairline: #2a2a2a;
  --color-hairline-strong: #3a3a3a;

  /* Text */
  --color-text-on-dark: #ffffff;
  --color-text-body: #cccccc;
  --color-text-body-strong: #e6e6e6;
  --color-text-muted: #888888;
  --color-text-muted-soft: #5a5a5a;
  --color-text-on-primary: #0a0a0a;

  /* Semantic */
  --color-success: #22c55e;
  --color-danger: #ef4444;
  --color-warning: #F59E0B;
}
```

### Uso em Classes Tailwind

| Token | Classe Tailwind | Uso |
|-------|-----------------|-----|
| Canvas | `bg-[#0a0a0a]` | Fundo da página |
| Surface Card | `bg-[#1a1a1a]` | Cards, inputs |
| Surface Soft | `bg-[#121212]` | Divisores, tintas |
| Hairline | `border-[#2a2a2a]` | Bordas de cards |
| Text On Dark | `text-white` | Títulos |
| Text Body | `text-[#cccccc]` | Texto corrido |
| Text Muted | `text-[#888888]` | Labels, captions |
| Primary | `bg-[#14B8A6]` | Botões primários |
| Primary Active | `bg-[#0D9488]` | Hover de botões |
| Secondary | `bg-[#3B82F6]` | Links, badges |
| Success | `text-[#22c55e]` | Lucro positivo |
| Danger | `text-[#ef4444]` | Lucro negativo |
| Warning | `bg-[#291C0F]` | Alertas (fundo) |

### Uso no Pencil

As variáveis no Pencil usam os mesmos valores hex:
- `--color-canvas` → `#0a0a0a`
- `--color-surface-card` → `#1a1a1a`
- `--color-primary` → `#14B8A6`
- `--color-warning` → `#F59E0B`

> **Nota:** As variáveis do Pencil são para referência visual nos mockups.
> Na implementação, traduzimos pra classes Tailwind diretamente.

---

## Typography

### Font Family
O sistema usa **Inter** para tudo — display, corpo, navegação, botões, captions. **JetBrains Mono** lida com code blocks. A stack de fallback caminha `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`.

A abordagem de família única é deliberada: Inter em pesos 700 + 600 + 400 cobre toda a hierarquia sem precisar de contraparte serif ou display. O caráter geométrico humanist de Inter em peso bold confiável dá ao DataPlay uma sensação precisa e engineered que combina com a positionamento de performance-first.

### Hierarchy

| Token | Size | Weight | Line Height | Letter Spacing | Use |
|---|---|---|---|---|---|
| `{typography.display-xl}` | 72px | 700 | 1.05 | -2.5px | Homepage h1 |
| `{typography.display-lg}` | 56px | 700 | 1.1 | -2px | Section heads |
| `{typography.display-md}` | 40px | 700 | 1.15 | -1.5px | Sub-section heads, CTA-band heads |
| `{typography.display-sm}` | 32px | 700 | 1.2 | -1px | Card titles, pricing tier prices |
| `{typography.title-lg}` | 24px | 700 | 1.3 | -0.3px | Pricing plan names, larger feature titles |
| `{typography.title-md}` | 18px | 600 | 1.4 | 0 | Card titles, intro paragraphs |
| `{typography.title-sm}` | 16px | 600 | 1.4 | 0 | Small card titles, list labels |
| `{typography.stat-display}` | 56px | 700 | 1.0 | -1.5px | Stat callouts — ALWAYS teal |
| `{typography.body-md}` | 16px | 400 | 1.55 | 0 | Default running-text |
| `{typography.body-sm}` | 14px | 400 | 1.55 | 0 | Footer body, fine-print |
| `{typography.caption}` | 13px | 500 | 1.4 | 0 | Badge labels, captions |
| `{typography.caption-uppercase}` | 12px | 600 | 1.4 | 1.5px | Section labels, "NEW" badges |
| `{typography.code}` | 14px | 400 | 1.55 | 0 | Code blocks — JetBrains Mono |
| `{typography.button}` | 14px | 600 | 1.0 | 0 | Standard button labels |
| `{typography.nav-link}` | 14px | 500 | 1.4 | 0 | Top-nav menu items |

### Principles
Pesos display ficam em 700 em todos os tamanhos. Letter-spacing negativo (-1 a -2.5px) é essencial — Inter em peso 700 sem tracking negativo parece largo / Apple-marketing. O tracking apertado dá ao DataPlay a sensação precisa e engineered.

Corpo e labels ficam em pesos 400 / 500 / 600. A hierarquia é construída em tamanho + peso, não em contraste de família.

### Nota sobre Substitutos de Fonte
Inter é open-source e a escolha documentada. **Söhne** é uma alternativa comercial próxima se licenciada. **Geist** é outra alternativa moderna.

## Layout

### Spacing System
- **Base unit:** 4px.
- **Tokens:** `{spacing.xxs}` 4px · `{spacing.xs}` 8px · `{spacing.sm}` 12px · `{spacing.md}` 16px · `{spacing.lg}` 24px · `{spacing.xl}` 32px · `{spacing.xxl}` 48px · `{spacing.section}` 96px.
- **Section padding:** `{spacing.section}` (96px) entre bands maiores.
- **Card internal padding:** `{spacing.xl}` (32px) para feature cards, pricing tiers; `{spacing.lg}` (24px) para code-window cards e event cards.

### Grid & Container
- **Max content width:** ~1280px centralizado.
- **Editorial body:** Grid de 12 colunas; hero frequentemente usa split 7/5 (h1 esquerda, code mockup direita).
- **Feature card grids:** 3-up em desktop, 2-up em tablet, 1-up em mobile.
- **Pricing grid:** 3-4 up em desktop, 1-up em mobile.

### Whitespace Philosophy
O DataPlay usa whitespace dense e levemente comprimido apropriado para uma marca de developer-tooling — generoso o suficiente para ler editorialmente, apertado o suficiente para parecer "engineering-grade" ao invés de "marketing-soft." Ritmo de seção em 96px é padrão; padding interno de card fica em 32px para feature cards.

## Elevation & Depth

| Level | Treatment | Use |
|---|---|---|
| Flat | Sem shadow, sem border | Body sections, top nav, hero |
| Soft hairline | 1px `{colors.hairline}` border | Code-window cards, content cards |
| Surface card | `{colors.surface-card}` background — sem shadow | Feature cards, pricing tiers, event cards |
| Teal band | `{colors.primary}` background — sem shadow | Full-bleed teal CTA cards / bands |

O sistema não usa drop shadows. A profundidade vem do contraste entre black canvas e `{colors.surface-card}` (um tom levemente mais claro que o canvas) — o contraste é sutil, mais como um "painel dim engineering-grade" que um "card elevado."

### Decorative Depth
- Code-window cards carregam seu chrome interno do produto — line numbers, syntax highlighting, status bars no fundo — adicionando densidade visual sem shadows externos.
- O contraste teal-on-black faz a maior parte do trabalho de elevação para CTAs.

## Shapes

### Border Radius Scale

| Token | Value | Use |
|---|---|---|
| `{rounded.xs}` | 4px | Reservado para badge accents |
| `{rounded.sm}` | 6px | Botões inline pequenos |
| `{rounded.md}` | 8px | Botões CTA padrão, text inputs |
| `{rounded.lg}` | 12px | Content cards, code-window cards, pricing tiers |
| `{rounded.pill}` | 9999px | Badge pills |
| `{rounded.full}` | 9999px / 50% | Avatars, botões de ícone |

## Components

### Top Navigation

**`top-nav`** — Nav bar preta fixa no topo. 64px tall, `{colors.canvas}` background. Carrega o logo + wordmark do DataPlay à esquerda, menu horizontal primário (Dashboard, Jogos, Apostas, Performance, Monitoramento) center-left, cluster à direita com "Sign in" + "Get Started" `{component.button-primary}` (teal). Itens do menu em `{typography.nav-link}` (Inter 14px / 500).

### Buttons

**`button-primary`** — O CTA teal signature. Background `{colors.primary}` (#14B8A6), texto `{colors.on-primary}` (preto), tipo `{typography.button}` (Inter 14px / 600), padding 12px × 20px, height 40px, rounded `{rounded.md}` (8px). A combinação teal + preto é icônica.

**`button-secondary`** — Botão dark surface card. Background `{colors.surface-card}`, texto `{colors.on-dark}`, mesma forma do primary.

**`button-text-link`** — Botão inline sem background. Usado para "Sign in" e CTAs inline.

**`text-link`** — Links inline em `{colors.primary}` (teal no dark). Sublinhado.

**`button-icon-circular`** — 36 × 36 botão de ícone circular no dark.

### Cards & Containers

**`hero-band`** — Hero black-canvas com grid 7-5: h1 + sub-headline + row de botões à esquerda, code-window ou product mockup à direita. Padding vertical `{spacing.section}` (96px).

**`hero-stat-card`** — Números stat-display teal ("779+", "47k+") inline no canvas. Sem surface — apenas texto teal em `{typography.stat-display}` (56px / 700).

**`feature-card-teal`** — Card teal full-bleed. Background `{colors.primary}`, texto `{colors.on-teal}` (preto), rounded `{rounded.lg}` (12px), padding `{spacing.xl}` (32px). O card teal É a ênfase visual.

**`feature-card-dark`** — Feature card dark padrão. Background `{colors.surface-card}`, texto `{colors.on-dark}`, rounded `{rounded.lg}`, padding `{spacing.xl}` (32px).

**`code-window-card`** — Card dark mostrando um code block SQL. Background `{colors.surface-card}`, code em JetBrains Mono com syntax highlighting, rounded `{rounded.lg}`, padding `{spacing.lg}` (24px).

**`product-mockup-card`** — Card mostrando UI real do produto DataPlay. Mesma forma do `{component.feature-card-dark}` mas com chrome do produto embutido.

**`pricing-tier-card`** — Card tier padrão. Background `{colors.surface-card}`, rounded `{rounded.lg}`, padding `{spacing.xl}` (32px).

**`pricing-tier-card-featured`** — O tier featured muda para `{colors.primary}` (teal). A superfície teal É o sinal de featured.

**`stat-callout`** — Números stat inline teal ("779+", "2.8k+", "47k+"). Background transparente, texto `{colors.primary}`, tipo `{typography.stat-display}`. Usado como bloco de layout flat, não como card com surface.

**`events-card`** — Card dark com título do evento, data em `{typography.caption-uppercase}`, localização, e CTA "Register". Rounded `{rounded.lg}`, padding `{spacing.lg}`.

**`customer-logo-strip`** — Strip horizontal de logos monocromáticos. Background `{colors.canvas}`, logos em `{colors.muted}`, padding vertical `{spacing.xl}` (32px).

### Inputs & Forms

**`text-input`** — Input de texto dark. Background `{colors.surface-card}`, texto `{colors.on-dark}`, rounded `{rounded.md}` (8px), padding 10px × 14px, height 40px.

**`text-input-focused`** — Borda engrossa para `{colors.primary}` (teal) para ênfase.

### Tags / Badges

**`badge-pill`** — Label pill dark pequeno. Background `{colors.surface-card}`, texto `{colors.on-dark}`, tipo `{typography.caption}`, rounded `{rounded.pill}`.

**`badge-teal`** — Pill teal para ênfase "NEW", "GET STARTED". Background `{colors.primary}`, texto `{colors.on-primary}`, tipo `{typography.caption-uppercase}`, rounded `{rounded.pill}`.

**`badge-blue`** — Pill azul para badges secundários. Background `{colors.secondary}`, texto "#ffffff", tipo `{typography.caption-uppercase}`, rounded `{rounded.pill}`.

### Tab / Filter

**`category-tab`** + **`category-tab-active`** — Navegação tab dark. Inactive: transparente + texto muted. Active: fundo surface-card + texto on-dark. Padding 8px × 14px, rounded `{rounded.md}`.

### CTA / Footer

**`cta-band-teal`** — Band CTA pré-footer full teal fill, texto preto, rounded `{rounded.lg}`, padding 64px. Carrega h2 em `{typography.display-md}` e um CTA — geralmente botão preto na superfície teal.

**`footer`** — Footer preto que fecha cada página. Background `{colors.canvas}`, texto `{colors.muted}`. Lista de links em 4 colunas em desktop cobrindo Produto / Casos de Uso / Recursos / Empresa. Padding vertical 64px. O wordmark do DataPlay fica no topo em `{colors.on-dark}`.

## Do's and Don'ts

### Do
- Ancore cada página no black canvas. A combinação teal + preto é a voltagem da marca.
- Reserve `{colors.primary}` (teal) para CTAs primários, números de stat-callout e bands CTA teal full-bleed. A escassez do teal em nível de elemento + abundância em nível de band é o que o torna poderoso.
- Use Inter em peso 700 para cada display headline, com -1 a -2.5px letter-spacing.
- Mostre code blocks SQL reais dentro de `{component.code-window-card}` — DataPlay é uma ferramenta de dados; mostre a query, não ilustrações abstratas.
- Use números `{component.stat-callout}` para estabelecer credibilidade. Os números stat teal são a signature.
- Ancore cada band com ritmo de seção `{spacing.section}` (96px).

### Don't
- Não introduza uma segunda cor de marca. DataPlay é monocromático + teal.
- Não bold display weight além de 700 ou use peso 500 para headlines. A hierarquia depende de tamanho, não de graduação de peso.
- Não use teal para texto corpo ou fills de superfície grandes fora de cards teal intencionais.
- Não use botões arredondados / pills fora de badges pequenos. O border radius padrão do botão é 8px (md).
- Não repita o mesmo modo de surface em duas bands consecutivas. Black canvas → dark feature card → teal CTA card → black canvas → code-window card.
- Não substitua code mockups SQL por ilustrações abstratas. O code É a voltagem de marketing.
- Não adicione hover state styling além do que o sistema já codifica.

## Responsive Behavior

### Breakpoints

| Name | Width | Key Changes |
|---|---|---|
| Mobile | < 768px | Hamburger nav; hero h1 72→36px; code-window-card empilha abaixo; feature grids 1-up; pricing 1-up |
| Tablet | 768–1024px | Top nav aperta; feature cards 2-up; pricing 2-up |
| Desktop | 1024–1440px | Top-nav completo; 3-up feature cards; 3-4 up pricing tiers |
| Wide | > 1440px | Igual ao desktop com mais espaço; max content 1280px |

### Touch Targets
- `{component.button-primary}` no mínimo 40 × 40px.
- `{component.button-icon-circular}` em exatamente 36 × 36 — levemente abaixo de WCAG 44, visualmente centralizado.
- `{component.text-input}` height é 40px.

### Collapsing Strategy
- Top nav colapsa para hamburger em < 768px.
- Hero grid 7-5 → single-column em mobile.
- Feature card grids reduzem colunas ao invés de escalar.
- Code-window cards retêm font-size; scroll horizontal dentro do card em mobile.
- Pricing tier cards colapsam 4 → 2 → 1; featured tier teal permanece distinto.

### Image Behavior
- Code blocks dentro de mockups dark retêm font-size fixo; scroll horizontal em mobile ao invés de wrapping.
- Logos de clientes em strip monocromática retêm larguras nativas; linha envolve em mobile.

## Iteration Guide

1. Foque em UM componente por vez. Referencie sua YAML key (`{component.code-window-card}`, `{component.pricing-tier-card-featured}`).
2. Variants de um componente existente (`-active`, `-disabled`, `-focused`) vivem como entries separados.
3. Use `{token.refs}` em todo lugar — nunca inline hex.
4. Nunca documente hover. Apenas estados Default e Active/Pressed.
5. Display headlines ficam Inter 700 com negative letter-spacing. Body fica Inter 400.
6. A combinação teal + black é o contrato da marca. Não suavize com acentos secundários.
7. Em dúvida sobre ênfase: Inter 700 maior antes de adicionar cor.

## Known Gaps

- O hex exato do teal (#14B8A6) é a cor principal documentada do DataPlay.
- Valores do eixo de peso do Inter além de 400 / 500 / 600 / 700 não são formalizados — apenas os pesos estáticos observados são documentados.
- Timings de animação e transição não estão no escopo.
- Estados de validação de formulário além de `{component.text-input-focused}` não são extraídos.
- A superfície real do produto DataPlay compartilha alguns tokens com o site de marketing mas adiciona muitos componentes específicos do produto que estão fora do escopo.
- A opacidade/tratamento exato da strip de logos de clientes varia — o cinza muted é aproximado.
