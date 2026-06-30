// ─── Organism: Topbar ─────────────────────────────────────────────────────────
// Barra superior del layout protegido.
// v2: Botón hamburguesa en el extremo izquierdo para alternar el sidebar.
//     Compone: Menu toggle + título + IconButton x2 + UserChip.

import { Bell, HelpCircle, Menu } from 'lucide-react'
import { IconButton } from '../molecules/IconButton'
import { UserChip } from '../molecules/UserChip'
import type { AuthUser } from '../../types/auth.types'

export interface TopbarProps {
  user: AuthUser
  onMenuToggle: () => void
}

export function Topbar({ user, onMenuToggle }: TopbarProps) {
  return (
    <header
      className="h-14 bg-white border-b border-gray-200 flex items-center px-3 md:px-4 shadow-sm flex-shrink-0 z-20 gap-2"
    >
      {/* ── Hamburger button ───────────────────────────────────────────── */}
      <button
        onClick={onMenuToggle}
        className={[
          'flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-lg',
          'text-gray-500 hover:bg-gray-100 hover:text-primary',
          'transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/30',
        ].join(' ')}
        aria-label="Alternar menú lateral"
        type="button"
      >
        <Menu size={20} strokeWidth={1.8} />
      </button>

      {/* ── System title ───────────────────────────────────────────────── */}
      <h1 className="text-sm md:text-base font-semibold text-primary truncate flex-1 min-w-0 select-none">
        Sistema Unidad Médica Suchiapa
      </h1>

      {/* ── Right: actions + user ──────────────────────────────────────── */}
      <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
        <IconButton icon={Bell}       label="Ver notificaciones" hasDot />
        <IconButton icon={HelpCircle} label="Ayuda" />

        {/* Separator */}
        <div aria-hidden="true" className="w-px h-6 bg-gray-200 mx-1 hidden sm:block" />

        <UserChip user={user} />
      </div>
    </header>
  )
}
