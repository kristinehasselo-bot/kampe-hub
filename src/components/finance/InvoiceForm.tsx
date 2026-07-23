import { useState, type FormEvent } from 'react'
import { supabase } from '../../lib/supabase'
import { INVOICE_STATUSES } from '../../lib/constants'
import type { Invoice, Mandate } from '../../lib/types'
import { Modal } from '../ui/Modal'
import { Field, FormActions, FormGrid } from '../ui/form'

export function InvoiceForm({
  invoice,
  mandates,
  onClose,
  onSaved,
}: {
  invoice: Invoice | null
  mandates: Mandate[]
  onClose: () => void
  onSaved: () => void
}) {
  const [draft, setDraft] = useState<Partial<Invoice>>(
    invoice ?? { status: 'sendt', issued_date: new Date().toISOString().slice(0, 10) },
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function set<K extends keyof Invoice>(key: K, value: Invoice[K] | null) {
    setDraft((prev) => ({ ...prev, [key]: value }))
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!draft.client?.trim()) {
      setError('Kunde mangler')
      return
    }
    if (draft.amount_eur == null || Number.isNaN(Number(draft.amount_eur))) {
      setError('Beløp mangler')
      return
    }

    setSaving(true)
    setError('')

    const paid = draft.status === 'betalt'
    const payload = {
      client: draft.client.trim(),
      amount_eur: Number(draft.amount_eur),
      issued_date: draft.issued_date || null,
      // Betalt-dato settes automatisk når status blir betalt, med mindre
      // hun allerede har fylt inn en.
      paid_date: paid
        ? draft.paid_date || new Date().toISOString().slice(0, 10)
        : draft.paid_date || null,
      status: draft.status ?? 'sendt',
      mandate_id: draft.mandate_id || null,
    }

    const { error } = invoice
      ? await supabase.from('invoices').update(payload).eq('id', invoice.id)
      : await supabase.from('invoices').insert(payload)

    setSaving(false)
    if (error) {
      setError(error.message)
      return
    }
    onSaved()
    onClose()
  }

  async function remove() {
    if (!invoice) return
    if (!confirm(`Slette fakturaen til ${invoice.client}?`)) return
    const { error } = await supabase.from('invoices').delete().eq('id', invoice.id)
    if (error) {
      setError(error.message)
      return
    }
    onSaved()
    onClose()
  }

  return (
    <Modal title={invoice ? 'Rediger faktura' : 'Ny faktura'} onClose={onClose}>
      <form onSubmit={submit}>
        <FormGrid>
          <Field label="Kunde" wide>
            <input
              className="field__input"
              value={draft.client ?? ''}
              onChange={(e) => set('client', e.target.value)}
              required
              autoFocus
            />
          </Field>

          <Field label="Beløp, EUR">
            <input
              type="number"
              min="0"
              step="0.01"
              className="field__input"
              value={draft.amount_eur ?? ''}
              onChange={(e) =>
                set('amount_eur', e.target.value === '' ? null : Number(e.target.value))
              }
              required
            />
          </Field>

          <Field label="Status">
            <select
              className="field__input"
              value={draft.status ?? 'sendt'}
              onChange={(e) => set('status', e.target.value as Invoice['status'])}
            >
              {INVOICE_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Utstedt">
            <input
              type="date"
              className="field__input"
              value={draft.issued_date ?? ''}
              onChange={(e) => set('issued_date', e.target.value)}
            />
          </Field>

          <Field label="Betalt">
            <input
              type="date"
              className="field__input"
              value={draft.paid_date ?? ''}
              onChange={(e) => set('paid_date', e.target.value)}
            />
          </Field>

          <Field label="Mandat" wide>
            <select
              className="field__input"
              value={draft.mandate_id ?? ''}
              onChange={(e) => set('mandate_id', e.target.value || null)}
            >
              <option value="">Ikke knyttet</option>
              {mandates.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.client_name}
                </option>
              ))}
            </select>
          </Field>
        </FormGrid>

        {error && <p className="login__note login__note--warn">{error}</p>}

        <FormActions onCancel={onClose} saving={saving} onDelete={invoice ? remove : undefined} />
      </form>
    </Modal>
  )
}
