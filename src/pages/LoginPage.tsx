// ─── Page: LoginPage ──────────────────────────────────────────────────────────
// Orquesta los organismos de login y conecta con AuthContext real.

import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { LoginHeroPanel } from '../components/organisms/LoginHeroPanel'
import { LoginForm } from '../components/organisms/LoginForm'
import { Spinner } from '../components/atoms/Spinner'
import type { LoginFormSubmitPayload } from '../components/organisms/LoginForm'

export function LoginPage() {
  const { login, isAuthenticated, isLoading } = useAuth()
  const navigate  = useNavigate()
  const location  = useLocation()
  const from      = (location.state as { from?: { pathname: string } })?.from?.pathname ?? '/dashboard'

  // Si ya está autenticado, redirige a la ruta destino
  if (!isLoading && isAuthenticated) {
    return <Navigate to={from} replace />
  }

  // Loading state mientras se restaura la sesión desde localStorage
  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-neutral-bg">
        <div className="flex flex-col items-center gap-4">
          <Spinner size="lg" />
          <p className="text-sm text-gray-500 font-medium">Verificando sesión...</p>
        </div>
      </div>
    )
  }

  async function handleFormSubmit({ email, password }: LoginFormSubmitPayload) {
    const result = await login(email, password)

    if (result.success) {
      navigate(from, { replace: true })
      return {}
    }

    // Distinguir error de rol denegado del error de credenciales
    const isDenied = result.deniedRole !== undefined
    return { error: result.error, isDenied }
  }

  return (
    <main className="h-screen flex overflow-hidden font-sans">
      {/* Left: Hero (desktop only) */}
      <LoginHeroPanel />

      {/* Right: Login form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-white p-8">
        <LoginForm onSubmit={handleFormSubmit} />
      </div>
    </main>
  )
}
