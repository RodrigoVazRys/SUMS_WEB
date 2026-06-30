// ─── Page: EstadisticasDemografiaPage ─────────────────────────────────────────
// Análisis demográfico — 8 endpoints:
//  1. GET /estadisticas/demografia/piramide
//  2. GET /estadisticas/demografia/genero
//  3. GET /estadisticas/demografia/escolaridad
//  4. GET /estadisticas/demografia/alfabetizacion
//  5. GET /estadisticas/demografia/lengua-indigena
//  6. GET /estadisticas/demografia/ingreso
//  7. GET /estadisticas/demografia/ocupacion
//  8. GET /estadisticas/demografia/estado-civil

import { useEffect, useState, useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'
import { Users2, BookOpen, Globe, DollarSign, Briefcase, Heart, AlertCircle } from 'lucide-react'
import {
  getDemografiaPiramide,
  getDemografiaGenero,
  getDemografiaEscolaridad,
  getDemografiaAlfabetizacion,
  getDemografiaLenguaIndigena,
  getDemografiaIngreso,
  getDemografiaOcupacion,
  getDemografiaEstadoCivil,
} from '../services/api'
import type {
  PiramideItem,
  GeneroItem,
  EscolaridadItem,
  AlfabetizacionData,
  LenguaIndigenaItem,
  IngresoItem,
  OcupacionItem,
  EstadoCivilItem,
} from '../types/api.types'

const GREEN = '#006657'
const GOLD  = '#BC955C'
const CHART_COLORS = ['#006657', '#BC955C', '#2563eb', '#10b981', '#f59e0b', '#ef4444', '#7c3aed', '#0891b2', '#ec4899']

// ─── Reusable components ──────────────────────────────────────────────────────
function SectionCard({ icon: Icon, title, subtitle, children }: {
  icon: React.ElementType; title: string; subtitle?: string; children: React.ReactNode
}) {
  return (
    <section className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-50 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-[#006657]/10 flex items-center justify-center flex-shrink-0">
          <Icon size={16} className="text-[#006657]" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
          {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      <div className="p-5">{children}</div>
    </section>
  )
}

function ChartSkeleton({ height = 200 }: { height?: number }) {
  return (
    <div className="flex items-end gap-2" style={{ height }}>
      {[55, 80, 40, 90, 65, 75, 50, 85].map((pct, i) => (
        <div key={i} className="flex-1 skeleton rounded-t-md" style={{ height: `${pct}%` }} />
      ))}
    </div>
  )
}

function ErrorState({ msg = 'No se pudieron cargar los datos.' }: { msg?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-8 text-xs text-gray-400">
      <AlertCircle size={14} /><span>{msg}</span>
    </div>
  )
}

function HBar({ label, value, max, color = GREEN }: { label: string; value: number; max: number; color?: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0
  return (
    <div className="flex items-center gap-3">
      <span className="text-[11px] text-gray-600 w-36 shrink-0 truncate" title={label}>{label}</span>
      <div className="flex-1 h-5 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <span className="text-[11px] font-semibold text-gray-700 w-10 text-right tabular-nums">
        {value.toLocaleString('es-MX')}
      </span>
    </div>
  )
}

// ─── Pirámide demográfica (6 rangos de la API) ─────────────────────────────────
function PiramideChart({ data }: { data: PiramideItem[] }) {
  const AGE_RANGES = ['0-4', '5-14', '15-29', '30-44', '45-59', '60+']
  const pyramidData = useMemo(() => {
    const map: Record<string, { m: number; f: number }> = {}
    for (const r of AGE_RANGES) map[r] = { m: 0, f: 0 }
    for (const item of data) {
      if (!map[item.rango_edad]) map[item.rango_edad] = { m: 0, f: 0 }
      if (item.sexo === 'masculino') map[item.rango_edad].m += item.total
      else if (item.sexo === 'femenino') map[item.rango_edad].f += item.total
    }
    return AGE_RANGES.map(r => ({ rango: r, ...map[r] }))
  }, [data])

  const maxVal = Math.max(...pyramidData.flatMap(d => [d.m, d.f]), 1)

  return (
    <div className="space-y-1.5">
      <div className="flex items-center mb-3 gap-4 justify-center">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: GOLD }} />
          <span className="text-[11px] font-medium text-gray-600">Hombres</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: GREEN }} />
          <span className="text-[11px] font-medium text-gray-600">Mujeres</span>
        </div>
      </div>
      {[...pyramidData].reverse().map(({ rango, m, f }) => {
        const mPct = (m / maxVal) * 100
        const fPct = (f / maxVal) * 100
        return (
          <div key={rango} className="flex items-center group">
            <div className="flex-1 flex justify-end pr-1">
              <div
                className="h-6 rounded-l-sm transition-all duration-700 group-hover:opacity-80"
                style={{ width: `${mPct}%`, backgroundColor: GOLD }}
                title={`Hombres ${rango}: ${m}`}
              />
            </div>
            <div className="w-14 shrink-0 text-center text-[10px] text-gray-500 font-medium">{rango}</div>
            <div className="flex-1 flex justify-start pl-1">
              <div
                className="h-6 rounded-r-sm transition-all duration-700 group-hover:opacity-80"
                style={{ width: `${fPct}%`, backgroundColor: GREEN }}
                title={`Mujeres ${rango}: ${f}`}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export function EstadisticasDemografiaPage() {
  const [piramide,    setPiramide]    = useState<PiramideItem[]>([])
  const [genero,      setGenero]      = useState<GeneroItem[]>([])
  const [escolaridad, setEscolaridad] = useState<EscolaridadItem[]>([])
  const [alfabetiz,   setAlfabetiz]   = useState<AlfabetizacionData | null>(null)
  const [lengua,      setLengua]      = useState<LenguaIndigenaItem[]>([])
  const [ingreso,     setIngreso]     = useState<IngresoItem[]>([])
  const [ocupacion,   setOcupacion]   = useState<OcupacionItem[]>([])
  const [estadoCivil, setEstadoCivil] = useState<EstadoCivilItem[]>([])
  const [loading,     setLoading]     = useState(true)
  const [errors,      setErrors]      = useState<Record<string, boolean>>({})

  useEffect(() => {
    let cancelled = false
    async function fetchAll() {
      const results = await Promise.allSettled([
        getDemografiaPiramide(),
        getDemografiaGenero(),
        getDemografiaEscolaridad(),
        getDemografiaAlfabetizacion(),
        getDemografiaLenguaIndigena(),
        getDemografiaIngreso(),
        getDemografiaOcupacion(),
        getDemografiaEstadoCivil(),
      ])
      if (cancelled) return
      const errs: Record<string, boolean> = {}
      const [pir, gen, esc, alfa, len, ing, ocu, ec] = results
      if (pir.status  === 'fulfilled') { setPiramide(pir.value) }    else { errs.piramide = true }
      if (gen.status  === 'fulfilled') { setGenero(gen.value) }      else { errs.genero = true }
      if (esc.status  === 'fulfilled') { setEscolaridad(esc.value) } else { errs.escolaridad = true }
      if (alfa.status === 'fulfilled') { setAlfabetiz(alfa.value) }  else { errs.alfabetiz = true }
      if (len.status  === 'fulfilled') { setLengua(len.value) }      else { errs.lengua = true }
      if (ing.status  === 'fulfilled') { setIngreso(ing.value) }     else { errs.ingreso = true }
      if (ocu.status  === 'fulfilled') { setOcupacion(ocu.value) }   else { errs.ocupacion = true }
      if (ec.status   === 'fulfilled') { setEstadoCivil(ec.value) }  else { errs.estadoCivil = true }
      setErrors(errs)
      setLoading(false)
    }
    fetchAll()
    return () => { cancelled = true }
  }, [])

  const maxEsc = Math.max(...escolaridad.map(e => e.total), 1)
  const maxLeng = Math.max(...lengua.map(l => l.total), 1)
  const maxOcu = Math.max(...ocupacion.map(o => o.total), 1)

  const totalAlfabetiz = alfabetiz ? alfabetiz.alfabetizados + alfabetiz.no_alfabetizados + alfabetiz.sin_dato : 0

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Users2 size={22} className="text-[#006657]" />
          Estadísticas de Demografía
        </h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Distribución poblacional por edad, sexo, escolaridad, idioma, ingreso y estado civil.
        </p>
      </div>

      {/* ROW 1: Pirámide + Género */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <SectionCard icon={Users2} title="Pirámide Poblacional" subtitle="Distribución por rango de edad y sexo">
            {loading ? <ChartSkeleton height={260} /> : errors.piramide ? <ErrorState /> : (
              <PiramideChart data={piramide} />
            )}
          </SectionCard>
        </div>

        <div className="space-y-5">
          {/* Género */}
          <SectionCard icon={Users2} title="Distribución por Género" subtitle="Hombres y Mujeres">
            {loading ? <ChartSkeleton height={180} /> : errors.genero ? <ErrorState /> : (
              <>
                <ResponsiveContainer width="100%" height={170}>
                  <PieChart>
                    <Pie data={genero} dataKey="total" nameKey="sexo" cx="50%" cy="50%"
                      outerRadius={65} innerRadius={38} paddingAngle={4}>
                      {genero.map((_, i) => (
                        <Cell key={i} fill={i === 0 ? GOLD : GREEN} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => [(v as number).toLocaleString('es-MX'), 'Personas']}
                      contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} iconType="circle" iconSize={8} />
                  </PieChart>
                </ResponsiveContainer>
              </>
            )}
          </SectionCard>

          {/* Alfabetización */}
          <SectionCard icon={BookOpen} title="Alfabetización" subtitle="Indicador IMSS-BIENESTAR">
            {loading ? <div className="skeleton h-24 rounded-lg" /> : errors.alfabetiz ? <ErrorState /> : alfabetiz ? (
              <div className="space-y-2">
                {[
                  { label: 'Alfabetizados',    value: alfabetiz.alfabetizados,    color: '#10b981' },
                  { label: 'No alfabetizados', value: alfabetiz.no_alfabetizados, color: '#ef4444' },
                  { label: 'Sin dato',         value: alfabetiz.sin_dato,         color: '#9ca3af' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="flex items-center gap-3">
                    <span className="text-[11px] text-gray-600 w-28 shrink-0">{label}</span>
                    <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${totalAlfabetiz > 0 ? (value / totalAlfabetiz) * 100 : 0}%`, backgroundColor: color }} />
                    </div>
                    <span className="text-[11px] font-semibold w-8 text-right tabular-nums" style={{ color }}>
                      {value.toLocaleString('es-MX')}
                    </span>
                  </div>
                ))}
              </div>
            ) : null}
          </SectionCard>
        </div>
      </div>

      {/* ROW 2: Escolaridad + Lengua indígena */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <SectionCard icon={BookOpen} title="Nivel de Escolaridad" subtitle="Distribución por nivel educativo">
          {loading ? <ChartSkeleton height={240} /> : errors.escolaridad ? <ErrorState /> : (
            <div className="space-y-2.5">
              {escolaridad.map((e) => <HBar key={e.nombre} label={e.nombre} value={e.total} max={maxEsc} color={GREEN} />)}
              {escolaridad.length === 0 && <p className="text-xs text-gray-400 text-center py-4">Sin datos</p>}
            </div>
          )}
        </SectionCard>

        <SectionCard icon={Globe} title="Lengua Indígena" subtitle="Hablantes por lengua">
          {loading ? <ChartSkeleton height={240} /> : errors.lengua ? <ErrorState /> : (
            lengua.length > 0 ? (
              <div className="space-y-2.5">
                {lengua.map((l) => <HBar key={l.lengua} label={l.lengua} value={l.total} max={maxLeng} color={GOLD} />)}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center gap-2">
                <Globe size={28} className="text-gray-200" />
                <p className="text-xs text-gray-400">Sin hablantes de lengua indígena registrados.</p>
              </div>
            )
          )}
        </SectionCard>
      </div>

      {/* ROW 3: Ingreso + Estado Civil */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <SectionCard icon={DollarSign} title="Ingreso Salarial" subtitle="Distribución por rango de ingreso">
          {loading ? <ChartSkeleton height={200} /> : errors.ingreso ? <ErrorState /> : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={ingreso} layout="vertical" margin={{ left: 0, right: 16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <YAxis type="category" dataKey="rango" tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false} width={90} />
                <Tooltip formatter={(v) => [(v as number).toLocaleString('es-MX'), 'Personas']}
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }} />
                <Bar dataKey="total" fill={GREEN} radius={[0, 4, 4, 0]} maxBarSize={24}>
                  {ingreso.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </SectionCard>

        <SectionCard icon={Heart} title="Estado Civil" subtitle="Distribución por estado civil">
          {loading ? <ChartSkeleton height={200} /> : errors.estadoCivil ? <ErrorState /> : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={estadoCivil} dataKey="total" nameKey="nombre" cx="50%" cy="50%"
                  outerRadius={80} innerRadius={45} paddingAngle={3}>
                  {estadoCivil.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v) => [(v as number).toLocaleString('es-MX'), 'Personas']}
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }} />
                <Legend wrapperStyle={{ fontSize: 10 }} iconType="circle" iconSize={7} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </SectionCard>
      </div>

      {/* ROW 4: Ocupación */}
      <SectionCard icon={Briefcase} title="Ocupación" subtitle="Distribución por tipo de ocupación">
        {loading ? <ChartSkeleton height={200} /> : errors.ocupacion ? <ErrorState /> : (
          <div className="space-y-2.5">
            {ocupacion.map((o) => <HBar key={o.nombre} label={o.nombre} value={o.total} max={maxOcu} color="#7c3aed" />)}
            {ocupacion.length === 0 && <p className="text-xs text-gray-400 text-center py-4">Sin datos</p>}
          </div>
        )}
      </SectionCard>
    </div>
  )
}
