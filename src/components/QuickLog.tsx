import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { BUCKETS, GROWTH_ITEMS } from '../lib/constants'
import type { Bucket, GrowthItem } from '../lib/types'
import { formatWeekday, today } from '../lib/dates'

type Hours = Record<Bucket, string>
type Growth = Record<GrowthItem, boolean>

const emptyHours = () =>
  Object.fromEntries(BUCKETS.map((b) => [b.key, ''])) as Hours

const emptyGrowth = () =>
  Object.fromEntries(GROWTH_ITEMS.map((g) => [g.key, false])) as Growth

/**
 * Hurtiglogg for dagen. Skriver med upsert på (date, bucket) og
 * (date, item), så gjentatt lagring oppdaterer i stedet for å duplisere.
 */
export function QuickLog({ onSaved }: { onSaved?: () => void }) {
  const date = today()
  const [hours, setHours] = useState<Hours>(emptyHours)
  const [growth, setGrowth] = useState<Growth>(emptyGrowth)
  const [state, setState] = useState<'loading' | 'idle' | 'saving' | 'saved' | 'error'>('loading')
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    async function load() {
      const [timeRes, growthRes] = await Promise.all([
        supabase.from('time_logs').select('bucket, hours').eq('date', date),
        supabase.from('growth_log').select('item, done').eq('date', date),
      ])
      if (!active) return

      if (timeRes.data) {
        const next = emptyHours()
        for (const row of timeRes.data) {
          next[row.bucket as Bucket] = String(row.hours)
        }
        setHours(next)
      }
      if (growthRes.data) {
        const next = emptyGrowth()
        for (const row of growthRes.data) {
          next[row.item as GrowthItem] = row.done as boolean
        }
        setGrowth(next)
      }
      setState('idle')
    }

    load()
    return () => {
      active = false
    }
  }, [date])

  async function save() {
    setState('saving')
    setError('')

    const timeRows = BUCKETS.filter((b) => hours[b.key] !== '').map((b) => ({
      date,
      bucket: b.key,
      hours: Number(hours[b.key].replace(',', '.')),
    }))

    const growthRows = GROWTH_ITEMS.map((g) => ({
      date,
      item: g.key,
      done: growth[g.key],
    }))

    const results = await Promise.all([
      timeRows.length
        ? supabase.from('time_logs').upsert(timeRows, { onConflict: 'user_id,date,bucket' })
        : Promise.resolve({ error: null }),
      supabase.from('growth_log').upsert(growthRows, { onConflict: 'user_id,date,item' }),
    ])

    const failed = results.find((r) => r.error)
    if (failed?.error) {
      setState('error')
      setError(failed.error.message)
      return
    }

    setState('saved')
    onSaved?.()
    setTimeout(() => setState('idle'), 2500)
  }

  const total = BUCKETS.reduce(
    (sum, b) => sum + (Number(hours[b.key].replace(',', '.')) || 0),
    0,
  )
  const doneCount = GROWTH_ITEMS.filter((g) => growth[g.key]).length

  return (
    <section className="panel">
      <header className="panel__head">
        <p className="section-label">Hurtiglogg</p>
        <p className="panel__aside">{formatWeekday(date)}</p>
      </header>

      {state === 'loading' ? (
        <p className="muted">Henter</p>
      ) : (
        <>
          <div className="buckets">
            {BUCKETS.map((bucket) => (
              <label key={bucket.key} className="bucket">
                <span className="bucket__label">{bucket.label}</span>
                <span className="bucket__hint">{bucket.hint}</span>
                <input
                  type="number"
                  inputMode="decimal"
                  min="0"
                  max="24"
                  step="0.25"
                  placeholder="0"
                  value={hours[bucket.key]}
                  onChange={(e) =>
                    setHours((prev) => ({ ...prev, [bucket.key]: e.target.value }))
                  }
                  className="bucket__input"
                />
              </label>
            ))}
          </div>

          <div className="growth">
            {GROWTH_ITEMS.map((item) => (
              <button
                key={item.key}
                type="button"
                className={growth[item.key] ? 'chip chip--on' : 'chip'}
                aria-pressed={growth[item.key]}
                onClick={() =>
                  setGrowth((prev) => ({ ...prev, [item.key]: !prev[item.key] }))
                }
              >
                {item.label}
              </button>
            ))}
          </div>

          <footer className="panel__foot">
            <p className="muted">
              {total > 0 ? `${total.toLocaleString('nb-NO')} timer` : 'Ingen timer enda'}
              {', '}
              {doneCount} av {GROWTH_ITEMS.length} vekstpunkter
            </p>
            <button
              type="button"
              className="button"
              onClick={save}
              disabled={state === 'saving'}
            >
              {state === 'saving' ? 'Lagrer' : state === 'saved' ? 'Lagret' : 'Lagre dagen'}
            </button>
          </footer>

          {state === 'error' && <p className="login__note login__note--warn">{error}</p>}
        </>
      )}
    </section>
  )
}
