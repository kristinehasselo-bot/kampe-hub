import { useMemo, useState } from 'react'
import type { ContentPlanItem } from '../../lib/types'
import { toISODate } from '../../lib/dates'

const MONTHS = [
  'januar', 'februar', 'mars', 'april', 'mai', 'juni',
  'juli', 'august', 'september', 'oktober', 'november', 'desember',
]
const WEEKDAYS = ['man', 'tir', 'ons', 'tor', 'fre', 'lør', 'søn']

const FORMAT_SHORT: Record<string, string> = {
  reel: 'Reel',
  karusell: 'Karusell',
  enkeltbilde: 'Bilde',
  newsletter: 'Nyhetsbrev',
}

/**
 * Innholdsplanen som månedskalender. Egen månedsnavigasjon, uavhengig av
 * den globale periodebryteren, siden en innholdskalender leses måned for
 * måned. Klikk på en post for å redigere.
 */
export function ContentCalendar({
  items,
  onPick,
  onNew,
}: {
  items: ContentPlanItem[]
  onPick: (item: ContentPlanItem) => void
  onNew: (date: string) => void
}) {
  const [cursor, setCursor] = useState(() => {
    const now = new Date()
    return { year: now.getFullYear(), month: now.getMonth() }
  })

  const byDate = useMemo(() => {
    const map = new Map<string, ContentPlanItem[]>()
    for (const item of items) {
      if (!item.planned_date) continue
      if (!map.has(item.planned_date)) map.set(item.planned_date, [])
      map.get(item.planned_date)!.push(item)
    }
    return map
  }, [items])

  const cells = useMemo(() => {
    const first = new Date(cursor.year, cursor.month, 1)
    const lead = (first.getDay() + 6) % 7 // mandag som første kolonne
    const daysInMonth = new Date(cursor.year, cursor.month + 1, 0).getDate()

    const out: (string | null)[] = []
    for (let i = 0; i < lead; i++) out.push(null)
    for (let d = 1; d <= daysInMonth; d++) {
      out.push(toISODate(new Date(cursor.year, cursor.month, d)))
    }
    while (out.length % 7 !== 0) out.push(null)
    return out
  }, [cursor])

  const today = toISODate(new Date())

  function step(delta: number) {
    setCursor((c) => {
      const d = new Date(c.year, c.month + delta, 1)
      return { year: d.getFullYear(), month: d.getMonth() }
    })
  }

  return (
    <div className="calendar">
      <header className="calendar__head">
        <button type="button" className="calendar__nav" onClick={() => step(-1)} aria-label="Forrige måned">
          ‹
        </button>
        <p className="calendar__title">
          {MONTHS[cursor.month]} {cursor.year}
        </p>
        <button type="button" className="calendar__nav" onClick={() => step(1)} aria-label="Neste måned">
          ›
        </button>
      </header>

      <div className="calendar__weekdays">
        {WEEKDAYS.map((w) => (
          <span key={w} className="calendar__weekday">
            {w}
          </span>
        ))}
      </div>

      <div className="calendar__grid">
        {cells.map((date, i) => {
          if (!date) return <div key={`x${i}`} className="calendar__cell calendar__cell--empty" />
          const day = Number(date.slice(8, 10))
          const posts = byDate.get(date) ?? []

          return (
            <div
              key={date}
              className={date === today ? 'calendar__cell calendar__cell--today' : 'calendar__cell'}
            >
              <button
                type="button"
                className="calendar__day"
                onClick={() => onNew(date)}
                aria-label={`Legg til post ${date}`}
              >
                {day}
              </button>
              <div className="calendar__posts">
                {posts.map((post) => (
                  <button
                    key={post.id}
                    type="button"
                    className={`post post--${post.status.replace('é', 'e')}`}
                    onClick={() => onPick(post)}
                    title={post.theme ?? ''}
                  >
                    <span className="post__format">
                      {post.format ? FORMAT_SHORT[post.format] : 'Post'}
                    </span>
                    <span className="post__theme">{post.theme ?? 'Uten tema'}</span>
                  </button>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
