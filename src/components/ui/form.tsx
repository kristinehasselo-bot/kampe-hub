import type { ReactNode } from 'react'

export function Field({
  label,
  children,
  wide = false,
}: {
  label: string
  children: ReactNode
  wide?: boolean
}) {
  return (
    <label className={wide ? 'field field--wide' : 'field'}>
      <span className="field__label">{label}</span>
      {children}
    </label>
  )
}

export function FormGrid({ children }: { children: ReactNode }) {
  return <div className="form-grid">{children}</div>
}

export function FormActions({
  onCancel,
  saving,
  saveLabel = 'Lagre',
  onDelete,
}: {
  onCancel: () => void
  saving: boolean
  saveLabel?: string
  onDelete?: () => void
}) {
  return (
    <div className="form-actions">
      {onDelete && (
        <button type="button" className="button button--danger" onClick={onDelete}>
          Slett
        </button>
      )}
      <span className="form-actions__spacer" />
      <button type="button" className="button button--quiet" onClick={onCancel}>
        Avbryt
      </button>
      <button type="submit" className="button" disabled={saving}>
        {saving ? 'Lagrer' : saveLabel}
      </button>
    </div>
  )
}
