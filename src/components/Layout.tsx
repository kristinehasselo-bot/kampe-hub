import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { formatWeekday, today } from '../lib/dates'
import { Nav } from './Nav'

export function Layout({ children }: { children: ReactNode }) {
  const { signOut } = useAuth()

  return (
    <div className="shell">
      <header className="topbar">
        <div className="topbar__inner">
          <Link to="/" className="topbar__brand">
            <span className="wordmark">Kämpe</span>
            <span className="wordmark wordmark--em">Hub</span>
          </Link>
          <p className="topbar__date">{formatWeekday(today())}</p>
          <button type="button" className="button button--quiet" onClick={signOut}>
            Logg ut
          </button>
        </div>
        <Nav />
      </header>

      <main className="content">{children}</main>

      <footer className="footer">
        <p className="muted">Fase 2. Grafer, innhold og økonomi kommer i senere faser.</p>
      </footer>
    </div>
  )
}
