# Long Polling do Snapshot (Frontend) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Trocar o `setInterval` de 40s da página `/scanner` por um loop de long polling com `?v=<versão>`, mantendo o tick de 1s, o highlight do Telegram, o merge de notificações locais e o refetch no foco (visibilitychange) já existente.

**Architecture:** Um loop `while` serializa os requests: sempre há um request no ar para `/live.json?v=<última versão>`; o servidor segura até publicar (resposta com versão nova → aplica) ou expirar o hold (mesma versão → re-pede na hora). Erro de rede → backoff de 5s. Resposta sem `version` (backend antigo) → fallback de polling de 10s. O `visibilitychange` passa a abortar o request em voo (o loop re-pede na hora), sem fetch concorrente.

**Tech Stack:** Nuxt 4 (Vue 3, `<script setup>` JS puro), `$fetch`/ofetch, Zod via `safeParse`.

**Spec:** `docs/superpowers/specs/2026-08-15-scanner-long-polling-design.md` (este repo).

## Global Constraints

- **Nada de TypeScript** — JS puro em `<script setup>`, convenção do repo.
- Formatação: Prettier sem ponto-e-vírgula, aspas simples, 120 colunas (pre-commit roda lint-staged).
- O `safeParse('scannerSnapshot', data)` é mantido (rede de segurança do schema; passthrough preserva `version`).
- Hold do servidor = 25s; timeout do fetch = **35s**; backoff de erro = **5s**; fallback sem `version` = **10s**.
- `AbortSignal.any` com feature-detect (fallback: só o `controller.signal`; browsers sem suporte perdem o teto de 35s).
- **Todo sucesso limpa `fetchError`/`offline`** (inclusive resposta de mesma versão); **todo erro de rede seta `loading=false`** (sai do skeleton).
- `visibilitychange` visível → `pollController?.abort()` (nunca fetch direto).
- Testes: `pnpm test:unit` (189 testes hoje; não há spec do scanner — verificação é smoke no browser com mock local).
- Commits frequentes, mensagens em PT-BR.
- Backend (momentum-scanner) já deve estar com o contrato novo (plano backend) para o smoke completo; o fallback de 10s cobre backend antigo.

---

### Task 1: Loop de long polling no `scanner.vue`

**Files:**
- Modify: `app/pages/scanner.vue` (todo o `<script setup>`)

**Interfaces:**
- Consumes: `config.public.SCANNER_SNAPSHOT_URL`, `safeParse`, `loadLocalHistory`/`saveLocalHistory`/`pruneLocalHistory`/`mergeHistories`, `filterScannerGames`, `formatUpdatedAgo`, `useFavorites` (tudo já importado/auto-importado hoje).
- Produces: comportamento novo da página (nenhuma API externa nova).

- [ ] **Step 1: Replace the whole `<script setup>` block**

Substitua o conteúdo de `<script setup>` de `app/pages/scanner.vue` (linhas 123-234 atuais) por:

```vue
<script setup>
import { useFavorites } from '~/composables/useFavorites'

const config = useRuntimeConfig()
const route = useRoute()
const router = useRouter()

const snapshot = ref(null)
const loading = ref(true)
const fetchError = ref(false)
const offline = ref(false)
const updatedAgo = ref('')

// Filtros client-side (busca + só notificados) — estado transitório de
// exploração, não persiste entre visitas. Favoritos seguem SEM filtro.
const query = ref('')
const onlyNotified = ref(false)
const filtersActive = computed(() => onlyNotified.value || normalizeSearchText(query.value) !== '')

// Destaque vindo do Telegram (?game=<id>): id ainda não encontrado no
// snapshot (highlightId) vs. id atualmente destacado (activeHighlight).
const highlightId = ref(route.query.game ? String(route.query.game) : null)
const activeHighlight = ref(null)
let highlightTimer

let tickTimer
let pollActive = true
let pollController = null
let lastVersion = null

const games = computed(() => snapshot.value?.games || [])

// Favoritos no topo (só ao vivo — jogo finalizado sai da seção e volta pro
// grid normal até sair do snapshot). O resto segue no grid principal.
const { isFavorite } = useFavorites()
const favoriteGames = computed(() => games.value.filter((g) => !g.finished && isFavorite(g.id)))
const otherGames = computed(() =>
  filterScannerGames(
    games.value.filter((g) => !(!g.finished && isFavorite(g.id))),
    { query: query.value, onlyNotified: onlyNotified.value },
  ),
)

// Aplica um snapshot já validado pelo safeParse no estado da página.
function applySnapshot(parsed) {
  const localHistory = loadLocalHistory()
  const games = (parsed.games || []).map((g) => {
    const merged = mergeHistories(g.notifications, localHistory[g.id])
    return { ...g, notifications: merged }
  })
  saveLocalHistory(pruneLocalHistory(games))
  snapshot.value = { ...parsed, games }
  loading.value = false
  maybeHighlight(games)
}

// Sleep abortável: o kick (volta à aba) interrompe backoff/fallback na hora.
function sleep(ms, signal) {
  return new Promise((resolve) => {
    if (signal?.aborted) return resolve()
    const t = setTimeout(resolve, ms)
    signal?.addEventListener('abort', () => { clearTimeout(t); resolve() }, { once: true })
  })
}

// Loop de long polling: sempre há um request no ar; resposta com a mesma
// versão (hold expirou sem mudança) → re-pede na hora.
async function pollLoop() {
  while (pollActive) {
    const controller = new AbortController()
    pollController = controller
    try {
      const base = config.public.SCANNER_SNAPSHOT_URL
      const url = lastVersion == null ? base : `${base}?v=${lastVersion}`
      const signal =
        typeof AbortSignal.any === 'function'
          ? AbortSignal.any([controller.signal, AbortSignal.timeout(35_000)])
          : controller.signal // browsers sem AbortSignal.any (Safari <17.4, Chrome <116): só o abort manual
      const data = await $fetch(url, { signal })
      if (!pollActive) return
      const parsed = safeParse('scannerSnapshot', data)
      fetchError.value = false
      offline.value = false // todo sucesso limpa os flags, inclusive no caso de mesma versão
      if (parsed?.version == null) {
        // Backend antigo (sem version): fallback polling de 10s.
        applySnapshot(parsed)
        await sleep(10_000, controller.signal)
        continue
      }
      if (parsed.version === lastVersion) continue // hold expirou sem mudança: re-pede já
      lastVersion = parsed.version
      applySnapshot(parsed)
    } catch (e) {
      if (!pollActive) return
      if (controller.signal.aborted) continue // abort intencional (kick/unmount): re-pede já
      // Timeout de 35s (request preso) cai aqui: tratado como erro de rede.
      fetchError.value = true
      offline.value = true
      loading.value = false // primeiro erro sai do skeleton e mostra o painel de erro
      await sleep(5_000, controller.signal)
    }
  }
}

// Se o jogo do Telegram está na lista E ainda ao vivo: rola até ele e acende
// o destaque por 12s. Se não está (não é mais transmitido) ou já encerrou
// (fica 15 min no snapshot com finished=true), descarta sem scrollar —
// highlight só dispara para jogo ao vivo presente num snapshot.
function maybeHighlight(list) {
  if (!highlightId.value) return
  const target = highlightId.value
  highlightId.value = null
  const game = list.find((g) => String(g.id) === target)
  if (!game || game.finished) return
  activeHighlight.value = target
  nextTick(() => {
    document.getElementById(`game-${target}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  })
  clearTimeout(highlightTimer)
  highlightTimer = setTimeout(() => {
    activeHighlight.value = null
  }, 12_000)
}

function tick() {
  updatedAgo.value = formatUpdatedAgo(snapshot.value?.generated_at)
}

// Browser pausa timers em aba em background: ao voltar pro foco, aborta o
// hold em voo — o loop acorda (catch com controller.signal.aborted → continue,
// ou sleep abortável resolvendo cedo) e re-pede na hora. Sem fetch concorrente.
function onVisibilityChange() {
  if (document.visibilityState === 'visible') pollController?.abort()
}

onMounted(() => {
  // URL limpa depois de ler o parâmetro: refresh não re-dispara o destaque.
  if (route.query.game) router.replace({ query: {} })
  pollLoop()
  tickTimer = setInterval(tick, 1000)
  document.addEventListener('visibilitychange', onVisibilityChange)
})

onUnmounted(() => {
  pollActive = false
  pollController?.abort()
  clearInterval(tickTimer)
  clearTimeout(highlightTimer)
  document.removeEventListener('visibilitychange', onVisibilityChange)
})
</script>
```

NÃO altere o `<template>` (continua igual — `loading`/`fetchError`/`offline`/`updatedAgo`/`snapshot` têm os mesmos nomes).

- [ ] **Step 2: Run the unit suite**

Run: `cd /Users/jone/Projetos/jonebet && pnpm test:unit`
Expected: PASS — 189 testes (nenhum cobre o scanner; o objetivo é não quebrar os existentes).

- [ ] **Step 3: Commit**

```bash
git add app/pages/scanner.vue
git commit -m "feat: scanner usa long polling com versão em vez de setInterval"
```

---

### Task 2: Smoke do long polling no browser (mock local)

Mock temporário (não versionado) que emula o contrato do backend: publica um payload novo a cada N segundos e segura requests com `?v=atual`.

**Files:**
- Create (fora do repo): `/tmp/jonebet-longpoll-mock.py`

**Interfaces:**
- Consumes: nada do repo.
- Produces: `GET http://127.0.0.1:8377/live.json` com `version`/`generated_at`/`games` (1 jogo cujo minuto muda a cada publicação), hold de 2s, CORS liberado. Flag `--no-version` omite `version` (emula backend antigo).

- [ ] **Step 1: Write the mock script**

Crie `/tmp/jonebet-longpoll-mock.py`:

```python
#!/usr/bin/env python3
"""Mock do /live.json com long polling para smoke do front (não versionado).

Uso: python3 mock.py [--port 8377] [--no-version] [--publish 5] [--hold 2]
- publica um payload novo a cada --publish segundos (minuto do jogo muda)
- segura requests com ?v=atual por até --hold segundos
- com --no-version omite o campo version (emula backend antigo → fallback 10s)
"""
import argparse
import json
import threading
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

payload = {}
cond = threading.Condition()
version = 0
no_version = False


def publish():
    global version, payload
    with cond:
        version += 1
        minute = 1 + (version % 90)
        payload = {
            "version": version,
            "generated_at": time.strftime("%Y-%m-%dT%H:%M:%S%z"),
            "games": [{
                "id": "mock1",
                "league": "Liga Mock",
                "home": "Casa",
                "away": "Fora",
                "score": {"home": 1, "away": 0},
                "minute": minute,
                "status": f"{minute}'",
                "goals": [],
                "momentum": [],
                "stats": {},
                "odds": {"prematch": {}},
                "notifications": [],
            }],
        }
        cond.notify_all()


class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path.split("?")[0] != "/live.json":
            self.send_error(404)
            return
        client_v = None
        qs = self.path.partition("?")[2]
        for part in qs.split("&"):
            if part.startswith("v="):
                try:
                    client_v = int(part[2:])
                except ValueError:
                    client_v = None
        if client_v is not None:
            with cond:
                while client_v == version:
                    if not cond.wait(timeout=args.hold):
                        break
        body = json.dumps(
            payload if not no_version else {k: v for k, v in payload.items() if k != "version"}
        ).encode()
        self.send_response(200)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        try:
            self.wfile.write(body)
        except (ConnectionError, BrokenPipeError, OSError):
            pass

    def log_message(self, *args):
        pass


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--port", type=int, default=8377)
    ap.add_argument("--no-version", action="store_true")
    ap.add_argument("--publish", type=float, default=5.0)
    ap.add_argument("--hold", type=float, default=2.0)
    args = ap.parse_args()
    no_version = args.no_version

    def pub_loop():
        while True:
            time.sleep(args.publish)
            publish()

    publish()
    threading.Thread(target=pub_loop, daemon=True).start()
    srv = ThreadingHTTPServer(("127.0.0.1", args.port), Handler)
    print(f"mock em :{args.port} (version={not no_version}, publish={args.publish}s, hold={args.hold}s)", flush=True)
    srv.serve_forever()
```

- [ ] **Step 2: Start mock + dev server**

```bash
python3 /tmp/jonebet-longpoll-mock.py --port 8377 --publish 5 --hold 2 &
# dev server (porta do agente, 3001; NUNCA a 3000 do usuário).
# NOTA: `-- --port` não funciona (o `--` engole a flag no nuxt dev) — use NUXT_PORT:
cd /Users/jone/Projetos/jonebet
NUXT_PUBLIC_SCANNER_SNAPSHOT_URL=http://127.0.0.1:8377/live.json NUXT_PORT=3001 pnpm run dev
```

Expected: mock loga `mock em :8377 (version=True, publish=5.0s, hold=2.0s)`; dev server sobe na 3001.

- [ ] **Step 3: Smoke no browser (4 verificações)**

Drive com a ferramenta de browser (headless), página `http://localhost:3001/scanner`:

1. **Carga inicial renderiza:** feche o age-gate 18+ se abrir (botão "Entendo e sou maior de 18 anos"); confirme que o card "Casa vs Fora" aparece com um minuto e o badge de contagem "1 jogo".
2. **Atualização sem esperar 40s:** anote o minuto exibido; aguarde ~6s (a publicação do mock roda a cada 5s); confirme que o minuto mudou — evidência de que a resposta nova foi aplicada logo após a publicação (muito antes de 40s).
3. **Hold + re-pede:** registre os requests a `live.json` (listener de network): cada request deve levar ~2s (hold) e o request seguinte deve partir imediatamente após a resposta (re-pede na hora, sem intervalo de 40s).
4. **Focus refetch:** dispare `visibilitychange` com `visibilityState='visible'` via evaluate; confirme 1 request novo a `live.json` partindo na hora (sem esperar hold/backoff).

Se qualquer verificação falhar, investigue antes de prosseguir (ex.: console do browser para erros de fetch).

- [ ] **Step 4: Smoke do fallback (backend antigo, sem version)**

```bash
# pare o mock com version e suba com --no-version
python3 /tmp/jonebet-longpoll-mock.py --port 8377 --no-version --publish 5 --hold 2 &
```

Recarregue `/scanner` no browser: o jogo renderiza e o minuto muda a cada ~10s (fallback de polling); nenhum erro no console; sem busy-loop de requests (intervalo entre requests ≥ ~10s).

- [ ] **Step 5: Cleanup**

Pare o mock e o dev server; remova `/tmp/jonebet-longpoll-mock.py` (ou mantenha em `/tmp` — nunca commitar).

---

### Task 3: Verificação final do frontend

- [ ] **Step 1: Unit suite**

Run: `cd /Users/jone/Projetos/jonebet && pnpm test:unit`
Expected: PASS — 189 testes.

- [ ] **Step 2: Lint do arquivo alterado (rápido, apenas o arquivo)**

Run: `pnpm exec eslint app/pages/scanner.vue`
Expected: sem erros (o pre-commit rodaria o mesmo + prettier + check de arbitrary values).

- [ ] **Step 3: Report**

Confirme: 189 testes verdes; smoke com mock validou (a) carga, (b) atualização em ~5s, (c) hold ~2s + re-pede imediato, (d) refetch no focus; fallback sem `version` funciona com polling de 10s.
