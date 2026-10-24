import {
  formatDate,
  formatDateTime,
  formatLongDateTime,
  formatNumericDate,
  formatShortDate,
  formatTime,
  parseLocalDate,
  toLocalDay,
} from './dates'

describe('dates (es-ES)', () => {
  it('formats a date and time', () => {
    expect(formatDateTime('2030-11-10T21:00:00')).toBe('domingo, 10 de noviembre de 2030, 21:00')
  })

  it('formats a long date', () => {
    expect(formatDate('2030-11-10T21:00:00')).toBe('10 de noviembre de 2030')
    expect(formatDate('2000-01-01')).toBe('1 de enero de 2000')
  })

  it('formats a short date for cards', () => {
    expect(formatShortDate('2030-11-10T21:00:00')).toBe('dom, 10 nov')
  })

  it('formats the time', () => {
    expect(formatTime('2030-11-10T09:05:00')).toBe('09:05')
  })
})

describe('parseLocalDate', () => {
  it('reads a bare date as local midnight, not UTC', () => {
    expect(parseLocalDate('2000-01-01').getTime()).toBe(new Date(2000, 0, 1).getTime())
  })

  it('reads a zone-less date-time as local time', () => {
    expect(parseLocalDate('2030-11-10T21:00:00').getTime()).toBe(
      new Date(2030, 10, 10, 21, 0, 0).getTime(),
    )
  })
})

describe('toLocalDay', () => {
  it.each([
    [new Date(2030, 5, 5, 23, 59), '2030-06-05'],
    [new Date(2030, 11, 31, 0, 0), '2030-12-31'],
    [new Date(2030, 0, 1, 12, 0), '2030-01-01'],
  ])('%s → %s', (date, day) => {
    expect(toLocalDay(date)).toBe(day)
  })
})

describe('formatNumericDate', () => {
  it('formats a day as dd/mm/yyyy', () => {
    expect(formatNumericDate('2030-01-12T10:00:00')).toBe('12/01/2030')
  })
})

describe('formatLongDateTime', () => {
  it('formats a date and time without weekday', () => {
    expect(formatLongDateTime(new Date(2030, 5, 15, 10, 30))).toBe(
      '15 de junio de 2030 a las 10:30',
    )
  })
})
