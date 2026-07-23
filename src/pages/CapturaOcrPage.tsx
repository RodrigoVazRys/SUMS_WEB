// ─── Page: CapturaOcrPage ────────────────────────────────────────────────────
// Orquesta el flujo OCR de 2 pasos con guardado real en la API.
// Paso 1 → Dropzone
// Paso 2 → DocumentViewer + OcrValidationForm (POST /cedulas)

import { useState, useCallback } from 'react'
import { AlertTriangle, Loader2 } from 'lucide-react'
import { Dropzone } from '../components/organisms/Dropzone'
import { DocumentViewer } from '../components/organisms/DocumentViewer'
import { OcrValidationForm } from '../components/organisms/OcrValidationForm'
import { FileInfoBar } from '../components/molecules/FileInfoBar'
import { Toast } from '../components/molecules/Toast'
import type { ToastVariant } from '../components/molecules/Toast'
import { procesarCedulaOcr } from '../services/mineriaApi'
import type { RespuestaOcrCedula } from '../types/mineria.types'

type OcrStep = 'dropzone' | 'processing' | 'validation'

interface ToastState {
  message: string
  variant: ToastVariant
}

function mapOcrErrorToFriendlyMessage(err: unknown): string {
  const axiosErr = err as { response?: { status?: number; data?: { detail?: string } } }
  const status = axiosErr.response?.status
  if (status === 400) return axiosErr.response?.data?.detail ?? 'El archivo no es un PDF válido o excede el tamaño permitido.'
  if (status === 503) return 'El servicio de OCR no está disponible en este momento. Intente más tarde.'
  if (status !== undefined && status >= 500) return 'Error interno del servicio de minería al procesar el documento.'
  return 'No se pudo conectar con el servicio de minería. Verifique la conexión.'
}

export function CapturaOcrPage() {
  const [step,      setStep]      = useState<OcrStep>('dropzone')
  const [fileName,  setFileName]  = useState<string | null>(null)
  const [ocrResult, setOcrResult] = useState<RespuestaOcrCedula | null>(null)
  const [toast,     setToast]     = useState<ToastState | null>(null)
  // Llave para forzar reset completo de OcrValidationForm
  const [formKey,   setFormKey]   = useState(0)

  // ── File loaded: sube el PDF a mineria (POST /ocr/procesar-cedula) ───────
  const handleFileLoaded = useCallback(async (file: File) => {
    setFileName(file.name)
    setStep('processing')
    try {
      const result = await procesarCedulaOcr(file)
      setOcrResult(result)
      setStep('validation')
    } catch (err: unknown) {
      setToast({ message: mapOcrErrorToFriendlyMessage(err), variant: 'error' })
      setStep('dropzone')
      setFileName(null)
    }
  }, [])

  // ── Reset: vuelve al paso 1 y resetea el formulario ───────────────────────
  function handleReset() {
    setStep('dropzone')
    setFileName(null)
    setOcrResult(null)
    setFormKey((k) => k + 1) // Fuerza re-montaje del OcrValidationForm
    setToast(null)
  }

  // ── Éxito al guardar cédula ───────────────────────────────────────────────
  function handleSaveSuccess() {
    setToast({
      message: 'Cédula sincronizada exitosamente en la base de datos.',
      variant: 'success',
    })
    // Reset tras 3.5s
    setTimeout(() => {
      setToast(null)
      handleReset()
    }, 3500)
  }

  // ── Error al guardar ──────────────────────────────────────────────────────
  function handleSaveError(msg: string) {
    setToast({ message: msg, variant: 'error' })
    // Limpiar toast tras 5s (sin reset del form — permite corregir y reintentar)
    setTimeout(() => setToast(null), 5000)
  }

  // Cuenta cuántos campos necesitan revisión, según el propio resumen de mineria
  const lowConfidenceCount = ocrResult?.resumen.necesitan_revision ?? 0

  return (
    <div className="h-full flex flex-col animate-fade-in">
      {/* ── Page Header ──────────────────────────────────────────────── */}
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Carga y Revisión OCR</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Cargue el PDF de la cédula física para extracción y validación automática de datos.
          </p>
        </div>

        {/* Alert badge — visible solo durante validación con baja confianza */}
        {lowConfidenceCount > 0 && (
          <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 rounded-full px-3 py-1.5 animate-fade-in">
            <AlertTriangle size={13} className="text-amber-500" aria-hidden="true" />
            <span className="text-xs font-semibold text-amber-700">
              {lowConfidenceCount} revisión sugerida
            </span>
          </div>
        )}
      </div>

      {/* ── Paso 1: Dropzone ─────────────────────────────────────────── */}
      {step === 'dropzone' && (
        <div className="flex-1 flex items-center justify-center">
          <Dropzone onFileLoaded={handleFileLoaded} />
        </div>
      )}

      {/* ── Paso intermedio: procesando OCR en mineria (~5-10s/documento) ── */}
      {step === 'processing' && (
        <div className="flex-1 flex flex-col items-center justify-center gap-3">
          <Loader2 size={32} className="animate-spin text-[#006657]" />
          <p className="text-sm text-gray-600 font-medium">Procesando documento con OCR...</p>
          <p className="text-xs text-gray-400">{fileName}</p>
        </div>
      )}

      {/* ── Paso 2: Two-column validation ────────────────────────────── */}
      {step === 'validation' && (
        <div className="flex-1 flex flex-col overflow-hidden gap-4">
          {/* File info bar */}
          {fileName && (
            <FileInfoBar fileName={fileName} onReset={handleReset} />
          )}

          {/* Two columns */}
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-5 overflow-hidden">
            <DocumentViewer />
            <OcrValidationForm
              key={formKey}
              ocrResult={ocrResult}
              onSuccess={handleSaveSuccess}
              onError={handleSaveError}
              onCancel={handleReset}
            />
          </div>
        </div>
      )}

      {/* Toast notification */}
      {toast && (
        <Toast
          message={toast.message}
          variant={toast.variant}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  )
}
