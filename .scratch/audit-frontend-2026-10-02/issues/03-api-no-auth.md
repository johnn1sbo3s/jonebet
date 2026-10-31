# 03 — superfície de API sem autenticação

> *Gerado por AI durante a intake da auditoria (scouts read-only, 2026-10-02); ainda não triageado.*

Repo: `frontend`
Status: `wontfix`
Severidade: `MEDIUM`

MEDIUM | app/composables/useModelApi.js:3 | Superfície de dados sem nenhuma autenticação no cliente | `const apiUrl = () => useRuntimeConfig().public.API_URL` e todos os fetches são sem token: grep por `Authorization|Bearer|api[_-]?key|token` em todo o repo → ZERO ocorrências no código-fonte. Exemplos: useModelApi.js:44 (`useFetch(\`${apiUrl()}/models\`)`), pages/index.vue:173 (`useFetch(\`${apiUrl}/dashboard\`)`), composables/useDailyReport.js:19, scanner polling scanner.vue:517. | Toda a superfície (dashboard, bankroll, apostas, modelos, relatórios) é consumida sem credencial. Se o backend jonebet-api também não exigir auth, qualquer pessoa consulta os mesmos dados direto pela API (URL é pública em nuxt.config.ts:58). Enforcement do backend está fora do escopo deste repo — confirmar lá.

## Comments
- 2026-10-02: decisão do jone — app é público por design; ausência de auth não é achado. Não acionar.
