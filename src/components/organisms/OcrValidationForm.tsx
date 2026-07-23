// ─── Organism: OcrValidationForm ─────────────────────────────────────────────
// Formulario de validación OCR con:
//   - Catálogos dinámicos (material, manejo-excretas, animal)
//   - POST /cedulas al guardar
//   - Borde naranja (baja confianza) que se limpia al corregir
//   - Callbacks onSuccess / onError para que la página muestre toasts

import { useState, useEffect, useRef } from 'react'
import { Save, Loader2, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { OcrFormField } from '../molecules/OcrFormField'
import { Select } from '../atoms/Select'
import { Button } from '../atoms/Button'
import { Badge } from '../atoms/Badge'
import type { SelectOption } from '../atoms/Select'
import type { OcrConfidence } from '../molecules/OcrFormField'
import { getCatalogo, postCedula } from '../../services/api'
import type { CatalogoItem } from '../../types/api.types'
import type { CampoOcr, RespuestaOcrCedula } from '../../types/mineria.types'
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

// ─── Derivación de valores desde la respuesta real de OCR (mineria) ──────────
// Los IDs de campo vienen de subcomponente_A_OCR/config/field_map_sums.json.
// "familia.nombre_informante" es UN SOLO campo de texto combinado (la cédula
// física no separa nombre/apellidos) — se separa aquí con una heurística
// simple (últimas 2 palabras = apellidos), que el entrevistador puede corregir
// igual que cualquier otro campo de baja confianza.

interface NombreDerivado {
  nombres: string
  apellidoPaterno: string
  apellidoMaterno: string
  confidence: OcrConfidence
}

function confianzaDeCampo(campo: CampoOcr | undefined): OcrConfidence {
  if (!campo) return 'normal'
  return campo.needs_review ? 'low' : 'normal'
}

function derivarNombreDesdeOcr(campos: Record<string, CampoOcr> | undefined): NombreDerivado {
  const campo = campos?.['familia.nombre_informante']
  const texto = typeof campo?.value === 'string' ? campo.value.trim() : ''
  if (!texto) return { nombres: '', apellidoPaterno: '', apellidoMaterno: '', confidence: 'normal' }

  const partes = texto.split(/\s+/)
  let nombres = texto
  let apellidoPaterno = ''
  let apellidoMaterno = ''
  if (partes.length >= 3) {
    apellidoMaterno = partes[partes.length - 1]
    apellidoPaterno = partes[partes.length - 2]
    nombres = partes.slice(0, -2).join(' ')
  } else if (partes.length === 2) {
    apellidoPaterno = partes[1]
    nombres = partes[0]
  }
  return { nombres, apellidoPaterno, apellidoMaterno, confidence: confianzaDeCampo(campo) }
}

/** De un grupo de casillas mutuamente excluyentes vivienda.<base>.<sufijo>,
 * resuelve cuál está marcada. Si ninguna o más de una están marcadas (OCR
 * ambiguo), no se puede resolver. Cubre techo/paredes/piso/cocina_ubicacion/
 * excretas — todos comparten esta misma forma en field_map_sums.json. */
function derivarGrupoDesdeOcr(
  campos: Record<string, CampoOcr> | undefined,
  base: string,
  sufijoAValor: Record<string, string>,
): { valor: string | null; confidence: OcrConfidence } {
  const activos = Object.keys(sufijoAValor).filter((sufijo) => campos?.[`${base}.${sufijo}`]?.value === true)
  if (activos.length !== 1) return { valor: null, confidence: 'normal' }
  const campo = campos?.[`${base}.${activos[0]}`]
  return { valor: sufijoAValor[activos[0]], confidence: confianzaDeCampo(campo) }
}

/** Casillas .si/.no (vivienda.<base>.si / .no): true si .si está marcada,
 * false si .no está marcada, null si OCR no marcó ninguna con claridad. */
function derivarBooleanoDesdeOcr(
  campos: Record<string, CampoOcr> | undefined,
  base: string,
): { valor: boolean | null; confidence: OcrConfidence } {
  const si = campos?.[`${base}.si`]
  const no = campos?.[`${base}.no`]
  if (si?.value === true && no?.value !== true) return { valor: true, confidence: confianzaDeCampo(si) }
  if (no?.value === true && si?.value !== true) return { valor: false, confidence: confianzaDeCampo(no) }
  return { valor: null, confidence: 'normal' }
}

const SUFIJO_TECHO_PAREDES: Record<string, string> = {
  concreto: 'Concreto o cemento',
  madera:   'Madera',
  lamina:   'Lámina',
  otros:    'Otros (especifique)',
}
const SUFIJO_PISO: Record<string, string> = {
  concreto: 'Concreto o cemento',
  madera:   'Madera',
  tierra:   'Tierra',
  otros:    'Otros (especifique)',
}
const SUFIJO_COCINA: Record<string, string> = {
  fuera_dormitorio:  'fuera_del_dormitorio',
  dentro_dormitorio: 'dentro_del_dormitorio',
}
const SUFIJO_EXCRETAS: Record<string, string> = {
  wc: 'WC',
  letrina: 'Letrina',
  ras_suelo: 'Al ras de suelo',
}
const SUFIJO_ANIMALES: Record<string, string> = {
  aves_corral: 'Aves de corral',
  bovinos: 'Bovinos',
  porcinos: 'Porcinos',
  otros: 'Otros',
}

const BOOLEAN_OPTIONS: SelectOption[] = [
  { value: 'true', label: 'Sí' },
  { value: 'false', label: 'No' },
]
const COCINA_OPTIONS: SelectOption[] = [
  { value: 'fuera_del_dormitorio', label: 'Fuera del dormitorio' },
  { value: 'dentro_del_dormitorio', label: 'Dentro del dormitorio' },
]

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
  ocrResult:    RespuestaOcrCedula | null
  onSuccess:    () => void
  onError:      (msg: string) => void
  onCancel:     () => void
}

export function OcrValidationForm({ ocrResult, onSuccess, onError, onCancel }: OcrValidationFormProps) {
  const { user } = useAuth()

  // ── Datos personales ──────────────────────────────────────────────────────
  const [nombres,         setNombres]         = useState('')
  const [apellidoPaterno, setApellidoPaterno] = useState('')
  const [apellidoMaterno, setApellidoMaterno] = useState('')
  const [sexoInformante,  setSexoInformante]  = useState('')
  const [nombreConfidence, setNombreConfidence] = useState<OcrConfidence>('normal')

  // ── Vivienda: materiales ───────────────────────────────────────────────────
  const [materialTechoId,   setMaterialTechoId]   = useState('')
  const [materialParedesId, setMaterialParedesId] = useState('')
  const [materialPisoId,    setMaterialPisoId]    = useState('')
  const [techoOtro,   setTechoOtro]   = useState('')
  const [paredesOtro, setParedesOtro] = useState('')
  const [pisoOtro,    setPisoOtro]    = useState('')
  const [techoConfidence,   setTechoConfidence]   = useState<OcrConfidence>('normal')
  const [paredesConfidence, setParedesConfidence] = useState<OcrConfidence>('normal')
  const [pisoConfidence,    setPisoConfidence]    = useState<OcrConfidence>('normal')
  const [techoResuelto,   setTechoResuelto]   = useState(false)
  const [paredesResuelto, setParedesResuelto] = useState(false)
  const [pisoResuelto,    setPisoResuelto]    = useState(false)

  // ── Vivienda: composición ──────────────────────────────────────────────────
  const [numeroCuartos,     setNumeroCuartos]     = useState('')
  const [numeroHabitantes,  setNumeroHabitantes]  = useState('')

  // ── Vivienda: servicios ────────────────────────────────────────────────────
  const [aguaEntubada,       setAguaEntubada]       = useState(true)
  const [energiaElectrica,   setEnergiaElectrica]   = useState(true)
  const [cocinaUbicacion,    setCocinaUbicacion]    = useState('fuera_del_dormitorio')
  const [cocinaConLena,      setCocinaConLena]      = useState(false)
  const [manejoExcretasId,   setManejoExcretasId]   = useState('')
  const [redAlcantarillado,  setRedAlcantarillado]  = useState(true)
  const [fosaSeptica,        setFosaSeptica]        = useState(false)
  const [excretasConfidence, setExcretasConfidence] = useState<OcrConfidence>('normal')
  const [excretasResuelto,   setExcretasResuelto]   = useState(false)

  // ── Mascotas y animales ────────────────────────────────────────────────────
  const [perrosGatosDentro,      setPerrosGatosDentro]      = useState(false)
  const [mascotasVacunas,        setMascotasVacunas]        = useState(false)
  const [mascotasEsterilizadas,  setMascotasEsterilizadas]  = useState(false)
  const [animalesSeleccionados,  setAnimalesSeleccionados]  = useState<Set<string>>(new Set())
  const [animalOtro,             setAnimalOtro]             = useState('')
  const [animalObservaciones,    setAnimalObservaciones]    = useState('')

  const [observaciones,   setObservaciones]   = useState('')
  const observacionesRef = useRef<HTMLTextAreaElement>(null)

  // ── Catálogos state ────────────────────────────────────────────────────────
  const [techoOptions,    setTechoOptions]    = useState<SelectOption[]>([])
  const [pisoOptions,     setPisoOptions]     = useState<SelectOption[]>([])
  const [excretasOptions, setExcretasOptions] = useState<SelectOption[]>([])
  const [animalOptions,   setAnimalOptions]   = useState<CatalogoItem[]>([])
  const [loadingCatalogos, setLoadingCatalogos] = useState(true)

  // ── Save state ─────────────────────────────────────────────────────────────
  const [isSaving, setIsSaving] = useState(false)

  // ── Núcleo familiar ────────────────────────────────────────────────────────
  // Todavía no existe una pantalla real de selección de núcleo familiar en la
  // app. En vez de enviar un placeholder (nucleo_familiar_id: 1) en silencio,
  // se bloquea el guardado hasta que exista un id real en el contexto/estado
  // de la aplicación. NOTA: por lo mismo, los campos de vivienda/mascotas de
  // abajo hoy solo se MUESTRAN y validan — postCedula() (POST /cedulas) no
  // acepta todavía datos de vivienda; persistirlos requiere integrar
  // POST /cedulas/captura-completa, pendiente como siguiente paso.
  const nucleoFamiliarId: number | null = null

  // ── Load catálogos on mount ─────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false
    async function fetchCatalogos() {
      try {
        const [materiales, excretas, animales] = await Promise.all([
          getCatalogo('material'),
          getCatalogo('manejo-excretas'),
          getCatalogo('animal'),
        ])
        if (cancelled) return

        const materialOpts = catalogoToOptions(materiales)
        setTechoOptions(materialOpts)
        setPisoOptions(materialOpts)
        setExcretasOptions(catalogoToOptions(excretas))
        setAnimalOptions(animales)

        function resolverGrupo(
          base: string,
          sufijoAValor: Record<string, string>,
          catalogo: CatalogoItem[],
          setId: (v: string) => void,
          setConfidence: (c: OcrConfidence) => void,
          setResuelto: (b: boolean) => void,
        ) {
          const { valor, confidence } = derivarGrupoDesdeOcr(ocrResult?.campos, base, sufijoAValor)
          const opcion = valor ? catalogo.find((c) => c.nombre === valor) : undefined
          if (opcion) {
            setId(String(opcion.id))
            setConfidence(confidence)
            setResuelto(true)
          } else if (catalogo.length > 0) {
            setId(String(catalogo[0].id))
          }
        }
        resolverGrupo('vivienda.material_techo', SUFIJO_TECHO_PAREDES, materiales, setMaterialTechoId, setTechoConfidence, setTechoResuelto)
        resolverGrupo('vivienda.material_paredes', SUFIJO_TECHO_PAREDES, materiales, setMaterialParedesId, setParedesConfidence, setParedesResuelto)
        resolverGrupo('vivienda.material_piso', SUFIJO_PISO, materiales, setMaterialPisoId, setPisoConfidence, setPisoResuelto)
        resolverGrupo('vivienda.excretas', SUFIJO_EXCRETAS, excretas, setManejoExcretasId, setExcretasConfidence, setExcretasResuelto)
      } catch {
        // Si falla el catálogo, mostramos opciones vacías (no bloquea el form)
      } finally {
        if (!cancelled) setLoadingCatalogos(false)
      }
    }
    fetchCatalogos()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Poblar el resto del formulario desde el resultado real de OCR ─────────
  useEffect(() => {
    const campos = ocrResult?.campos
    const derivadoNombre = derivarNombreDesdeOcr(campos)
    setNombres(derivadoNombre.nombres)
    setApellidoPaterno(derivadoNombre.apellidoPaterno)
    setApellidoMaterno(derivadoNombre.apellidoMaterno)
    setNombreConfidence(derivadoNombre.confidence)

    const cuartos = campos?.['vivienda.numero_cuartos']?.value
    if (typeof cuartos === 'number') setNumeroCuartos(String(cuartos))
    const habitantes = campos?.['vivienda.numero_habitantes']?.value
    if (typeof habitantes === 'number') setNumeroHabitantes(String(habitantes))

    const cocina = derivarGrupoDesdeOcr(campos, 'vivienda.cocina_ubicacion', SUFIJO_COCINA)
    if (cocina.valor) setCocinaUbicacion(cocina.valor)

    const agua = derivarBooleanoDesdeOcr(campos, 'vivienda.agua_entubada')
    if (agua.valor !== null) setAguaEntubada(agua.valor)
    const energia = derivarBooleanoDesdeOcr(campos, 'vivienda.energia_electrica')
    if (energia.valor !== null) setEnergiaElectrica(energia.valor)
    const lena = derivarBooleanoDesdeOcr(campos, 'vivienda.cocina_lena')
    if (lena.valor !== null) setCocinaConLena(lena.valor)
    const alcantarillado = derivarBooleanoDesdeOcr(campos, 'vivienda.red_alcantarillado')
    if (alcantarillado.valor !== null) setRedAlcantarillado(alcantarillado.valor)
    const fosa = derivarBooleanoDesdeOcr(campos, 'vivienda.fosa_septica')
    if (fosa.valor !== null) setFosaSeptica(fosa.valor)
    const perrosGatos = derivarBooleanoDesdeOcr(campos, 'vivienda.perros_gatos_dentro')
    if (perrosGatos.valor !== null) setPerrosGatosDentro(perrosGatos.valor)
    const vacunas = derivarBooleanoDesdeOcr(campos, 'vivienda.mascotas_vacunas')
    if (vacunas.valor !== null) setMascotasVacunas(vacunas.valor)
    const esterilizadas = derivarBooleanoDesdeOcr(campos, 'vivienda.mascotas_esterilizadas')
    if (esterilizadas.valor !== null) setMascotasEsterilizadas(esterilizadas.valor)

    const animalesMarcados = new Set<string>()
    for (const [sufijo, etiqueta] of Object.entries(SUFIJO_ANIMALES)) {
      if (campos?.[`vivienda.animales.${sufijo}`]?.value === true) animalesMarcados.add(etiqueta)
    }
    setAnimalesSeleccionados(animalesMarcados)
  }, [ocrResult])

  // ── Al editar un campo marcado como baja confianza, se marca "corregido" ──
  function editarConBajaConfianza(
    confidence: OcrConfidence,
    setConfidence: (c: OcrConfidence) => void,
  ) {
    if (confidence === 'low') setConfidence('corrected')
  }

  function toggleAnimal(etiqueta: string) {
    setAnimalesSeleccionados((prev) => {
      const next = new Set(prev)
      if (next.has(etiqueta)) next.delete(etiqueta)
      else next.add(etiqueta)
      return next
    })
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

  function confidenceBadge(confidence: OcrConfidence) {
    if (confidence === 'low') return <Badge variant="warning"><AlertTriangle size={10} /> Baja confianza</Badge>
    if (confidence === 'corrected') return <Badge variant="success"><CheckCircle2 size={10} /> Corregido</Badge>
    return null
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
            onChange={(e) => {
              setNombres(sanitizeNombreInput(e.target.value))
              editarConBajaConfianza(nombreConfidence, setNombreConfidence)
            }}
            maxLength={100}
            confidence={nombreConfidence}
            placeholder="Nombre(s)"
          />

          <OcrFormField
            label="Apellido Paterno"
            htmlFor="ocr-apellido-paterno"
            value={apellidoPaterno}
            onChange={(e) => {
              setApellidoPaterno(sanitizeNombreInput(e.target.value))
              editarConBajaConfianza(nombreConfidence, setNombreConfidence)
            }}
            maxLength={100}
            confidence={nombreConfidence}
            placeholder="Apellido Paterno"
          />

          <OcrFormField
            label="Apellido Materno"
            htmlFor="ocr-apellido-materno"
            value={apellidoMaterno}
            onChange={(e) => {
              setApellidoMaterno(sanitizeNombreInput(e.target.value))
              editarConBajaConfianza(nombreConfidence, setNombreConfidence)
            }}
            maxLength={100}
            confidence={nombreConfidence}
            placeholder="Apellido Materno"
          />

          {ocrResult && !ocrResult.campos['familia.nombre_informante']?.value && (
            <p className="text-[11px] text-amber-600 flex items-center gap-1">
              <AlertTriangle size={11} /> OCR no detectó el nombre del informante — captúrelo manualmente.
            </p>
          )}

          <div className="space-y-1.5">
            <label htmlFor="ocr-sexo" className="text-xs font-semibold text-gray-600 uppercase tracking-wide block">Sexo del informante</label>
            <Select id="ocr-sexo" value={sexoInformante} onChange={(e) => setSexoInformante(e.target.value)}
              options={[{ value: '', label: 'Seleccione' }, { value: 'Masculino', label: 'Masculino' }, { value: 'Femenino', label: 'Femenino' }]} />
          </div>
        </fieldset>

        {/* ── Vivienda: Materiales ──────────────────────────── */}
        <fieldset className="space-y-3">
          <legend className="text-[10px] font-bold text-primary uppercase tracking-widest mb-3 block">
            Vivienda — Materiales
          </legend>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="ocr-techo" className="text-xs font-semibold text-gray-600 uppercase tracking-wide block">Techo</label>
                {confidenceBadge(techoConfidence)}
              </div>
              {loadingCatalogos ? <div className="w-full h-10 bg-gray-100 animate-pulse rounded-lg" /> : (
                <Select id="ocr-techo" value={materialTechoId}
                  onChange={(e) => { setMaterialTechoId(e.target.value); editarConBajaConfianza(techoConfidence, setTechoConfidence) }}
                  options={techoOptions.length > 0 ? techoOptions : [{ value: '', label: 'Sin opciones' }]} />
              )}
              {ocrResult && !techoResuelto && <p className="text-[11px] text-amber-600">Sin marca única — verifique.</p>}
              {techoOptions.find((o) => o.value === materialTechoId)?.label === 'Otros (especifique)' && (
                <input type="text" value={techoOtro} onChange={(e) => setTechoOtro(e.target.value)} maxLength={80}
                  placeholder="Especifique el material" className="w-full mt-1 px-2.5 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30" />
              )}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="ocr-paredes" className="text-xs font-semibold text-gray-600 uppercase tracking-wide block">Paredes</label>
                {confidenceBadge(paredesConfidence)}
              </div>
              {loadingCatalogos ? <div className="w-full h-10 bg-gray-100 animate-pulse rounded-lg" /> : (
                <Select id="ocr-paredes" value={materialParedesId}
                  onChange={(e) => { setMaterialParedesId(e.target.value); editarConBajaConfianza(paredesConfidence, setParedesConfidence) }}
                  options={techoOptions.length > 0 ? techoOptions : [{ value: '', label: 'Sin opciones' }]} />
              )}
              {ocrResult && !paredesResuelto && <p className="text-[11px] text-amber-600">Sin marca única — verifique.</p>}
              {techoOptions.find((o) => o.value === materialParedesId)?.label === 'Otros (especifique)' && (
                <input type="text" value={paredesOtro} onChange={(e) => setParedesOtro(e.target.value)} maxLength={80}
                  placeholder="Especifique el material" className="w-full mt-1 px-2.5 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30" />
              )}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="ocr-piso" className="text-xs font-semibold text-gray-600 uppercase tracking-wide block">Piso</label>
                {confidenceBadge(pisoConfidence)}
              </div>
              {loadingCatalogos ? <div className="w-full h-10 bg-gray-100 animate-pulse rounded-lg" /> : (
                <Select id="ocr-piso" value={materialPisoId}
                  onChange={(e) => { setMaterialPisoId(e.target.value); editarConBajaConfianza(pisoConfidence, setPisoConfidence) }}
                  options={pisoOptions.length > 0 ? pisoOptions : [{ value: '', label: 'Sin opciones' }]} />
              )}
              {ocrResult && !pisoResuelto && <p className="text-[11px] text-amber-600">Sin marca única — verifique.</p>}
              {pisoOptions.find((o) => o.value === materialPisoId)?.label === 'Otros (especifique)' && (
                <input type="text" value={pisoOtro} onChange={(e) => setPisoOtro(e.target.value)} maxLength={80}
                  placeholder="Especifique el material" className="w-full mt-1 px-2.5 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30" />
              )}
            </div>
          </div>
        </fieldset>

        {/* ── Vivienda: Composición ──────────────────────────── */}
        <fieldset className="space-y-3">
          <legend className="text-[10px] font-bold text-primary uppercase tracking-widest mb-3 block">
            Vivienda — Composición
          </legend>
          <div className="grid grid-cols-2 gap-3">
            <OcrFormField label="Número de cuartos" htmlFor="ocr-cuartos" type="number" min={0}
              value={numeroCuartos} onChange={(e) => setNumeroCuartos(e.target.value)} placeholder="0" />
            <OcrFormField label="Número de habitantes" htmlFor="ocr-habitantes" type="number" min={0}
              value={numeroHabitantes} onChange={(e) => setNumeroHabitantes(e.target.value)} placeholder="0" />
          </div>
        </fieldset>

        {/* ── Servicios de la Vivienda ───────────────────────── */}
        <fieldset className="space-y-3">
          <legend className="text-[10px] font-bold text-primary uppercase tracking-widest mb-3 block">
            Servicios de la Vivienda
          </legend>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label htmlFor="ocr-agua" className="text-xs font-semibold text-gray-600 uppercase tracking-wide block">Agua entubada</label>
              <Select id="ocr-agua" value={String(aguaEntubada)} onChange={(e) => setAguaEntubada(e.target.value === 'true')} options={BOOLEAN_OPTIONS} />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="ocr-energia" className="text-xs font-semibold text-gray-600 uppercase tracking-wide block">Energía eléctrica</label>
              <Select id="ocr-energia" value={String(energiaElectrica)} onChange={(e) => setEnergiaElectrica(e.target.value === 'true')} options={BOOLEAN_OPTIONS} />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="ocr-cocina-ubicacion" className="text-xs font-semibold text-gray-600 uppercase tracking-wide block">Ubicación de la cocina</label>
              <Select id="ocr-cocina-ubicacion" value={cocinaUbicacion} onChange={(e) => setCocinaUbicacion(e.target.value)} options={COCINA_OPTIONS} />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="ocr-cocina-lena" className="text-xs font-semibold text-gray-600 uppercase tracking-wide block">Cocina con leña</label>
              <Select id="ocr-cocina-lena" value={String(cocinaConLena)} onChange={(e) => setCocinaConLena(e.target.value === 'true')} options={BOOLEAN_OPTIONS} />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="ocr-excretas" className="text-xs font-semibold text-gray-600 uppercase tracking-wide block">Manejo de excretas</label>
                {confidenceBadge(excretasConfidence)}
              </div>
              {loadingCatalogos ? <div className="w-full h-10 bg-gray-100 animate-pulse rounded-lg" /> : (
                <Select id="ocr-excretas" value={manejoExcretasId}
                  onChange={(e) => { setManejoExcretasId(e.target.value); editarConBajaConfianza(excretasConfidence, setExcretasConfidence) }}
                  options={excretasOptions.length > 0 ? excretasOptions : [{ value: '', label: 'Sin opciones' }]} />
              )}
              {ocrResult && !excretasResuelto && <p className="text-[11px] text-amber-600">Sin marca única — verifique.</p>}
            </div>
            <div className="space-y-1.5">
              <label htmlFor="ocr-alcantarillado" className="text-xs font-semibold text-gray-600 uppercase tracking-wide block">Red de alcantarillado</label>
              <Select id="ocr-alcantarillado" value={String(redAlcantarillado)} onChange={(e) => setRedAlcantarillado(e.target.value === 'true')} options={BOOLEAN_OPTIONS} />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="ocr-fosa" className="text-xs font-semibold text-gray-600 uppercase tracking-wide block">Fosa séptica</label>
              <Select id="ocr-fosa" value={String(fosaSeptica)} onChange={(e) => setFosaSeptica(e.target.value === 'true')} options={BOOLEAN_OPTIONS} />
            </div>
          </div>
        </fieldset>

        {/* ── Mascotas y Animales ────────────────────────────── */}
        <fieldset className="space-y-3">
          <legend className="text-[10px] font-bold text-primary uppercase tracking-widest mb-3 block">
            Mascotas y Animales
          </legend>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label htmlFor="ocr-perros-gatos" className="text-xs font-semibold text-gray-600 uppercase tracking-wide block">Perros/gatos dentro</label>
              <Select id="ocr-perros-gatos" value={String(perrosGatosDentro)} onChange={(e) => setPerrosGatosDentro(e.target.value === 'true')} options={BOOLEAN_OPTIONS} />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="ocr-mascotas-vacunas" className="text-xs font-semibold text-gray-600 uppercase tracking-wide block">Vacunas al corriente</label>
              <Select id="ocr-mascotas-vacunas" value={String(mascotasVacunas)} onChange={(e) => setMascotasVacunas(e.target.value === 'true')} options={BOOLEAN_OPTIONS} />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="ocr-mascotas-esterilizadas" className="text-xs font-semibold text-gray-600 uppercase tracking-wide block">Esterilizadas</label>
              <Select id="ocr-mascotas-esterilizadas" value={String(mascotasEsterilizadas)} onChange={(e) => setMascotasEsterilizadas(e.target.value === 'true')} options={BOOLEAN_OPTIONS} />
            </div>
          </div>
          <div className="space-y-1.5 pt-1">
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide block">Animales de traspatio</label>
            <div className="flex flex-wrap gap-2">
              {(animalOptions.length > 0 ? animalOptions.map((a) => a.nombre) : Object.values(SUFIJO_ANIMALES)).map((etiqueta) => (
                <button
                  key={etiqueta}
                  type="button"
                  onClick={() => toggleAnimal(etiqueta)}
                  className={[
                    'text-xs px-3 py-1.5 rounded-full border transition-colors',
                    animalesSeleccionados.has(etiqueta)
                      ? 'bg-primary/10 border-primary text-primary font-semibold'
                      : 'border-gray-300 text-gray-600 hover:bg-gray-50',
                  ].join(' ')}
                >
                  {etiqueta}
                </button>
              ))}
            </div>
            {animalesSeleccionados.has('Otros') && (
              <input type="text" value={animalOtro} onChange={(e) => setAnimalOtro(e.target.value)} maxLength={80}
                placeholder="Especifique el animal" className="w-full mt-1 px-2.5 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30" />
            )}
          </div>
          <div className="space-y-1.5">
            <label htmlFor="ocr-animal-obs" className="text-xs font-semibold text-gray-600 uppercase tracking-wide block">Observaciones (mascotas/animales)</label>
            <textarea id="ocr-animal-obs" value={animalObservaciones} onChange={(e) => setAnimalObservaciones(e.target.value)}
              rows={2} maxLength={200}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
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
