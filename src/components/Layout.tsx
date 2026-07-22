import { useState, type ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { formatWeekday, today } from '../lib/dates'
import { Nav } from './Nav'
import { AccountForm } from './AccountForm'
import { PeriodSwitcher } from '../period/PeriodSwitcher'

/**
 * Sidene som faktisk summerer over en periode. Bryteren vises bare
 * der, så hun aldri sitter med en kontroll som ikke gjør noe.
 */
const PERIOD_PAGES = ['/jobb/kunder', '/jobb/innhold', '/jobb/okonomi', '/privat/tid']

export function Layout({ children }: { children: ReactNode }) {
  const { signOut } = useAuth()
  const [accountOpen, setAccountOpen] = useState(false)
  const { pathname } = useLocation()
  const showPeriod = PERIOD_PAGES.includes(pathname)

  return (
    <div className="shell">
      <header className="topbar">
        <div className="topbar__inner">
          <Link to="/" className="topbar__brand">
            <span className="wordmark">Kämpe</span>
            <span className="wordmark wordmark--em">Hub</span>
          </Link>
          <p className="topbar__date">{formatWeekday(today())}</p>
          <button
            type="button"
            className="button button--quiet"
            onClick={() => setAccountOpen(true)}
          >
            Konto
          </button>
          <button type="button" className="button button--quiet" onClick={signOut}>
            Logg ut
          </button>
        </div>
        <Nav />
        {showPeriod && <PeriodSwitcher />}
      </header>

      <main className="content">{children}</main>

      <footer className="footer">
        <p className="muted">Fase 2. Grafer, innhold og økonomi kommer i senere faser.</p>
      </footer>

      {accountOpen && <AccountForm onClose={() => setAccountOpen(false)} />}
    </div>
  )
}
