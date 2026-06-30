// ─── Organism: Sidebar ────────────────────────────────────────────────────────
// Panel de navegación lateral con RBAC.
// v3: Sección "Análisis" con 4 módulos de estadísticas (Admin + SuperAdmin).

import { LayoutDashboard, ScanLine, LogOut, Users, Building2, Activity, Users2, HeartPulse, Home, BarChart2 } from 'lucide-react'
import { Logo } from '../atoms/Logo'
import { NavItem } from '../molecules/NavItem'
import { useAuth } from '../../contexts/AuthContext'

const BASE_NAV_ITEMS = [
  { to: '/dashboard',   label: 'Inicio',          icon: LayoutDashboard },
  { to: '/captura-ocr', label: 'Captura Cédulas', icon: ScanLine        },
]

const ANALYTICS_NAV_ITEMS = [
  { to: '/estadisticas/operacion',  label: 'Operación',  icon: Activity    },
  { to: '/estadisticas/demografia', label: 'Demografía', icon: Users2      },
  { to: '/estadisticas/salud',      label: 'Salud',      icon: HeartPulse  },
  { to: '/estadisticas/vivienda',   label: 'Vivienda',   icon: Home        },
]

const SUPERADMIN_NAV_ITEMS = [
  { to: '/gestion-usuarios', label: 'Gestión de Usuarios', icon: Users      },
  { to: '/centros-salud',    label: 'Centros de Salud',    icon: Building2  },
]

function NavSectionLabel({ label }: { label: string }) {
  return (
    <div className="pt-3 pb-1 px-4">
      <p className="text-[10px] text-white/40 uppercase tracking-widest font-semibold">{label}</p>
    </div>
  )
}

export interface SidebarProps {
  onLogout: () => void
  isOpen:   boolean
}

export function Sidebar({ onLogout, isOpen }: SidebarProps) {
  const { user } = useAuth()
  const isSuperAdmin = user?.role === 'SuperAdmin'

  return (
    <aside
      className={[
        'fixed top-0 left-0 h-full w-64 z-40',
        'bg-[#006657] text-white',
        'flex flex-col justify-between shadow-2xl',
        'transition-transform duration-300 ease-in-out',
        isOpen ? 'translate-x-0' : '-translate-x-full',
      ].join(' ')}
      aria-hidden={!isOpen}
    >
      {/* ── Parte superior: logo + navegación ─────────────────────────── */}
      <div className="flex flex-col overflow-hidden">
        {/* Logo */}
        <div className="px-4 py-5 border-b border-white/10 flex-shrink-0">
          <Logo size="sm" />
        </div>

        {/* Navigation */}
        <nav
          className="flex-1 px-3 py-4 space-y-1 overflow-y-auto"
          aria-label="Navegación principal"
        >
          {/* Rutas base */}
          {BASE_NAV_ITEMS.map((item) => (
            <NavItem key={item.to} to={item.to} label={item.label} icon={item.icon} />
          ))}

          {/* Sección Análisis (Admin + SuperAdmin) */}
          <NavSectionLabel label="Análisis" />
          <div className="flex items-center gap-2 px-4 py-1 mb-0.5">
            <BarChart2 size={12} className="text-white/30" />
            <span className="text-[10px] text-white/30">Estadísticas SUMS</span>
          </div>
          {ANALYTICS_NAV_ITEMS.map((item) => (
            <NavItem key={item.to} to={item.to} label={item.label} icon={item.icon} />
          ))}

          {/* Rutas exclusivas de SuperAdmin */}
          {isSuperAdmin && (
            <>
              <NavSectionLabel label="Administración" />
              {SUPERADMIN_NAV_ITEMS.map((item) => (
                <NavItem key={item.to} to={item.to} label={item.label} icon={item.icon} />
              ))}
            </>
          )}
        </nav>
      </div>

      {/* ── Parte inferior: Cerrar sesión ──────────────────────────────── */}
      <div className="px-3 py-4 border-t border-white/10 flex-shrink-0">
        <button
          onClick={onLogout}
          className={[
            'flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm font-medium',
            'text-white/70 hover:text-red-300 hover:bg-red-500/10',
            'transition-all duration-200',
          ].join(' ')}
          type="button"
        >
          <LogOut size={18} strokeWidth={1.8} />
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  )
}
