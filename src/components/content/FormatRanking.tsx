import type { ContentPlanItem } from '../../lib/types'
import { CONTENT_FORMATS } from '../../lib/constants'

/**
 * Hva som faktisk driver rekkevidde. Rangerer publiserte poster etter
 * gjennomsnittlig rekkevidde per format. Har ingen av dem rekkeviddetall
 * enda, faller den tilbake på antall publisert og sier ifra.
 */
export function FormatRanking({ items }: { items: ContentPlanItem[] }) {
  const published = items.filter((i) => i.status === 'publisert')

  const stats = CONTENT_FORMATS.map((format) => {
    const posts = published.filter((p) => p.format === format)
    const withReach = posts.filter((p) => p.reach != null)
    const avgReach = withReach.length
      ? Math.round(withReach.reduce((sum, p) => sum + Number(p.reach), 0) / withReach.length)
      : null
    return { format, count: posts.length, avgReach, reachCount: withReach.length }
  })

  const anyReach = stats.some((s) => s.avgReach != null)
  const maxReach = Math.max(...stats.map((s) => s.avgReach ?? 0), 1)
  const maxCount = Math.max(...stats.map((s) => s.count), 1)

  const ranked = [...stats].sort((a, b) => {
    if (anyReach) return (b.avgReach ?? -1) - (a.avgReach ?? -1)
    return b.count - a.count
  })

  if (published.length === 0) {
    return (
      <p className="muted">
        Ingen publiserte poster i planen enda. Rangeringen fylles når poster får status
        publisert.
      </p>
    )
  }

  return (
    <div className="ranking">
      <ul className="bars">
        {ranked.map((s) => {
          const value = anyReach ? (s.avgReach ?? 0) : s.count
          const max = anyReach ? maxReach : maxCount
          return (
            <li key={s.format} className="bar">
              <span className="bar__label">{s.format}</span>
              <span className="bar__track">
                <span className="bar__fill" style={{ width: `${(value / max) * 100}%` }} />
              </span>
              <span className="bar__value">
                {anyReach
                  ? s.avgReach != null
                    ? s.avgReach.toLocaleString('nb-NO')
                    : '–'
                  : `${s.count} stk`}
              </span>
            </li>
          )
        })}
      </ul>

      <p className="muted bar__note">
        {anyReach
          ? 'Snittrekkevidde per format blant publiserte poster.'
          : 'Rangert på antall publisert. Legg inn rekkevidde per post for å rangere på hva som faktisk når ut.'}
      </p>
    </div>
  )
}
