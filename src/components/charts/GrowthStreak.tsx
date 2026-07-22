import type { GrowthLog } from '../../lib/types'
import { GROWTH_ITEMS } from '../../lib/constants'
import { weeksIn, type Range } from '../../lib/period'
import { toISODate, weekStart } from '../../lib/dates'

/**
 * Uker på rad der alle fem vekstpunktene er huket av minst én gang.
 * En enkel rad med fylte og tomme felt, ikke et diagram.
 */
export function GrowthStreak({ rows, range }: { rows: GrowthLog[]; range: Range }) {
  const weeks = weeksIn(range)

  const doneByWeek = new Map<string, Set<string>>()
  for (const row of rows) {
    if (!row.done) continue
    const [y, m, d] = row.date.split('-').map(Number)
    const key = toISODate(weekStart(new Date(y, m - 1, d)))
    if (!doneByWeek.has(key)) doneByWeek.set(key, new Set())
    doneByWeek.get(key)!.add(row.item)
  }

  const cells = weeks.map((week) => ({
    week,
    complete: (doneByWeek.get(week)?.size ?? 0) === GROWTH_ITEMS.length,
    partial: doneByWeek.get(week)?.size ?? 0,
  }))

  // Streaken telles bakfra, fra siste uke i perioden.
  let streak = 0
  for (let i = cells.length - 1; i >= 0; i--) {
    if (!cells[i].complete) break
    streak++
  }

  return (
    <div className="streak">
      <div className="streak__cells">
        {cells.map((cell) => (
          <span
            key={cell.week}
            className={cell.complete ? 'streak__cell streak__cell--on' : 'streak__cell'}
            title={`Uke fra ${cell.week}: ${cell.partial} av ${GROWTH_ITEMS.length}`}
          />
        ))}
      </div>
      <p className="streak__count">
        <span className="streak__number">{streak}</span>
        <span className="figure__unit">
          {streak === 1 ? 'uke på rad med alle fem' : 'uker på rad med alle fem'}
        </span>
      </p>
    </div>
  )
}
