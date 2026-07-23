import { useCallback, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useQuery } from '../lib/useQuery'
import { usePeriod } from '../period/PeriodContext'
import type { ContentMetric, ContentPlanItem } from '../lib/types'
import { FollowersChart } from '../components/charts/FollowersChart'
import { ContentCalendar } from '../components/content/ContentCalendar'
import { ContentPlanForm } from '../components/content/ContentPlanForm'
import { FormatRanking } from '../components/content/FormatRanking'

export function Innhold() {
  const { range } = usePeriod()
  const [editing, setEditing] = useState<ContentPlanItem | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [newDate, setNewDate] = useState<string | undefined>(undefined)

  const metrics = useQuery<ContentMetric>(
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

  // Hele planen, ikke periodefiltrert. Kalenderen har egen månedsnav, og
  // format-rangeringen skal se alle publiserte poster.
  const plan = useQuery<ContentPlanItem>(
    useCallback(() => supabase.from('content_plan').select('*'), []),
  )

  function openEdit(item: ContentPlanItem) {
    setEditing(item)
    setNewDate(undefined)
    setFormOpen(true)
  }

  function openNew(date?: string) {
    setEditing(null)
    setNewDate(date)
    setFormOpen(true)
  }

  const metricsEmpty = !metrics.loading && metrics.rows.length === 0

  return (
    <div className="stack surface-warm">
      <header className="page-head">
        <div>
          <p className="section-label">Jobb</p>
          <h1 className="page-title">Innhold</h1>
        </div>
        <button type="button" className="button" onClick={() => openNew()}>
          Ny post
        </button>
      </header>

      <div className="split">
        <section className="panel">
          <header className="panel__head">
            <p className="section-label">Følgervekst, netto</p>
            <p className="panel__aside">{range.label}</p>
          </header>
          {metricsEmpty ? (
            <p className="muted">
              Ingen tall i denne perioden. KE ukentlig review skriver til content_metrics hver
              mandag.
            </p>
          ) : (
            <FollowersChart rows={metrics.rows} range={range} metric="followers_net" />
          )}
        </section>

        <section className="panel">
          <header className="panel__head">
            <p className="section-label">Engasjementrate</p>
            <p className="panel__aside">prosent</p>
          </header>
          {!metricsEmpty && (
            <FollowersChart rows={metrics.rows} range={range} metric="engagement_rate" />
          )}
        </section>
      </div>

      <section className="panel">
        <header className="panel__head">
          <p className="section-label">Innholdsplan</p>
        </header>
        <ContentCalendar items={plan.rows} onPick={openEdit} onNew={openNew} />
      </section>

      <section className="panel">
        <header className="panel__head">
          <p className="section-label">Format-rangering</p>
          <p className="panel__aside">hva som når ut</p>
        </header>
        <FormatRanking items={plan.rows} />
      </section>

      {formOpen && (
        <ContentPlanForm
          item={editing}
          defaultDate={newDate}
          onClose={() => setFormOpen(false)}
          onSaved={plan.refresh}
        />
      )}
    </div>
  )
}
