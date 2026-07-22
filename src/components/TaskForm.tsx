import { useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabase'
import { TASK_AREAS, TASK_CATEGORIES, TASK_STATUSES } from '../lib/constants'
import type { Area, Task } from '../lib/types'
import { Modal } from './ui/Modal'
import { Field, FormActions, FormGrid } from './ui/form'

export function TaskForm({
  task,
  area,
  onClose,
  onSaved,
}: {
  task: Task | null
  area: Area
  onClose: () => void
  onSaved: () => void
}) {
  const [draft, setDraft] = useState<Partial<Task>>(
    task ?? { title: '', area, status: 'åpen', priority: 2, source: 'manuell' },
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function set<K extends keyof Task>(key: K, value: Task[K] | null) {
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
      area: draft.area ?? area,
      category: draft.category ?? null,
      status: draft.status ?? 'åpen',
      due_date: draft.due_date || null,
      priority: draft.priority ?? 2,
      url: clean(draft.url ?? ''),
      source: task?.source ?? 'manuell',
    }

    const { error } = task
      ? await supabase.from('tasks').update(payload).eq('id', task.id)
      : await supabase.from('tasks').insert(payload)

    setSaving(false)
    if (error) {
      setError(error.message)
      return
    }
    onSaved()
    onClose()
  }

  async function remove() {
    if (!task) return
    if (!confirm(`Slette oppgaven "${task.title}"?`)) return
    const { error } = await supabase.from('tasks').delete().eq('id', task.id)
    if (error) {
      setError(error.message)
      return
    }
    onSaved()
    onClose()
  }

  return (
    <Modal title={task ? 'Rediger oppgave' : 'Ny oppgave'} onClose={onClose}>
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

          <Field label="Område">
            <select
              className="field__input"
              value={draft.area ?? area}
              onChange={(e) => set('area', e.target.value as Area)}
            >
              {TASK_AREAS.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Kategori">
            <select
              className="field__input"
              value={draft.category ?? ''}
              onChange={(e) => set('category', (e.target.value || null) as Task['category'])}
            >
              <option value="">Ingen</option>
              {TASK_CATEGORIES.map((c) => (
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
              onChange={(e) => set('status', e.target.value as Task['status'])}
            >
              {TASK_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Prioritet">
            <select
              className="field__input"
              value={draft.priority ?? 2}
              onChange={(e) => set('priority', Number(e.target.value) as Task['priority'])}
            >
              <option value={1}>1, viktigst</option>
              <option value={2}>2</option>
              <option value={3}>3</option>
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

          <Field label="Lenke" wide>
            <input
              className="field__input"
              value={draft.url ?? ''}
              onChange={(e) => set('url', e.target.value)}
            />
          </Field>
        </FormGrid>

        {error && <p className="login__note login__note--warn">{error}</p>}

        <FormActions onCancel={onClose} saving={saving} onDelete={task ? remove : undefined} />
      </form>
    </Modal>
  )
}
