import { useState, type FormEvent } from 'react'
import { supabase, redirectTo } from '../lib/supabase'
import { ALLOWED_EMAIL } from '../lib/constants'

type Mode = 'passord' | 'lenke'

export function Login() {
  const [mode, setMode] = useState<Mode>('passord')
  const [email, setEmail] = useState(ALLOWED_EMAIL)
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [isError, setIsError] = useState(false)

  function fail(text: string) {
    setIsError(true)
    setMessage(text)
    setBusy(false)
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const trimmed = email.trim().toLowerCase()

    if (trimmed !== ALLOWED_EMAIL) {
      fail(`Denne huben har én bruker: ${ALLOWED_EMAIL}`)
      return
    }

    setBusy(true)
    setMessage('')
    setIsError(false)

    if (mode === 'passord') {
      const { error } = await supabase.auth.signInWithPassword({
        email: trimmed,
        password,
      })
      if (error) {
        // Brukeren ble opprettet med magisk lenke og har kanskje
        // aldri satt et passord.
        fail(
          error.message.toLowerCase().includes('invalid login credentials')
            ? 'Feil passord, eller så har du ikke satt et enda. Logg inn med magisk lenke og velg Konto øverst for å sette ett.'
            : error.message,
        )
      }
      // Ved suksess bytter AuthProvider visning av seg selv.
      return
    }

    const { error } = await supabase.auth.signInWithOtp({
      email: trimmed,
      options: { emailRedirectTo: redirectTo },
    })

    if (error) {
      fail(error.message)
      return
    }

    setBusy(false)
    setIsError(false)
    setMessage('Lenken ligger i innboksen. Den varer i én time.')
  }

  return (
    <main className="login">
      <div className="login__card">
        <p className="section-label">Kämpe Estates</p>
        <h1 className="login__title">Hub</h1>

        <div className="toggle-row login__modes">
          <button
            type="button"
            className={mode === 'passord' ? 'toggle toggle--on' : 'toggle'}
            onClick={() => {
              setMode('passord')
              setMessage('')
            }}
          >
            Passord
          </button>
          <button
            type="button"
            className={mode === 'lenke' ? 'toggle toggle--on' : 'toggle'}
            onClick={() => {
              setMode('lenke')
              setMessage('')
            }}
          >
            Magisk lenke
          </button>
        </div>

        <p className="login__lead">
          {mode === 'passord'
            ? 'Du forblir innlogget etterpå, så dette skal du sjelden måtte gjøre.'
            : 'Du får en lenke på e post og trenger ikke passord.'}
        </p>

        <form onSubmit={handleSubmit} className="login__form">
          <label className="field">
            <span className="field__label">E post</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
              required
              className="field__input"
            />
          </label>

          {mode === 'passord' && (
            <label className="field">
              <span className="field__label">Passord</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                className="field__input"
              />
            </label>
          )}

          <button type="submit" className="button" disabled={busy}>
            {busy ? 'Vent' : mode === 'passord' ? 'Logg inn' : 'Send meg lenken'}
          </button>
        </form>

        {message && (
          <p className={isError ? 'login__note login__note--warn' : 'login__note'}>{message}</p>
        )}
      </div>
    </main>
  )
}
