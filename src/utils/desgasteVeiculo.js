export function calcularDesgasteItem(item, kmAtual) {
  const intervalo = Math.max(Number(item?.intervalo_km) || 0, 0)
  const kmDesdeUltima = Math.max(Number(kmAtual) - Number(item?.km_ultima_troca || 0), 0)
  const percentualReal = intervalo > 0 ? (kmDesdeUltima / intervalo) * 100 : 0
  const vencido = intervalo > 0 && kmDesdeUltima >= intervalo

  return {
    intervalo,
    kmDesdeUltima,
    percentualReal,
    percentualExibido: Math.min(percentualReal, 100),
    vencido,
    kmRestantes: vencido ? 0 : Math.max(intervalo - kmDesdeUltima, 0),
    kmAcimaDaTroca: vencido ? kmDesdeUltima - intervalo : 0,
  }
}
