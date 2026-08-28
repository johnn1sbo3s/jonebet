# Long polling do snapshot do scanner — Design

Data: 2026-08-15 · Escopo: momentum-scanner (backend, VPS Contabo) + jonebet (frontend, Nuxt 4)

## Contexto e problema

A página `/scanner` do jonebet consulta `https://scanner.jonebet.xyz/live.json` via `setInterval` de 40s
(`app/pages/scanner.vue`). O backend (momentum-scanner) regenera o snapshot a cada ciclo
(`MONITOR_INTERVAL=30s` + tempo de extração, que pode passar de 60s) e publica o payload via
`set_payload`. Os dois ciclos (poll do front 40s, publicação do back 30–90s) nunca se alinham: um
snapshot novo pode nascer 1s depois da última consulta do front e ficar até ~40s invisível.

Decisão do usuário: **long polling com hold de 25s** (nem polling curto — mantém o problema de fase —
nem WebSocket — overkill para o servidor HTTP stdlib).

## Decisões de design

1. **Long polling** com `threading.Condition` no servidor HTTP existente (ThreadingHTTPServer, stdlib).
   Custo: 1 thread parada por cliente esperando (CPU zero, memória ~nada). Escala com usuários
   simultâneos; o gargalo real do back são os browsers do extrator (~2.9GB RSS, limite 4GB), não as
   threads HTTP.
2. **Hold de 25s** em produção (decidido pelo usuário). Menor que o `proxy_read_timeout=180s` do nginx.
   Configurável via `start_snapshot_server(long_poll_timeout=...)` para testes com valores curtos.
3. **Versão embutida no payload JSON** (campo top-level `version: int`), não em header:
   - O schema `scannerSnapshot` do front é `z.object({}).passthrough()` — campos extras são
     preservados sem mudança de schema.
   - O front usa `$fetch` simples + `safeParse`; ler header exigiria `$fetch.raw` e complicaria o
     fallback.
   - Debugável com `curl`.
4. **Resposta sempre `200` com payload completo** (sem `304`/corpo mínimo): o `$fetch`/ofetch do Nuxt
   trata `304` como erro e o corpo vazio quebraria o `safeParse`. Banda: mesmo payload de ~66KB por
   request; em idle (sem publicação) a frequência sobe de 1/40s para 1/25s (o hold expira e o cliente
   re-pede na hora) — ~1.6x requests, trivial nesse tamanho.
5. **Fallback de compatibilidade**: resposta sem `version` (backend antigo) → o front aplica o snapshot
   e volta a **polling de 10s** até ver `version`. Front novo nunca quebra contra back velho.
6. **Ordem de deploy: backend primeiro, front depois.** Hoje o handler compara `self.path ==
   "/live.json"` — um request com `?v=` daria `404`. O back novo ignora query string; o front novo
   contra back velho cai no fallback (item 5); back novo contra front velho responde na hora (sem `?v`).

## Contrato da API — `GET /live.json`

Query opcional `v` (int) = versão do snapshot que o cliente já tem.

| Cenário (request) | Comportamento do servidor |
|---|---|
| Sem `?v` | Responde imediato com payload atual (comportamento atual). |
| `?v=N` com `N != version` atual | Responde imediato com payload atual. |
| `?v=N` com `N == version` atual | Segura a resposta: publicou durante a espera → responde imediato com payload novo; senão, após `long_poll_timeout` (25s) → responde com payload atual (mesma versão). |
| `?v=abc` (não numérico) | Trata como ausente → responde imediato. |

- Resposta: sempre `200`, `application/json`, headers atuais (CORS `*`, `Cache-Control: no-store`).
- Payload do snapshot ganha campo top-level `version` (int), ao lado de `generated_at`/`games`.
- Rota passa a ignorar query string (`self.path.partition('?')[0] == SNAPSHOT_PATH`).

### Semântica de versão

`version` incrementa a cada publicação (`set_payload`), mesmo que os games não mudem (o `generated_at`
já muda a cada ciclo — versão é contador de publicação, não hash de conteúdo). Cliente que recebe a
mesma versão não re-renderiza (o payload é idêntico ao que já tem) e re-pede imediatamente.

### Corridas e o padrão check+wait

O check `N == version` e o `wait` acontecem **sob a mesma `Condition`** (`with server.snapshot_cond:`),
e `Condition.wait` libera a lock de forma atômica com o registro do waiter — não existe janela em que
uma publicação entre e perca o `notify_all`. A resposta sempre sai com o payload mais novo lido após o
`wait` (pior caso de staleness: ~1 RTT). Efeito aceito: um spurious wakeup do `Condition` reinicia o
timeout completo do `wait` (o `while` re-checa e segue esperando se nada mudou) — raro e sem impacto
funcional. Não "consertar" movendo o check para fora da lock (isso sim criaria a corrida).

## Backend — momentum-scanner

### `momentum/http_server.py`

- `start_snapshot_server(port, evaluate_service=None, report_store=None, long_poll_timeout=25.0)`:
  inicializa `server.snapshot_cond = threading.Condition()`, `server.snapshot_version = 0`,
  `server.long_poll_timeout`.
- `set_payload(server, payload_bytes, version)` (assinatura muda — migrar os 5 call sites: 1 no
  `monitor.py` + 4 usos em 3 funções de teste em `tests/momentum/test_http_server.py`):
  ```python
  with server.snapshot_cond:
      server.snapshot_payload = payload_bytes
      server.snapshot_version = version
      server.snapshot_cond.notify_all()
  ```
- `do_GET` — a validação de rota passa a ignorar query string (sem isso, `/live.json?v=1` dá 404 antes
  de chegar ao handler):
  ```python
  if self.path.partition('?')[0] == SNAPSHOT_PATH:
      self._serve_snapshot()
      return
  ```
- `_serve_snapshot` — sem 404 interno (rota já validada no `do_GET`):
  ```python
  client_v = None
  try:
      client_v = int(parse_qs(urlparse(self.path).query).get('v', [''])[0])
  except ValueError:
      pass  # não numérico → trata como ausente
  server = self.server
  if client_v is not None:
      with server.snapshot_cond:
          while client_v == server.snapshot_version:
              if not server.snapshot_cond.wait(timeout=server.long_poll_timeout):
                  break
  payload = server.snapshot_payload
  try:
      ... 200 com payload (headers atuais) ...
  except (ConnectionError, BrokenPipeError, OSError):
      pass  # cliente abortou o hold (mudou de aba) e o socket fechou: sem traceback no stderr
  ```
- `SNAPSHOT_PATH` continua exportado (usado pelo monitor no log).

### `momentum/snapshot.py`

- `build_snapshot(games, history, now, version=0)` — adiciona `"version": version` ao dict retornado.
  Default `0` não quebra as 3 chamadas de teste existentes (verificado: os testes checam campos
  específicos, não o dict inteiro).

### `momentum/monitor.py`

- Antes do loop: `snapshot_version = 0`.
- No fim de cada ciclo, dentro do guard existente (`if snapshot_server is not None:` — mantém o
  comportamento com `SCANNER_SNAPSHOT_PORT=0`, servidor desligado):
  ```python
  if snapshot_server is not None:
      snapshot_version += 1
      payload = json.dumps(
          build_snapshot(store.all(), history.all(), datetime.now(), version=snapshot_version),
          ensure_ascii=False,
      ).encode("utf-8")
      set_payload(snapshot_server, payload, snapshot_version)
  ```

### Testes backend

`tests/momentum/test_http_server.py` — servidor com `long_poll_timeout` curto (ex.: 0.3s) e
`http.client` com timeout maior (ex.: 2s):

1. `?v=<atual>` → resposta demora ~timeout e traz a mesma versão (payload inalterado).
2. `?v=<antiga>` → resposta imediata com versão nova.
3. Hold com publicação concorrente: `long_poll_timeout=1.0s`; thread publica ~0.2s após o request;
   resposta chega com o payload novo e em < 0.9s (margens largas contra máquina lenta).
4. Sem `?v` → imediato.
5. `?v=abc` → imediato (tratado como ausente).
6. Migrar `test_set_payload_atualiza_proxima_resposta` e demais usos de `set_payload` para a nova
   assinatura (passar `version`).
7. Cliente fecha a conexão no meio do hold (aborta): servidor não imprime traceback (try/except no
   write) e o GET seguinte responde normal.

`tests/momentum/test_snapshot.py`:

8. `build_snapshot(..., version=7)` → `snap["version"] == 7`; sem o argumento → `0`.

## Frontend — jonebet (`app/pages/scanner.vue`)

Substitui o `setInterval(loadSnapshot, 40_000)` por um loop de long polling. Mantém: `tick` de 1s
(`updatedAgo`), highlight do Telegram (`maybeHighlight`), merge/`saveLocalHistory` de notificações,
`fetchError`/`offline`, age-gate e o `visibilitychange` já existente (que muda de papel, ver abaixo).

### Estado novo

```js
let pollActive = true
let pollController = null
let lastVersion = null
```

### `applySnapshot(parsed)` — lógica extraída do `loadSnapshot` atual

Recebe o objeto **já parseado** pelo `safeParse` (ver loop abaixo). Merge de histories +
`saveLocalHistory(pruneLocalHistory(games))` + `snapshot.value = {...}` + `maybeHighlight(games)` +
`loading = false`.

### Loop `pollLoop()`

```js
function sleep(ms, signal) {
  // Abortável: o kick (volta à aba) interrompe o backoff/fallback na hora.
  return new Promise((resolve) => {
    if (signal?.aborted) return resolve()
    const t = setTimeout(resolve, ms)
    signal?.addEventListener('abort', () => { clearTimeout(t); resolve() }, { once: true })
  })
}

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
      const parsed = safeParse('scannerSnapshot', data) // mesma rede de segurança do loadSnapshot atual
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
      // Timeout de 35s (request preso) cai aqui: tratado como erro de rede (declarado).
      fetchError.value = true
      offline.value = true
      loading.value = false // primeiro erro sai do skeleton e mostra o painel de erro
      await sleep(5_000, controller.signal)
    }
  }
}
```

- Timeout de 35s no fetch = folga de 10s sobre o hold de 25s (proteção contra request preso). Se
  dispara, vira erro de rede: `offline` + backoff de 5s.
- `inFlight` e `loadSnapshot` originais são removidos (clean cutover: o loop serializa; o kick usa
  abort em vez de fetch concorrente).

### Kick (visibilitychange — bônus já aprovado, papel atualizado)

`onVisibilityChange`: `visible` → `pollController?.abort()`. O loop acorda por um dos dois caminhos —
`catch` com `controller.signal.aborted → continue`, ou `sleep` abortável resolvendo cedo — e re-pede
imediatamente. Sem fetch concorrente. Se não há request em voo nem sleep (janela entre respostas), o
abort não faz nada e o loop já re-pede na hora.

### Unmount

`pollActive = false` + `pollController?.abort()` (no lugar do `clearInterval(pollTimer)`).

### Verificação do front

- `pnpm test:unit` continua verde (189 testes; não há spec do scanner).
- Smoke no browser (dev server 3001 + `NUXT_PUBLIC_SCANNER_SNAPSHOT_URL` apontando para o
  momentum-scanner rodando local com `SCANNER_SNAPSHOT_PORT`, ou mock local com suporte a
  `?v=`/`version`/hold): (a) carga inicial renderiza; (b) publicação → card/minuto atualiza sem
  esperar 40s; (c) hold expira → re-pede; (d) voltar à aba → refetch imediato (1 request).

## Verificação geral

- Backend: `pytest` no momentum-scanner (suíte completa + 7 testes novos/atualizados).
- Front: `pnpm test:unit` + smoke acima.
- Deploy: **fora de escopo** desta iteração; quando fizer, ordem obrigatória: back (VPS) → front
  (Vercel).

## Fora de escopo

- WebSocket.
- gzip / servir `live.json` via nginx estático (otimização futura se a audiência crescer).
- Mudanças em `/report` e `/evaluate`.
- Deploy na VPS/Vercel.

## Impacto em arquivos

| Repo | Arquivo | Mudança |
|---|---|---|
| momentum-scanner | `momentum/http_server.py` | Cond + version + long_poll_timeout + rota ignora query |
| momentum-scanner | `momentum/snapshot.py` | `build_snapshot(..., version=0)` inclui `version` |
| momentum-scanner | `momentum/monitor.py` | Contador de versão no loop; `set_payload` com version |
| momentum-scanner | `tests/momentum/test_http_server.py` | 6 testes novos + migração de assinatura em 3 funções |
| momentum-scanner | `tests/momentum/test_snapshot.py` | 1 teste novo (version) |
| momentum-scanner | `README.md` | Atualizar a descrição do consumo do `/live.json` (polling → long polling, `?v=`, campo `version`) |
| jonebet | `app/pages/scanner.vue` | Loop long polling + kick + unmount |
| jonebet | `docs/superpowers/specs/2026-08-15-scanner-long-polling-design.md` | Este documento |

Nota: a spec antiga `momentum-scanner/docs/superpowers/specs/2026-08-07-live-snapshot-api-design.md`
documenta o contrato do `/live.json` sem `version`/`?v` — fica desatualizada (histórico de design; não
é atualizada nesta iteração). O README é a referência viva e entra na tabela.
