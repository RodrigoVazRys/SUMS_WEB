// ─── Organism: Dropzone ───────────────────────────────────────────────────────
// Zona de arrastrar-y-soltar para cargar el PDF de la cédula.
// Comunica el archivo cargado vía `onFileLoaded`.
// Sin estado de procesamiento — lo maneja la página padre.

import { useRef, useState, useCallback } from 'react'
import { Upload, FileText, AlertCircle } from 'lucide-react'
import { Button } from '../atoms/Button'

export interface DropzoneProps {
  onFileLoaded: (file: File) => void
  accept?: string
}

// ─── Validación de archivo ────────────────────────────────────────────────────
// Remediación de seguridad: antes de invocar onFileLoaded se valida tamaño y
// tipo MIME real del archivo (no solo la extensión), para evitar que se
// acepten archivos arbitrarios (potencialmente maliciosos) hacia el flujo de
// OCR / subida.
const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024 // 20 MB
const ALLOWED_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png']

function validateFile(file: File): string | null {
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return 'El archivo excede el tamaño máximo permitido de 20 MB.'
  }
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return 'Tipo de archivo no permitido. Solo se aceptan PDF, JPG o PNG.'
  }
  return null
}

export function Dropzone({ onFileLoaded, accept = '.pdf,image/*' }: DropzoneProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const processFile = useCallback(
    (file: File) => {
      const validationError = validateFile(file)
      if (validationError) {
        setError(validationError)
        return
      }
      setError(null)
      onFileLoaded(file)
    },
    [onFileLoaded],
  )

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) processFile(file)
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) processFile(file)
    // Permite volver a seleccionar el mismo archivo tras un error.
    e.target.value = ''
  }

  return (
    <div
      id="ocr-dropzone"
      role="button"
      tabIndex={0}
      aria-label="Zona para cargar archivo de cédula. Haga clic o arrastre un archivo."
      onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
      className={[
        'w-full max-w-lg cursor-pointer rounded-2xl border-2 border-dashed p-12',
        'flex flex-col items-center gap-5 transition-all duration-300',
        isDragOver
          ? 'border-primary bg-primary/5 scale-[1.02] shadow-lg shadow-primary/10'
          : 'border-gray-300 hover:border-primary hover:bg-primary/5 bg-white',
      ].join(' ')}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="sr-only"
        onChange={handleInputChange}
        tabIndex={-1}
      />

      {/* Icon */}
      <div
        className={[
          'w-20 h-20 rounded-2xl flex items-center justify-center transition-all duration-300',
          isDragOver ? 'bg-primary' : 'bg-primary/10',
        ].join(' ')}
      >
        <Upload
          size={36}
          strokeWidth={1.5}
          className={[
            'transition-all duration-300',
            isDragOver ? 'text-white scale-110' : 'text-primary',
          ].join(' ')}
        />
      </div>

      {/* Copy */}
      <div className="text-center space-y-1">
        <p className="text-base font-semibold text-gray-800">
          Arrastre el archivo PDF de la Cédula Física aquí
        </p>
        <p className="text-sm text-gray-500">o haga clic para seleccionar desde su equipo</p>
        <p className="text-xs text-gray-400 mt-1">PDF, JPG, PNG — Máx. 20 MB</p>
      </div>

      {/* CTA button */}
      <Button
        variant="primary"
        size="md"
        leftIcon={<FileText size={15} />}
        onClick={(e) => { e.stopPropagation(); inputRef.current?.click() }}
      >
        Seleccionar Archivo
      </Button>

      {/* Error de validación de archivo */}
      {error && (
        <div
          role="alert"
          className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-left w-full"
        >
          <AlertCircle size={14} className="text-red-500 mt-0.5 flex-shrink-0" aria-hidden="true" />
          <p className="text-xs text-red-700 leading-snug">{error}</p>
        </div>
      )}
    </div>
  )
}
