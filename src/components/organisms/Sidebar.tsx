// ─── Organism: Sidebar ────────────────────────────────────────────────────────
// Panel de navegación lateral con RBAC.
// Links de gestión (Usuarios, Centros de Salud) solo visibles para SuperAdmin.

import { LayoutDashboard, ScanLine, LogOut, Users, Building2 } from 'lucide-react'
import { Logo } from '../atoms/Logo'
import { NavItem } from '../molecules/NavItem'
import { useAuth } from '../../contexts/AuthContext'

const BASE_NAV_ITEMS = [
  { to: '/dashboard',   label: 'Inicio',          icon: LayoutDashboard },
  { to: '/captura-ocr', label: 'Captura Cédulas', icon: ScanLine        },
]

const SUPERADMIN_NAV_ITEMS = [
  { to: '/gestion-usuarios', label: 'Gestión de Usuarios', icon: Users      },
  { to: '/centros-salud',    label: 'Centros de Salud',    icon: Building2  },
]

export interface SidebarProps {
  onLogout: () => void
}

export function Sidebar({ onLogout }: SidebarProps) {
  const { user } = useAuth()
  const isSuperAdmin = user?.role === 'SuperAdmin'

  return (
    <aside className="w-56 flex-shrink-0 bg-primary flex flex-col shadow-xl z-10">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-white/10">
        <Logo size="sm" />
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto" aria-label="Navegación principal">
        {/* Rutas base (SuperAdmin + Admin) */}
        {BASE_NAV_ITEMS.map((item) => (
          <NavItem key={item.to} to={item.to} label={item.label} icon={item.icon} />
        ))}

        {/* Rutas exclusivas de SuperAdmin */}
        {isSuperAdmin && (
          <>
            <div className="pt-3 pb-1 px-4">
              <p className="text-[10px] text-white/40 uppercase tracking-widest font-semibold">
                Administración
              </p>
            </div>
            {SUPERADMIN_NAV_ITEMS.map((item) => (
              <NavItem key={item.to} to={item.to} label={item.label} icon={item.icon} />
            ))}
          </>
        )}
      </nav>

      {/* Bottom: Logout */}
      <div className="px-3 py-4 border-t border-white/10">
        <button
          onClick={onLogout}
          className={[
            'flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm font-medium',
            'text-white/70 hover:text-red-300 hover:bg-red-500/10',
            'transition-all duration-200',
          ].join(' ')}
        >
          <LogOut size={18} strokeWidth={1.8} />
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  )
}
