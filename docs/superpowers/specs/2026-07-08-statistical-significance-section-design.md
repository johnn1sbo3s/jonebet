# Significância Estatística — Design

## Objetivo
Adicionar uma nova seção na tela de Performance que ajude o usuário a distinguir resultados de "skill" de resultados de "sorte", usando métricas estatísticas clássicas calculadas a partir do histórico de apostas reais do modelo.

## Métricas
Todas as métricas são calculadas sobre o período de **jogos reais** (`real_bets`).

### 1. T-statistic ROI
` t = roi / se_roi `, onde `se_roi = (std_profit / sqrt(n)) / |medLoss| * 100`.

Interpretação: quantos desvios padrão o ROI observado está de zero. Quanto maior o módulo, mais significativo.

### 2. p-value ROI
`p = 2 * (1 - CDF_t(|t|, df=n-1))` (teste bicaudal).

Interpretação: probabilidade de observar um ROI tão extremo quanto o observado se o ROI real fosse zero.

### 3. IC 95% ROI
`[roi - t_crit * se_roi, roi + t_crit * se_roi]`

Interpretação: intervalo de confiança de 95% para o ROI real.

### 4. Probabilidade de edge positivo
`P(ROI > 0) = 1 - CDF_t(0, loc=roi, scale=se_roi)` usando distribuição t com `df=n-1`.

Interpretação: chance de o modelo ter edge lucrativo de verdade.

### 5. T-statistic WR
`z = (wr - breakeven_wr) / sqrt(wr * (1 - wr) / n)`
Onde `breakeven_wr = 1 / mean_odds`.

Interpretação: testa se a taxa de acerto é maior que o breakeven implícito na odd média.

### 6. p-value WR
`p = 2 * (1 - CDF_normal(|z|))`

Interpretação: probabilidade de a WR ser igual ao breakeven por acaso.

### 7. Kelly Criterion
Para apostas binárias com odds média `b = mean_odds - 1`:
`kelly = (wr * b - (1 - wr)) / b`

Simplificado: `kelly = wr - (1 - wr) / (mean_odds - 1)`.

Interpretação: fração ótima da banca a ser alocada em cada aposta do modelo. Valores negativos indicam que não se deve seguir o modelo.

### 8. Amostra mínima
`n_min = ((z_alpha + z_beta)^2 * std_profit^2) / (roi_in_u^2)`

Onde:
- `z_alpha = 1.96` (95% confiança)
- `z_beta = 0.84` (80% power)
- `roi_in_u = roi / 100 * |medLoss|`

Interpretação: número mínimo de apostas necessárias para detectar o ROI observado com 95% de confiança e 80% de power. Mostrar também quantas faltam (`n_min - n`).

## Contrato da API

### Novo campo no `/models/:id`
Adicionar `metrics.statisticalSignificance` ao objeto retornado por `serialize_model`:

```json
{
  "metrics": {
    "val": { ... },
    "real": { ... },
    "total": { ... },
    "statisticalSignificance": {
      "roiTStatistic": -0.21,
      "roiPValue": 0.834,
      "roiConfidenceInterval": [-0.52, 0.42],
      "positiveEdgeProbability": 41.7,
      "wrTStatistic": 0.65,
      "wrPValue": 0.516,
      "kellyCriterion": -0.02,
      "minimumSampleSize": 3847,
      "sampleSizeRemaining": 2805
    }
  }
}
```

### Implementação no backend
- Adicionar função `compute_statistical_significance(bets, roi_as_percent=True)` em `scripts/ModelService.py`.
- Chamá-la em `serialize_model` passando `real_bets`.
- Usar `scipy.stats.t` para CDFs e intervalos.
- Arredondar valores financeiros para 2 casas e probabilidades para 3 casas.

## Frontend

### Componente
Novo componente `app/components/statisticalSignificanceCard.vue`.

### Layout
- Card `UCard` com título "Significância Estatística".
- Grid responsivo: `grid-cols-2 md:grid-cols-4`.
- Posicionado abaixo da linha de métricas + gráfico, acima de "Resultados por blocos de 100 jogos".

### Cores
Cada métrica de decisão é colorida por significância:

| Métrica | Verde | Vermelho | Neutro |
|---|---|---|---|
| p-value ROI | < 0.05 | ≥ 0.05 | — |
| Prob. edge positivo | > 80% | < 50% | 50-80% |
| Kelly Criterion | > 0 | ≤ 0 | — |
| IC 95% ROI (intervalo) | limite inferior > 0 | limite superior < 0 | cruza 0 |
| T-statistic ROI / WR | \|t\| > 2 | \|t\| ≤ 2 | — |
| Amostra mínima | n ≥ mínimo | n < mínimo | — |

Valores numéricos seguem o padrão de formatação do projeto:
- `formatNumber` para t-statistic, z-score e p-values (frações 0-1).
- `formatPercent` para probabilidades e Kelly expressos em percentual (backend já envia escalado: 41.7 significa 41.7%).
- `formatPercent` para limites do IC 95% do ROI (backend envia percentuais).
- `formatNumber` para amostra mínima (contagem).

### Tooltips
Cada métrica terá um botão de info (`i-lucide-info`) explicando o que significa, seguindo o padrão do `performanceChartCard.vue`.

## Testes

### Backend
Adicionar em `jonebet-api/tests/test_metrics.py`:
- Teste com amostra pequena: p-value alto.
- Teste com amostra grande e ROI positivo: p-value baixo, edge positivo alto.
- Teste com ROI negativo: Kelly negativo, edge positivo < 50%.
- Teste de breakeven WR para odds conhecidas.

### Frontend
Adicionar `tests/app/components/statisticalSignificanceCard.spec.ts`:
- Renderiza as 8 métricas.
- Aplica cor verde quando significativo.
- Aplica cor vermelha quando não significativo.
- Não renderiza quando `statisticalSignificance` é null.

## Riscos / Notas
1. `scipy` já é dependência do backend? Verificar `requirements.txt` / `Pipfile`. Se não estiver, adicionar.
2. `scipy` não é dependência atual do backend. Será adicionado a `requirements.txt` / `Pipfile`.
3. O cálculo assume apostas independentes. Apostas correlacionadas (mesmo dia, mesma liga) podem subestimar o erro padrão.
3. Para modelos com poucas apostas reais, o intervalo de confiança será muito amplo — isso é esperado e deve ser comunicado.
4. Kelly Criterion usa a fórmula simplificada de back bet com odds média. Para modelos lay com liability variável, é uma aproximação.

## Dependências
- Backend: `scipy`.
- Frontend: nenhuma nova (usa NuxtUI + Chart.js existentes).

## Aceite
Nova seção "Significância Estatística" visível na tela de Performance, com as 8 métricas acima, coloridas conforme regras, e testes passando nos dois repositórios.
