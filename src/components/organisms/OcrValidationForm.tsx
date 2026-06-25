// ─── Organism: OcrValidationForm ─────────────────────────────────────────────
// Formulario de validación OCR con:
//   - Catálogos dinámicos cargados desde GET /catalogos/material y /catalogos/servicio-vivienda
//   - POST /cedulas al guardar
//   - Borde naranja (baja confianza) que se limpia al corregir
//   - Callbacks onSuccess / onError para que la página muestre toasts

import { useState, useEffect } from 'react'
import { Save, Loader2 } from 'lucide-react'
import { OcrFormField } from '../molecules/OcrFormField'
import { Select } from '../atoms/Select'
import { Button } from '../atoms/Button'
import type { SelectOption } from '../atoms/Select'
import type { OcrConfidence } from '../molecules/OcrFormField'
import { getCatalogo, postCedula } from '../../services/api'
import type { CatalogoItem } from '../../types/api.types'
import { useAuth } from '../../contexts/AuthContext'

// ─── OCR initial values (simulated extraction) ────────────────────────────────
const INITIAL_VALUES = {
  nombres:          'Juan Carlos',
  apellidoPaterno:  'Péres',       // Low-confidence OCR value
  apellidoMaterno:  'García',
  materialTecho:    '',            // Se rellena desde catálogo
  servicioAgua:     '',            // Se rellena desde catálogo
}

const SUGGESTION_APELLIDO = 'Pérez'

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

  // ── Catálogos state ────────────────────────────────────────────────────────
  const [techoOptions, setTechoOptions] = useState<SelectOption[]>([])
  const [aguaOptions,  setAguaOptions]  = useState<SelectOption[]>([])
  const [loadingCatalogos, setLoadingCatalogos] = useState(true)

  // ── Save state ─────────────────────────────────────────────────────────────
  const [isSaving, setIsSaving] = useState(false)

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

  // ── Submit: POST /cedulas ─────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsSaving(true)

    try {
      await postCedula({
        unidad_salud_id:     user?.unidad_salud_id ?? 1,
        entrevistador_id:    user?.id ?? 1,
        nucleo_familiar_id:  1, // Placeholder — en producción viene de selección anterior
        fecha_registro:      new Date().toISOString().split('T')[0],
        estado:              'sincronizada',
        observaciones:       `Nombres: ${nombres} ${apellidoPaterno} ${apellidoMaterno}. Mat.Techo ID: ${materialTechoId}. Serv.Agua ID: ${servicioAguaId}`,
      })
      onSuccess()
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { error?: string }; status?: number } }
      const msg = axiosError.response?.data?.error ?? 'Error al guardar la cédula. Intente nuevamente.'
      onError(msg)
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
            onChange={(e) => setNombres(e.target.value)}
            placeholder="Nombre(s)"
          />

          <OcrFormField
            label="Apellido Paterno"
            htmlFor="ocr-apellido-paterno"
            value={apellidoPaterno}
            onChange={(e) => setApellidoPaterno(e.target.value)}
            confidence={apellidoConfianza}
            suggestion={SUGGESTION_APELLIDO}
            onAcceptSuggestion={handleAcceptSuggestion}
            placeholder="Apellido Paterno"
          />

          <OcrFormField
            label="Apellido Materno"
            htmlFor="ocr-apellido-materno"
            value={apellidoMaterno}
            onChange={(e) => setApellidoMaterno(e.target.value)}
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
      </div>

      {/* Footer actions */}
      <div className="px-4 py-3.5 border-t border-gray-100 bg-gray-50 flex items-center justify-between gap-3 flex-shrink-0">
        <Button variant="secondary" type="button" onClick={onCancel} disabled={isSaving}>
          Cancelar
        </Button>
        <Button
          id="ocr-save-btn"
          variant="primary"
          type="submit"
          disabled={isSaving || loadingCatalogos}
          leftIcon={isSaving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
        >
          {isSaving ? 'Guardando...' : 'Validar y Guardar Cédula'}
        </Button>
      </div>
    </form>
  )
}
