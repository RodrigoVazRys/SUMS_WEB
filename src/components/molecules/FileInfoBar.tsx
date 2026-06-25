// ─── Molecule: FileInfoBar ────────────────────────────────────────────────────
// Barra que muestra el nombre del archivo cargado en la vista OCR.
// Incluye botón para descartar y cargar otro archivo.

import { FileText, RefreshCw } from 'lucide-react'

export interface FileInfoBarProps {
  fileName: string
  onReset: () => void
}

export function FileInfoBar({ fileName, onReset }: FileInfoBarProps) {
  return (
    <div className="flex items-center gap-2 bg-primary/5 border border-primary/20 rounded-lg px-4 py-2.5">
      <FileText size={14} className="text-primary flex-shrink-0" />
      <span className="text-sm text-primary font-medium truncate flex-1 min-w-0">
        {fileName}
      </span>
      <button
        type="button"
        onClick={onReset}
        className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-red-500 transition-colors flex-shrink-0"
      >
        <RefreshCw size={12} />
        Cargar otro
      </button>
    </div>
  )
}
