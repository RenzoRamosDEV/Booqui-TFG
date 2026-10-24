const euro = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' })

export function toCents(amount: number): number {
  return Math.round(amount * 100)
}

export function centsToAmount(cents: number): number {
  return cents / 100
}

export function formatEuro(cents: number): string {
  return euro.format(centsToAmount(cents))
}
