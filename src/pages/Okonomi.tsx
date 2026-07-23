import { useCallback, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useQuery } from '../lib/useQuery'
import { usePeriod } from '../period/PeriodContext'
import type { Goal, Invoice, Mandate } from '../lib/types'
import { REVENUE_GOAL_FLOOR_EUR, REVENUE_GOAL_NAME } from '../lib/constants'
import { daysUntil, formatDate, formatEur, toISODate } from '../lib/dates'
import { RevenueProgress } from '../components/charts/RevenueProgress'
import { ForfettarioMeter } from '../components/finance/ForfettarioMeter'
import { InvoiceForm } from '../components/finance/InvoiceForm'

const STATUS_ORDER: Record<Invoice['status'], number> = {
  forfalt: 0,
  sendt: 1,
  utkast: 2,
  betalt: 3,
}

export function Okonomi() {
  const { range } = usePeriod()
  const [editing, setEditing] = useState<Invoice | null>(null)
  const [formOpen, setFormOpen] = useState(false)

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

  // Forfettario-taket er årlig, så dette kallet ignorerer periodebryteren.
  const yearStart = toISODate(new Date(new Date().getFullYear(), 0, 1))
  const yearInvoices = useQuery<Invoice>(
    useCallback(() => supabase.from('invoices').select('*').gte('issued_date', yearStart), [
      yearStart,
    ]),
    [yearStart],
  )

  const goals = useQuery<Goal>(
    useCallback(() => supabase.from('goals').select('*').eq('name', REVENUE_GOAL_NAME), []),
  )

  const mandates = useQuery<Mandate>(
    useCallback(() => supabase.from('mandates').select('*'), []),
  )

  const invoiced = invoices.rows.reduce((sum, i) => sum + Number(i.amount_eur ?? 0), 0)
  const paid = invoices.rows
    .filter((i) => i.status === 'betalt')
    .reduce((sum, i) => sum + Number(i.amount_eur ?? 0), 0)
  const goal = Number(goals.rows[0]?.target_value ?? REVENUE_GOAL_FLOOR_EUR)
  const invoicedThisYear = yearInvoices.rows.reduce(
    (sum, i) => sum + Number(i.amount_eur ?? 0),
    0,
  )

  const sorted = [...invoices.rows].sort(
    (a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status],
  )

  function openNew() {
    setEditing(null)
    setFormOpen(true)
  }

  function refresh() {
    invoices.refresh()
    yearInvoices.refresh()
  }

  return (
    <div className="stack surface-cool">
      <header className="page-head">
        <div>
          <p className="section-label">Jobb</p>
          <h1 className="page-title">Økonomi</h1>
        </div>
        <button type="button" className="button" onClick={openNew}>
          Ny faktura
        </button>
      </header>

      <div className="split">
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
            <p className="section-label">Forfettario-terskel</p>
            <p className="panel__aside">årlig</p>
          </header>
          <ForfettarioMeter invoicedThisYear={invoicedThisYear} />
        </section>
      </div>

      <section className="panel">
        <header className="panel__head">
          <p className="section-label">Fakturaer</p>
          <p className="panel__aside">{range.label}</p>
        </header>

        {!invoices.loading && sorted.length === 0 && (
          <p className="muted">Ingen fakturaer i denne perioden.</p>
        )}

        <ul className="tasks">
          {sorted.map((inv) => {
            const days = inv.issued_date ? daysUntil(inv.issued_date) : null
            const overdue = inv.status !== 'betalt' && days !== null && days < -30

            return (
              <li key={inv.id} className="task">
                <button
                  type="button"
                  className="task__main"
                  onClick={() => {
                    setEditing(inv)
                    setFormOpen(true)
                  }}
                >
                  <span className="task__title">{inv.client}</span>
                  <span className="priority__meta">
                    <span className={`badge badge--inv-${inv.status}`}>{inv.status}</span>
                    {inv.issued_date && <span>utstedt {formatDate(inv.issued_date)}</span>}
                    {inv.paid_date && <span>betalt {formatDate(inv.paid_date)}</span>}
                    {overdue && <span className="flag">{Math.abs(days!)} dager gammel</span>}
                  </span>
                </button>
                <span className="invoice__amount">{formatEur(Number(inv.amount_eur ?? 0))}</span>
              </li>
            )
          })}
        </ul>
      </section>

      {formOpen && (
        <InvoiceForm
          invoice={editing}
          mandates={mandates.rows}
          onClose={() => setFormOpen(false)}
          onSaved={refresh}
        />
      )}
    </div>
  )
}
