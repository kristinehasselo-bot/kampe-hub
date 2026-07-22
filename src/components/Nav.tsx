import { NavLink, useLocation } from 'react-router-dom'

const TOP = [
  { to: '/', label: 'Hjem' },
  { to: '/jobb', label: 'Jobb' },
  { to: '/privat', label: 'Privat' },
]

const SUB: Record<string, { to: string; label: string }[]> = {
  '/jobb': [
    { to: '/jobb/kunder', label: 'Kunder' },
    { to: '/jobb/admin', label: 'Admin og milepæler' },
    { to: '/jobb/oppgaver', label: 'Oppgaver' },
  ],
  '/privat': [
    { to: '/privat/tid', label: 'Tid og vekst' },
    { to: '/privat/oppgaver', label: 'Oppgaver' },
  ],
}

export function Nav() {
  const { pathname } = useLocation()
  const section = pathname.startsWith('/jobb')
    ? '/jobb'
    : pathname.startsWith('/privat')
      ? '/privat'
      : '/'
  const sub = SUB[section]

  return (
    <nav className="nav">
      <div className="nav__top">
        {TOP.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) => (isActive ? 'nav__tab nav__tab--on' : 'nav__tab')}
          >
            {item.label}
          </NavLink>
        ))}
      </div>

      {sub && (
        <div className="nav__sub">
          {sub.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => (isActive ? 'nav__link nav__link--on' : 'nav__link')}
            >
              {item.label}
            </NavLink>
          ))}
        </div>
      )}
    </nav>
  )
}
