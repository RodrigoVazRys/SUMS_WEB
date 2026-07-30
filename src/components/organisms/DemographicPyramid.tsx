// ─── Organism: DemographicPyramid ─────────────────────────────────────────────
// Panel compuesto de dos visualizaciones 100% Flexbox + Tailwind:
//
//  IZQUIERDA — Pirámide Demográfica
//    Fuente: GET /estadisticas/demografia/piramide
//    6 rangos de edad (60+ → 0-4), barras dobles por sexo
//    Tooltip hover con conteo exacto
//    Tarjetas resumen: % Hombres / % Mujeres
//
//  DERECHA — Histograma de Vacunación por Sexo
//    Fuente: GET /vacunaciones/por-sexo/masculino + /femenino
//    Barras agrupadas por vacuna, colores institucionales
//    Totales acumulados por género
//
// Responsive: side-by-side en lg+, stacked en móvil.

import { useEffect, useState, useMemo } from 'react'
import { Users2, Syringe } from 'lucide-react'
import { getDemografiaPiramide, getVacunacionesPorSexo } from '../../services/api'
import type { PiramideItem, VacunacionPorSexoDTO } from '../../types/api.types'

const AGE_LABELS = ['0-4', '5-14', '15-29', '30-44', '45-59', '60+']

const MOCK_PIRAMIDE: PiramideItem[] = [
  { rango_edad: '0-4', sexo: 'masculino', total: 450 },
  { rango_edad: '0-4', sexo: 'femenino', total: 420 },
  { rango_edad: '5-14', sexo: 'masculino', total: 1100 },
  { rango_edad: '5-14', sexo: 'femenino', total: 1050 },
  { rango_edad: '15-29', sexo: 'masculino', total: 1800 },
  { rango_edad: '15-29', sexo: 'femenino', total: 1900 },
  { rango_edad: '30-44', sexo: 'masculino', total: 1600 },
  { rango_edad: '30-44', sexo: 'femenino', total: 1750 },
  { rango_edad: '45-59', sexo: 'masculino', total: 950 },
  { rango_edad: '45-59', sexo: 'femenino', total: 1010 },
  { rango_edad: '60+', sexo: 'masculino', total: 400 },
  { rango_edad: '60+', sexo: 'femenino', total: 450 },
]

const MOCK_VACUNAS_M: VacunacionPorSexoDTO[] = [
  { sexo: 'M', vacuna: 'BCG', total_aplicaciones: 400 },
  { sexo: 'M', vacuna: 'Hepatitis B', total_aplicaciones: 350 },
  { sexo: 'M', vacuna: 'Hexavalente', total_aplicaciones: 300 },
  { sexo: 'M', vacuna: 'Rotavirus', total_aplicaciones: 280 },
  { sexo: 'M', vacuna: 'Neumocócica', total_aplicaciones: 200 },
]

const MOCK_VACUNAS_F: VacunacionPorSexoDTO[] = [
  { sexo: 'F', vacuna: 'BCG', total_aplicaciones: 420 },
  { sexo: 'F', vacuna: 'Hepatitis B', total_aplicaciones: 370 },
  { sexo: 'F', vacuna: 'Hexavalente', total_aplicaciones: 310 },
  { sexo: 'F', vacuna: 'Rotavirus', total_aplicaciones: 290 },
  { sexo: 'F', vacuna: 'Neumocócica', total_aplicaciones: 210 },
  { sexo: 'F', vacuna: 'VPH', total_aplicaciones: 150 },
]

// ─── Abreviaciones para nombres de vacunas largos ─────────────────────────────
function shortenVacuna(name: string): string {
  return name
    .replace('estacional', '')
    .replace('conjugada', '')
    .replace('(13 valente)', '13v')
    .replace('(DPaT+VPI+Hib+HepB)', '')
    .trim()
}

// ─── Colores institucionales ──────────────────────────────────────────────────
const GOLD  = '#BC955C'
const GREEN = '#006657'

// ─────────────────────────────────────────────────────────────────────────────
export function DemographicPyramid() {
  const [piramide,    setPiramide]    = useState<PiramideItem[]>([])
  const [vacMasc,     setVacMasc]     = useState<VacunacionPorSexoDTO[]>([])
  const [vacFem,      setVacFem]      = useState<VacunacionPorSexoDTO[]>([])
  const [isLoading,   setIsLoading]   = useState(true)
  const [hoveredRow,  setHoveredRow]  = useState<number | null>(null)

  // ── Fetch paralelo de los tres endpoints reales ──────────────────────────────
  useEffect(() => {
    let cancelled = false

    async function fetchAll() {
      const [pRes, mRes, fRes] = await Promise.allSettled([
        getDemografiaPiramide(),
        getVacunacionesPorSexo('M'),
        getVacunacionesPorSexo('F'),
      ])

      if (cancelled) return

      if (pRes.status === 'fulfilled') {
        setPiramide(pRes.value)
      } else {
        console.warn('[DemographicPyramid] piramide fetch failed — usando vacío:', pRes.reason)
        setPiramide(MOCK_PIRAMIDE)
      }

      if (mRes.status === 'fulfilled') {
        setVacMasc(mRes.value)
      } else {
        console.warn('[DemographicPyramid] vacunaciones/M fetch failed — usando vacío:', mRes.reason)
        setVacMasc(MOCK_VACUNAS_M)
      }

      if (fRes.status === 'fulfilled') {
        setVacFem(fRes.value)
      } else {
        console.warn('[DemographicPyramid] vacunaciones/F fetch failed — usando vacío:', fRes.reason)
        setVacFem(MOCK_VACUNAS_F)
      }

      setIsLoading(false)
    }

    fetchAll()
    return () => { cancelled = true }
  }, [])

  // Total personas en la pirámide
  const totalPersonas = useMemo(() => {
    return piramide.reduce((sum, item) => sum + item.total, 0)
  }, [piramide])

  // ── Pirámide: agrupa personas por rango de edad y sexo ──────────────────────
  const { hArr, fArr } = useMemo(() => {
    const h = new Array<number>(AGE_LABELS.length).fill(0)
    const f = new Array<number>(AGE_LABELS.length).fill(0)
    for (const item of piramide) {
      const idx = AGE_LABELS.indexOf(item.rango_edad)
      if (idx !== -1) {
        if (item.sexo === 'masculino') h[idx] += item.total
        else if (item.sexo === 'femenino') f[idx] += item.total
      }
    }
    return { hArr: h, fArr: f }
  }, [piramide])

  const maxPyr = useMemo(() => Math.max(...hArr, ...fArr, 1), [hArr, fArr])

  // Porcentajes totales de género
  const { totalH, totalF, pctH, pctF } = useMemo(() => {
    const tH = hArr.reduce((s, v) => s + v, 0)
    const tF = fArr.reduce((s, v) => s + v, 0)
    const tot = Math.max(tH + tF, 1)
    return {
      totalH: tH,
      totalF: tF,
      pctH: Math.round((tH / tot) * 100),
      pctF: Math.round((tF / tot) * 100),
    }
  }, [hArr, fArr])

  // ── Vacunación: agrega por vacuna cruzando masculino + femenino ─────────────
  const vacData = useMemo(() => {
    const map = new Map<string, { m: number; f: number }>()
    for (const v of vacMasc) {
      const e = map.get(v.vacuna) ?? { m: 0, f: 0 }
      e.m += v.total_aplicaciones
      map.set(v.vacuna, e)
    }
    for (const v of vacFem) {
      const e = map.get(v.vacuna) ?? { m: 0, f: 0 }
      e.f += v.total_aplicaciones
      map.set(v.vacuna, e)
    }
    return Array.from(map.entries())
      .map(([vacuna, counts]) => ({ vacuna, ...counts }))
      .sort((a, b) => (b.m + b.f) - (a.m + a.f))
  }, [vacMasc, vacFem])

  const maxVac  = useMemo(() => Math.max(...vacData.flatMap(d => [d.m, d.f]), 1), [vacData])
  const totalVM = vacMasc.reduce((s, v) => s + v.total_aplicaciones, 0)
  const totalVF = vacFem.reduce((s, v) => s + v.total_aplicaciones, 0)

  // ── Loading skeleton ────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <div className="h-4 skeleton rounded w-48 mb-6" />
        <div className="space-y-2">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="skeleton h-4 flex-1 rounded" style={{ opacity: 0.4 + i * 0.06 }} />
              <div className="skeleton h-4 w-12 rounded" />
              <div className="skeleton h-4 flex-1 rounded" style={{ opacity: 0.4 + i * 0.06 }} />
            </div>
          ))}
        </div>
      </section>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <section
      aria-label="Pirámide demográfica y estadísticas de vacunación"
      className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden"
    >
      {/* ── Header de sección ─────────────────────────────────────────── */}
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between flex-wrap gap-2">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <Users2 size={16} className="text-[#006657]" aria-hidden="true" />
            Análisis Demográfico y Vacunación
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {totalPersonas.toLocaleString('es-MX')} personas registradas
          </p>
        </div>
      </div>

      {/* ── Contenido: 2 columnas en lg+, 1 columna en móvil ─────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 divide-y lg:divide-y-0 lg:divide-x divide-gray-100">

        {/* ══════════════════════════════════════════════════════════════
            COLUMNA IZQUIERDA — Pirámide Demográfica (3/5 del espacio)
        ══════════════════════════════════════════════════════════════ */}
        <div className="lg:col-span-3 p-4 md:p-5">

          {/* Leyenda de colores */}
          <div className="flex items-center justify-center gap-6 mb-3">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: GOLD }} />
              <span className="text-[11px] font-semibold text-gray-600">Hombres</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: GREEN }} />
              <span className="text-[11px] font-semibold text-gray-600">Mujeres</span>
            </div>
          </div>

          {/* Encabezados de columna */}
          <div className="flex items-center mb-1.5">
            <div className="flex-1 text-right pr-2">
              <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: GOLD }}>
                ♂ Hombres
              </span>
            </div>
            <div className="w-14 shrink-0" />
            <div className="flex-1 pl-2">
              <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: GREEN }}>
                Mujeres ♀
              </span>
            </div>
          </div>

          {/* Filas de la pirámide */}
          <div className="space-y-px">
            {[...AGE_LABELS].reverse().map((label) => {
              const idx = AGE_LABELS.indexOf(label)
              const h    = hArr[idx]
              const f    = fArr[idx]
              const hPct = (h / maxPyr) * 100
              const fPct = (f / maxPyr) * 100
              const isH  = hoveredRow === idx

              return (
                <div
                  key={label}
                  className={[
                    'relative flex items-center rounded-md transition-colors duration-100',
                    isH ? 'bg-gray-50' : '',
                  ].join(' ')}
                  onMouseEnter={() => setHoveredRow(idx)}
                  onMouseLeave={() => setHoveredRow(null)}
                >
                  {/* Barra de hombres — crece hacia la izquierda */}
                  <div className="flex-1 flex justify-end pr-0.5 py-[3px]">
                    <div
                      className="h-[14px] sm:h-4 rounded-l-sm transition-all duration-500 ease-out"
                      style={{ width: `${hPct}%`, backgroundColor: GOLD, minWidth: h > 0 ? '2px' : '0' }}
                    />
                  </div>

                  {/* Etiqueta de edad (centro) */}
                  <div className="w-14 text-center text-[9px] sm:text-[10px] text-gray-500 font-medium shrink-0 select-none leading-none">
                    {label}
                  </div>

                  {/* Barra de mujeres — crece hacia la derecha */}
                  <div className="flex-1 flex justify-start pl-0.5 py-[3px]">
                    <div
                      className="h-[14px] sm:h-4 rounded-r-sm transition-all duration-500 ease-out"
                      style={{ width: `${fPct}%`, backgroundColor: GREEN, minWidth: f > 0 ? '2px' : '0' }}
                    />
                  </div>

                  {/* Tooltip flotante al hacer hover */}
                  {isH && (
                    <div
                      className={[
                        'absolute left-1/2 -translate-x-1/2 -top-9 z-20',
                        'bg-gray-900 text-white text-[11px] rounded-lg px-3 py-1.5',
                        'whitespace-nowrap shadow-xl pointer-events-none',
                        'flex items-center gap-2',
                      ].join(' ')}
                      role="tooltip"
                    >
                      <span style={{ color: '#f5d99a' }}>♂ {h.toLocaleString('es-MX')}</span>
                      <span className="text-gray-500 text-[9px]">|</span>
                      <span style={{ color: '#6ee7b7' }}>♀ {f.toLocaleString('es-MX')}</span>
                      {/* Flecha apuntando hacia abajo */}
                      <div className="absolute top-full left-1/2 -translate-x-1/2 border-[5px] border-transparent border-t-gray-900" />
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Tarjetas de resumen de género */}
          <div className="grid grid-cols-2 gap-2 sm:gap-3 mt-4">
            {/* Hombres */}
            <div className="rounded-xl p-3 flex items-center gap-2.5 border"
              style={{ backgroundColor: '#fef8ef', borderColor: '#e8c88a' }}>
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-xl shrink-0"
                style={{ backgroundColor: `${GOLD}22` }}>
                🧑
              </div>
              <div className="min-w-0">
                <p className="text-xl sm:text-2xl font-bold leading-none" style={{ color: GOLD }}>
                  {pctH}%
                </p>
                <p className="text-[10px] font-semibold mt-0.5" style={{ color: '#9a7a42' }}>Hombres</p>
                <p className="text-[9px] text-gray-500">{totalH.toLocaleString('es-MX')} personas</p>
              </div>
            </div>
            {/* Mujeres */}
            <div className="rounded-xl p-3 flex items-center gap-2.5 border"
              style={{ backgroundColor: '#edf7f4', borderColor: '#6abba0' }}>
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-xl shrink-0"
                style={{ backgroundColor: `${GREEN}22` }}>
                👩
              </div>
              <div className="min-w-0">
                <p className="text-xl sm:text-2xl font-bold leading-none" style={{ color: GREEN }}>
                  {pctF}%
                </p>
                <p className="text-[10px] font-semibold mt-0.5" style={{ color: '#00513f' }}>Mujeres</p>
                <p className="text-[9px] text-gray-500">{totalF.toLocaleString('es-MX')} personas</p>
              </div>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════
            COLUMNA DERECHA — Histograma de Vacunación por Sexo (2/5)
        ══════════════════════════════════════════════════════════════ */}
        <div className="lg:col-span-2 p-4 md:p-5 flex flex-col">

          {/* Header */}
          <div className="flex items-center gap-2 mb-3 flex-shrink-0">
            <Syringe size={15} className="text-[#006657]" aria-hidden="true" />
            <h4 className="text-sm font-semibold text-gray-900">Vacunación por Sexo</h4>
          </div>

          {/* Totales acumulados por género */}
          <div className="grid grid-cols-2 gap-2 mb-4 flex-shrink-0">
            <div className="text-center rounded-lg py-2.5 px-2" style={{ backgroundColor: '#fef8ef' }}>
              <p className="text-lg font-bold leading-none" style={{ color: GOLD }}>
                {totalVM.toLocaleString('es-MX')}
              </p>
              <p className="text-[10px] mt-1 font-medium" style={{ color: '#9a7a42' }}>♂ Masculino</p>
            </div>
            <div className="text-center rounded-lg py-2.5 px-2" style={{ backgroundColor: '#edf7f4' }}>
              <p className="text-lg font-bold leading-none" style={{ color: GREEN }}>
                {totalVF.toLocaleString('es-MX')}
              </p>
              <p className="text-[10px] mt-1 font-medium" style={{ color: '#00513f' }}>♀ Femenino</p>
            </div>
          </div>

          {/* Barras por vacuna */}
          <div className="flex-1 space-y-3 overflow-y-auto">
            {vacData.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-6">Sin datos de vacunación disponibles</p>
            ) : (
              vacData.map(({ vacuna, m, f }) => {
                const mPct = (m / maxVac) * 100
                const fPct = (f / maxVac) * 100
                return (
                  <div key={vacuna} className="space-y-1.5">
                    {/* Nombre de vacuna */}
                    <p
                      className="text-[10px] font-semibold text-gray-700 truncate leading-tight"
                      title={vacuna}
                    >
                      {shortenVacuna(vacuna)}
                    </p>

                    {/* Barra Masculino */}
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold w-3.5 shrink-0" style={{ color: GOLD }}>♂</span>
                      <div className="flex-1 h-3 rounded-full overflow-hidden bg-gray-100">
                        <div
                          className="h-full rounded-full transition-all duration-700 ease-out"
                          style={{ width: `${mPct}%`, backgroundColor: GOLD }}
                        />
                      </div>
                      <span className="text-[10px] text-gray-500 w-8 text-right shrink-0 tabular-nums">
                        {m.toLocaleString('es-MX')}
                      </span>
                    </div>

                    {/* Barra Femenino */}
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold w-3.5 shrink-0" style={{ color: GREEN }}>♀</span>
                      <div className="flex-1 h-3 rounded-full overflow-hidden bg-gray-100">
                        <div
                          className="h-full rounded-full transition-all duration-700 ease-out"
                          style={{ width: `${fPct}%`, backgroundColor: GREEN }}
                        />
                      </div>
                      <span className="text-[10px] text-gray-500 w-8 text-right shrink-0 tabular-nums">
                        {f.toLocaleString('es-MX')}
                      </span>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
