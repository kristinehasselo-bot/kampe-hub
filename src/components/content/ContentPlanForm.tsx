import { useState, type FormEvent } from 'react'
import { supabase } from '../../lib/supabase'
import { CONTENT_FORMATS, CONTENT_STATUSES } from '../../lib/constants'
import type { ContentPlanItem } from '../../lib/types'
import { Modal } from '../ui/Modal'
import { Field, FormActions, FormGrid } from '../ui/form'

export function ContentPlanForm({
  item,
  defaultDate,
  onClose,
  onSaved,
}: {
  item: ContentPlanItem | null
  defaultDate?: string
  onClose: () => void
  onSaved: () => void
}) {
  const [draft, setDraft] = useState<Partial<ContentPlanItem>>(
    item ?? { status: 'idé', planned_date: defaultDate ?? '' },
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function set<K extends keyof ContentPlanItem>(key: K, value: ContentPlanItem[K] | null) {
    setDraft((prev) => ({ ...prev, [key]: value }))
  }

  function clean(value: string) {
    return value.trim() === '' ? null : value
  }

  // Rekkevidde og engasjement er bare relevant når posten er publisert.
  const published = draft.status === 'publisert'

  async function submit(event: FormEvent) {
    event.preventDefault()
    setSaving(true)
    setError('')

    const payload = {
      planned_date: draft.planned_date || null,
      format: draft.format ?? null,
      theme: clean(draft.theme ?? ''),
      caption_dir: clean(draft.caption_dir ?? ''),
      status: draft.status ?? 'idé',
      canva_url: clean(draft.canva_url ?? ''),
      notion_url: clean(draft.notion_url ?? ''),
      reach: published ? (draft.reach ?? null) : null,
      engagement_rate: published ? (draft.engagement_rate ?? null) : null,
    }

    const { error } = item
      ? await supabase.from('content_plan').update(payload).eq('id', item.id)
      : await supabase.from('content_plan').insert(payload)

    setSaving(false)
    if (error) {
      setError(error.message)
      return
    }
    onSaved()
    onClose()
  }

  async function remove() {
    if (!item) return
    if (!confirm('Slette denne posten fra planen?')) return
    const { error } = await supabase.from('content_plan').delete().eq('id', item.id)
    if (error) {
      setError(error.message)
      return
    }
    onSaved()
    onClose()
  }

  return (
    <Modal title={item ? 'Rediger post' : 'Ny post'} onClose={onClose}>
      <form onSubmit={submit}>
        <FormGrid>
          <Field label="Tema" wide>
            <input
              className="field__input"
              value={draft.theme ?? ''}
              onChange={(e) => set('theme', e.target.value)}
              placeholder="Podere vs casale"
              autoFocus
            />
          </Field>

          <Field label="Dato">
            <input
              type="date"
              className="field__input"
              value={draft.planned_date ?? ''}
              onChange={(e) => set('planned_date', e.target.value)}
            />
          </Field>

          <Field label="Format">
            <select
              className="field__input"
              value={draft.format ?? ''}
              onChange={(e) => set('format', (e.target.value || null) as ContentPlanItem['format'])}
            >
              <option value="">Ikke satt</option>
              {CONTENT_FORMATS.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Status">
            <select
              className="field__input"
              value={draft.status ?? 'idé'}
              onChange={(e) => set('status', e.target.value as ContentPlanItem['status'])}
            >
              {CONTENT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Caption-retning" wide>
            <textarea
              className="field__input"
              rows={2}
              value={draft.caption_dir ?? ''}
              onChange={(e) => set('caption_dir', e.target.value)}
              placeholder="Åpne med prisen per kvadratmeter, ikke med utsikten"
            />
          </Field>

          <Field label="Canva">
            <input
              className="field__input"
              value={draft.canva_url ?? ''}
              onChange={(e) => set('canva_url', e.target.value)}
              placeholder="https://canva.com/..."
            />
          </Field>

          <Field label="Notion">
            <input
              className="field__input"
              value={draft.notion_url ?? ''}
              onChange={(e) => set('notion_url', e.target.value)}
            />
          </Field>

          {published && (
            <>
              <Field label="Rekkevidde">
                <input
                  type="number"
                  min="0"
                  className="field__input"
                  value={draft.reach ?? ''}
                  onChange={(e) =>
                    set('reach', e.target.value === '' ? null : Number(e.target.value))
                  }
                  placeholder="Fra Insights"
                />
              </Field>

              <Field label="Engasjement, %">
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  className="field__input"
                  value={draft.engagement_rate ?? ''}
                  onChange={(e) =>
                    set('engagement_rate', e.target.value === '' ? null : Number(e.target.value))
                  }
                />
              </Field>
            </>
          )}
        </FormGrid>

        {published && (
          <p className="muted form-hint">
            Rekkevidde og engasjement mater format-rangeringen. Fyll dem inn fra Insights når
            posten er ute.
          </p>
        )}

        {error && <p className="login__note login__note--warn">{error}</p>}

        <FormActions onCancel={onClose} saving={saving} onDelete={item ? remove : undefined} />
      </form>
    </Modal>
  )
}
