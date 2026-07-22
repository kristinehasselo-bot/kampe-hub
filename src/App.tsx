import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './auth/AuthProvider'
import { isConfigured } from './lib/supabase'
import { Layout } from './components/Layout'
import { Login } from './components/Login'
import { SetupNotice } from './components/SetupNotice'
import { Home } from './pages/Home'
import { Kunder } from './pages/Kunder'
import { Admin } from './pages/Admin'
import { Oppgaver } from './pages/Oppgaver'
import { TidOgVekst } from './pages/TidOgVekst'

// Pages serverer fra /kampe-hub/, lokalt fra /. React Router vil ha
// basename uten skråstrek på slutten.
const basename = import.meta.env.BASE_URL.replace(/\/$/, '')

function Gate() {
  const { session, loading } = useAuth()

  if (loading) {
    return (
      <main className="login">
        <p className="muted">Henter</p>
      </main>
    )
  }

  if (!session) return <Login />

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />

        <Route path="/jobb" element={<Navigate to="/jobb/kunder" replace />} />
        <Route path="/jobb/kunder" element={<Kunder />} />
        <Route path="/jobb/admin" element={<Admin />} />
        <Route path="/jobb/oppgaver" element={<Oppgaver area="jobb" />} />

        <Route path="/privat" element={<Navigate to="/privat/tid" replace />} />
        <Route path="/privat/tid" element={<TidOgVekst />} />
        <Route path="/privat/oppgaver" element={<Oppgaver area="privat" />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  )
}

export default function App() {
  if (!isConfigured) return <SetupNotice />

  return (
    <BrowserRouter basename={basename}>
      <AuthProvider>
        <Gate />
      </AuthProvider>
    </BrowserRouter>
  )
}
