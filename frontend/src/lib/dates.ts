const locale = 'es-ES'

const dateTime = new Intl.DateTimeFormat(locale, { dateStyle: 'full', timeStyle: 'short' })
const longDate = new Intl.DateTimeFormat(locale, { dateStyle: 'long' })
const shortDate = new Intl.DateTimeFormat(locale, {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
})
const time = new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit' })
const numericDate = new Intl.DateTimeFormat(locale, {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
})
const longDateTime = new Intl.DateTimeFormat(locale, { dateStyle: 'long', timeStyle: 'short' })

/** Backend dates carry no zone; a bare `YYYY-MM-DD` would parse as UTC, so pin it to local midnight. */
export function parseLocalDate(iso: string): Date {
  return new Date(iso.length === 10 ? `${iso}T00:00:00` : iso)
}

export function formatDateTime(iso: string): string {
  return dateTime.format(parseLocalDate(iso))
}

export function formatDate(iso: string): string {
  return longDate.format(parseLocalDate(iso))
}

export function formatShortDate(iso: string): string {
  return shortDate.format(parseLocalDate(iso))
}

export function formatTime(iso: string): string {
  return time.format(parseLocalDate(iso))
}

export function formatNumericDate(iso: string): string {
  return numericDate.format(parseLocalDate(iso))
}

export function formatLongDateTime(date: Date): string {
  return longDateTime.format(date)
}

/** `YYYY-MM-DD` of a date in the browser's time zone. */
export function toLocalDay(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}
