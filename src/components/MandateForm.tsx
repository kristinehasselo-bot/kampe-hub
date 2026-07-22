import { useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabase'
import { MANDATE_STAGES } from '../lib/constants'
import type { Mandate, MandateStage } from '../lib/types'
import { Modal } from './ui/Modal'
import { Field, FormActions, FormGrid } from './ui/form'

type Draft = Partial<Mandate>

export function MandateForm({
  mandate,
  onClose,
  onSaved,
}: {
  mandate: Mandate | null
  onClose: () => void
  onSaved: () => void
}) {
  const [draft, setDraft] = useState<Draft>(
    mandate ?? { client_name: '', stage: 'mandat signert', fee_paid: 0 },
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function set<K extends keyof Mandate>(key: K, value: Mandate[K] | null) {
    setDraft((prev) => ({ ...prev, [key]: value }))
  }

  /** Tomme felt skal bli null i basen, ikke tom streng. */
  function clean(value: string) {
    return value.trim() === '' ? null : value
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    setSaving(true)
    setError('')

    const payload = {
      client_name: draft.client_name?.trim(),
      area: clean(draft.area ?? ''),
      stage: draft.stage,
      next_step: clean(draft.next_step ?? ''),
      next_step_due: draft.next_step_due || null,
      viewing_from: draft.viewing_from || null,
      viewing_to: draft.viewing_to || null,
      fee_total: draft.fee_total ?? null,
      fee_paid: draft.fee_paid ?? 0,
      notes: clean(draft.notes ?? ''),
      notion_url: clean(draft.notion_url ?? ''),
    }

    const { error } = mandate
      ? await supabase.from('mandates').update(payload).eq('id', mandate.id)
      : await supabase.from('mandates').insert(payload)

    setSaving(false)
    if (error) {
      setError(error.message)
      return
    }
    onSaved()
    onClose()
  }

  async function remove() {
    if (!mandate) return
    if (!confirm(`Slette mandatet for ${mandate.client_name}?`)) return
    const { error } = await supabase.from('mandates').delete().eq('id', mandate.id)
    if (error) {
      setError(error.message)
      return
    }
    onSaved()
    onClose()
  }

  return (
    <Modal title={mandate ? 'Rediger mandat' : 'Nytt mandat'} onClose={onClose}>
      <form onSubmit={submit}>
        <FormGrid>
          <Field label="Kunde" wide>
            <input
              className="field__input"
              value={draft.client_name ?? ''}
              onChange={(e) => set('client_name', e.target.value)}
              required
              autoFocus
            />
          </Field>

          <Field label="Område">
            <input
              className="field__input"
              value={draft.area ?? ''}
              onChange={(e) => set('area', e.target.value)}
              placeholder="Val d'Orcia"
            />
          </Field>

          <Field label="Fase">
            <select
              className="field__input"
              value={draft.stage ?? 'mandat signert'}
              onChange={(e) => set('stage', e.target.value as MandateStage)}
            >
              {MANDATE_STAGES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Neste steg" wide>
            <input
              className="field__input"
              value={draft.next_step ?? ''}
              onChange={(e) => set('next_step', e.target.value)}
            />
          </Field>

          <Field label="Frist neste steg">
            <input
              type="date"
              className="field__input"
              value={draft.next_step_due ?? ''}
              onChange={(e) => set('next_step_due', e.target.value)}
            />
          </Field>

          <Field label="Visning fra">
            <input
              type="date"
              className="field__input"
              value={draft.viewing_from ?? ''}
              onChange={(e) => set('viewing_from', e.target.value)}
            />
          </Field>

          <Field label="Visning til">
            <input
              type="date"
              className="field__input"
              value={draft.viewing_to ?? ''}
              onChange={(e) => set('viewing_to', e.target.value)}
            />
          </Field>

          <Field label="Honorar totalt, EUR">
            <input
              type="number"
              step="0.01"
              min="0"
              className="field__input"
              value={draft.fee_total ?? ''}
              onChange={(e) =>
                set('fee_total', e.target.value === '' ? null : Number(e.target.value))
              }
            />
          </Field>

          <Field label="Honorar betalt, EUR">
            <input
              type="number"
              step="0.01"
              min="0"
              className="field__input"
              value={draft.fee_paid ?? ''}
              onChange={(e) =>
                set('fee_paid', e.target.value === '' ? null : Number(e.target.value))
              }
            />
          </Field>

          <Field label="Notion" wide>
            <input
              className="field__input"
              value={draft.notion_url ?? ''}
              onChange={(e) => set('notion_url', e.target.value)}
              placeholder="https://notion.so/..."
            />
          </Field>

          <Field label="Notater" wide>
            <textarea
              className="field__input"
              rows={3}
              value={draft.notes ?? ''}
              onChange={(e) => set('notes', e.target.value)}
            />
          </Field>
        </FormGrid>

        {error && <p className="login__note login__note--warn">{error}</p>}

        <FormActions
          onCancel={onClose}
          saving={saving}
          onDelete={mandate ? remove : undefined}
        />
      </form>
    </Modal>
  )
}
