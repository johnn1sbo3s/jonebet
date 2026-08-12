// app/utils/scannerPressure.js
// Métricas de pressão derivadas do gráfico de momentum (barras do Flashscore).
// Definição canônica no backend: momentum-scanner/momentum/monitor.py
// `extract_state` — mean5/mean10 = média das últimas 5/10 barras por time
// (0.0 conta), janela = minutos de gráfico (1 barra/minuto).
// Aqui reproduzimos a mesma conta sobre o momentum[] que o live.json já
// envia (snapshot.py serializa o MESMO array mesclado por minuto, com
// home/away sempre presentes; lado ausente = 0.0).

const toNum = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0)

const meanOf = (bars, side) => {
  if (!bars.length) return null
  return bars.reduce((acc, b) => acc + toNum(b?.[side]), 0) / bars.length
}

export function computePressure(momentum) {
  const bars = Array.isArray(momentum) ? momentum : []
  const last5 = bars.slice(-5)
  const last10 = bars.slice(-10)
  const pair = (list) => ({ home: meanOf(list, 'home'), away: meanOf(list, 'away') })
  return {
    mean5: pair(last5),
    mean10: pair(last10),
    max10: {
      home: last10.length ? Math.max(...last10.map((b) => toNum(b?.home))) : null,
      away: last10.length ? Math.max(...last10.map((b) => toNum(b?.away))) : null,
    },
    meanTotal: pair(bars),
  }
}

export function computeControl(momentum) {
  const bars = Array.isArray(momentum) ? momentum : []
  let homeWins = 0
  let awayWins = 0
  for (const b of bars) {
    const h = toNum(b?.home)
    const a = toNum(b?.away)
    if (h > a) homeWins += 1
    else if (a > h) awayWins += 1
    // empate (ex.: minuto morto 0 x 0) não conta pra ninguém e sai do denominador
  }
  const decided = homeWins + awayWins
  if (!decided) return { home: null, away: null }
  return { home: homeWins / decided, away: awayWins / decided }
}
