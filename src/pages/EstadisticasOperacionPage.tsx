// ─── Page: EstadisticasOperacionPage ──────────────────────────────────────────
// Dashboard de Operación / Productividad — 8 endpoints:
//  1. GET /estadisticas/resumen-general
//  2. GET /estadisticas/productividad/entrevistadores
//  3. GET /estadisticas/cedulas/serie?agrupar=mes
//  4. GET /estadisticas/cedulas/por-estado
//  5. GET /estadisticas/cedulas/por-unidad
//  6. GET /estadisticas/cedulas/por-localidad
//  7. GET /estadisticas/cedulas/por-colonia
//  8. GET /estadisticas/cedulas/nucleos-tamano

import { useEffect, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
  AreaChart, Area,
} from 'recharts'
import {
  Activity, Users, TrendingUp, MapPin, Building2,
  Map, Home, AlertCircle,
} from 'lucide-react'
import { renderPercentLegend } from '../utils/chartHelpers'
import {
  getProductividadEntrevistadores,
  getCedulasSerie,
  getCedulasPorEstado,
  getCedulasPorUnidad,
  getCedulasPorLocalidad,
  getCedulasPorColonia,
  getNucleosTamano,
} from '../services/api'
import type {
  ProductividadEntrevistador,
  CedulaSerieItem,
  CedulaEstadoItem,
  CedulaPorUnidadItem,
  CedulaPorLocalidadItem,
  CedulaPorColoniaItem,
  NucleoTamanoItem,
} from '../types/api.types'

// ─── Colors ───────────────────────────────────────────────────────────────────
const GREEN = '#006657'
const GOLD  = '#BC955C'
const ESTADO_COLORS: Record<string, string> = {
  borrador:      '#f59e0b',
  sincronizada:  '#3b82f6',
  validada:      '#10b981',
  cerrada:       '#6b7280',
}
const CHART_COLORS = ['#006657', '#BC955C', '#2563eb', '#10b981', '#f59e0b', '#ef4444', '#7c3aed', '#0891b2']

// ─── Reusable Section Card ─────────────────────────────────────────────────────
function SectionCard({
  icon: Icon,
  title,
  subtitle,
  children,
}: {
  icon: React.ElementType
  title: string
  subtitle?: string
  children: React.ReactNode
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

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function ChartSkeleton({ height = 200 }: { height?: number }) {
  return (
    <div className="flex items-end gap-2" style={{ height }}>
      {[50, 70, 45, 85, 60, 75, 55, 90].map((pct, i) => (
        <div key={i} className="flex-1 skeleton rounded-t-md" style={{ height: `${pct}%` }} />
      ))}
    </div>
  )
}

function ErrorState({ message = 'No se pudieron cargar los datos.' }: { message?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-8 text-xs text-gray-400">
      <AlertCircle size={14} />
      <span>{message}</span>
    </div>
  )
}

// ─── Horizontal Bar (top-N) ───────────────────────────────────────────────────
function HBar({ label, value, max, color = GREEN }: { label: string; value: number; max: number; color?: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0
  return (
    <div className="flex items-center gap-3">
      <span className="text-[11px] text-gray-600 w-32 shrink-0 truncate" title={label}>{label}</span>
      <div className="flex-1 h-5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-[11px] font-semibold text-gray-700 w-10 text-right tabular-nums">
        {value.toLocaleString('es-MX')}
      </span>
    </div>
  )
}

// ─── Page Component ────────────────────────────────────────────────────────────
export function EstadisticasOperacionPage() {
  const [productividad, setProductividad] = useState<ProductividadEntrevistador[]>([])
  const [serie,         setSerie]         = useState<CedulaSerieItem[]>([])
  const [porEstado,     setPorEstado]     = useState<CedulaEstadoItem[]>([])
  const [porUnidad,     setPorUnidad]     = useState<CedulaPorUnidadItem[]>([])
  const [porLocalidad,  setPorLocalidad]  = useState<CedulaPorLocalidadItem[]>([])
  const [porColonia,    setPorColonia]    = useState<CedulaPorColoniaItem[]>([])
  const [nucleosTamano, setNucleosTamano] = useState<NucleoTamanoItem[]>([])
  const [loading,       setLoading]       = useState(true)
  const [errors,        setErrors]        = useState<Record<string, boolean>>({})

  useEffect(() => {
    let cancelled = false
    async function fetchAll() {
      const [prodRes, serieRes, estadoRes, unidadRes, localidadRes, coloniaRes, nucleoRes] =
        await Promise.allSettled([
          getProductividadEntrevistadores(),
          getCedulasSerie('mes'),
          getCedulasPorEstado(),
          getCedulasPorUnidad(),
          getCedulasPorLocalidad(),
          getCedulasPorColonia(),
          getNucleosTamano(),
        ])
      if (cancelled) return
      const errs: Record<string, boolean> = {}
      if (prodRes.status      === 'fulfilled') { setProductividad(prodRes.value) }    else { errs.productividad = true }
      if (serieRes.status     === 'fulfilled') { setSerie(serieRes.value) }           else { errs.serie = true }
      if (estadoRes.status    === 'fulfilled') { setPorEstado(estadoRes.value) }      else { errs.estado = true }
      if (unidadRes.status    === 'fulfilled') { setPorUnidad(unidadRes.value) }      else { errs.unidad = true }
      if (localidadRes.status === 'fulfilled') { setPorLocalidad(localidadRes.value) } else { errs.localidad = true }
      if (coloniaRes.status   === 'fulfilled') { setPorColonia(coloniaRes.value) }    else { errs.colonia = true }
      if (nucleoRes.status    === 'fulfilled') { setNucleosTamano(nucleoRes.value) }  else { errs.nucleo = true }
      setErrors(errs)
      setLoading(false)
    }
    fetchAll()
    return () => { cancelled = true }
  }, [])

  const maxUnidad    = Math.max(...porUnidad.map(u => u.total), 1)
  const maxLocalidad = Math.max(...porLocalidad.map(l => l.total), 1)
  const maxColonia   = Math.max(...porColonia.map(c => c.total), 1)
  const totalCedulas = porEstado.reduce((s, e) => s + e.total, 0)

  return (
    <div className="space-y-5 animate-fade-in">
      {/* ── Page Header ──────────────────────────────────────────────────── */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Activity size={22} className="text-[#006657]" />
          Estadísticas de Operación
        </h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Productividad del levantamiento, tendencias y distribución de cédulas.
        </p>
      </div>

      {/* ── ROW 1: Serie temporal + Embudo por estado ─────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Serie temporal (2/3) */}
        <div className="lg:col-span-2">
          <SectionCard icon={TrendingUp} title="Tendencia de Cédulas por Mes" subtitle="Evolución mensual de registros">
            {loading ? <ChartSkeleton height={220} /> : errors.serie ? <ErrorState /> : (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={serie} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradSerie" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={GREEN} stopOpacity={0.25} />
                      <stop offset="95%" stopColor={GREEN} stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis dataKey="periodo" tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    formatter={(v) => [(v as number).toLocaleString('es-MX'), 'Cédulas']}
                    contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
                  />
                  <Area type="monotone" dataKey="total" stroke={GREEN} strokeWidth={2.5} fill="url(#gradSerie)"
                    dot={{ r: 3, fill: GREEN, strokeWidth: 0 }} activeDot={{ r: 5, fill: GREEN }} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </SectionCard>
        </div>

        {/* Embudo por estado (1/3) */}
        <SectionCard icon={Activity} title="Por Estado" subtitle={`${totalCedulas.toLocaleString('es-MX')} cédulas totales`}>
          {loading ? <ChartSkeleton height={220} /> : errors.estado ? <ErrorState /> : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={porEstado}
                  dataKey="total"
                  nameKey="estado"
                  cx="50%"
                  cy="45%"
                  outerRadius={75}
                  innerRadius={42}
                  paddingAngle={3}
                >
                  {porEstado.map((entry) => (
                    <Cell key={entry.estado} fill={ESTADO_COLORS[entry.estado] ?? '#9ca3af'} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v) => [(v as number).toLocaleString('es-MX'), 'Cédulas']}
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
                />
                <Legend content={renderPercentLegend} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </SectionCard>
      </div>

      {/* ── ROW 2: Por Unidad + Por Localidad ────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <SectionCard icon={Building2} title="Por Unidad de Salud" subtitle="Top 10 unidades con más registros">
          {loading ? <ChartSkeleton height={240} /> : errors.unidad ? <ErrorState /> : (
            <div className="space-y-2.5">
              {porUnidad.slice(0, 10).map((u) => (
                <HBar key={u.id_unidad_salud} label={u.nombre} value={u.total} max={maxUnidad} color={GREEN} />
              ))}
              {porUnidad.length === 0 && <p className="text-xs text-gray-400 text-center py-4">Sin datos</p>}
            </div>
          )}
        </SectionCard>

        <SectionCard icon={MapPin} title="Por Localidad" subtitle="Top 10 localidades con más registros">
          {loading ? <ChartSkeleton height={240} /> : errors.localidad ? <ErrorState /> : (
            <div className="space-y-2.5">
              {porLocalidad.slice(0, 10).map((l) => (
                <HBar key={l.localidad} label={l.localidad} value={l.total} max={maxLocalidad} color={GOLD} />
              ))}
              {porLocalidad.length === 0 && <p className="text-xs text-gray-400 text-center py-4">Sin datos</p>}
            </div>
          )}
        </SectionCard>
      </div>

      {/* ── ROW 3: Por Colonia + Tamaño de Núcleo ─────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <SectionCard icon={Map} title="Por Colonia" subtitle="Top 10 colonias con más registros">
          {loading ? <ChartSkeleton height={240} /> : errors.colonia ? <ErrorState /> : (
            <div className="space-y-2.5">
              {porColonia.slice(0, 10).map((c) => (
                <HBar key={c.colonia} label={c.colonia} value={c.total} max={maxColonia} color="#2563eb" />
              ))}
              {porColonia.length === 0 && <p className="text-xs text-gray-400 text-center py-4">Sin datos</p>}
            </div>
          )}
        </SectionCard>

        <SectionCard icon={Home} title="Tamaño de Núcleo Familiar" subtitle="Distribución por número de integrantes">
          {loading ? <ChartSkeleton height={240} /> : errors.nucleo ? <ErrorState /> : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={nucleosTamano} barCategoryGap="20%">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="tamano" tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false}
                  label={{ value: 'Integrantes', position: 'insideBottom', offset: -2, fontSize: 10, fill: '#9ca3af' }} />
                <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip
                  formatter={(v) => [(v as number).toLocaleString('es-MX'), 'Núcleos']}
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
                />
                <Bar dataKey="total" fill={GREEN} radius={[4, 4, 0, 0]} maxBarSize={40}>
                  {nucleosTamano.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </SectionCard>
      </div>

      {/* ── ROW 4: Ranking de Productividad ──────────────────────────── */}
      <SectionCard icon={Users} title="Productividad por Entrevistador" subtitle="Cédulas registradas por entrevistador desde su alta">
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex gap-3 items-center">
                <div className="skeleton h-8 w-8 rounded-full" />
                <div className="skeleton h-4 flex-1 rounded" />
                <div className="skeleton h-4 w-16 rounded" />
              </div>
            ))}
          </div>
        ) : errors.productividad ? <ErrorState /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left pb-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">#</th>
                  <th className="text-left pb-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">Entrevistador</th>
                  <th className="text-right pb-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">Hoy</th>
                  <th className="text-right pb-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">Semana</th>
                  <th className="text-right pb-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">Mes</th>
                  <th className="text-right pb-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">Total</th>
                  <th className="text-right pb-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">Última act.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {productividad
                  .sort((a, b) => b.total - a.total)
                  .map((e, i) => (
                  <tr key={e.id_entrevistador} className="hover:bg-gray-50 transition-colors">
                    <td className="py-2.5 pr-3">
                      {i < 3 ? (
                        <span className={[
                          'inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold',
                          i === 0 ? 'bg-yellow-100 text-yellow-700' :
                          i === 1 ? 'bg-gray-100 text-gray-600' :
                          'bg-orange-100 text-orange-600',
                        ].join(' ')}>{i + 1}</span>
                      ) : (
                        <span className="text-xs text-gray-400 pl-1">{i + 1}</span>
                      )}
                    </td>
                    <td className="py-2.5 text-sm font-medium text-gray-800">{e.nombre}</td>
                    <td className="py-2.5 text-right text-xs tabular-nums text-gray-600">{e.hoy}</td>
                    <td className="py-2.5 text-right text-xs tabular-nums text-gray-600">{e.semana}</td>
                    <td className="py-2.5 text-right text-xs tabular-nums text-gray-600">{e.mes}</td>
                    <td className="py-2.5 text-right text-xs tabular-nums font-semibold text-[#006657]">
                      {e.total.toLocaleString('es-MX')}
                    </td>
                    <td className="py-2.5 text-right text-xs text-gray-400">
                      {e.ultima_actividad ? new Date(e.ultima_actividad).toLocaleDateString('es-MX') : '—'}
                    </td>
                  </tr>
                ))}
                {productividad.length === 0 && (
                  <tr><td colSpan={7} className="py-8 text-center text-xs text-gray-400">Sin datos de productividad.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </div>
  )
}
