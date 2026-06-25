// ─── Atom: Logo ───────────────────────────────────────────────────────────────
// Logo oficial del IMSS Bienestar.
// Variantes: 'default' (sobre fondo blanco) | 'inverted' (blanco sobre fondo verde)

export type LogoVariant = 'default' | 'inverted'
export type LogoSize    = 'sm' | 'md' | 'lg'

const IMG_URL =
  'https://upload.wikimedia.org/wikipedia/commons/4/40/Logo_IMSS_Bienestar_2025.png'

const SIZE_H: Record<LogoSize, string> = {
  sm: 'h-10',
  md: 'h-14',
  lg: 'h-20',
}

export interface LogoProps {
  variant?: LogoVariant
  size?: LogoSize
  className?: string
}

export function Logo({ variant = 'default', size = 'md', className = '' }: LogoProps) {
  return (
    <div
      className={[
        'rounded-xl inline-flex items-center justify-center shadow-sm',
        variant === 'default'
          ? 'bg-white px-4 py-3'
          : 'bg-primary/80 backdrop-blur-sm px-4 py-3',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <img
        src={IMG_URL}
        alt="IMSS Bienestar"
        className={[SIZE_H[size], 'w-auto object-contain'].join(' ')}
        loading="eager"
      />
    </div>
  )
}
