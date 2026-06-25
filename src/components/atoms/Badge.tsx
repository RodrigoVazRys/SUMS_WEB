// ─── Atom: Badge ──────────────────────────────────────────────────────────────
// Pill/etiqueta genérica. Usada para roles, deltas, estados, alertas.

import type { ReactNode } from 'react'

export type BadgeVariant =
  | 'primary'
  | 'gold'
  | 'success'
  | 'warning'
  | 'danger'
  | 'neutral'
  | 'outline'

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  primary:  'bg-primary text-white',
  gold:     'bg-gold text-white',
  success:  'bg-green-100 text-green-700',
  warning:  'bg-amber-100 text-amber-700',
  danger:   'bg-red-100 text-red-700',
  neutral:  'bg-gray-100 text-gray-600',
  outline:  'bg-transparent text-gray-600 border border-gray-300',
}

export interface BadgeProps {
  variant?: BadgeVariant
  children: ReactNode
  className?: string
  uppercase?: boolean
}

export function Badge({
  variant = 'neutral',
  children,
  className = '',
  uppercase = false,
}: BadgeProps) {
  return (
    <span
      className={[
        'inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full',
        uppercase ? 'uppercase tracking-wide' : '',
        VARIANT_CLASSES[variant],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </span>
  )
}
