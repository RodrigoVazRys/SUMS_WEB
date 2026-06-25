// ─── Organism: DocumentViewer ─────────────────────────────────────────────────
// Visor simulado del PDF escaneado con líneas skeleton y el campo
// problemático resaltado en ámbar (Apellido Paterno con baja confianza OCR).
// Compone: SkeletonLine (atom) x N.

import { FileText, ZoomIn, ZoomOut } from 'lucide-react'
import { IconButton } from '../molecules/IconButton'
import { SkeletonLine } from '../atoms/SkeletonLine'

export function DocumentViewer() {
  return (
    <section
      aria-label="Vista previa del documento escaneado"
      className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col overflow-hidden"
    >
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 bg-gray-50 flex-shrink-0">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <FileText size={14} className="text-primary" aria-hidden="true" />
          Vista Previa de Cédula
        </div>
        <div className="flex items-center gap-1">
          <IconButton icon={ZoomIn}  label="Acercar"  size={13} />
          <IconButton icon={ZoomOut} label="Alejar"   size={13} />
        </div>
      </div>

      {/* Document body */}
      <div className="flex-1 p-5 bg-gray-50 overflow-y-auto">
        <div className="bg-white border border-gray-200 rounded shadow-sm mx-auto max-w-xs p-5 space-y-3">
          <SkeletonLine width="w-3/4" />
          <SkeletonLine width="w-full" />
          <SkeletonLine width="w-5/6" />
          <SkeletonLine width="w-2/3" />

          {/* Spacer */}
          <div className="h-4" />

          {/* Highlighted field: simulates flagged "Apellido Paterno" */}
          <div
            aria-label="Campo con baja confianza OCR"
            className="border-2 border-amber-400 rounded px-2 py-2 bg-amber-50/50"
          >
            <div className="h-3 bg-amber-300/60 rounded w-full" />
          </div>

          <div className="h-4" />
          <SkeletonLine width="w-full" />
          <SkeletonLine width="w-4/5" />
          <SkeletonLine width="w-3/4" />
          <div className="h-4" />
          <SkeletonLine width="w-5/6" />
          <SkeletonLine width="w-full" />
          <SkeletonLine width="w-2/3" />
          <div className="h-4" />
          <SkeletonLine width="w-3/4" />
          <SkeletonLine width="w-full" />
        </div>
      </div>
    </section>
  )
}
