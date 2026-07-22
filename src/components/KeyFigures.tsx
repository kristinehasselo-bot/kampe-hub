import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import {
  REVENUE_GOAL_CEILING_EUR,
  REVENUE_GOAL_FLOOR_EUR,
  REVENUE_GOAL_NAME,
} from '../lib/constants'
import {
  daysUntil,
  formatEur,
  formatHours,
  monthStart,
  nextSeptember30,
  toISODate,
  weekStart,
} from '../lib/dates'

interface Figures {
  invoiced: number
  goal: number
  mandates: number
  weekHours: number
}

export function KeyFigures({ refreshKey = 0 }: { refreshKey?: number }) {
  const [figures, setFigures] = useState<Figures | null>(null)

  const load = useCallback(async () => {
    const monthFrom = toISODate(monthStart())
    const weekFrom = toISODate(weekStart())

    const [invoiceRes, goalRes, mandateRes, hoursRes] = await Promise.all([
      supabase.from('invoices').select('amount_eur').gte('issued_date', monthFrom),
      supabase.from('goals').select('target_value').eq('name', REVENUE_GOAL_NAME).maybeSingle(),
      supabase.from('mandates').select('id').neq('stage', 'ferdig'),
      supabase.from('time_logs').select('hours').gte('date', weekFrom),
    ])

    setFigures({
      invoiced: (invoiceRes.data ?? []).reduce((sum, r) => sum + Number(r.amount_eur ?? 0), 0),
      goal: Number(goalRes.data?.target_value ?? REVENUE_GOAL_FLOOR_EUR),
      mandates: (mandateRes.data ?? []).length,
      weekHours: (hoursRes.data ?? []).reduce((sum, r) => sum + Number(r.hours ?? 0), 0),
    })
  }, [])

  useEffect(() => {
    load()
  }, [load, refreshKey])

  const countdown = daysUntil(nextSeptember30())
  const share = figures && figures.goal > 0 ? figures.invoiced / figures.goal : 0

  return (
    <section className="figures">
      <article className="figure">
        <p className="figure__label">Til 30. september</p>
        <p className="figure__value">{countdown}</p>
        <p className="figure__unit">dager</p>
      </article>

      <article className="figure figure--finance">
        <p className="figure__label">Fakturert denne måneden</p>
        <p className="figure__value">{figures ? formatEur(figures.invoiced) : ''}</p>
        <p className="figure__unit">
          mål {figures ? formatEur(figures.goal) : formatEur(REVENUE_GOAL_FLOOR_EUR)}
          {' til '}
          {formatEur(REVENUE_GOAL_CEILING_EUR)}
        </p>
        <div className="meter" aria-hidden>
          <span className="meter__fill" style={{ width: `${Math.min(share, 1) * 100}%` }} />
        </div>
      </article>

      <article className="figure">
        <p className="figure__label">Aktive mandater</p>
        <p className="figure__value">{figures ? figures.mandates : ''}</p>
        <p className="figure__unit">under arbeid</p>
      </article>

      <article className="figure">
        <p className="figure__label">Denne uken</p>
        <p className="figure__value">{figures ? formatHours(figures.weekHours) : ''}</p>
        <p className="figure__unit">timer logget</p>
      </article>
    </section>
  )
}
