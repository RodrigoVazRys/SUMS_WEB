// ─── Atom: SkeletonLine ───────────────────────────────────────────────────────
// Línea de shimmer para estados de carga de documentos/listas.

export interface SkeletonLineProps {
  width?: string   // Tailwind class, ej: 'w-3/4'
  height?: string  // Tailwind class, ej: 'h-3'
  className?: string
}

export function SkeletonLine({
  width = 'w-full',
  height = 'h-3',
  className = '',
}: SkeletonLineProps) {
  return (
    <div
      aria-hidden="true"
      className={['rounded skeleton', height, width, className].filter(Boolean).join(' ')}
    />
  )
}
