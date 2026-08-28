# Spec — Relatório: visualização "Por liga" / "Por horário"

**Data:** 2026-08-10 · **Repo:** jonebet (Nuxt 4) · **Página:** `app/pages/relatorio.vue`

## Contexto

A página /relatorio agrupa os jogos do dia por liga (`byLeague`), cada liga virando um painel (section + header com `h2` + pill "N jogos" + grid de cards). O usuário quer um segmented control para alternar a forma de visualização: **Por liga** (atual) ou **Por horário**.

Decisões tomadas com o usuário via brainstorm + mockup (dados reais, aprovado em 2026-08-10):
- Agrupamento por hora (bloco "14h"), não por turno nem por minuto exato.
- Escolha persistida em localStorage; primeira visita abre em "Por liga".

## Decisões de design

### 1. Controle — reutilizar `SegmentedControl.vue`
- Componente existente `app/components/SegmentedControl.vue` (interface `options: [{ value, label }]` + `v-model:modelValue`), já usado em `fixturesList.vue`. NÃO usar UTabs — segunda convenção ao lado de uma existente é proibida.
- Valores: `'por_liga'` | `'por_horario'`. Labels: "Por liga" / "Por horário".
- `<SegmentedControl v-model="visualizacao" :options="viewOptions" />`

### 2. Posição
- Linha própria entre o `PageHeader` e o conteúdo, alinhada à esquerda (precedente: `fixturesList.vue` coloca o controle na própria linha).
- Renderiza **somente** quando o relatório carregou (`state.status === 'done'` com jogos). Estados loading/erro/vazio ficam intocados — o controle some junto com o conteúdo.

### 3. Agrupamento por horário (`byHour` computed)
- Extrai a hora de `j.time` via regex `^(\d{1,2}):`; chave = `HH`.
- Rótulo do painel: `HH + 'h'` (ex.: "14h"); pill "N jogos" idêntica ao painel por liga.
- Jogos ordenados por horário dentro do painel; painéis ordenados por hora crescente.
- Jogo sem horário parseável → grupo **"Outros"** no final (espelha o fallback "Outras" do `byLeague`).
- Mesma estrutura do `byLeague`: `[...map.entries()].map(...).sort(...)`.

### 4. Persistência
- Key `relatorio.visualizacao` no localStorage; default `'por_liga'` (lido no setup; grava no change do controle).

### 5. Layout dos painéis
- **Reusar as classes atuais** dos painéis por liga: `grid grid-cols-1 gap-3 md:grid-cols-2` — viewport-based, em <768px cai para 1 coluna (verificado no mock com container queries; no app real o `md:` resolve por viewport).
- Cards renderizados com o mesmo `gameCard`-equivalente do template atual (nada muda no card).

### 6. Estados e skeleton
- Loading/erro/vazio/skeleton inalterados. O skeleton genérico (2 painéis × 4 cards) continua servindo as duas visões.

## Arquitetura

**Único arquivo alterado:** `app/pages/relatorio.vue`.

- Script: `visualizacao` ref (com init do localStorage), `viewOptions` const, `byHour` computed (espelha `byLeague`), `groups` computed que escolhe entre `byLeague`/`byHour` conforme `visualizacao`.
- Template: linha com `SegmentedControl` (renderizada só com conteúdo carregado) + `v-for` sobre `groups` (troca `byLeague` por `groups` no loop existente).
- Sem mudanças em API, composables, schemas, PageHeader, contador, cards.

## Verificação

- Browser headless com viewport real:
  - Switch Por liga ↔ Por horário reflete na lista de painéis.
  - **375px**: 1 coluna, sem overflow horizontal (medição via `getBoundingClientRect`/`scrollWidth`, não screenshot).
  - **1280px**: 2 colunas.
  - Persistência: escolher por horário, recarregar, volta em "Por horário"; localStorage key correta.
  - Painel "Outros" só aparece com dado sem horário (caso sintético via interceptor de resposta).
- Sem teste unitário novo — páginas são verificadas visualmente neste repo (padrão estabelecido; `byLeague` já é inline sem test).

## Fora de escopo

- Alterações no PageHeader, contador de jogos, skeleton, estados de erro/vazio, API.
- Outros agrupamentos (turno, minuto exato), ordenação configurável, ícones no controle.
- Persistência em servidor (ex.: preferência por usuário).
