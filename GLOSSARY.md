# Frontend

Dark-only Nuxt dashboard visualizing model performance, bankroll, fixtures, daily bets, and the live scanner.

## Language

### Scanner ao vivo

**Snapshot**:
The payload published by momentum-scanner at `/live.json` and polled by the scanner screen; each new version is a fresh reading of the live games.
_Avoid_: update, refresh, sync

**Ciclo do scanner**:
One emission of a new snapshot version, and therefore the instant the data age resets to zero.
_Avoid_: refresh, reload

**Idade do dado**:
The time elapsed since the snapshot's `generated_at`, displayed as `há M:SS` so the user can judge whether the graphs are still trustworthy — past roughly 1min20s the data is suspect.
_Avoid_: última atualização, atualizado há, sync

**Bloco de status**:
The header element holding the live dot, the data age, and the offline signal, with its width reserved at the worst case so a changing data age never moves anything around it.
_Avoid_: header, toolbar

**Largura reservada**:
The fixed width of the status block, equal to its widest state, so a changing data age swaps inside that box instead of resizing it.
_Avoid_: largura fixa (without saying of what), placeholder

**Offline**:
The state where the screen could not reach the snapshot, signalled by the dot's colour rather than visible text while screen readers still get it in words.
_Avoid_: erro de rede, desconectado

**Relatório de amanhã**:
The link to the next day's daily bets, appearing after 23h São Paulo by clock rule alone; it promises that the report will exist, not that it already does.
_Avoid_: previsão, projeção
