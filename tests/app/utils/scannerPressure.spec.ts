// tests/app/utils/scannerPressure.spec.ts
import { describe, it, expect } from 'vitest'
import { computePressure, computeControl } from '~/utils/scannerPressure'

const bar = (minute, home, away) => ({ minute, home, away })

describe('computePressure', () => {
  it('mean5/mean10 sobre a janela certa, contando 0.0', () => {
    const momentum = [bar(1, 0.5, 0), bar(2, 0, 0.8), bar(3, 0.6, 0), bar(4, 0, 0.4), bar(5, 0.9, 0), bar(6, 0, 0.7)]
    const p = computePressure(momentum)
    // últimas 5 (min 2..6): home (0+0.6+0+0.9+0)/5 = 0.3 ; away (0.8+0+0.4+0+0.7)/5 = 0.38
    expect(p.mean5.home).toBeCloseTo(0.3, 10)
    expect(p.mean5.away).toBeCloseTo(0.38, 10)
    // últimas 10 = todas as 6: home (0.5+0+0.6+0+0.9+0)/6 = 1/3 ; away (0+0.8+0+0.4+0+0.7)/6 = 0.3166…
    expect(p.mean10.home).toBeCloseTo(1 / 3, 10)
    expect(p.mean10.away).toBeCloseTo(0.3166666667, 10)
    // max10 (últimas 10 = todas as 6): home 0.9 ; away 0.8
    expect(p.max10.home).toBe(0.9)
    expect(p.max10.away).toBe(0.8)
    // meanTotal = todas
    expect(p.meanTotal.home).toBeCloseTo(1 / 3, 10)
  })

  it('janela parcial: menos de 5 barras usa as existentes', () => {
    const p = computePressure([bar(1, 0.4, 0), bar(2, 0, 0.2)])
    expect(p.mean5.home).toBeCloseTo(0.2, 10)
    expect(p.mean5.away).toBeCloseTo(0.1, 10)
    expect(p.max10.home).toBe(0.4)
  })

  it('vazio/ausente → tudo null (não 0)', () => {
    expect(computePressure([]).mean5).toEqual({ home: null, away: null })
    expect(computePressure(undefined).mean10).toEqual({ home: null, away: null })
    expect(computePressure(null).max10).toEqual({ home: null, away: null })
  })
})

describe('computeControl', () => {
  it('% dos minutos decididos; empates saem do denominador', () => {
    const momentum = [
      bar(1, 0.6, 0), // home
      bar(2, 0, 0.5), // away
      bar(3, 0.8, 0), // home
      bar(4, 0, 0), // empate (minuto morto) — excluído
      bar(5, 0.3, 0), // home
    ]
    const c = computeControl(momentum)
    expect(c.home).toBeCloseTo(3 / 4, 10)
    expect(c.away).toBeCloseTo(1 / 4, 10)
  })

  it('sem minuto decidido → null', () => {
    expect(computeControl([bar(1, 0, 0), bar(2, 0, 0)])).toEqual({ home: null, away: null })
    expect(computeControl([])).toEqual({ home: null, away: null })
  })

  it('C10 = computeControl das últimas 10', () => {
    const momentum = Array.from({ length: 12 }, (_, i) => bar(i + 1, i % 2 === 0 ? 0.7 : 0, i % 2 === 0 ? 0 : 0.6))
    // 12 barras alternadas: últimas 10 (min 3..12) = 5 home + 5 away → 50/50
    const c10 = computeControl(momentum.slice(-10))
    expect(c10.home).toBeCloseTo(0.5, 10)
    expect(c10.away).toBeCloseTo(0.5, 10)
  })
})
