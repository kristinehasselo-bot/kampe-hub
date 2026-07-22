import { useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useQuery } from '../lib/useQuery'
import { usePeriod } from '../period/PeriodContext'
import type { ContentMetric } from '../lib/types'
import { FollowersChart } from '../components/charts/FollowersChart'

/**
 * Fase 3 gir metrikkgrafene. Innholdsplanen som kalender og
 * formatrangeringen kommer i fase 5.
 */
export function Innhold() {
  const { range } = usePeriod()

  const { rows, loading } = useQuery<ContentMetric>(
    useCallback(
      () =>
        supabase
          .from('content_metrics')
          .select('*')
          .gte('week_start', range.from)
          .lte('week_start', range.to)
          .order('week_start', { ascending: true }),
      [range.from, range.to],
    ),
    [range.from, range.to],
  )

  const empty = !loading && rows.length === 0

  return (
    <div className="stack surface-warm">
      <header className="page-head">
        <div>
          <p className="section-label">Jobb</p>
          <h1 className="page-title">Innhold</h1>
        </div>
      </header>

      {empty && (
        <p className="muted">
          Ingen tall i denne perioden. KE ukentlig review skriver til content_metrics hver
          mandag fra fase 4.
        </p>
      )}

      <section className="panel">
        <header className="panel__head">
          <p className="section-label">Følgervekst, netto</p>
          <p className="panel__aside">{range.label}</p>
        </header>
        <FollowersChart rows={rows} range={range} metric="followers_net" />
      </section>

      <section className="panel">
        <header className="panel__head">
          <p className="section-label">Engasjementrate</p>
          <p className="panel__aside">prosent</p>
        </header>
        <FollowersChart rows={rows} range={range} metric="engagement_rate" />
      </section>
    </div>
  )
}
