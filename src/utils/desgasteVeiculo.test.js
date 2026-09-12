import { describe, expect, it } from 'vitest'
import { calcularDesgasteItem } from './desgasteVeiculo'

describe('calcularDesgasteItem', () => {
  it('mantém a barra em 100% e mostra o excedente após a vida útil', () => {
    const desgaste = calcularDesgasteItem({ intervalo_km: 1000, km_ultima_troca: 10000 }, 11250)
    expect(desgaste.percentualExibido).toBe(100)
    expect(desgaste.vencido).toBe(true)
    expect(desgaste.kmRestantes).toBe(0)
    expect(desgaste.kmAcimaDaTroca).toBe(250)
  })

  it('calcula quilometragem restante sem marcar a peça como vencida', () => {
    const desgaste = calcularDesgasteItem({ intervalo_km: 1000, km_ultima_troca: 10000 }, 10640)
    expect(desgaste.percentualExibido).toBe(64)
    expect(desgaste.vencido).toBe(false)
    expect(desgaste.kmRestantes).toBe(360)
    expect(desgaste.kmAcimaDaTroca).toBe(0)
  })
})
