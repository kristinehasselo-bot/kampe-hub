import type { ReactNode } from 'react'
import { useAuth } from '../auth/AuthProvider'
import { formatWeekday, today } from '../lib/dates'

export function Layout({ children }: { children: ReactNode }) {
  const { signOut } = useAuth()

  return (
    <div className="shell surface-warm">
      <header className="topbar">
        <div className="topbar__inner">
          <div className="topbar__brand">
            <span className="wordmark">Kämpe</span>
            <span className="wordmark wordmark--em">Hub</span>
          </div>
          <p className="topbar__date">{formatWeekday(today())}</p>
          <button type="button" className="button button--quiet" onClick={signOut}>
            Logg ut
          </button>
        </div>
      </header>

      <main className="content">{children}</main>

      <footer className="footer">
        <p className="muted">Fase 1. Struktur, grafer og innhold kommer i senere faser.</p>
      </footer>
    </div>
  )
}
