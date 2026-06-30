// ─── App.tsx ──────────────────────────────────────────────────────────────────
// Árbol de routing con RBAC.
// Rutas SuperAdmin: /gestion-usuarios, /centros-salud
// Rutas Admin+SuperAdmin: /dashboard, /captura-ocr
// Rutas Estadísticas (Admin+SuperAdmin): /estadisticas/operacion|demografia|salud|vivienda

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ProtectedRoute } from './router/ProtectedRoute'
import { AdminLayout } from './layouts/AdminLayout'
import { LoginPage } from './pages/LoginPage'
import { DashboardPage } from './pages/DashboardPage'
import { CapturaOcrPage } from './pages/CapturaOcrPage'
import { GestionUsuariosPage } from './pages/GestionUsuariosPage'
import { CentrosSaludPage } from './pages/CentrosSaludPage'
import { EstadisticasOperacionPage } from './pages/EstadisticasOperacionPage'
import { EstadisticasDemografiaPage } from './pages/EstadisticasDemografiaPage'
import { EstadisticasSaludPage } from './pages/EstadisticasSaludPage'
import { EstadisticasViviendaPage } from './pages/EstadisticasViviendaPage'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* ── Public ─────────────────────────────────────── */}
          <Route path="/login" element={<LoginPage />} />

          {/* ── Protected: SuperAdmin + Admin ──────────────── */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AdminLayout />}>
              <Route path="/dashboard"   element={<DashboardPage />}   />
              <Route path="/captura-ocr" element={<CapturaOcrPage />}  />

              {/* ── Módulos de Estadísticas ─────────────────── */}
              <Route path="/estadisticas/operacion"  element={<EstadisticasOperacionPage />}  />
              <Route path="/estadisticas/demografia" element={<EstadisticasDemografiaPage />} />
              <Route path="/estadisticas/salud"      element={<EstadisticasSaludPage />}      />
              <Route path="/estadisticas/vivienda"   element={<EstadisticasViviendaPage />}   />

              {/* ── SuperAdmin only ──────────────────────── */}
              <Route element={<ProtectedRoute allowedRoles={['SuperAdmin']} />}>
                <Route path="/gestion-usuarios" element={<GestionUsuariosPage />} />
                <Route path="/centros-salud"    element={<CentrosSaludPage />}    />
              </Route>
            </Route>
          </Route>

          {/* ── Redirects ──────────────────────────────────── */}
          <Route path="/"  element={<Navigate to="/dashboard" replace />} />
          <Route path="*"  element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
