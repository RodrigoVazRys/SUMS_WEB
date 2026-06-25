// ─── Atom: Spinner ────────────────────────────────────────────────────────────
// Indicador de carga circular. Soporta tamaños y colores.

type SpinnerSize  = 'xs' | 'sm' | 'md' | 'lg'
type SpinnerColor = 'primary' | 'white' | 'gray'

const SIZE_CLASSES: Record<SpinnerSize, string> = {
  xs: 'w-3 h-3 border-2',
  sm: 'w-4 h-4 border-2',
  md: 'w-8 h-8 border-3',
  lg: 'w-12 h-12 border-4',
}

const COLOR_CLASSES: Record<SpinnerColor, string> = {
  primary: 'border-primary/20 border-t-primary',
  white:   'border-white/30 border-t-white',
  gray:    'border-gray-200 border-t-gray-500',
}

export interface SpinnerProps {
  size?: SpinnerSize
  color?: SpinnerColor
  className?: string
}

export function Spinner({ size = 'md', color = 'primary', className = '' }: SpinnerProps) {
  return (
    <span
      role="status"
      aria-label="Cargando..."
      className={[
        'inline-block rounded-full animate-spin flex-shrink-0',
        SIZE_CLASSES[size],
        COLOR_CLASSES[color],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    />
  )
}
