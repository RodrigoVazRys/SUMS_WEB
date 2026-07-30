// ─── Page: RiesgoPage ─────────────────────────────────────────────────────────
// Subcomponente B — Predicción de Riesgo Familiar (microservicio de minería).
// Formulario con todas las features de FamiliaFeatures + tarjeta de resultado
// con badge de nivel de riesgo. Debajo, lista priorizada de visitas domiciliarias
// (GET /riesgo/lista) renderizada dinámicamente a partir de las columnas presentes.

import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { ShieldAlert, Loader2, ListOrdered, RefreshCw, AlertCircle, HeartPulse, MapPinned, Users } from 'lucide-react'
import { Select } from '../components/atoms/Select'
import { Button } from '../components/atoms/Button'
import { Toast } from '../components/molecules/Toast'
import type { ToastVariant } from '../components/molecules/Toast'
import type { SelectOption } from '../components/atoms/Select'
import { predecirRiesgo, getListaVisitas, getCatalogosRiesgo, getRiesgoPorZona, getRiesgoDistribucion } from '../services/mineriaApi'
import type {
  FamiliaFeatures,
  CocinaUbicacion,
  RiesgoPrediccion,
  VisitaPrioritaria,
  NivelRiesgo,
  ResumenZona,
  DistribucionRiesgo,
} from '../types/mineria.types'

interface ToastState {
  message: string
  variant: ToastVariant
}

// ── Fallback de catálogos si GET /catalogos falla o no responde ───────────────
// IMPORTANTE: estos valores deben coincidir EXACTAMENTE con los que acepta el
// backend (Literal en integracion/api_mineria.py::FamiliaFeatures, tomados de
// subcomponente_B_ETL_Risk/src/catalogos_sums.py). Antes tenía categorías
// censales genéricas y plausibles ("Lámina de cartón", "Teja", "Palma o paja",
// etc.) que NO están en el catálogo real — si el usuario enviaba el formulario
// con el fallback activo (API caída), el backend respondía 422 porque el
// Literal las rechaza. Debe ser un subconjunto fiel del catálogo real, no una
// aproximación "razonable".
const FALLBACK_CATALOGOS = {
  materiales_techo:   ['Concreto o cemento', 'Madera', 'Lámina'],
  materiales_paredes: ['Concreto o cemento', 'Madera', 'Lámina'],
  materiales_piso:    ['Concreto o cemento', 'Madera', 'Tierra'],
  manejo_excretas:    ['WC', 'Letrina', 'Al ras de suelo'],
}

const DEFAULT_FEATURES: FamiliaFeatures = {
  numero_cuartos: 3,
  numero_habitantes: 4,
  personas_por_cuarto: 1.33,
  count_enfermedades_cronicas: 0,
  count_toxicomanias: 0,
  avg_dias_proteina: 4,
  avg_dias_frutas_verduras: 4,
  avg_dias_cereales: 7,
  ingreso_nivel: 2,
  escolaridad_promedio: 6,
  total_integrantes: 4,
  material_techo: '',
  material_paredes: '',
  material_piso: '',
  manejo_excretas: '',
  cocina_ubicacion: 'fuera_del_dormitorio',
  agua_entubada: true,
  energia_electrica: true,
  cocina_con_lena: false,
  red_alcantarillado: false,
  fosa_septica: true,
  vacunacion_completa: true,
  seguridad_social_jefe: false,
  tiene_embarazada: false,
  tiene_menor_1_anio: false,
  tiene_menor_5_sin_vacunas: false,
  tiene_adulto_mayor_solo: false,
  tiene_mascota_sin_vacunar: false,
}

type NumericKey =
  | 'numero_cuartos'
  | 'numero_habitantes'
  | 'personas_por_cuarto'
  | 'count_enfermedades_cronicas'
  | 'count_toxicomanias'
  | 'avg_dias_proteina'
  | 'avg_dias_frutas_verduras'
  | 'avg_dias_cereales'
  | 'ingreso_nivel'
  | 'escolaridad_promedio'
  | 'total_integrantes'

type BooleanKey =
  | 'agua_entubada'
  | 'energia_electrica'
  | 'cocina_con_lena'
  | 'red_alcantarillado'
  | 'fosa_septica'
  | 'vacunacion_completa'
  | 'seguridad_social_jefe'

type BanderaKey =
  | 'tiene_embarazada'
  | 'tiene_menor_1_anio'
  | 'tiene_menor_5_sin_vacunas'
  | 'tiene_adulto_mayor_solo'
  | 'tiene_mascota_sin_vacunar'

const NUMERIC_FIELDS: Array<{ key: NumericKey; label: string; min?: number; max?: number; step?: number }> = [
  { key: 'numero_cuartos',              label: 'Número de cuartos',                   min: 0, step: 1   },
  { key: 'numero_habitantes',           label: 'Número de habitantes',                min: 0, step: 1   },
  { key: 'personas_por_cuarto',         label: 'Personas por cuarto',                 min: 0, step: 0.1 },
  { key: 'total_integrantes',           label: 'Total de integrantes',                min: 0, step: 1   },
  { key: 'count_enfermedades_cronicas', label: 'Enfermedades crónicas (conteo)',      min: 0, step: 1   },
  { key: 'count_toxicomanias',          label: 'Toxicomanías (conteo)',               min: 0, step: 1   },
  { key: 'avg_dias_proteina',           label: 'Días/sem. con proteína (prom.)',      min: 0, max: 7, step: 0.1 },
  { key: 'avg_dias_frutas_verduras',    label: 'Días/sem. frutas y verduras (prom.)', min: 0, max: 7, step: 0.1 },
  { key: 'avg_dias_cereales',           label: 'Días/sem. cereales (prom.)',          min: 0, max: 7, step: 0.1 },
  { key: 'ingreso_nivel',               label: 'Nivel de ingreso',                    min: 0, step: 1   },
  { key: 'escolaridad_promedio',        label: 'Escolaridad promedio (años)',         min: 0, step: 0.5 },
]

const BOOLEAN_FIELDS: Array<{ key: BooleanKey; label: string }> = [
  { key: 'agua_entubada',         label: 'Agua entubada'                      },
  { key: 'energia_electrica',     label: 'Energía eléctrica'                  },
  { key: 'cocina_con_lena',       label: 'Cocina con leña'                    },
  { key: 'red_alcantarillado',    label: 'Red de alcantarillado'              },
  { key: 'fosa_septica',          label: 'Fosa séptica'                       },
  { key: 'vacunacion_completa',   label: 'Vacunación completa'                },
  { key: 'seguridad_social_jefe', label: 'Seguridad social (jefe de familia)' },
]

const BANDERA_FIELDS: Array<{ key: BanderaKey; label: string }> = [
  { key: 'tiene_embarazada',          label: 'Integrante embarazada'               },
  { key: 'tiene_menor_1_anio',        label: 'Bebé (menor de 1 año) en el hogar'   },
  { key: 'tiene_menor_5_sin_vacunas', label: 'Menor de 5 años sin vacunas'         },
  { key: 'tiene_adulto_mayor_solo',   label: 'Adulto(s) mayor(es) sin acompañante' },
  { key: 'tiene_mascota_sin_vacunar', label: 'Mascota en la vivienda sin vacunar'  },
]

const BOOLEAN_OPTIONS: SelectOption[] = [
  { value: 'true',  label: 'Sí' },
  { value: 'false', label: 'No' },
]

const COCINA_OPTIONS: SelectOption[] = [
  { value: 'fuera_del_dormitorio',  label: 'Fuera del dormitorio'  },
  { value: 'dentro_del_dormitorio', label: 'Dentro del dormitorio' },
]

const NIVEL_RIESGO_CONFIG: Record<NivelRiesgo, { badge: string; bar: string; ring: string }> = {
  ALTO:  { badge: 'bg-red-100 text-red-700 border border-red-200',      bar: '#dc2626', ring: 'border-red-200 bg-red-50/40'     },
  MEDIO: { badge: 'bg-amber-100 text-amber-700 border border-amber-200', bar: '#f59e0b', ring: 'border-amber-200 bg-amber-50/40' },
  BAJO:  { badge: 'bg-green-100 text-green-700 border border-green-200', bar: '#10b981', ring: 'border-green-200 bg-green-50/40' },
}

function toOptions(values: string[]): SelectOption[] {
  return values.length > 0
    ? values.map((v) => ({ value: v, label: v }))
    : [{ value: '', label: 'Sin opciones' }]
}

function formatColumnLabel(key: string): string {
  return key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

function formatCellValue(key: string, value: string | number | undefined): string {
  if (value === undefined || value === null || value === '') return '—'
  if (key === 'probabilidad_alto' && typeof value === 'number') return `${Math.round(value * 100)}%`
  if (typeof value === 'number') return value.toLocaleString('es-MX', { maximumFractionDigits: 2 })
  return String(value)
}

export function RiesgoPage() {
  // ── Form state ─────────────────────────────────────────────────────────────
  const [features, setFeatures] = useState<FamiliaFeatures>(DEFAULT_FEATURES)

  // ── Catálogos ───────────────────────────────────────────────────────────────
  const [techoOptions,    setTechoOptions]    = useState<SelectOption[]>(toOptions(FALLBACK_CATALOGOS.materiales_techo))
  const [paredesOptions,  setParedesOptions]  = useState<SelectOption[]>(toOptions(FALLBACK_CATALOGOS.materiales_paredes))
  const [pisoOptions,     setPisoOptions]     = useState<SelectOption[]>(toOptions(FALLBACK_CATALOGOS.materiales_piso))
  const [excretasOptions, setExcretasOptions] = useState<SelectOption[]>(toOptions(FALLBACK_CATALOGOS.manejo_excretas))

  // ── Predicción ───────────────────────────────────────────────────────────────
  const [isPredicting, setIsPredicting] = useState(false)
  const [resultado,    setResultado]    = useState<RiesgoPrediccion | null>(null)

  // ── Lista priorizada ───────────────────────────────────────────────────────
  const [visitas,        setVisitas]       = useState<VisitaPrioritaria[]>([])
  const [loadingVisitas, setLoadingVisitas] = useState(true)
  const [topN,           setTopN]          = useState(20)

  // ── Riesgo por zona (cúmulo geográfico) ───────────────────────────────────
  const [zonas,        setZonas]        = useState<ResumenZona[]>([])
  const [loadingZonas, setLoadingZonas] = useState(true)
  const [errorZonas,   setErrorZonas]   = useState(false)

  // ── Distribución poblacional de riesgo (BAJO/MEDIO/ALTO) ──────────────────
  const [distribucion,        setDistribucion]        = useState<DistribucionRiesgo | null>(null)
  const [loadingDistribucion, setLoadingDistribucion]  = useState(true)
  const [errorDistribucion,   setErrorDistribucion]    = useState(false)

  // ── Toast ────────────────────────────────────────────────────────────────────
  const [toast, setToast] = useState<ToastState | null>(null)

  function notify(message: string, variant: ToastVariant, autoCloseMs = 5000) {
    setToast({ message, variant })
    if (autoCloseMs > 0) setTimeout(() => setToast(null), autoCloseMs)
  }

  // ── Load catálogos on mount ───────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false
    async function fetchCatalogos() {
      try {
        const cat = await getCatalogosRiesgo()
        if (cancelled) return
        const techo    = toOptions(cat.materiales_techo?.length    ? cat.materiales_techo    : FALLBACK_CATALOGOS.materiales_techo)
        const paredes  = toOptions(cat.materiales_paredes?.length  ? cat.materiales_paredes  : FALLBACK_CATALOGOS.materiales_paredes)
        const piso     = toOptions(cat.materiales_piso?.length     ? cat.materiales_piso     : FALLBACK_CATALOGOS.materiales_piso)
        const excretas = toOptions(cat.manejo_excretas?.length     ? cat.manejo_excretas     : FALLBACK_CATALOGOS.manejo_excretas)
        setTechoOptions(techo)
        setParedesOptions(paredes)
        setPisoOptions(piso)
        setExcretasOptions(excretas)
        setFeatures((prev) => ({
          ...prev,
          material_techo:   prev.material_techo   || techo[0]?.value    || '',
          material_paredes: prev.material_paredes || paredes[0]?.value  || '',
          material_piso:    prev.material_piso    || piso[0]?.value     || '',
          manejo_excretas:  prev.manejo_excretas  || excretas[0]?.value || '',
        }))
      } catch {
        if (cancelled) return
        notify('No se pudieron cargar los catálogos del servidor. Se usan valores por defecto.', 'warning')
        setFeatures((prev) => ({
          ...prev,
          material_techo:   prev.material_techo   || FALLBACK_CATALOGOS.materiales_techo[0],
          material_paredes: prev.material_paredes || FALLBACK_CATALOGOS.materiales_paredes[0],
          material_piso:    prev.material_piso    || FALLBACK_CATALOGOS.materiales_piso[0],
          manejo_excretas:  prev.manejo_excretas  || FALLBACK_CATALOGOS.manejo_excretas[0],
        }))
      }
    }
    fetchCatalogos()
    return () => { cancelled = true }
  }, [])

  // ── Load lista priorizada de visitas ──────────────────────────────────────
  useEffect(() => {
    let cancelled = false
    async function fetchInitial() {
      setLoadingVisitas(true)
      try {
        const data = await getListaVisitas(20)
        if (!cancelled) setVisitas(data)
      } catch {
        if (!cancelled) {
          notify('No se pudo cargar la lista priorizada de visitas.', 'error')
          setVisitas([])
        }
      } finally {
        if (!cancelled) setLoadingVisitas(false)
      }
    }
    fetchInitial()
    return () => { cancelled = true }
  }, [])

  // ── Load riesgo por zona (cúmulo geográfico) ──────────────────────────────
  useEffect(() => {
    let cancelled = false
    async function fetchZonas() {
      setLoadingZonas(true)
      setErrorZonas(false)
      try {
        const data = await getRiesgoPorZona()
        if (!cancelled) setZonas(data)
      } catch {
        if (!cancelled) {
          notify('No se pudo cargar el riesgo por zona.', 'error')
          setZonas([])
          setErrorZonas(true)
        }
      } finally {
        if (!cancelled) setLoadingZonas(false)
      }
    }
    fetchZonas()
    return () => { cancelled = true }
  }, [])

  // ── Load distribución poblacional de riesgo ───────────────────────────────
  useEffect(() => {
    let cancelled = false
    async function fetchDistribucion() {
      setLoadingDistribucion(true)
      setErrorDistribucion(false)
      try {
        const data = await getRiesgoDistribucion()
        if (!cancelled) setDistribucion(data)
      } catch {
        if (!cancelled) {
          notify('No se pudo cargar la distribución de riesgo poblacional.', 'error')
          setDistribucion(null)
          setErrorDistribucion(true)
        }
      } finally {
        if (!cancelled) setLoadingDistribucion(false)
      }
    }
    fetchDistribucion()
    return () => { cancelled = true }
  }, [])

  async function handleRefreshVisitas() {
    setLoadingVisitas(true)
    try {
      const data = await getListaVisitas(topN)
      setVisitas(data)
    } catch {
      notify('No se pudo cargar la lista priorizada de visitas.', 'error')
    } finally {
      setLoadingVisitas(false)
    }
  }

  // ── Field updaters ────────────────────────────────────────────────────────
  function updateNumeric(key: NumericKey, raw: string) {
    const n = raw === '' ? 0 : Number(raw)
    setFeatures((prev) => ({ ...prev, [key]: Number.isNaN(n) ? 0 : n }))
  }

  function updateBoolean(key: BooleanKey, raw: string) {
    setFeatures((prev) => ({ ...prev, [key]: raw === 'true' }))
  }

  function updateBandera(key: BanderaKey, raw: string) {
    setFeatures((prev) => ({ ...prev, [key]: raw === 'true' }))
  }

  function updateCocinaUbicacion(raw: string) {
    setFeatures((prev) => ({ ...prev, cocina_ubicacion: raw as CocinaUbicacion }))
  }

  // ── Submit: POST /riesgo/predecir ─────────────────────────────────────────
  async function handlePredecir(e: FormEvent) {
    e.preventDefault()
    setIsPredicting(true)
    setResultado(null)
    try {
      const data = await predecirRiesgo(features)
      setResultado(data)
    } catch (err: unknown) {
      const axiosErr = err as { response?: { status?: number; data?: { detail?: string } } }
      const status = axiosErr.response?.status
      if (status === 422) {
        notify('Los datos enviados no son válidos. Revise los campos e intente nuevamente.', 'error')
      } else if (status !== undefined && status >= 500) {
        notify(axiosErr.response?.data?.detail || 'Error interno del servidor de minería. Intente más tarde.', 'error')
      } else {
        notify('No se pudo calcular la predicción de riesgo. Verifique la conexión con el microservicio.', 'error')
      }
    } finally {
      setIsPredicting(false)
    }
  }

  const visitaColumns = visitas.length > 0 ? Object.keys(visitas[0]).filter(k => k !== 'probabilidad_alto' && k !== 'score_total') : []

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <ShieldAlert size={22} className="text-[#006657]" />
          Predicción de Riesgo Familiar
        </h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Estime el nivel de riesgo de una familia y consulte la lista priorizada de visitas domiciliarias.
        </p>
      </div>

      {/* ── Distribución Poblacional de Riesgo ───────────────────────────────── */}
      <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#006657]/10 flex items-center justify-center flex-shrink-0">
              <Users size={16} className="text-[#006657]" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900">Distribución de Riesgo Poblacional</h3>
              <p className="text-xs text-gray-500 mt-0.5">Conteo de familias por nivel de riesgo, sobre toda la población evaluada.</p>
            </div>
          </div>
        </div>

        <div className="p-5">
          {loadingDistribucion ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => <div key={i} className="skeleton h-9 rounded-lg" />)}
            </div>
          ) : errorDistribucion || !distribucion ? (
            <div className="flex items-center justify-center gap-2 py-8 text-xs text-gray-400">
              <AlertCircle size={14} /><span>No se pudo cargar la distribución de riesgo.</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-center">
              {/* Tarjetas de conteo */}
              <div className="grid grid-cols-3 gap-3">
                {(['BAJO', 'MEDIO', 'ALTO'] as NivelRiesgo[]).map((nivel) => {
                  const count = distribucion.distribucion[nivel] ?? 0
                  const pct = distribucion.n_total > 0 ? Math.round((count / distribucion.n_total) * 100) : 0
                  return (
                    <div key={nivel} className={`rounded-xl border p-3 text-center ${NIVEL_RIESGO_CONFIG[nivel]?.ring ?? 'border-gray-200'}`}>
                      <p className="text-2xl font-bold" style={{ color: NIVEL_RIESGO_CONFIG[nivel]?.bar ?? '#6b7280' }}>
                        {count.toLocaleString('es-MX')}
                      </p>
                      <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mt-0.5">{nivel}</p>
                      <p className="text-[10px] text-gray-400">{pct}%</p>
                    </div>
                  )
                })}
                <div className="col-span-3 text-center pt-1">
                  <p className="text-[11px] text-gray-500">
                    <span className="font-semibold text-gray-700">{distribucion.n_total.toLocaleString('es-MX')}</span> familias evaluadas en total
                  </p>
                </div>
              </div>

              {/* Gráfica de barras */}
              <ResponsiveContainer width="100%" height={140}>
                <BarChart
                  data={(['BAJO', 'MEDIO', 'ALTO'] as NivelRiesgo[]).map((nivel) => ({
                    nivel,
                    total: distribucion.distribucion[nivel] ?? 0,
                  }))}
                  layout="vertical"
                  barCategoryGap="25%"
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false} allowDecimals={false} label={{ value: 'Cantidad de Familias', position: 'insideBottom', offset: -5, fontSize: 10, fill: '#9ca3af' }} />
                  <YAxis type="category" dataKey="nivel" width={50} tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false} label={{ value: 'Nivel', angle: -90, position: 'insideLeft', fontSize: 10, fill: '#9ca3af', style: { textAnchor: 'middle' } }} />
                  <Tooltip
                    contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
                    cursor={{ fill: '#f9fafb' }}
                    formatter={(value) => [(value as number).toLocaleString('es-MX'), 'Familias']}
                  />
                  <Bar dataKey="total" radius={[0, 4, 4, 0]} maxBarSize={26}>
                    {(['BAJO', 'MEDIO', 'ALTO'] as NivelRiesgo[]).map((nivel) => (
                      <Cell key={nivel} fill={NIVEL_RIESGO_CONFIG[nivel]?.bar ?? '#6b7280'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* ── Formulario ───────────────────────────────────────────────────── */}
        <form
          onSubmit={handlePredecir}
          className="xl:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
        >
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="text-sm font-bold text-gray-900">Datos de la Familia</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Todos los campos tienen un valor por defecto — ajuste solo los que necesite.
            </p>
          </div>

          <div className="p-5 space-y-5">
            {/* Numéricos */}
            <fieldset className="space-y-3">
              <legend className="text-[10px] font-bold text-primary uppercase tracking-widest mb-2 block">
                Vivienda y Composición Familiar
              </legend>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {NUMERIC_FIELDS.map((f) => (
                  <div key={f.key} className="space-y-1">
                    <label htmlFor={`riesgo-${f.key}`} className="text-xs font-semibold text-gray-600 uppercase tracking-wide block">
                      {f.label}
                    </label>
                    <input
                      id={`riesgo-${f.key}`}
                      type="number"
                      min={f.min}
                      max={f.max}
                      step={f.step ?? 1}
                      value={features[f.key]}
                      onChange={(e) => updateNumeric(f.key, e.target.value)}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all duration-200"
                    />
                  </div>
                ))}
              </div>
            </fieldset>

            {/* Materiales y servicios */}
            <fieldset className="space-y-3">
              <legend className="text-[10px] font-bold text-primary uppercase tracking-widest mb-2 block">
                Materiales y Servicios de la Vivienda
              </legend>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label htmlFor="riesgo-techo" className="text-xs font-semibold text-gray-600 uppercase tracking-wide block">Material del techo</label>
                  <Select
                    id="riesgo-techo"
                    options={techoOptions}
                    value={features.material_techo}
                    onChange={(e) => setFeatures((p) => ({ ...p, material_techo: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <label htmlFor="riesgo-paredes" className="text-xs font-semibold text-gray-600 uppercase tracking-wide block">Material de paredes</label>
                  <Select
                    id="riesgo-paredes"
                    options={paredesOptions}
                    value={features.material_paredes}
                    onChange={(e) => setFeatures((p) => ({ ...p, material_paredes: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <label htmlFor="riesgo-piso" className="text-xs font-semibold text-gray-600 uppercase tracking-wide block">Material del piso</label>
                  <Select
                    id="riesgo-piso"
                    options={pisoOptions}
                    value={features.material_piso}
                    onChange={(e) => setFeatures((p) => ({ ...p, material_piso: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <label htmlFor="riesgo-excretas" className="text-xs font-semibold text-gray-600 uppercase tracking-wide block">Manejo de excretas</label>
                  <Select
                    id="riesgo-excretas"
                    options={excretasOptions}
                    value={features.manejo_excretas}
                    onChange={(e) => setFeatures((p) => ({ ...p, manejo_excretas: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <label htmlFor="riesgo-cocina-ubicacion" className="text-xs font-semibold text-gray-600 uppercase tracking-wide block">Ubicación de la cocina</label>
                  <Select
                    id="riesgo-cocina-ubicacion"
                    options={COCINA_OPTIONS}
                    value={features.cocina_ubicacion}
                    onChange={(e) => updateCocinaUbicacion(e.target.value)}
                  />
                </div>
              </div>
            </fieldset>

            {/* Booleanos */}
            <fieldset className="space-y-3">
              <legend className="text-[10px] font-bold text-primary uppercase tracking-widest mb-2 block">
                Servicios y Condiciones (Sí/No)
              </legend>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {BOOLEAN_FIELDS.map((f) => (
                  <div key={f.key} className="space-y-1">
                    <label htmlFor={`riesgo-${f.key}`} className="text-xs font-semibold text-gray-600 uppercase tracking-wide block">
                      {f.label}
                    </label>
                    <Select
                      id={`riesgo-${f.key}`}
                      options={BOOLEAN_OPTIONS}
                      value={features[f.key] ? 'true' : 'false'}
                      onChange={(e) => updateBoolean(f.key, e.target.value)}
                    />
                  </div>
                ))}
              </div>
            </fieldset>

            {/* Grupos vulnerables — NO son features del modelo ML; se combinan
                con el nivel de riesgo para decidir prioridad_visita. Una familia
                con buena vivienda pero con una embarazada sin control prenatal
                sí necesita visita pronto, y el modelo (agregados) no lo ve solo. */}
            <fieldset className="space-y-3">
              <legend className="text-[10px] font-bold text-primary uppercase tracking-widest mb-2 flex items-center gap-1.5">
                <HeartPulse size={12} /> Grupos Vulnerables en el Hogar
              </legend>
              <div className="grid grid-cols-2 gap-3">
                {BANDERA_FIELDS.map((f) => (
                  <div key={f.key} className="space-y-1">
                    <label htmlFor={`riesgo-${f.key}`} className="text-xs font-semibold text-gray-600 uppercase tracking-wide block">
                      {f.label}
                    </label>
                    <Select
                      id={`riesgo-${f.key}`}
                      options={BOOLEAN_OPTIONS}
                      value={features[f.key] ? 'true' : 'false'}
                      onChange={(e) => updateBandera(f.key, e.target.value)}
                    />
                  </div>
                ))}
              </div>
            </fieldset>
          </div>

          <div className="px-5 py-3.5 border-t border-gray-100 bg-gray-50 flex justify-end">
            <Button
              type="submit"
              variant="primary"
              disabled={isPredicting}
              leftIcon={isPredicting ? <Loader2 size={15} className="animate-spin" /> : <ShieldAlert size={15} />}
            >
              {isPredicting ? 'Calculando...' : 'Predecir Riesgo'}
            </Button>
          </div>
        </form>

        {/* ── Resultado ───────────────────────────────────────────────────── */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 h-fit">
          <h3 className="text-sm font-bold text-gray-900 mb-3">Resultado de la Predicción</h3>
          {!resultado && !isPredicting && (
            <p className="text-xs text-gray-400 text-center py-10">
              Complete el formulario y presione "Predecir Riesgo" para ver el resultado.
            </p>
          )}
          {isPredicting && (
            <div className="flex items-center justify-center py-10">
              <Loader2 size={24} className="animate-spin text-[#006657]" />
            </div>
          )}
          {resultado && !isPredicting && (
            <div className={`rounded-xl border p-4 space-y-3 ${NIVEL_RIESGO_CONFIG[resultado.nivel_riesgo]?.ring ?? 'border-gray-200'}`}>
              {resultado.prioridad_visita === 'URGENTE' && (
                <div className="flex items-start gap-2 bg-red-600 text-white rounded-lg px-3 py-2 -mt-1">
                  <HeartPulse size={15} className="flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-extrabold uppercase tracking-wide">Visita urgente</p>
                    <p className="text-[11px] opacity-90 leading-snug">{resultado.motivo_prioridad}</p>
                  </div>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Nivel de riesgo</span>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${NIVEL_RIESGO_CONFIG[resultado.nivel_riesgo]?.badge ?? 'bg-gray-100 text-gray-600'}`}>
                  {resultado.nivel_riesgo}
                </span>
              </div>
              {resultado.prioridad_visita !== 'URGENTE' && (
                <p className="text-[11px] text-gray-500">{resultado.motivo_prioridad}</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Lista priorizada de visitas ──────────────────────────────────────── */}
      <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#006657]/10 flex items-center justify-center flex-shrink-0">
              <ListOrdered size={16} className="text-[#006657]" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900">Lista Priorizada de Visitas</h3>
              <p className="text-xs text-gray-500 mt-0.5">Familias con mayor prioridad de visita domiciliaria.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={1}
              max={200}
              value={topN}
              onChange={(e) => setTopN(Number(e.target.value) || 1)}
              className="w-20 px-2.5 py-1.5 border border-gray-300 rounded-lg text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <Button
              variant="secondary"
              size="sm"
              type="button"
              onClick={handleRefreshVisitas}
              disabled={loadingVisitas}
              leftIcon={<RefreshCw size={13} className={loadingVisitas ? 'animate-spin' : ''} />}
            >
              Actualizar
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          {loadingVisitas ? (
            <div className="p-5 space-y-2">
              {[1, 2, 3, 4].map((i) => <div key={i} className="skeleton h-9 rounded-lg" />)}
            </div>
          ) : visitas.length === 0 ? (
            <div className="flex items-center justify-center gap-2 py-8 text-xs text-gray-400">
              <AlertCircle size={14} /><span>No hay visitas priorizadas disponibles.</span>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {visitaColumns.map((col) => (
                    <th key={col} className="text-left px-4 py-2.5 text-[11px] font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                      {formatColumnLabel(col)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visitas.map((visita, i) => (
                  <tr key={i} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/60">
                    {visitaColumns.map((col) => (
                      <td key={col} className="px-4 py-2.5 text-gray-700 whitespace-nowrap">
                        {col === 'riesgo_predicho' && typeof visita[col] === 'string' ? (
                          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                            NIVEL_RIESGO_CONFIG[visita[col] as NivelRiesgo]?.badge ?? 'bg-gray-100 text-gray-600'
                          }`}>
                            {String(visita[col])}
                          </span>
                        ) : (
                          formatCellValue(col, visita[col])
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {/* ── Riesgo por Zona (cúmulo geográfico) ──────────────────────────────── */}
      <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#006657]/10 flex items-center justify-center flex-shrink-0">
              <MapPinned size={16} className="text-[#006657]" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900">Riesgo por Zona</h3>
              <p className="text-xs text-gray-500 mt-0.5">Concentración de riesgo agrupada por colonia, de mayor a menor.</p>
            </div>
          </div>
          <p className="text-[11px] text-gray-400 mt-2">
            Aproximado por colonia; no es un modelo de contagio persona-a-persona (no existe un campo
            de enfermedad transmisible en los datos hoy).
          </p>
        </div>

        <div className="overflow-x-auto">
          {loadingZonas ? (
            <div className="p-5 space-y-2">
              {[1, 2, 3, 4].map((i) => <div key={i} className="skeleton h-9 rounded-lg" />)}
            </div>
          ) : zonas.length === 0 ? (
            <div className="flex items-center justify-center gap-2 py-8 text-xs text-gray-400">
              <AlertCircle size={14} />
              <span>{errorZonas ? 'No se pudo cargar el riesgo por zona.' : 'No hay zonas disponibles.'}</span>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Zona</th>
                  <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Total Familias</th>
                  <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">% Alto/Bandera</th>
                  <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Nivel de Alerta</th>
                </tr>
              </thead>
              <tbody>
                {zonas.map((z, i) => (
                  <tr key={`${z.zona}-${i}`} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/60">
                    <td className="px-4 py-2.5 text-gray-700 whitespace-nowrap font-medium">{z.zona}</td>
                    <td className="px-4 py-2.5 text-gray-700 whitespace-nowrap">{z.total_familias.toLocaleString('es-MX')}</td>
                    <td className="px-4 py-2.5 text-gray-700 whitespace-nowrap">{Math.round(z.pct_alto_o_bandera * 100)}%</td>
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                        NIVEL_RIESGO_CONFIG[z.nivel_alerta_zona]?.badge ?? 'bg-gray-100 text-gray-600'
                      }`}>
                        {z.nivel_alerta_zona}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {/* Toast notification */}
      {toast && (
        <Toast message={toast.message} variant={toast.variant} onClose={() => setToast(null)} />
      )}
    </div>
  )
}
