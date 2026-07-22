import { useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useQuery } from '../lib/useQuery'
import { usePeriod } from '../period/PeriodContext'
import type { Goal, Invoice } from '../lib/types'
import { REVENUE_GOAL_FLOOR_EUR, REVENUE_GOAL_NAME } from '../lib/constants'
import { daysUntil, formatDate, formatEur } from '../lib/dates'
import { RevenueProgress } from '../components/charts/RevenueProgress'

/**
 * Fase 3 gir grafen. Fakturaregisteret og forfettario-terskelen
 * kommer i fase 5.
 */
export function Okonomi() {
  const { range } = usePeriod()

  const invoices = useQuery<Invoice>(
    useCallback(
      () =>
        supabase
          .from('invoices')
          .select('*')
          .gte('issued_date', range.from)
          .lte('issued_date', range.to)
          .order('issued_date', { ascending: false }),
      [range.from, range.to],
    ),
    [range.from, range.to],
  )

  const goals = useQuery<Goal>(
    useCallback(() => supabase.from('goals').select('*').eq('name', REVENUE_GOAL_NAME), []),
  )

  const invoiced = invoices.rows.reduce((sum, i) => sum + Number(i.amount_eur ?? 0), 0)
  const paid = invoices.rows
    .filter((i) => i.status === 'betalt')
    .reduce((sum, i) => sum + Number(i.amount_eur ?? 0), 0)
  const goal = Number(goals.rows[0]?.target_value ?? REVENUE_GOAL_FLOOR_EUR)

  const outstanding = invoices.rows.filter((i) => i.status !== 'betalt')

  return (
    <div className="stack surface-cool">
      <header className="page-head">
        <div>
          <p className="section-label">Jobb</p>
          <h1 className="page-title">Økonomi</h1>
        </div>
      </header>

      <section className="panel">
        <header className="panel__head">
          <p className="section-label">Fakturert mot mål</p>
          <p className="panel__aside">{range.label}</p>
        </header>

        {invoices.loading ? (
          <p className="muted">Henter</p>
        ) : (
          <RevenueProgress invoiced={invoiced} paid={paid} goal={goal} />
        )}
      </section>

      <section className="panel">
        <header className="panel__head">
          <p className="section-label">Utestående</p>
          <p className="panel__aside">{outstanding.length}</p>
        </header>

        {outstanding.length === 0 && (
          <p className="muted">Ingenting utestående i denne perioden.</p>
        )}

        <ul className="tasks">
          {outstanding.map((i) => {
            const days = i.issued_date ? daysUntil(i.issued_date) : null
            return (
              <li key={i.id} className="task">
                <div className="task__main">
                  <span className="task__title">{i.client}</span>
                  <span className="priority__meta">
                    <span>{i.status}</span>
                    {i.issued_date && <span>utstedt {formatDate(i.issued_date)}</span>}
                    {days !== null && days < -30 && (
                      <span className="flag">{Math.abs(days)} dager gammel</span>
                    )}
                  </span>
                </div>
                <span className="invoice__amount">{formatEur(Number(i.amount_eur ?? 0))}</span>
              </li>
            )
          })}
        </ul>
      </section>
    </div>
  )
}
