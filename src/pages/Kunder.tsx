import { useCallback, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useQuery } from '../lib/useQuery'
import { usePeriod } from '../period/PeriodContext'
import type { Mandate, Property, TimeLog } from '../lib/types'
import { DUE_SOON_DAYS } from '../lib/constants'
import { daysUntil, formatDate, formatEur } from '../lib/dates'
import { StageTimeline } from '../components/StageTimeline'
import { MandateForm } from '../components/MandateForm'
import { PropertyPicker } from '../components/PropertyPicker'
import { MandatesByStage } from '../components/charts/MandatesByStage'
import { BizDevVsClients } from '../components/charts/BizDevVsClients'

export function Kunder() {
  const [editing, setEditing] = useState<Mandate | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [pickerFor, setPickerFor] = useState<Mandate | null>(null)
  const { range } = usePeriod()

  const mandates = useQuery<Mandate>(
    useCallback(
      () => supabase.from('mandates').select('*').order('next_step_due', {
        ascending: true,
        nullsFirst: false,
      }),
      [],
    ),
  )

  const properties = useQuery<Property>(
    useCallback(
      () => supabase.from('properties').select('*').not('client_shortlist', 'is', null),
      [],
    ),
  )

  // Kun timene i forretningsutvikling, og kun i valgt periode.
  const bizDevHours = useQuery<TimeLog>(
    useCallback(
      () =>
        supabase
          .from('time_logs')
          .select('*')
          .eq('bucket', 'biz_dev')
          .gte('date', range.from)
          .lte('date', range.to),
      [range.from, range.to],
    ),
    [range.from, range.to],
  )

  function refresh() {
    mandates.refresh()
    properties.refresh()
    bizDevHours.refresh()
  }

  function openNew() {
    setEditing(null)
    setFormOpen(true)
  }

  function openEdit(m: Mandate) {
    setEditing(m)
    setFormOpen(true)
  }

  return (
    <div className="stack surface-warm">
      <header className="page-head">
        <div>
          <p className="section-label">Jobb</p>
          <h1 className="page-title">Kunder</h1>
        </div>
        <button type="button" className="button" onClick={openNew}>
          Nytt mandat
        </button>
      </header>

      <div className="split">
        <section className="panel">
          <header className="panel__head">
            <p className="section-label">Mandater etter fase</p>
            <p className="panel__aside">{mandates.rows.length} totalt</p>
          </header>
          <MandatesByStage rows={mandates.rows} />
        </section>

        <section className="panel">
          <header className="panel__head">
            <p className="section-label">Timer mot resultat</p>
            <p className="panel__aside">{range.label}</p>
          </header>
          <BizDevVsClients
            hours={bizDevHours.rows}
            mandates={mandates.rows}
            range={range}
          />
        </section>
      </div>

      {mandates.loading && <p className="muted">Henter</p>}

      {!mandates.loading && mandates.rows.length === 0 && (
        <p className="muted">
          Ingen mandater enda. Legg inn det første, så tegnes tidslinjen fra mandat til rogito.
        </p>
      )}

      <div className="mandates">
        {mandates.rows.map((m) => {
          const shortlist = properties.rows.filter((p) => p.client_shortlist === m.id)
          const days = m.next_step_due ? daysUntil(m.next_step_due) : null
          const pressing = days !== null && days <= DUE_SOON_DAYS
          const total = Number(m.fee_total ?? 0)
          const paid = Number(m.fee_paid ?? 0)
          const share = total > 0 ? Math.min(paid / total, 1) : 0

          return (
            <article key={m.id} className="mandate">
              <header className="mandate__head">
                <div>
                  <h2 className="mandate__client">{m.client_name}</h2>
                  {m.area && <p className="muted">{m.area}</p>}
                </div>
                <button
                  type="button"
                  className="button button--quiet"
                  onClick={() => openEdit(m)}
                >
                  Rediger
                </button>
              </header>

              <StageTimeline stage={m.stage} />

              <dl className="mandate__facts">
                {m.next_step && (
                  <div className="fact">
                    <dt>Neste steg</dt>
                    <dd>
                      {m.next_step}
                      {m.next_step_due && (
                        <span className={pressing ? ' flag' : ' muted'}>
                          {' '}
                          {days! < 0
                            ? `${Math.abs(days!)} dager over frist`
                            : days === 0
                              ? 'i dag'
                              : `om ${days} dager`}
                        </span>
                      )}
                    </dd>
                  </div>
                )}

                {(m.viewing_from || m.viewing_to) && (
                  <div className="fact">
                    <dt>Visning</dt>
                    <dd>
                      {m.viewing_from && formatDate(m.viewing_from)}
                      {m.viewing_from && m.viewing_to && ' til '}
                      {m.viewing_to && formatDate(m.viewing_to)}
                    </dd>
                  </div>
                )}

                {total > 0 && (
                  <div className="fact">
                    <dt>Honorar</dt>
                    <dd>
                      {formatEur(paid)} av {formatEur(total)}
                      <div className="meter">
                        <span className="meter__fill meter__fill--warm" style={{ width: `${share * 100}%` }} />
                      </div>
                    </dd>
                  </div>
                )}
              </dl>

              <div className="shortlist">
                <div className="shortlist__head">
                  <p className="section-label">Shortlist</p>
                  <button
                    type="button"
                    className="button button--quiet button--small"
                    onClick={() => setPickerFor(m)}
                  >
                    Legg til eiendom
                  </button>
                </div>

                {shortlist.length === 0 && (
                  <p className="muted">Ingen eiendommer knyttet til dette mandatet enda.</p>
                )}

                {shortlist.length > 0 && (
                  <ul className="shortlist__list">
                    {shortlist.map((p) => (
                      <li key={p.id} className="shortlist__item">
                        <span className="shortlist__title">{p.title}</span>
                        <span className="shortlist__meta">
                          {p.price_eur != null && formatEur(Number(p.price_eur))}
                          {p.sqm != null && ` · ${p.sqm} mq`}
                          {p.price_per_sqm != null &&
                            ` · ${formatEur(Number(p.price_per_sqm))} per mq`}
                        </span>
                        <span className="shortlist__links">
                          {p.listing_url && (
                            <a href={p.listing_url} target="_blank" rel="noreferrer">
                              Annonse
                            </a>
                          )}
                          {p.notion_url && (
                            <a href={p.notion_url} target="_blank" rel="noreferrer">
                              Notion
                            </a>
                          )}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {m.notes && <p className="mandate__notes">{m.notes}</p>}

              {m.notion_url && (
                <a href={m.notion_url} target="_blank" rel="noreferrer" className="mandate__link">
                  Åpne i Notion
                </a>
              )}
            </article>
          )
        })}
      </div>

      {formOpen && (
        <MandateForm
          mandate={editing}
          onClose={() => setFormOpen(false)}
          onSaved={refresh}
        />
      )}

      {pickerFor && (
        <PropertyPicker
          mandate={pickerFor}
          onClose={() => setPickerFor(null)}
          onSaved={() => properties.refresh()}
        />
      )}
    </div>
  )
}
