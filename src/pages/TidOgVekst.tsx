import { useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useQuery } from '../lib/useQuery'
import type { GrowthLog, TimeLog } from '../lib/types'
import {
  BUCKETS,
  CONTENT_CAP_HOURS_PER_WEEK,
  GROWTH_ITEMS,
} from '../lib/constants'
import { formatHours, toISODate, weekStart } from '../lib/dates'

/**
 * Lean utgave for fase 2. Tallene er ekte, men grafene og
 * periodebryteren kommer i fase 3.
 */
export function TidOgVekst() {
  const from = toISODate(weekStart())

  const time = useQuery<TimeLog>(
    useCallback(() => supabase.from('time_logs').select('*').gte('date', from), [from]),
    [from],
  )

  const growth = useQuery<GrowthLog>(
    useCallback(() => supabase.from('growth_log').select('*').gte('date', from), [from]),
    [from],
  )

  const perBucket = BUCKETS.map((b) => ({
    ...b,
    hours: time.rows
      .filter((r) => r.bucket === b.key)
      .reduce((sum, r) => sum + Number(r.hours ?? 0), 0),
  }))

  const total = perBucket.reduce((sum, b) => sum + b.hours, 0)
  const max = Math.max(...perBucket.map((b) => b.hours), 1)
  const contentHours = perBucket.find((b) => b.key === 'content')?.hours ?? 0
  const travelDays = new Set(
    time.rows.filter((r) => r.bucket === 'travel' && Number(r.hours) > 0).map((r) => r.date),
  ).size

  const growthDone = GROWTH_ITEMS.map((item) => ({
    ...item,
    days: growth.rows.filter((r) => r.item === item.key && r.done).length,
  }))

  return (
    <div className="stack surface-warm">
      <header className="page-head">
        <div>
          <p className="section-label">Privat</p>
          <h1 className="page-title">Tid og vekst</h1>
        </div>
      </header>

      <section className="panel">
        <header className="panel__head">
          <p className="section-label">Timer denne uken</p>
          <p className="panel__aside">{formatHours(total)} totalt</p>
        </header>

        {time.loading && <p className="muted">Henter</p>}

        <ul className="bars">
          {perBucket.map((b) => (
            <li key={b.key} className="bar">
              <span className="bar__label">{b.label}</span>
              <span className="bar__track">
                <span
                  className={b.key === 'content' ? 'bar__fill bar__fill--capped' : 'bar__fill'}
                  style={{ width: `${(b.hours / max) * 100}%` }}
                />
              </span>
              <span className="bar__value">{formatHours(b.hours)}</span>
            </li>
          ))}
        </ul>

        <p className="muted bar__note">
          Tak på innhold: {CONTENT_CAP_HOURS_PER_WEEK} timer i uken. Du ligger på{' '}
          <span className={contentHours > CONTENT_CAP_HOURS_PER_WEEK ? 'flag' : undefined}>
            {formatHours(contentHours)}
          </span>
          .
        </p>
      </section>

      <div className="split">
        <section className="panel">
          <header className="panel__head">
            <p className="section-label">Vekst denne uken</p>
          </header>
          <ul className="bars">
            {growthDone.map((g) => (
              <li key={g.key} className="bar">
                <span className="bar__label">{g.label}</span>
                <span className="bar__track">
                  <span className="bar__fill" style={{ width: `${(g.days / 7) * 100}%` }} />
                </span>
                <span className="bar__value">{g.days} av 7</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="panel">
          <header className="panel__head">
            <p className="section-label">Reise</p>
          </header>
          <p className="figure__value">{travelDays}</p>
          <p className="figure__unit">reisedager denne uken</p>
        </section>
      </div>
    </div>
  )
}
