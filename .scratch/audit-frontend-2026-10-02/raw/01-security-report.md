Auditoria de SEGURANÇA — /Users/jone/Projetos/jonebet/jonebet-frontend (read-only, varredura completa do fonte)

FORMATO: severidade | arquivo:linha | achado | evidência | impacto

---

MEDIUM | app/components/scannerCard.vue:85 | URL externa sem validação de esquema usada direto em :href | `:href="game.flashscore_url"` com `target="_blank"` (rel="noopener noreferrer" vem do componente scannerActionButton.vue:7). O payload passa por schemas.js:51-54 que usa `FlexObject = z.object({}).passthrough()` (schemas.js:3) — nenhuma validação de URL/esquema; grep por `startsWith('https`/`sanitizeUrl`/validação de esquema no app: zero ocorrências. | Se o snapshot de scanner.jonebet.xyz for comprometido ou o campo for manipulado no pipeline de scrape, um valor `javascript:...` executaria JS no contexto da app no clique do usuário (XSS por href). Mitigação parcial: origem HTTPS + rel noopener.

MEDIUM | nuxt.config.ts:68-74 | Headers de segurança ausentes (CSP/X-Frame-Options/Referrer-Policy/HSTS) | `routeRules` só define `Cache-Control` para '/'; leitura integral de nuxt.config.ts: nenhum bloco `security`, nenhum módulo helmet/nuxt-security, nenhuma meta CSP em `app.head` (linhas 2-14). Módulos: `['@nuxt/ui','@nuxt/fonts','@pinia/nuxt','@nuxtjs/device','@nuxt/eslint','@vite-pwa/nuxt']`. | Sem CSP a camada de defesa contra XSS (inclusive o href acima) fica ausente; sem X-Frame-Options o app pode ser iframado (clickjacking — impacto limitado por não haver ações sensíveis). Nota: HSTS/CSP podem existir no Vercel fora deste repo, não verificável aqui.

MEDIUM | app/composables/useModelApi.js:3 | Superfície de dados sem nenhuma autenticação no cliente | `const apiUrl = () => useRuntimeConfig().public.API_URL` e todos os fetches são sem token: grep por `Authorization|Bearer|api[_-]?key|token` em todo o repo → ZERO ocorrências no código-fonte. Exemplos: useModelApi.js:44 (`useFetch(\`${apiUrl()}/models\`)`), pages/index.vue:173 (`useFetch(\`${apiUrl}/dashboard\`)`), composables/useDailyReport.js:19, scanner polling scanner.vue:517. | Toda a superfície (dashboard, bankroll, apostas, modelos, relatórios) é consumida sem credencial. Se o backend jonebet-api também não exigir auth, qualquer pessoa consulta os mesmos dados direto pela API (URL é pública em nuxt.config.ts:58). Enforcement do backend está fora do escopo deste repo — confirmar lá.

LOW | app/composables/useTradingModels.js:21 | Query param montada por concatenação sem URL-encoding | `await fetchFn(\`${apiUrl()}/trading-models/daily?date=${dateRef.value}\`)` — contrasta com useDailyReport.js:19 e usePreGameAnalysis.js:41 que usam `encodeURIComponent`. | Hoje não é alcançável por input atacante (`dateRef` vem de `initialDate`/DatePicker interno — TradingModelsContent.vue:14, sem leitura de route.query), mas é injeção de query se a data algum dia vier de URL. Risco prático baixo (API é do próprio projeto).

LOW | app/pages/scanner.vue:517 | Valor vindo do payload interpolado cru na query do long-polling | `const url = lastVersion == null ? base : \`${base}?v=${lastVersion}\`` — `lastVersion` vem de `parsed.version` (scanner.vue:536), sem `encodeURIComponent`. | Quem controla a resposta de scanner.jonebet.xyz já controla a origem, então o impacto é autorremesso (possível quebra/param injection no próprio request). Sem vetor externo.

LOW | app/utils/flashscore.js:2 | Fixture_ID interpolado em URL sem validação de formato | `return \`https://www.flashscore.com.br/jogo/${fixtureId}/\`` — chamado com dados de API em dailyBetCard.vue:8, fixtureCard.vue:31, fixtureDetailsCard.vue:15, reportGameCard.vue:63. | O host/scheme são fixos antes do interpolation, então não há open-redirect/escape de domínio (permanece em flashscore.com.br); apenas path manipulation no site de terceiros. Vue bind evita attribute injection.

---

Verificações que NÃO renderam achado (explícito):
- XSS via HTML: NENHUM uso de `v-html`, `innerHTML`, `insertAdjacentHTML`, `:innerHTML` ou dynamic `<component :is>` com dado externo em `app/` (únicos hits de `innerHTML` são `document.body.innerHTML = ''` em specs de teste: tests/app/components/*.spec.ts). Todo dado de API é renderizado via interpolação `{{ }}` (escapada pelo Vue).
- Segredos: NENHUM. Varredura por `sk-`/`AKIA`/`ghp_`/`BEGIN`/`AIza`/`(secret|api_key|token|password) = "..."` → zero. Nenhum `.env` (inclusive ocultos/gitignore off). `.gitignore:21-23` cobre `.env`/`.env.*`. runtimeConfig público (nuxt.config.ts:56-60) expõe só URLs de endpoints públicos (`API_URL`, `SCANNER_SNAPSHOT_URL`) — não são segredos.
- Chaves de bookmaker/scraping no frontend: NENHUMA.
- postMessage/window.open/redirect aberto: NENHUM. `navigateTo('/scanner')` (daily-report.vue:308) e `clearError({redirect:'/'})` (error.vue) são fixos.
- localStorage/pinia: só preferências de UI (favoritos, view mode, som, timestamp de alertas) — nenhum token/PII. `useState` caches são em memória, sem persistência.
- console.*: só `console.error/warn` com mensagens de schema/glossário (useAcademiaGlossario.js:46-69, schemas.js:74) — nenhum loga token/cookie/dado sensível.
- XSS via query params: `route.query.date` (daily-report.vue:185) e `route.query.game` (scanner.vue:421) passam por `encodeURIComponent` (useDailyReport.js:19) ou só comparação/`getElementById` (scanner.vue:399,404) — sem render crú.
- Escopo de rota/client-side auth: N/A — o app não tem middleware nem login; não há barreira client-side a contornar (a barreira, se existir, é 100% do backend — ver MEDIUM #3).
- SSR/route rules: `ssr` não desligado (default true); cache edge de 60s é de página pública, sem dado de usuário.
- Dependências com hooks suspeitos: `postinstall: nuxt prepare` e `prepare: husky` (package.json) — padrão normal.

Resumo: 6 achados (0 críticos) — 3 MEDIUM, 3 LOW.
