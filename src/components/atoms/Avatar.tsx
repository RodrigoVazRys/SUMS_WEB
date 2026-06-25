// ─── Atom: Avatar ─────────────────────────────────────────────────────────────
// Avatar de usuario basado en ícono (sin imagen real en demo).
// En producción, acepta `src` para mostrar foto de perfil.

import { Shield, User } from 'lucide-react'
import type { UserRole } from '../../types/auth.types'

export interface AvatarProps {
  role?: UserRole
  src?: string
  name?: string
  size?: 'sm' | 'md' | 'lg'
}

const SIZE_CLASSES = {
  sm: 'w-7 h-7',
  md: 'w-9 h-9',
  lg: 'w-12 h-12',
}

const ICON_SIZE = {
  sm: 13,
  md: 15,
  lg: 20,
}

export function Avatar({ role, src, name, size = 'md' }: AvatarProps) {
  if (src) {
    return (
      <img
        src={src}
        alt={name ?? 'Usuario'}
        className={[
          SIZE_CLASSES[size],
          'rounded-full object-cover border border-primary/20',
        ].join(' ')}
      />
    )
  }

  return (
    <div
      aria-label={name ?? 'Avatar de usuario'}
      className={[
        SIZE_CLASSES[size],
        'rounded-full bg-primary/10 border border-primary/20',
        'flex items-center justify-center flex-shrink-0',
      ].join(' ')}
    >
      {role === 'SuperAdmin' ? (
        <Shield size={ICON_SIZE[size]} className="text-primary" />
      ) : (
        <User size={ICON_SIZE[size]} className="text-primary" />
      )}
    </div>
  )
}
