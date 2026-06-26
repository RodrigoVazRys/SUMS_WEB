// ─── Layout: AdminLayout ──────────────────────────────────────────────────────
// Layout protegido que envuelve todas las rutas privadas.
// Compone: Sidebar (organism) + Topbar (organism) + <Outlet />.
// v2: Sidebar retráctil con hamburguesa. Desktop inicia abierto (lg+), móvil cerrado.
//     Overlay oscuro en móvil cierra el menú al tocar fuera.

import { useState, useEffect } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Sidebar } from '../components/organisms/Sidebar'
import { Topbar } from '../components/organisms/Topbar'

export function AdminLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  // En desktop (≥1024px) inicia abierto; en móvil/tablet inicia cerrado
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  useEffect(() => {
    function syncWithViewport() {
      setIsSidebarOpen(window.innerWidth >= 1024)
    }
    syncWithViewport()
    window.addEventListener('resize', syncWithViewport)
    return () => window.removeEventListener('resize', syncWithViewport)
  }, [])

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev)
  const closeSidebar  = () => setIsSidebarOpen(false)

  // user is guaranteed non-null here because ProtectedRoute already checked auth
  return (
    <div className="flex h-screen overflow-hidden bg-neutral-bg">

      {/* ── Overlay móvil — cierra sidebar al tocar fuera ──────────────── */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 lg:hidden"
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}

      {/* ── Sidebar — fixed, desliza con translateX ────────────────────── */}
      <Sidebar onLogout={handleLogout} isOpen={isSidebarOpen} />

      {/* ── Contenido principal ────────────────────────────────────────── */}
      {/* En desktop con sidebar abierto se desplaza con ml-64             */}
      <div
        className={[
          'flex-1 flex flex-col overflow-hidden min-w-0',
          'transition-[margin] duration-300 ease-in-out',
          isSidebarOpen ? 'lg:ml-64' : 'lg:ml-0',
        ].join(' ')}
      >
        <Topbar user={user!} onMenuToggle={toggleSidebar} />

        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
