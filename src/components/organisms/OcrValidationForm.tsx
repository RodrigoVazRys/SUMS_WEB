// ─── Organism: OcrValidationForm ─────────────────────────────────────────────
// Formulario de validación OCR con:
//   - Catálogos dinámicos cargados desde GET /catalogos/material y /catalogos/servicio-vivienda
//   - POST /cedulas al guardar
//   - Borde naranja (baja confianza) que se limpia al corregir
//   - Callbacks onSuccess / onError para que la página muestre toasts

import { useState, useEffect, useRef } from 'react'
import { Save, Loader2, AlertTriangle } from 'lucide-react'
import { OcrFormField } from '../molecules/OcrFormField'
import { Select } from '../atoms/Select'
import { Button } from '../atoms/Button'
import type { SelectOption } from '../atoms/Select'
import type { OcrConfidence } from '../molecules/OcrFormField'
import { getCatalogo, postCedula } from '../../services/api'
import type { CatalogoItem } from '../../types/api.types'
import { useAuth } from '../../contexts/AuthContext'
import { sanitizeNombreInput, validateNombre } from '../../utils/validators'

// ─── Catálogo cerrado de mensajes de error ────────────────────────────────────
// En vez de reenviar axiosError.response.data.error crudo al usuario (puede
// filtrar detalles internos del backend/DB), se mapea por código de estado
// HTTP a un mensaje amigable predefinido.
function mapCedulaErrorToFriendlyMessage(err: unknown): string {
  const axiosError = err as { response?: { status?: number } }
  const status = axiosError.response?.status

  if (status === 400) return 'Los datos enviados no son válidos. Revise los campos e intente nuevamente.'
  if (status === 401) return 'Su sesión ha expirado. Vuelva a iniciar sesión.'
  if (status === 403) return 'No tiene permisos para guardar esta cédula.'
  if (status === 409) return 'Ya existe un registro con estos datos.'
  if (status !== undefined && status >= 500) return 'Error del servidor. Intente nuevamente más tarde.'
  return 'Error al guardar la cédula. Intente nuevamente.'
}

// ─── OCR initial values (simulated extraction) ────────────────────────────────
const INITIAL_VALUES = {
  nombres:          'Juan Carlos',
  apellidoPaterno:  'Péres',       // Low-confidence OCR value
  apellidoMaterno:  'García',
  materialTecho:    '',            // Se rellena desde catálogo
  servicioAgua:     '',            // Se rellena desde catálogo
}

const SUGGESTION_APELLIDO = 'Pérez'

// ─── Categorías de observaciones de la visita ─────────────────────────────────
// Lista fija de 6 categorías compartida en todo el sistema. Cada chip inserta
// la "frase base" correspondiente en el textarea de observaciones.
const CATEGORIAS_OBSERVACION = [
  { key: 'seguimiento', label: 'Seguimiento', frase: 'Se requiere visita de seguimiento la próxima semana.' },
  { key: 'enfermedad_rara', label: 'Enfermedad rara', frase: 'Se observó un padecimiento inusual que requiere valoración médica.' },
  { key: 'embarazo', label: 'Embarazo', frase: 'Hay una integrante embarazada, dar seguimiento prenatal.' },
  { key: 'vacunas_pendientes', label: 'Vacunas pendientes', frase: 'Faltan dosis de vacunación, llevar cartilla la próxima visita.' },
  { key: 'vivienda_mal_estado', label: 'Vivienda en mal estado', frase: 'Vivienda con materiales precarios, requiere atención.' },
  { key: 'mascota_sin_vacunar', label: 'Mascota sin vacunar', frase: 'Hay mascotas sin vacunación al corriente en el hogar.' },
] as const

function catalogoToOptions(items: CatalogoItem[]): SelectOption[] {
  return items.map((item) => ({ value: String(item.id), label: item.nombre }))
}

export interface OcrValidationFormProps {
  onSuccess:    () => void
  onError:      (msg: string) => void
  onCancel:     () => void
}

export function OcrValidationForm({ onSuccess, onError, onCancel }: OcrValidationFormProps) {
  const { user } = useAuth()

  // ── Form state ─────────────────────────────────────────────────────────────
  const [nombres,         setNombres]         = useState(INITIAL_VALUES.nombres)
  const [apellidoPaterno, setApellidoPaterno] = useState(INITIAL_VALUES.apellidoPaterno)
  const [apellidoMaterno, setApellidoMaterno] = useState(INITIAL_VALUES.apellidoMaterno)
  const [materialTechoId, setMaterialTechoId] = useState('')
  const [servicioAguaId,  setServicioAguaId]  = useState('')
  const [observaciones,   setObservaciones]   = useState('')
  const observacionesRef = useRef<HTMLTextAreaElement>(null)

  // ── Catálogos state ────────────────────────────────────────────────────────
  const [techoOptions, setTechoOptions] = useState<SelectOption[]>([])
  const [aguaOptions,  setAguaOptions]  = useState<SelectOption[]>([])
  const [loadingCatalogos, setLoadingCatalogos] = useState(true)

  // ── Save state ─────────────────────────────────────────────────────────────
  const [isSaving, setIsSaving] = useState(false)

  // ── Núcleo familiar ────────────────────────────────────────────────────────
  // Todavía no existe una pantalla real de selección de núcleo familiar en la
  // app. En vez de enviar un placeholder (nucleo_familiar_id: 1) en silencio,
  // se bloquea el guardado hasta que exista un id real en el contexto/estado
  // de la aplicación.
  const nucleoFamiliarId: number | null = null

  // ── Load catálogos on mount ─────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false
    async function fetchCatalogos() {
      try {
        const [materiales, servicios] = await Promise.all([
          getCatalogo('material'),
          getCatalogo('servicio-vivienda'),
        ])
        if (!cancelled) {
          const techoOpts = catalogoToOptions(materiales)
          const aguaOpts  = catalogoToOptions(servicios)
          setTechoOptions(techoOpts)
          setAguaOptions(aguaOpts)
          // Seleccionar el primer valor disponible como default
          if (techoOpts.length > 0) setMaterialTechoId(techoOpts[0].value)
          if (aguaOpts.length > 0)  setServicioAguaId(aguaOpts[0].value)
        }
      } catch {
        // Si falla el catálogo, mostramos opciones vacías (no bloquea el form)
      } finally {
        if (!cancelled) setLoadingCatalogos(false)
      }
    }
    fetchCatalogos()
    return () => { cancelled = true }
  }, [])

  // ── OCR confidence logic ──────────────────────────────────────────────────
  const apellidoConfianza: OcrConfidence =
    apellidoPaterno === SUGGESTION_APELLIDO ? 'corrected' :
    apellidoPaterno === INITIAL_VALUES.apellidoPaterno ? 'low' :
    'normal'

  function handleAcceptSuggestion() {
    setApellidoPaterno(SUGGESTION_APELLIDO)
  }

  // ── Observaciones: insertar frase predefinida desde un chip ───────────────
  function insertarFrase(frase: string) {
    setObservaciones((prev) => (prev.trim() === '' ? frase : `${prev} ${frase}`))
    // Mover el foco al textarea y el cursor al final, sin sobreingeniería.
    requestAnimationFrame(() => {
      const el = observacionesRef.current
      if (el) {
        el.focus()
        const end = el.value.length
        el.setSelectionRange(end, end)
      }
    })
  }

  // ── Submit: POST /cedulas ─────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    // Defensa en profundidad: además de deshabilitar el botón de guardado,
    // se bloquea el envío aquí si no hay un núcleo familiar real seleccionado.
    if (nucleoFamiliarId === null) {
      onError('No se puede guardar: no hay un núcleo familiar seleccionado. Esta funcionalidad requiere implementar la pantalla de selección de núcleo familiar.')
      return
    }

    // .trim() consistente en nombres/apellidos antes de validar y enviar
    const nombresTrim         = nombres.trim()
    const apellidoPaternoTrim = apellidoPaterno.trim()
    const apellidoMaternoTrim = apellidoMaterno.trim()

    const nombresCheck = validateNombre(nombresTrim)
    if (!nombresCheck.valid) {
      onError(nombresCheck.error ?? 'El campo Nombre(s) es inválido.')
      return
    }
    const paternoCheck = validateNombre(apellidoPaternoTrim)
    if (!paternoCheck.valid) {
      onError(paternoCheck.error ?? 'El campo Apellido Paterno es inválido.')
      return
    }
    if (apellidoMaternoTrim) {
      const maternoCheck = validateNombre(apellidoMaternoTrim)
      if (!maternoCheck.valid) {
        onError(maternoCheck.error ?? 'El campo Apellido Materno es inválido.')
        return
      }
    }

    if (observaciones.trim().length < 15) {
      onError('Las observaciones de la visita son obligatorias y deben describir algo específico (mínimo 15 caracteres).')
      return
    }

    setIsSaving(true)

    try {
      await postCedula({
        unidad_salud_id:     user?.unidad_salud_id ?? 1,
        entrevistador_id:    user?.id ?? 1,
        nucleo_familiar_id:  nucleoFamiliarId,
        fecha_registro:      new Date().toISOString().split('T')[0],
        estado:              'sincronizada',
        observaciones:       observaciones.trim(),
      })
      onSuccess()
    } catch (err: unknown) {
      onError(mapCedulaErrorToFriendlyMessage(err))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form
      id="ocr-validation-form"
      onSubmit={handleSubmit}
      className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col overflow-hidden"
    >
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100 flex-shrink-0">
        <h3 className="text-sm font-bold text-gray-900">Validación de Datos OCR</h3>
        <p className="text-xs text-gray-500 mt-0.5">
          Revise y corrija los datos extraídos automáticamente.
        </p>
      </div>

      {/* Fields */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5">

        {/* ── Datos Personales ──────────────────────────────── */}
        <fieldset className="space-y-3">
          <legend className="text-[10px] font-bold text-primary uppercase tracking-widest mb-3 block">
            Datos Personales
          </legend>

          <OcrFormField
            label="Nombre(s)"
            htmlFor="ocr-nombres"
            value={nombres}
            onChange={(e) => setNombres(sanitizeNombreInput(e.target.value))}
            maxLength={100}
            placeholder="Nombre(s)"
          />

          <OcrFormField
            label="Apellido Paterno"
            htmlFor="ocr-apellido-paterno"
            value={apellidoPaterno}
            onChange={(e) => setApellidoPaterno(sanitizeNombreInput(e.target.value))}
            maxLength={100}
            confidence={apellidoConfianza}
            suggestion={SUGGESTION_APELLIDO}
            onAcceptSuggestion={handleAcceptSuggestion}
            placeholder="Apellido Paterno"
          />

          <OcrFormField
            label="Apellido Materno"
            htmlFor="ocr-apellido-materno"
            value={apellidoMaterno}
            onChange={(e) => setApellidoMaterno(sanitizeNombreInput(e.target.value))}
            maxLength={100}
            placeholder="Apellido Materno"
          />
        </fieldset>

        {/* ── Sociodemográficos ─────────────────────────────── */}
        <fieldset className="space-y-3">
          <legend className="text-[10px] font-bold text-primary uppercase tracking-widest mb-3 block">
            Socio-Demográficos
          </legend>

          <div className="grid grid-cols-2 gap-3">
            {/* Material del Techo */}
            <div className="space-y-1.5">
              <label htmlFor="ocr-techo" className="text-xs font-semibold text-gray-600 uppercase tracking-wide block">
                Material del Techo
              </label>
              {loadingCatalogos ? (
                <div className="w-full h-10 bg-gray-100 animate-pulse rounded-lg" />
              ) : (
                <Select
                  id="ocr-techo"
                  value={materialTechoId}
                  onChange={(e) => setMaterialTechoId(e.target.value)}
                  options={techoOptions.length > 0 ? techoOptions : [{ value: '', label: 'Sin opciones' }]}
                />
              )}
            </div>

            {/* Servicio de Agua */}
            <div className="space-y-1.5">
              <label htmlFor="ocr-agua" className="text-xs font-semibold text-gray-600 uppercase tracking-wide block">
                Servicio de Agua
              </label>
              {loadingCatalogos ? (
                <div className="w-full h-10 bg-gray-100 animate-pulse rounded-lg" />
              ) : (
                <Select
                  id="ocr-agua"
                  value={servicioAguaId}
                  onChange={(e) => setServicioAguaId(e.target.value)}
                  options={aguaOptions.length > 0 ? aguaOptions : [{ value: '', label: 'Sin opciones' }]}
                />
              )}
            </div>
          </div>
        </fieldset>

        {/* ── Observaciones de la Visita ────────────────────── */}
        <fieldset className="space-y-2">
          <legend className="text-[10px] font-bold text-primary uppercase tracking-widest mb-3 block">
            Observaciones de la Visita
          </legend>

          <div className="flex flex-wrap gap-1.5">
            {CATEGORIAS_OBSERVACION.map((cat) => (
              <button
                key={cat.key}
                type="button"
                onClick={() => insertarFrase(cat.frase)}
                className="text-[11px] px-2.5 py-1 rounded-full border border-gray-300 text-gray-600 hover:bg-primary/10 hover:border-primary hover:text-primary transition-colors"
              >
                {cat.label}
              </button>
            ))}
          </div>

          <textarea
            ref={observacionesRef}
            id="ocr-observaciones"
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            rows={4}
            maxLength={300}
            placeholder="Describe hallazgos concretos de la visita: salud, vivienda, seguimiento necesario..."
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />

          <div className="flex items-center justify-between">
            <span className="text-[11px] text-gray-400">{observaciones.length}/300</span>
            {observaciones.trim().length < 15 && (
              <span className="text-[11px] text-amber-600">
                Describe algo específico, mínimo 15 caracteres.
              </span>
            )}
          </div>
        </fieldset>
      </div>

      {/* Aviso: sin núcleo familiar real seleccionado — guardado bloqueado */}
      {nucleoFamiliarId === null && (
        <div className="mx-5 mb-2 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 flex-shrink-0">
          <AlertTriangle size={14} className="mt-0.5 flex-shrink-0 text-amber-600" aria-hidden="true" />
          <p className="text-xs text-amber-700 leading-snug">
            No hay un núcleo familiar seleccionado. Esta cédula no puede guardarse hasta que exista una pantalla real
            de selección de núcleo familiar.
          </p>
        </div>
      )}

      {/* Footer actions */}
      <div className="px-4 py-3.5 border-t border-gray-100 bg-gray-50 flex items-center justify-between gap-3 flex-shrink-0">
        <Button variant="secondary" type="button" onClick={onCancel} disabled={isSaving}>
          Cancelar
        </Button>
        <Button
          id="ocr-save-btn"
          variant="primary"
          type="submit"
          disabled={isSaving || loadingCatalogos || nucleoFamiliarId === null}
          leftIcon={isSaving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
        >
          {isSaving ? 'Guardando...' : 'Validar y Guardar Cédula'}
        </Button>
      </div>
    </form>
  )
}
