// ─── Organism: Topbar ─────────────────────────────────────────────────────────
// Barra superior del layout protegido.
// Compone: título + IconButton (molecule) x2 + UserChip (molecule).

import { Bell, HelpCircle } from 'lucide-react'
import { IconButton } from '../molecules/IconButton'
import { UserChip } from '../molecules/UserChip'
import type { AuthUser } from '../../types/auth.types'

export interface TopbarProps {
  user: AuthUser
}

export function Topbar({ user }: TopbarProps) {
  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6 shadow-sm flex-shrink-0">
      {/* Left: System title */}
      <h1 className="text-base font-semibold text-primary hidden md:block">
        Sistema Unidad Médica Suchiapa
      </h1>

      {/* Right: actions + user */}
      <div className="flex items-center gap-2 ml-auto">
        <IconButton icon={Bell} label="Ver notificaciones" hasDot />
        <IconButton icon={HelpCircle} label="Ayuda" />

        {/* Separator */}
        <div aria-hidden="true" className="w-px h-6 bg-gray-200 mx-1" />

        <UserChip user={user} />
      </div>
    </header>
  )
}
