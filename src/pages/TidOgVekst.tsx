import { useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useQuery } from '../lib/useQuery'
import { usePeriod } from '../period/PeriodContext'
import type { GrowthLog, TimeLog } from '../lib/types'
import { BUCKETS, CONTENT_CAP_HOURS_PER_WEEK } from '../lib/constants'
import { formatHours } from '../lib/dates'
import { HoursStacked } from '../components/charts/HoursStacked'
import { GrowthStreak } from '../components/charts/GrowthStreak'

export function TidOgVekst() {
  const { range } = usePeriod()

  const time = useQuery<TimeLog>(
    useCallback(
      () =>
        supabase
          .from('time_logs')
          .select('*')
          .gte('date', range.from)
          .lte('date', range.to),
      [range.from, range.to],
    ),
    [range.from, range.to],
  )

  const growth = useQuery<GrowthLog>(
    useCallback(
      () =>
        supabase
          .from('growth_log')
          .select('*')
          .gte('date', range.from)
          .lte('date', range.to),
      [range.from, range.to],
    ),
    [range.from, range.to],
  )

  const perBucket = BUCKETS.map((b) => ({
    ...b,
    hours: time.rows
      .filter((r) => r.bucket === b.key)
      .reduce((sum, r) => sum + Number(r.hours ?? 0), 0),
  }))

  const total = perBucket.reduce((sum, b) => sum + b.hours, 0)
  const contentHours = perBucket.find((b) => b.key === 'content')?.hours ?? 0
  const weeks = Math.max(1, Math.round((total > 0 ? countWeeks(range.from, range.to) : 1)))
  const contentPerWeek = contentHours / weeks
  const travelDays = new Set(
    time.rows.filter((r) => r.bucket === 'travel' && Number(r.hours) > 0).map((r) => r.date),
  ).size

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
          <p className="section-label">Timer per bucket</p>
          <p className="panel__aside">{formatHours(total)} timer totalt</p>
        </header>

        {time.loading ? (
          <p className="muted">Henter</p>
        ) : (
          <HoursStacked rows={time.rows} range={range} />
        )}

        <p className="muted bar__note">
          Tak på innhold: {CONTENT_CAP_HOURS_PER_WEEK} timer i uken. Snittet i denne
          perioden er{' '}
          <span className={contentPerWeek > CONTENT_CAP_HOURS_PER_WEEK ? 'flag' : undefined}>
            {formatHours(contentPerWeek)}
          </span>
          .
        </p>
      </section>

      <div className="split">
        <section className="panel">
          <header className="panel__head">
            <p className="section-label">Vekststreak</p>
          </header>
          {growth.loading ? (
            <p className="muted">Henter</p>
          ) : (
            <GrowthStreak rows={growth.rows} range={range} />
          )}
        </section>

        <section className="panel">
          <header className="panel__head">
            <p className="section-label">Reise</p>
          </header>
          <p className="figure__value">{travelDays}</p>
          <p className="figure__unit">reisedager i perioden</p>
        </section>
      </div>
    </div>
  )
}

function countWeeks(from: string, to: string) {
  const [fy, fm, fd] = from.split('-').map(Number)
  const [ty, tm, td] = to.split('-').map(Number)
  const days =
    (new Date(ty, tm - 1, td).getTime() - new Date(fy, fm - 1, fd).getTime()) / 86_400_000 + 1
  return days / 7
}
