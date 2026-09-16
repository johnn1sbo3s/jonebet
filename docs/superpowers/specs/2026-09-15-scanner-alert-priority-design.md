# Design: prioridade do alerta sobre o chute no gráfico do scanner

Data: 2026-09-15 · Repo: jonebet-frontend · Status: aprovado pelo usuário (jone)

## Contexto

No gráfico de momentum (`app/components/momentumChart.vue`), chute e alerta
do mesmo minuto/time caem num único item `kind: 'shots'` (via `buildTracks`
em `app/utils/scannerIncidents.js`). O template desenha a bolinha do chute
(`v-if="item.kind === 'shots' && item.shownShot"`) e só cai no losango âmbar
(`v-else`) quando não há chute. Resultado: o alerta some do gráfico e só
aparece abrindo o popover.

## Decisão

Inverter a prioridade visual: item com alerta (sozinho ou agregado com
chute) desenha o losango âmbar + badge `+N`. Caminho A aprovado — reaproveita
o ramo `v-else` existente, sem nova trilha/tipo.

## Comportamento

- chute sozinho → bolinha C1–C4 (inalterado)
- alerta sozinho → losango (inalterado)
- chute + alerta → losango com `+N` (NOVO; `+N` conta chute + alerta)
- gol → bola na trilha própria (intocado, fora da disputa)
- popover: ordem inalterada (chutes primeiro, alertas depois, via `entryTitle`)

## Implementação

1. `app/utils/scannerIncidents.js` (`buildTracks`): expor `hasAlerts` por
   item, derivado dos grupos fundidos (`groups.flatMap(g => g.alerts)`),
   não só do minuto original — vizinhos fundidos (um com alerta, outro só
   chute) precisam desenhar losango.
2. `app/components/momentumChart.vue`: o ramo da bolinha passa a exigir
   ausência de alerta (`kind === 'shots' && shownShot && !hasAlerts`); item
   com alerta cai no `v-else` do losango. Trilha, lado, `x`, fusão de
   vizinhos e popover inalterados. `shownShot` continua calculado (popover
   lista os chutes).

## Testes

- `tests/app/utils/scannerIncidents.spec.ts`: item chute+alerta expõe
  `hasAlerts true`; item só-chute expõe `false` (inclusive após fusão).
- `tests/app/components/momentumChart.spec.ts`: chute+alerta renderiza
  `.lane-alert` com `.lane-more` e sem `.lane-shot`; ajustar o teste atual
  do popover de alerta (usa `.lane-shot`, passa a usar `.lane-alert`).

## Fora de escopo

Backend/VPS (zero mudança), `winner` do `groupIncidents` (não consumido pelo
chart), ordem das linhas do popover, trilha do gol, C4.
