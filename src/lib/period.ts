import { toISODate, weekStart } from './dates'

export type Period = 'uke' | 'måned' | 'kvartal' | 'år'

export const PERIODS: Period[] = ['uke', 'måned', 'kvartal', 'år']

/** Hvor grov x-aksen er for en gitt periode. */
type Grain = 'dag' | 'uke' | 'måned'

export interface Range {
  period: Period
  from: string
  to: string
  grain: Grain
  /** Menneskelig beskrivelse av perioden, vises under bryteren. */
  label: string
}

const MONTHS = [
  'januar', 'februar', 'mars', 'april', 'mai', 'juni',
  'juli', 'august', 'september', 'oktober', 'november', 'desember',
]

const MONTHS_SHORT = ['jan', 'feb', 'mar', 'apr', 'mai', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'des']

const WEEKDAYS_SHORT = ['man', 'tir', 'ons', 'tor', 'fre', 'lør', 'søn']

export function periodRange(period: Period, now = new Date()): Range {
  const y = now.getFullYear()

  switch (period) {
    case 'uke': {
      const from = weekStart(now)
      const to = new Date(from)
      to.setDate(to.getDate() + 6)
      return {
        period,
        from: toISODate(from),
        to: toISODate(to),
        grain: 'dag',
        label: `${from.getDate()}. ${MONTHS[from.getMonth()]} til ${to.getDate()}. ${MONTHS[to.getMonth()]}`,
      }
    }

    case 'måned': {
      const from = new Date(y, now.getMonth(), 1)
      const to = new Date(y, now.getMonth() + 1, 0)
      return {
        period,
        from: toISODate(from),
        to: toISODate(to),
        grain: 'uke',
        label: `${MONTHS[now.getMonth()]} ${y}`,
      }
    }

    case 'kvartal': {
      const q = Math.floor(now.getMonth() / 3)
      const from = new Date(y, q * 3, 1)
      const to = new Date(y, q * 3 + 3, 0)
      return {
        period,
        from: toISODate(from),
        to: toISODate(to),
        grain: 'uke',
        label: `Q${q + 1} ${y}, ${MONTHS[from.getMonth()]} til ${MONTHS[to.getMonth()]}`,
      }
    }

    case 'år': {
      return {
        period,
        from: toISODate(new Date(y, 0, 1)),
        to: toISODate(new Date(y, 11, 31)),
        grain: 'måned',
        label: String(y),
      }
    }
  }
}

export interface Slot {
  key: string
  label: string
}

/** Alle x-akse-punktene i perioden, i rekkefølge, også de tomme. */
export function slots(range: Range): Slot[] {
  const out: Slot[] = []
  const [fy, fm, fd] = range.from.split('-').map(Number)
  const [ty, tm, td] = range.to.split('-').map(Number)
  const end = new Date(ty, tm - 1, td)

  if (range.grain === 'dag') {
    const cur = new Date(fy, fm - 1, fd)
    while (cur <= end) {
      out.push({
        key: toISODate(cur),
        label: WEEKDAYS_SHORT[(cur.getDay() + 6) % 7],
      })
      cur.setDate(cur.getDate() + 1)
    }
    return out
  }

  if (range.grain === 'uke') {
    const cur = weekStart(new Date(fy, fm - 1, fd))
    while (cur <= end) {
      out.push({
        key: toISODate(cur),
        label: `${cur.getDate()}.${cur.getMonth() + 1}`,
      })
      cur.setDate(cur.getDate() + 7)
    }
    return out
  }

  const cur = new Date(fy, fm - 1, 1)
  while (cur <= end) {
    out.push({
      key: `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, '0')}`,
      label: MONTHS_SHORT[cur.getMonth()],
    })
    cur.setMonth(cur.getMonth() + 1)
  }
  return out
}

/** Hvilket x-akse-punkt en dato hører hjemme i. */
export function slotOf(iso: string, range: Range): string {
  if (range.grain === 'dag') return iso
  const [y, m, d] = iso.split('-').map(Number)
  if (range.grain === 'uke') return toISODate(weekStart(new Date(y, m - 1, d)))
  return `${y}-${String(m).padStart(2, '0')}`
}

/** Alle mandager i perioden, brukt av vekststreaken. */
export function weeksIn(range: Range, minimum = 8): string[] {
  const [ty, tm, td] = range.to.split('-').map(Number)
  const last = weekStart(new Date(ty, tm - 1, td))
  const [fy, fm, fd] = range.from.split('-').map(Number)
  const first = weekStart(new Date(fy, fm - 1, fd))

  const out: string[] = []
  const cur = new Date(first)
  while (cur <= last) {
    out.push(toISODate(cur))
    cur.setDate(cur.getDate() + 7)
  }

  // En uke alene leser ikke som en streak, så vi fyller bakover.
  while (out.length < minimum) {
    const earliest = out[0].split('-').map(Number)
    const back = new Date(earliest[0], earliest[1] - 1, earliest[2])
    back.setDate(back.getDate() - 7)
    out.unshift(toISODate(back))
  }

  return out
}
