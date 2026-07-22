import { AuthProvider, useAuth } from './auth/AuthProvider'
import { isConfigured } from './lib/supabase'
import { Layout } from './components/Layout'
import { Login } from './components/Login'
import { SetupNotice } from './components/SetupNotice'
import { Home } from './pages/Home'

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
      <Home />
    </Layout>
  )
}

export default function App() {
  if (!isConfigured) return <SetupNotice />

  return (
    <AuthProvider>
      <Gate />
    </AuthProvider>
  )
}
