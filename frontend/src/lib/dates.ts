const locale = 'es-ES'

const dateTime = new Intl.DateTimeFormat(locale, { dateStyle: 'full', timeStyle: 'short' })
const longDate = new Intl.DateTimeFormat(locale, { dateStyle: 'long' })
const shortDate = new Intl.DateTimeFormat(locale, {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
})
const time = new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit' })

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
