import { useState, type FormEvent } from 'react'
import { supabase, redirectTo } from '../lib/supabase'
import { ALLOWED_EMAIL } from '../lib/constants'

export function Login() {
  const [email, setEmail] = useState(ALLOWED_EMAIL)
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [message, setMessage] = useState('')

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const trimmed = email.trim().toLowerCase()

    if (trimmed !== ALLOWED_EMAIL) {
      setStatus('error')
      setMessage(`Denne huben har én bruker: ${ALLOWED_EMAIL}`)
      return
    }

    setStatus('sending')
    const { error } = await supabase.auth.signInWithOtp({
      email: trimmed,
      options: { emailRedirectTo: redirectTo },
    })

    if (error) {
      setStatus('error')
      setMessage(error.message)
      return
    }

    setStatus('sent')
    setMessage('Lenken ligger i innboksen. Den varer i én time.')
  }

  return (
    <main className="login">
      <div className="login__card">
        <p className="section-label">Kämpe Estates</p>
        <h1 className="login__title">Hub</h1>
        <p className="login__lead">
          Én innlogging, én bruker. Du får en lenke på e post og trenger ikke passord.
        </p>

        <form onSubmit={handleSubmit} className="login__form">
          <label className="field">
            <span className="field__label">E post</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
              className="field__input"
            />
          </label>

          <button type="submit" className="button" disabled={status === 'sending'}>
            {status === 'sending' ? 'Sender' : 'Send meg lenken'}
          </button>
        </form>

        {message && (
          <p className={status === 'error' ? 'login__note login__note--warn' : 'login__note'}>
            {message}
          </p>
        )}
      </div>
    </main>
  )
}
