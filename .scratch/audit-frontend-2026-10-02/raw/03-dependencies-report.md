# Scout de Dependências / Supply Chain — jonebet-frontend (master, read-only)

**Resultado em poucas palavras:** o repositório está em boa forma nas checagens estruturais — lockfile existe, está íntegro e sincronizado com o package.json; não há ranges perigosos (`latest`, `*`, `>=`), nem scripts de lifecycle suspeitos, nem duplicatas entre dependencies e devDependencies, e nenhuma dependência marcada como deprecated nas versões verificadas. Os problemas reais são: um import fantasma que só resolve por acaso do hoisting do pnpm, um controle de segurança de instalação que está anunciado mas não está ativo, e uma dependência duplicada de roteamento.

| severidade | item | achado | evidência | impacto |
|---|---|---|---|---|
| MEDIUM | Ghost dep `@internationalized/date` | Importada pelo código do app mas **não declarada** em package.json (nem deps nem devDeps); só existe como dependência transitiva do @nuxt/ui e no hoist oculto do pnpm | `app/components/DatePicker.vue:40` (`import { CalendarDate } from '@internationalized/date'`); ausente de package.json e do importers do lockfile; `pnpm-lock.yaml:1003` e `:12474` (dep do @nuxt/ui); `node_modules/.modules.yaml:320-321` (`'@internationalized/date@3.12.3': private`); `node_modules/@internationalized` não existe na raiz (read → Path not found); `.output/server/chunks/build/DatePicker-CqbfwT7F.mjs` contém o código embutido (build de 26/09 resolveu) | O build quebra se o @nuxt/ui trocar essa dep, se o padrão de hoist do pnpm mudar ou se o layout de instalação mudar; a versão usada não é controlada diretamente pelo projeto (só indiretamente pelo lockfile) |
| MEDIUM | `allowBuilds` inerte vs PM fixado | `pnpm-workspace.yaml` declara `allowBuilds` (whitelist de scripts de build), mas o `packageManager` fixa **pnpm@9.15.9**, que não suporta esse campo e roda **todos** os postinstalls de dependências por padrão | `pnpm-workspace.yaml:5-9` (allowBuilds: @parcel/watcher, esbuild, unrs-resolver, vue-demi); `package.json:5` (`"packageManager": "pnpm@9.15.9"`); `node_modules/.modules.yaml:2341` (`packageManager: pnpm@9.15.9`); docs pnpm: approve-builds/allowBuilds "Added in: v10.1.0" e blog pnpm "introduced allowBuilds in v10.26" | O controle anti-supply-chain anunciado não está em vigor: qualquer script de instalação de uma transitiva roda no `pnpm install` (comportamento default do pnpm 9); dá falsa sensação de proteção |
| MEDIUM | vue-router duplicado (4.x + 5.x) | package.json declara `vue-router: ^4.6.4` direto, mas o Nuxt 4.5.2 usa `vue-router ^5.2.0` — o lockfile instala **as duas majors**; nada no código importa `vue-router` diretamente | `package.json` (dependencies: `"vue-router": "^4.6.4"`); `pnpm-lock.yaml:6250` (`vue-router@4.6.4`) e `:6255`/`:11853` (`vue-router@5.2.0` via nuxt); grep `from 'vue-router'` em app/ e tests/ → 0 matches (só `.nuxt/imports.d.ts:30`, tipos gerados) | Dependência morta que infla a instalação e cria risco latente de duas instâncias de roteador (qualquer resolução da cópia raiz contra a instância 5.2.0 do Nuxt causaria comportamento de rota quebrado); também impede obter correções da 5.x pela via declarada |
| LOW | pinia + @pinia/nuxt mortos | Ambos declarados **e** o módulo registrado no Nuxt, mas zero uso no código — o repo tem até comentário dizendo que não usa Pinia | grep `defineStore\|from 'pinia'\|storeToRefs` em app/ e tests/ → 0 matches; comentário em `app/composables/usePreGameAnalysis.js` ("sem Pinia (convenção do repo)"); `nuxt.config.ts` (modules inclui `@pinia/nuxt`); versões: pinia 2.3.1 vs latest 4.0.3 e @pinia/nuxt 0.5.5 vs latest 1.0.2 (registry npm) | Peso morto que roda à cada build; duas majors de atraso acumulados que ficarão ainda mais caros de migrar se um dia precisarem de store |
| LOW | Deep import em `node_modules/@nuxtjs/device` | Dois arquivos de produção importam composable por caminho relativo profundo dentro do node_modules (bypass do exports map), e 3 specs mockam esse mesmo caminho; pacote está uma major atrás | `app/components/installButton.vue:10` e `app/pages/performance/[[model]].vue:3` (`'../../node_modules/@nuxtjs/device/dist/runtime/composables/useDevice'`); mocks em `tests/app/components/installDrawer.spec.ts:6`, `installButton.spec.ts:8`, `tests/app/composables/usePwaInstall.spec.ts:5`; package.json `@nuxtjs/device ^3.2.4` vs latest 4.0.0 (registry) | Quebra se o layout/exports do pacote mudarem (a v4 já mudou o map de exports), travando a atualização; o composable correto está disponível via auto-import do módulo (`installDrawer.vue` já usa `useDevice()` sem import) |
| LOW | json-server beta em dependencies + script quebrado | Prerelease `1.0.0-beta.15` declarado em **dependencies** (prod) mas usado apenas pelo script dev `backend`, cujo arquivo de dados `db/db.json` não existe no repo | `package.json` (dependencies: `"json-server": "1.0.0-beta.15"`; scripts: `"backend": "json-server --watch db/db.json --port 5000"` na linha 25); `db/` → Path not found; registry: latest do json-server é o próprio 1.0.0-beta.15 | Superfície de instalação de produção desnecessária (mock server nunca usado em prod); script `pnpm backend` aponta para arquivo inexistente |
| LOW | @nuxt/ui uma minor atrás | Declarado `^4.10.0`, lockfile em 4.10.0, latest estável 4.11.3 | `pnpm-lock.yaml` importers (`specifier: ^4.10.0, version: 4.10.0`); registry npm `@nuxt/ui@4.11.3`; notas 4.11.0 (newreleases.io): componente InputRating e ícones embutidos no bundle | Sem breaking changes conhecidos na subida menor; perde correções/featurees da 4.11.x até o próximo `pnpm update` |
| LOW | engines do Node mais frouxo que o Nuxt exige | `engines.node` é `24.x` (aceita 24.0+), mas o Nuxt 4.5.2 exige `^22.19.0 \|\| ^24.11.0 \|\| >=26.0.0` (mínimo 24.11 na linha 24) | `package.json` (engines); registry npm `nuxt@4.5.2` (engines) | Dev/CI em Node 24.0–24.10 passa no engines mas falha/avisa na instalação do Nuxt — divergência de faixa |
| LOW | `globals` em devDependencies sem uso | Declarado mas nenhum arquivo do repo importa o pacote (flat config do Nuxt gera os globals embutidos) | `package.json` devDependencies (`globals ^17.9.0`); grep `from 'globals'\|require('globals')` no repo → 0 matches | Peso morto mínimo; amplia desnecessariamente a superfície de instalação |
| LOW | Stack de gráficos uma major atrás (EOL) | `chart.js ^3.9.1` (última da linha 3, 2022; latest 4.5.1) e `vue-chart-3 ^3.1.8` (latest 4.0.1, peer `chart.js ^4`); upstream da 3.1.8 declara deps com range `latest` | `package.json` (chart.js, vue-chart-3, plugins); registry npm (chart.js 4.5.1, vue-chart-3 4.0.1); `pnpm-lock.yaml:6224` (peer malformado do upstream: `chart.js: '=> ^3.1.0'`) e `:3095`/`:4446` (csstype/lodash-es pinados pelo lockfile) | Linha 3 sem mais correções; atualização exige migração coordenada (vue-chart-3@4 + chart.js@4). Sem CVE conhecida — risco de manutenção, não de segurança imediato |
| LOW | Diretório órfão `--port/` na raiz | Existe diretório `--port/` contendo `.nuxt/` com `rootDir` apontando para `.../jonebet-frontend/--port` — artefato de um `nuxt dev --port` malformado (o `--port` virou nome de diretório) | listing da raiz (`--port/`, 1mo); `--port/.nuxt/nuxt.json` → `"rootDir": "/Users/jone/Projetos/jonebet/jonebet-frontend/--port"` | Lixo de build no repo; se versionado, polui o histórico e confunde tooling |
| LOW | Sem pipeline de CI no repo | Não existe `.github/` (Path not found), nem `vercel.json`, `.nvmrc` ou `.npmrc` na raiz — pinagem de ambiente só via `engines` + `packageManager` | listing da raiz; glob `.github` → Path not found | Nenhum gate automático de `pnpm audit`/testes antes do deploy; a segurança depende do build da plataforma (Vercel) e dos hooks locais (husky) |

## Lockfile

- **Existe e está íntegro:** `pnpm-lock.yaml` (13.845 linhas, `lockfileVersion: '9.0'` compatível com o pnpm 9.15.9 fixado).
- **Sincronizado com package.json:** todos os specifiers do importers batem item a item (`^0.14.0`, `^4.10.0`, `1.1.1`, `^4.5.2`, `^3.9.1`, `^4.6.1`…), e os `overrides` do lockfile reproduzem exatamente os do package.json (esbuild 0.28.1, brace-expansion 5.0.9, nanoid ^3.3.18). **Não está desatualizado.**
- `pnpm-lock.yaml` não está no .gitignore → versionado ✓.
- Overrides existentes são positivos: `esbuild: 0.28.1` é exatamente a versão corrigida dos advisories GHSA-g7r4-m6w7-qqqr e SNYK-JS-ESBUILD-17750822 (afetam `<0.28.1`).

## Ranges perigosos / scripts de lifecycle / duplicatas (checagens pedidas)

- **Ranges perigosos:** nenhum. Todas as entradas usam caret ou pin exato (`@vite-pwa/nuxt: 1.1.1`, `json-server: 1.0.0-beta.15`). Nenhum `latest`, `*`, `>=` ou range major aberto no package.json. (Resquício: o pacote *upstream* `vue-chart-3@3.1.8` declara deps com range `latest` — mitigado pelo lockfile.)
- **Scripts de lifecycle suspeitos:** nenhum. Apenas `postinstall: nuxt prepare` (padrão Nuxt) e `prepare: husky` (padrão husky). Não há `preinstall`.
- **Duplicatas dependencies/devDependencies:** nenhuma — os dois blocos são disjuntos.
- **Dependências deprecated:** nenhuma nos pacotes cuja página do registry foi consultada (nuxt, @nuxt/ui, pinia, @pinia/nuxt, chart.js 3.9.1, json-server, vue-chart-3, @nuxtjs/device, @vite-pwa/nuxt).

## Versões core vs latest estável

| pacote | declarado/instalado | latest | situação / breaking |
|---|---|---|---|
| nuxt | ^4.5.2 → 4.5.2 | 4.5.2 | Atual — nenhuma mudança/breaking a considerar |
| @nuxt/ui | ^4.10.0 → 4.10.0 | 4.11.3 | Menor atrás; sem breaking conhecido na subida 4.10→4.11 |
| @nuxtjs/i18n | **não usado neste repo** | — | Nuxt config não tem módulo de i18n; nada a comparar |
| @nuxtjs/tailwindcss | **não usado neste repo** | — | O projeto usa `tailwindcss` v4 direto + integração do @nuxt/ui (`app/assets/css/main.css`: `@import 'tailwindcss'; @import '@nuxt/ui';`) |
| @nuxtjs/device | ^3.2.4 → 3.2.4 | 4.0.0 | Uma major atrás; a v4 mudou exports e quebraria o deep import (ver achado LOW acima) |
| pinia / @pinia/nuxt | 2.3.1 / 0.5.5 | 4.0.3 / 1.0.2 | Duas majors atrás, mas **sem uso no código** — ver achado |

## Vulnerabilidades (audit)

- **`npm audit`/`pnpm audit` NÃO foi executado** — este scout roda com ferramentas somente-leitura (sem shell). Comando para o agente principal rodar: `pnpm audit --omit=dev` (ou `pnpm audit`) no repo.
- Substituto manual (pesquisa de advisories no GitHub Advisory DB/NVD/Snyk vs versões travadas): **0 vulnerabilidades confirmadas** entre os advisories verificados:
  - nuxt 4.5.2: limpa GHSA-wm8w-6qjm-cv43 (payload leak, High, afeta 4.4.0–4.5.0), GHSA-fx6j-w5w5-h468 (XSS, moderado, ≤4.4.5), CVE-2026-71321 (DoS island, corrigido em 4.5.1), SNYK-JS-NUXT-18593815 (corrigido em 4.5.1), GHSA-534h-c3cw-v3h9 (dev server, corrigido em 4.4.7).
  - vite 8.2.1: limpa GHSA-p9ff-h696-f583 (arbitrary file read via WS, afeta 8.0.0–8.0.4, corrigido em 8.0.5; além disso é só dev server).
  - esbuild: override `0.28.1` = versão corrigida de SNYK-JS-ESBUILD-17750822 (`<0.28.1`) e GHSA-g7r4-m6w7-qqqr.
  - @nuxt/devtools 3.4.1 (transitivo): acima do fix 3.3.1 do CVE-2026-71319 (crítico, só dev mode).
- Contagem oficial do audit continua **pendente de execução** com shell.

## Observação fora de escopo estrito

- `app/test.setup.ts:3` menciona "Node 26.x" num comentário, enquanto `engines` fixa 24.x — só indício de divergência de ambiente local, sem impacto de dependência.

**Resumo: 12 achados (0 críticos)** — 3 MEDIUM, 9 LOW. Nenhum achado de segurança ativa no código de produção; os dois MEDIUM de maior valor prático são o import fantasma (`@internationalized/date`, quebra o build se o hoist mudar) e o `allowBuilds` que não está valendo por causa do pnpm 9 fixado.
