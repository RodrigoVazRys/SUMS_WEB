// ─── Molecule: NavItem ────────────────────────────────────────────────────────
// Ítem de navegación del Sidebar. Usa NavLink de react-router-dom
// para aplicar automáticamente el estado activo.

import { NavLink } from 'react-router-dom'
import type { ElementType } from 'react'

export interface NavItemProps {
  to: string
  label: string
  icon: ElementType
}

export function NavItem({ to, label, icon: Icon }: NavItemProps) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        [
          'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium',
          'transition-all duration-200 cursor-pointer',
          isActive
            ? 'bg-white/15 text-white border-l-2 border-gold pl-[14px]'
            : 'text-white/75 hover:bg-white/10 hover:text-white',
        ].join(' ')
      }
    >
      <Icon size={18} strokeWidth={1.8} />
      <span>{label}</span>
    </NavLink>
  )
}
