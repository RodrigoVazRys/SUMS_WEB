// ─── Layout: AdminLayout ──────────────────────────────────────────────────────
// Layout protegido que envuelve todas las rutas privadas.
// Compone: Sidebar (organism) + Topbar (organism) + <Outlet />.
// La lógica de logout vive aquí porque requiere navigate + logout del contexto.

import { Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Sidebar } from '../components/organisms/Sidebar'
import { Topbar } from '../components/organisms/Topbar'

export function AdminLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  // user is guaranteed non-null here because ProtectedRoute already checked auth
  return (
    <div className="flex h-screen overflow-hidden bg-neutral-bg">
      <Sidebar onLogout={handleLogout} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar user={user!} />

        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
