import { useCallback, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useQuery } from '../lib/useQuery'
import type { Milestone } from '../lib/types'
import { DUE_SOON_DAYS, MILESTONE_CATEGORIES } from '../lib/constants'
import { daysUntil, formatDate } from '../lib/dates'
import { MilestoneForm } from '../components/MilestoneForm'

/** Rekkefølgen kategoriene vises i, resten havner under "annet". */
const ORDER = [...MILESTONE_CATEGORIES, null] as (Milestone['category'] | null)[]

export function Admin() {
  const [editing, setEditing] = useState<Milestone | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [showDone, setShowDone] = useState(false)

  const { rows, loading, refresh } = useQuery<Milestone>(
    useCallback(
      () =>
        supabase
          .from('milestones')
          .select('*')
          .order('due_date', { ascending: true, nullsFirst: false }),
      [],
    ),
  )

  const visible = showDone ? rows : rows.filter((m) => m.status !== 'ferdig')
  const doneCount = rows.filter((m) => m.status === 'ferdig').length

  return (
    <div className="stack surface-cool">
      <header className="page-head">
        <div>
          <p className="section-label">Jobb</p>
          <h1 className="page-title">Admin og milepæler</h1>
        </div>
        <button
          type="button"
          className="button"
          onClick={() => {
            setEditing(null)
            setFormOpen(true)
          }}
        >
          Ny milepæl
        </button>
      </header>

      {loading && <p className="muted">Henter</p>}

      {!loading && rows.length === 0 && (
        <p className="muted">
          Ingen milepæler enda. Kjør <code>supabase/seed-milepaeler.sql</code> for å legge inn
          P.IVA, FIF Sezione G, oppdragsavtalen og Impatriati.
        </p>
      )}

      {ORDER.map((category) => {
        const items = visible.filter((m) => m.category === category)
        if (items.length === 0) return null

        return (
          <section key={category ?? 'annet'} className="panel">
            <header className="panel__head">
              <p className="section-label">{category ?? 'annet'}</p>
              <p className="panel__aside">{items.length}</p>
            </header>

            <ul className="milestones">
              {items.map((m) => {
                const days = m.due_date ? daysUntil(m.due_date) : null
                const pressing =
                  days !== null && days <= DUE_SOON_DAYS && m.status !== 'ferdig'

                return (
                  <li key={m.id} className="milestone">
                    <button
                      type="button"
                      className="milestone__main"
                      onClick={() => {
                        setEditing(m)
                        setFormOpen(true)
                      }}
                    >
                      <span className="milestone__title">{m.title}</span>
                      <span className="milestone__meta">
                        <span className={`badge badge--${statusKey(m.status)}`}>{m.status}</span>
                        {m.owner && <span>{m.owner}</span>}
                        {m.due_date && (
                          <span className={pressing ? 'flag' : undefined}>
                            {days! < 0
                              ? `${Math.abs(days!)} dager over frist`
                              : formatDate(m.due_date)}
                          </span>
                        )}
                      </span>
                      {m.blocker && (
                        <span className="milestone__blocker">Blokkert av: {m.blocker}</span>
                      )}
                    </button>

                    {m.url && (
                      <a
                        href={m.url}
                        target="_blank"
                        rel="noreferrer"
                        className="milestone__link"
                      >
                        Åpne
                      </a>
                    )}
                  </li>
                )
              })}
            </ul>
          </section>
        )
      })}

      {doneCount > 0 && (
        <button
          type="button"
          className="button button--quiet button--self"
          onClick={() => setShowDone((v) => !v)}
        >
          {showDone ? 'Skjul ferdige' : `Vis ${doneCount} ferdige`}
        </button>
      )}

      {formOpen && (
        <MilestoneForm
          milestone={editing}
          onClose={() => setFormOpen(false)}
          onSaved={refresh}
        />
      )}
    </div>
  )
}

function statusKey(status: Milestone['status']) {
  return status === 'i gang' ? 'igang' : status
}
