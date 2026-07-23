import { useCallback, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useQuery } from '../lib/useQuery'
import type { Mandate, Property } from '../lib/types'
import { formatEur } from '../lib/dates'
import { Modal } from './ui/Modal'

/**
 * Kobler eiendommer til et mandat ved å sette client_shortlist. En
 * eiendom hører til ett mandat om gangen. Notion-synken rører aldri
 * dette feltet, så koblingen overlever neste synk.
 */
export function PropertyPicker({
  mandate,
  onClose,
  onSaved,
}: {
  mandate: Mandate
  onClose: () => void
  onSaved: () => void
}) {
  const { rows, loading, refresh } = useQuery<Property>(
    useCallback(() => supabase.from('properties').select('*').order('title'), []),
  )
  const [filter, setFilter] = useState('')
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState('')

  const needle = filter.trim().toLowerCase()
  const visible = needle
    ? rows.filter(
        (p) =>
          p.title.toLowerCase().includes(needle) ||
          (p.area ?? '').toLowerCase().includes(needle),
      )
    : rows

  async function toggle(p: Property) {
    const linkedHere = p.client_shortlist === mandate.id
    setBusy(p.id)
    setError('')
    const { error } = await supabase
      .from('properties')
      .update({ client_shortlist: linkedHere ? null : mandate.id })
      .eq('id', p.id)
    setBusy(null)
    if (error) {
      setError(error.message)
      return
    }
    refresh()
    onSaved()
  }

  return (
    <Modal title={`Eiendommer for ${mandate.client_name}`} onClose={onClose}>
      <input
        className="field__input"
        placeholder="Søk på tittel eller område"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        autoFocus
      />

      {loading && <p className="muted picker__status">Henter</p>}

      {!loading && rows.length === 0 && (
        <p className="muted picker__status">
          Ingen eiendommer i huben enda. De kommer inn fra Notion via den daglige synken, eller
          du kan legge dem inn manuelt i Supabase.
        </p>
      )}

      {!loading && rows.length > 0 && visible.length === 0 && (
        <p className="muted picker__status">Ingen treff på {filter}.</p>
      )}

      <ul className="picker">
        {visible.map((p) => {
          const linkedHere = p.client_shortlist === mandate.id
          const linkedElsewhere = p.client_shortlist != null && !linkedHere

          return (
            <li key={p.id} className="picker__row">
              <div className="picker__body">
                <span className="picker__title">{p.title}</span>
                <span className="picker__meta">
                  {p.area && <span>{p.area}</span>}
                  {p.price_eur != null && <span>{formatEur(Number(p.price_eur))}</span>}
                  {p.sqm != null && <span>{p.sqm} mq</span>}
                  {linkedElsewhere && <span className="muted">på et annet mandat</span>}
                </span>
              </div>
              <button
                type="button"
                className={linkedHere ? 'toggle toggle--on' : 'toggle'}
                onClick={() => toggle(p)}
                disabled={busy === p.id}
              >
                {linkedHere ? 'På mandatet' : linkedElsewhere ? 'Flytt hit' : 'Legg til'}
              </button>
            </li>
          )
        })}
      </ul>

      {error && <p className="login__note login__note--warn">{error}</p>}

      <div className="form-actions">
        <span className="form-actions__spacer" />
        <button type="button" className="button" onClick={onClose}>
          Ferdig
        </button>
      </div>
    </Modal>
  )
}
