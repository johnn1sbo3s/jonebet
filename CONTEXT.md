# Frontend

Dark-only Nuxt dashboard visualizing model performance, bankroll, fixtures, daily bets, and the live scanner.

## Language

### Scanner ao vivo

**Snapshot**:
The payload published by momentum-scanner at `/live.json` that the scanner screen polls. Each
new version is a fresh reading of the live games.
_Avoid_: update, refresh, sync

**Ciclo do scanner**:
One emission of a new snapshot version, and therefore the instant the data age resets to zero.
_Avoid_: refresh, reload

**Idade do dado**:
Time elapsed since the snapshot's `generated_at`, shown as `há M:SS`. The user reads it to judge
whether what the graphs show is still trustworthy — roughly, past 1min20s the data is suspect.
_Avoid_: última atualização, atualizado há, sync

**Bloco de status**:
The header element holding the live dot, the data age, and the offline signal. Its width is
reserved at the worst case so that a changing data age never moves anything around it.
_Avoid_: header, toolbar

**Largura reservada**:
The fixed width of the status block, equal to the widest state it can display. A changing data
age swaps inside that box instead of resizing it.
_Avoid_: largura fixa (without saying of what), placeholder

**Offline**:
The state where the screen could not reach the snapshot. Signalled by the dot's colour and never
by visible text; screen readers still get the state in words.
_Avoid_: erro de rede, desconectado

**Relatório de amanhã**:
The link to the next day's daily bets, which appears after 23h São Paulo by clock rule alone —
it is a promise that the report will exist, not a claim that it already does.
_Avoid_: previsão, projeção
