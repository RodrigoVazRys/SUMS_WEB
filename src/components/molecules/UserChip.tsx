// ─── Molecule: UserChip ───────────────────────────────────────────────────────
// Muestra el nombre, email y rol del usuario autenticado en el Topbar.
// Combina Avatar (atom) + Badge (atom) + texto.

import { Avatar } from '../atoms/Avatar'
import { Badge } from '../atoms/Badge'
import type { AuthUser } from '../../types/auth.types'

export interface UserChipProps {
  user: AuthUser
}

export function UserChip({ user }: UserChipProps) {
  return (
    <div className="flex items-center gap-2.5">
      {/* Name + email (hidden on very small screens) */}
      <div className="text-right hidden sm:block">
        <p className="text-xs font-semibold text-gray-800 leading-tight">{user.name}</p>
        <p className="text-[10px] text-gray-500 leading-tight">{user.nombre_usuario}</p>
      </div>

      {/* Role pill */}
      <Badge variant="gold" uppercase>
        {user.role}
      </Badge>

      {/* Avatar */}
      <Avatar role={user.role} name={user.name} size="sm" />
    </div>
  )
}
