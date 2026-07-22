import { useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabase'
import { Modal } from './ui/Modal'
import { Field, FormActions, FormGrid } from './ui/form'

const MIN_LENGTH = 10

/**
 * Setter eller endrer passord for den innloggede brukeren.
 * Passordet skrives kun her, av henne, og sendes rett til Supabase.
 */
export function AccountForm({ onClose }: { onClose: () => void }) {
  const [password, setPassword] = useState('')
  const [repeat, setRepeat] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [isError, setIsError] = useState(false)

  async function submit(event: FormEvent) {
    event.preventDefault()

    if (password.length < MIN_LENGTH) {
      setIsError(true)
      setMessage(`Minst ${MIN_LENGTH} tegn.`)
      return
    }

    if (password !== repeat) {
      setIsError(true)
      setMessage('De to feltene er ikke like.')
      return
    }

    setSaving(true)
    setMessage('')

    const { error } = await supabase.auth.updateUser({ password })
    setSaving(false)

    if (error) {
      setIsError(true)
      setMessage(error.message)
      return
    }

    setIsError(false)
    setMessage('Passordet er satt. Neste gang kan du logge inn uten e post.')
    setPassword('')
    setRepeat('')
  }

  return (
    <Modal title="Konto" onClose={onClose}>
      <form onSubmit={submit}>
        <p className="login__lead">
          Setter du et passord, slipper du e postlenken. Sesjonen varer uansett
          lenge, så du skal sjelden trenge å logge inn i det hele tatt.
        </p>

        <FormGrid>
          <Field label="Nytt passord" wide>
            <input
              type="password"
              className="field__input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              required
              autoFocus
            />
          </Field>

          <Field label="Gjenta passord" wide>
            <input
              type="password"
              className="field__input"
              value={repeat}
              onChange={(e) => setRepeat(e.target.value)}
              autoComplete="new-password"
              required
            />
          </Field>
        </FormGrid>

        {message && (
          <p className={isError ? 'login__note login__note--warn' : 'login__note'}>{message}</p>
        )}

        <FormActions onCancel={onClose} saving={saving} saveLabel="Lagre passord" />
      </form>
    </Modal>
  )
}
