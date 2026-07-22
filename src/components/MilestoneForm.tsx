import { useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabase'
import {
  MILESTONE_CATEGORIES,
  MILESTONE_OWNERS,
  MILESTONE_STATUSES,
} from '../lib/constants'
import type { Milestone } from '../lib/types'
import { Modal } from './ui/Modal'
import { Field, FormActions, FormGrid } from './ui/form'

export function MilestoneForm({
  milestone,
  onClose,
  onSaved,
}: {
  milestone: Milestone | null
  onClose: () => void
  onSaved: () => void
}) {
  const [draft, setDraft] = useState<Partial<Milestone>>(
    milestone ?? { title: '', status: 'åpen', owner: 'Kristine' },
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function set<K extends keyof Milestone>(key: K, value: Milestone[K] | null) {
    setDraft((prev) => ({ ...prev, [key]: value }))
  }

  function clean(value: string) {
    return value.trim() === '' ? null : value
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    setSaving(true)
    setError('')

    const payload = {
      title: draft.title?.trim(),
      category: draft.category ?? null,
      status: draft.status ?? 'åpen',
      due_date: draft.due_date || null,
      blocker: clean(draft.blocker ?? ''),
      owner: draft.owner ?? null,
      notes: clean(draft.notes ?? ''),
      url: clean(draft.url ?? ''),
    }

    const { error } = milestone
      ? await supabase.from('milestones').update(payload).eq('id', milestone.id)
      : await supabase.from('milestones').insert(payload)

    setSaving(false)
    if (error) {
      setError(error.message)
      return
    }
    onSaved()
    onClose()
  }

  async function remove() {
    if (!milestone) return
    if (!confirm(`Slette milepælen "${milestone.title}"?`)) return
    const { error } = await supabase.from('milestones').delete().eq('id', milestone.id)
    if (error) {
      setError(error.message)
      return
    }
    onSaved()
    onClose()
  }

  return (
    <Modal title={milestone ? 'Rediger milepæl' : 'Ny milepæl'} onClose={onClose}>
      <form onSubmit={submit}>
        <FormGrid>
          <Field label="Tittel" wide>
            <input
              className="field__input"
              value={draft.title ?? ''}
              onChange={(e) => set('title', e.target.value)}
              required
              autoFocus
            />
          </Field>

          <Field label="Kategori">
            <select
              className="field__input"
              value={draft.category ?? ''}
              onChange={(e) =>
                set('category', (e.target.value || null) as Milestone['category'])
              }
            >
              <option value="">Ingen</option>
              {MILESTONE_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Status">
            <select
              className="field__input"
              value={draft.status ?? 'åpen'}
              onChange={(e) => set('status', e.target.value as Milestone['status'])}
            >
              {MILESTONE_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Frist">
            <input
              type="date"
              className="field__input"
              value={draft.due_date ?? ''}
              onChange={(e) => set('due_date', e.target.value)}
            />
          </Field>

          <Field label="Eier neste steg">
            <select
              className="field__input"
              value={draft.owner ?? ''}
              onChange={(e) => set('owner', (e.target.value || null) as Milestone['owner'])}
            >
              <option value="">Ingen</option>
              {MILESTONE_OWNERS.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Blokkering" wide>
            <input
              className="field__input"
              value={draft.blocker ?? ''}
              onChange={(e) => set('blocker', e.target.value)}
              placeholder="Hva står i veien"
            />
          </Field>

          <Field label="Lenke" wide>
            <input
              className="field__input"
              value={draft.url ?? ''}
              onChange={(e) => set('url', e.target.value)}
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
          onDelete={milestone ? remove : undefined}
        />
      </form>
    </Modal>
  )
}
