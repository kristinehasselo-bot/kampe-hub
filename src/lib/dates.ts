/**
 * Datoer holdes som 'YYYY-MM-DD' i lokal tid hele veien.
 * Aldri toISOString() på en dato, den bytter dag i norsk sommertid.
 */

export function toISODate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function today(): string {
  return toISODate(new Date())
}

/** Mandag i uken en dato ligger i. */
export function weekStart(d: Date = new Date()): Date {
  const copy = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const offset = (copy.getDay() + 6) % 7
  copy.setDate(copy.getDate() - offset)
  return copy
}

export function monthStart(d: Date = new Date()): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

/** Hele dager fra i dag til en dato, negativ hvis den har passert. */
export function daysUntil(iso: string): number {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const [y, m, d] = iso.split('-').map(Number)
  const target = new Date(y, m - 1, d)
  return Math.round((target.getTime() - start.getTime()) / 86_400_000)
}

/** Neste 30. september, årets hvis den ikke har passert. */
export function nextSeptember30(): string {
  const now = new Date()
  const thisYear = new Date(now.getFullYear(), 8, 30)
  const year = thisYear >= new Date(now.getFullYear(), now.getMonth(), now.getDate())
    ? now.getFullYear()
    : now.getFullYear() + 1
  return `${year}-09-30`
}

const LONG_DATE = new Intl.DateTimeFormat('nb-NO', {
  day: 'numeric',
  month: 'long',
})

const WEEKDAY = new Intl.DateTimeFormat('nb-NO', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
})

export function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  return LONG_DATE.format(new Date(y, m - 1, d))
}

export function formatWeekday(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  return WEEKDAY.format(new Date(y, m - 1, d))
}

export function formatEur(value: number): string {
  return new Intl.NumberFormat('nb-NO', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatHours(value: number): string {
  return new Intl.NumberFormat('nb-NO', { maximumFractionDigits: 1 }).format(value)
}
