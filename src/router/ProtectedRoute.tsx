// ─── Router: ProtectedRoute ───────────────────────────────────────────────────
// Guard de rutas privadas con RBAC.
// Props:
//   allowedRoles? — si se especifica, solo esos roles pueden acceder.
//   Si el usuario no tiene el rol → redirige a /dashboard (no a /login).

import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Spinner } from '../components/atoms/Spinner'
import type { UserRole } from '../types/auth.types'

interface ProtectedRouteProps {
  allowedRoles?: UserRole[]
}

export function ProtectedRoute({ allowedRoles }: ProtectedRouteProps = {}) {
  const { isAuthenticated, isLoading, user } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Spinner size="lg" />
          <p className="text-sm text-gray-500 font-medium">Verificando sesión...</p>
        </div>
      </div>
    )
  }

  // No autenticado → login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // RBAC: si se especifican roles permitidos y el usuario no los tiene → dashboard
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}
