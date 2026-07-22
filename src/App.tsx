import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './auth/AuthProvider'
import { isConfigured } from './lib/supabase'
import { Layout } from './components/Layout'
import { Login } from './components/Login'
import { SetupNotice } from './components/SetupNotice'
import { Home } from './pages/Home'
import { PeriodProvider } from './period/PeriodContext'

// Hjem lastes med en gang, resten når hun går dit. Det holder
// Recharts ute av førstelastingen, som teller på mobil på reise.
const Kunder = lazy(() => import('./pages/Kunder').then((m) => ({ default: m.Kunder })))
const Admin = lazy(() => import('./pages/Admin').then((m) => ({ default: m.Admin })))
const Oppgaver = lazy(() => import('./pages/Oppgaver').then((m) => ({ default: m.Oppgaver })))
const TidOgVekst = lazy(() =>
  import('./pages/TidOgVekst').then((m) => ({ default: m.TidOgVekst })),
)
const Innhold = lazy(() => import('./pages/Innhold').then((m) => ({ default: m.Innhold })))
const Okonomi = lazy(() => import('./pages/Okonomi').then((m) => ({ default: m.Okonomi })))

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
    <PeriodProvider>
      <Layout>
        <Suspense fallback={<p className="muted">Henter</p>}>
          <Routes>
            <Route path="/" element={<Home />} />

            <Route path="/jobb" element={<Navigate to="/jobb/kunder" replace />} />
            <Route path="/jobb/kunder" element={<Kunder />} />
            <Route path="/jobb/admin" element={<Admin />} />
            <Route path="/jobb/innhold" element={<Innhold />} />
            <Route path="/jobb/okonomi" element={<Okonomi />} />
            <Route path="/jobb/oppgaver" element={<Oppgaver area="jobb" />} />

            <Route path="/privat" element={<Navigate to="/privat/tid" replace />} />
            <Route path="/privat/tid" element={<TidOgVekst />} />
            <Route path="/privat/oppgaver" element={<Oppgaver area="privat" />} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </Layout>
    </PeriodProvider>
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
