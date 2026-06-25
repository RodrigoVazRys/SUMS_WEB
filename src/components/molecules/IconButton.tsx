// ─── Molecule: IconButton ─────────────────────────────────────────────────────
// Botón circular solo-icono con indicador de notificación opcional.
// Usado en el Topbar para campana (Bell), ayuda (HelpCircle), etc.

import type { ButtonHTMLAttributes, ElementType } from 'react'

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: ElementType
  size?: number
  hasDot?: boolean
  dotColor?: string
  label: string   // aria-label obligatorio para accesibilidad
}

export function IconButton({
  icon: Icon,
  size = 18,
  hasDot = false,
  dotColor = 'bg-red-500',
  label,
  className = '',
  ...props
}: IconButtonProps) {
  return (
    <button
      aria-label={label}
      className={[
        'relative p-2 rounded-lg text-gray-500',
        'hover:text-primary hover:bg-gray-100',
        'transition-colors duration-200',
        'focus:outline-none focus:ring-2 focus:ring-primary/30',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      <Icon size={size} strokeWidth={1.8} />
      {hasDot && (
        <span
          aria-hidden="true"
          className={`absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full ${dotColor}`}
        />
      )}
    </button>
  )
}
