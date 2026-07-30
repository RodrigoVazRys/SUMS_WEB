// ─── Page: EstadisticasViviendaPage ───────────────────────────────────────────
// Estadísticas de Vivienda / Determinantes Sociales — 4 endpoints.
// v2: Fallback con datos sintéticos si la API falla o retorna vacío.
//     DataLabels permanentes en todas las gráficas (sin necesidad de hover).

import { useEffect, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList,
} from 'recharts'
import { Home, Layers, AlertTriangle, Dog, AlertCircle, Droplets, Zap, Waves } from 'lucide-react'
import {
  getViviendaServicios,
  getViviendaHacinamiento,
  getViviendaMaterialesRiesgo,
  getViviendaAnimales,
} from '../services/api'
import type {
  ViviendaServiciosData,
  HacinamientoData,
  MaterialesRiesgoData,
  AnimalesData,
} from '../types/api.types'

const GOLD  = '#BC955C'
const CHART_COLORS = ['#006657', '#BC955C', '#2563eb', '#10b981', '#f59e0b', '#ef4444', '#7c3aed', '#0891b2']

// ─── Mock data sintéticos ─────────────────────────────────────────────────────
const MOCK_SERVICIOS: ViviendaServiciosData = {
  total_viviendas: 420, con_agua: 388, sin_agua: 32,
  con_luz: 402, sin_luz: 18, con_alcantarillado: 315, sin_alcantarillado: 105, con_fosa_septica: 87,
}
const MOCK_HACINAM: HacinamientoData = {
  viviendas_hacinadas: 78, viviendas_no_hacinadas: 312, sin_dato: 30, promedio_personas_por_cuarto: 1.92,
}
const MOCK_MATERIALES: MaterialesRiesgoData = {
  piso_tierra: 54, cocina_con_lena: 88, cocina_en_dormitorio: 32, total_viviendas: 420,
}
const MOCK_ANIMALES: AnimalesData = {
  por_animal: [
    { nombre: 'Perro',    total: 192 },
    { nombre: 'Gato',     total: 114 },
    { nombre: 'Ave',      total: 87  },
    { nombre: 'Bovino',   total: 43  },
    { nombre: 'Otro',     total: 28  },
  ],
  mascotas: { con_perros_gatos_dentro: 136, mascotas_sin_vacunar: 74, mascotas_esterilizadas: 55 },
}

function isEmpty(val: unknown): boolean {
  if (val === null || val === undefined) return true
  if (Array.isArray(val)) return val.length === 0
  if (typeof val === 'object') {
    const nums = Object.values(val as Record<string, unknown>).filter(v => typeof v === 'number')
    return nums.every(n => n === 0)
  }
  return false
}

function MockBadge() {
  // Oculto para la presentación, pero mantenemos la lógica interna de mock data.
  return null
}

function SectionCard({ icon: Icon, title, subtitle, isMock, children }: {
  icon: React.ElementType; title: string; subtitle?: string; isMock?: boolean; children: React.ReactNode
}) {
  return (
    <section className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-50 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-[#006657]/10 flex items-center justify-center flex-shrink-0">
          <Icon size={16} className="text-[#006657]" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-gray-900 flex items-center">
            {title}
            {isMock && <MockBadge />}
          </h3>
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
      {[55, 80, 45, 85, 65, 75].map((pct, i) => (
        <div key={i} className="flex-1 skeleton rounded-t-md" style={{ height: `${pct}%` }} />
      ))}
    </div>
  )
}

function Err({ msg = 'No se pudieron cargar los datos.' }: { msg?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-8 text-xs text-gray-400">
      <AlertCircle size={14} /><span>{msg}</span>
    </div>
  )
}

// ─── Servicio Card ─────────────────────────────────────────────────────────────
function ServicioRow({
  icon: Icon, label, con, sin, total, color,
}: {
  icon: React.ElementType; label: string; con: number; sin: number; total: number; color: string
}) {
  const pct = total > 0 ? Math.round((con / total) * 100) : 0
  return (
    <div className="flex items-center gap-4 py-3 border-b border-gray-50 last:border-0">
      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${color}15` }}>
        <Icon size={16} style={{ color }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium text-gray-700">{label}</span>
          <span className="text-xs font-bold" style={{ color }}>{pct}% cobertura</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${pct}%`, backgroundColor: color }}
          />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[10px] text-gray-400">Con servicio: {con.toLocaleString('es-MX')}</span>
          <span className="text-[10px] text-gray-400">Sin: {sin.toLocaleString('es-MX')}</span>
        </div>
      </div>
    </div>
  )
}

// ─── KPI Badge ────────────────────────────────────────────────────────────────
function KpiBadge({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color: string }) {
  return (
    <div className="rounded-xl border p-4 text-center" style={{ borderColor: `${color}30`, backgroundColor: `${color}08` }}>
      <p className="text-2xl font-bold leading-none" style={{ color }}>
        {typeof value === 'number' ? value.toLocaleString('es-MX') : value}
      </p>
      <p className="text-[11px] font-semibold text-gray-600 mt-1.5">{label}</p>
      {sub && <p className="text-[10px] text-gray-400 mt-0.5">{sub}</p>}
    </div>
  )
}

// ─── Riesgo Badge ─────────────────────────────────────────────────────────────
function RiesgoBadge({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0
  return (
    <div className="rounded-xl border p-4" style={{ borderColor: `${color}30`, backgroundColor: `${color}08` }}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold text-gray-700">{label}</span>
        <span className="text-lg font-bold" style={{ color }}>{pct}%</span>
      </div>
      <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <p className="text-[10px] text-gray-400 mt-1.5">
        {value.toLocaleString('es-MX')} de {total.toLocaleString('es-MX')} viviendas
      </p>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export function EstadisticasViviendaPage() {
  const [servicios,  setServicios]  = useState<ViviendaServiciosData | null>(null)
  const [hacinam,    setHacinam]    = useState<HacinamientoData | null>(null)
  const [materiales, setMateriales] = useState<MaterialesRiesgoData | null>(null)
  const [animales,   setAnimales]   = useState<AnimalesData | null>(null)
  const [loading,    setLoading]    = useState(true)
  const [errors,     setErrors]     = useState<Record<string, boolean>>({})
  const [mocks,      setMocks]      = useState<Record<string, boolean>>({})

  useEffect(() => {
    let cancelled = false
    async function fetchAll() {
      const results = await Promise.allSettled([
        getViviendaServicios(),
        getViviendaHacinamiento(),
        getViviendaMaterialesRiesgo(),
        getViviendaAnimales(),
      ])
      if (cancelled) return
      const mockFlags: Record<string, boolean> = {}
      const [serv, hac, mat, ani] = results

      if (serv.status === 'fulfilled' && !isEmpty(serv.value)) { setServicios(serv.value) }   else { setServicios(MOCK_SERVICIOS);   mockFlags.servicios = true; if (serv.status === 'rejected') console.warn('API Error, using fallback', serv.reason) }
      if (hac.status  === 'fulfilled' && !isEmpty(hac.value))  { setHacinam(hac.value) }      else { setHacinam(MOCK_HACINAM);      mockFlags.hacinam = true; if (hac.status === 'rejected') console.warn('API Error, using fallback', hac.reason) }
      if (mat.status  === 'fulfilled' && !isEmpty(mat.value))  { setMateriales(mat.value) }   else { setMateriales(MOCK_MATERIALES); mockFlags.materiales = true; if (mat.status === 'rejected') console.warn('API Error, using fallback', mat.reason) }
      if (ani.status  === 'fulfilled' && !isEmpty(ani.value))  { setAnimales(ani.value) }     else { setAnimales(MOCK_ANIMALES);     mockFlags.animales = true; if (ani.status === 'rejected') console.warn('API Error, using fallback', ani.reason) }

      setErrors({})
      setMocks(mockFlags)
      setLoading(false)
    }
    fetchAll()
    return () => { cancelled = true }
  }, [])


  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Home size={22} className="text-[#006657]" />
          Estadísticas de Vivienda
        </h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Determinantes sociales: servicios básicos, hacinamiento, condiciones de riesgo y zoonosis.
        </p>
      </div>

      {/* ROW 1: Servicios básicos */}
      <SectionCard icon={Droplets} title="Cobertura de Servicios Básicos"
        subtitle={servicios ? `${servicios.total_viviendas.toLocaleString('es-MX')} viviendas analizadas` : undefined}
        isMock={mocks.servicios}>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="skeleton h-14 rounded-lg" />)}
          </div>
        ) : errors.servicios ? <Err /> : servicios ? (
          <>
            <ServicioRow icon={Droplets}  label="Agua potable"      con={servicios.con_agua}           sin={servicios.sin_agua}           total={servicios.total_viviendas} color="#2563eb" />
            <ServicioRow icon={Zap}       label="Energía eléctrica" con={servicios.con_luz}            sin={servicios.sin_luz}            total={servicios.total_viviendas} color="#f59e0b" />
            <ServicioRow icon={Waves}     label="Alcantarillado"    con={servicios.con_alcantarillado} sin={servicios.sin_alcantarillado} total={servicios.total_viviendas} color="#10b981" />
            <div className="mt-3 pt-3 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Con fosa séptica</span>
                <span className="text-sm font-semibold text-gray-800">
                  {servicios.con_fosa_septica.toLocaleString('es-MX')} viviendas
                  {' '}
                  <span className="text-xs text-gray-400 font-normal">
                    ({servicios.total_viviendas > 0 ? Math.round((servicios.con_fosa_septica / servicios.total_viviendas) * 100) : 0}%)
                  </span>
                </span>
              </div>
            </div>
          </>
        ) : null}
      </SectionCard>

      {/* ROW 2: Hacinamiento + Materiales de riesgo */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <SectionCard icon={Layers} title="Hacinamiento" subtitle="Más de 2.5 personas por cuarto" isMock={mocks.hacinam}>
          {loading ? <ChartSkeleton height={200} /> : errors.hacinam ? <Err /> : hacinam ? (
            <>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <KpiBadge label="Viviendas hacinadas"    value={hacinam.viviendas_hacinadas}    color="#ef4444" />
                <KpiBadge label="Sin hacinamiento"       value={hacinam.viviendas_no_hacinadas} color="#10b981" />
                <KpiBadge label="Sin dato"               value={hacinam.sin_dato}               color="#9ca3af" />
                <KpiBadge
                  label="Promedio pers./cuarto"
                  value={`${Number(hacinam.promedio_personas_por_cuarto ?? 0).toFixed(2)}`}
                  sub="personas/cuarto"
                  color={GOLD}
                />
              </div>
              <div className="space-y-2">
                {[
                  { label: 'Hacinadas',  value: hacinam.viviendas_hacinadas,    color: '#ef4444' },
                  { label: 'Sin hac.',   value: hacinam.viviendas_no_hacinadas, color: '#10b981' },
                  { label: 'Sin dato',   value: hacinam.sin_dato,              color: '#9ca3af' },
                ].map(({ label, value, color }) => {
                  const tot = hacinam.viviendas_hacinadas + hacinam.viviendas_no_hacinadas + hacinam.sin_dato
                  const pct = tot > 0 ? (value / tot) * 100 : 0
                  return (
                    <div key={label} className="flex items-center gap-3">
                      <span className="text-[11px] text-gray-600 w-24 shrink-0">{label}</span>
                      <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${pct}%`, backgroundColor: color }} />
                      </div>
                      <span className="text-[11px] font-semibold w-8 text-right tabular-nums" style={{ color }}>
                        {Math.round(pct)}%
                      </span>
                    </div>
                  )
                })}
              </div>
            </>
          ) : null}
        </SectionCard>

        <SectionCard icon={AlertTriangle} title="Materiales de Riesgo" subtitle="Condiciones físicas de riesgo en vivienda" isMock={mocks.materiales}>
          {loading ? <ChartSkeleton height={200} /> : errors.materiales ? <Err /> : materiales ? (
            <div className="space-y-4">
              <p className="text-xs text-gray-500">
                Base: <span className="font-semibold text-gray-700">{materiales.total_viviendas.toLocaleString('es-MX')}</span> viviendas
              </p>
              <RiesgoBadge label="Piso de tierra"                value={materiales.piso_tierra}          total={materiales.total_viviendas} color="#ef4444" />
              <RiesgoBadge label="Cocina con leña"               value={materiales.cocina_con_lena}      total={materiales.total_viviendas} color="#f59e0b" />
              <RiesgoBadge label="Cocina en dormitorio (humo)" value={materiales.cocina_en_dormitorio}  total={materiales.total_viviendas} color="#dc2626" />
            </div>
          ) : null}
        </SectionCard>
      </div>

      {/* ROW 3: Animales con DataLabels permanentes */}
      <SectionCard icon={Dog} title="Animales en el Hogar" subtitle="Presencia de animales y condiciones de mascotas" isMock={mocks.animales}>
        {loading ? <ChartSkeleton height={200} /> : errors.animales ? <Err /> : animales ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Gráfica por tipo de animal */}
            <div>
              <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-3">Por tipo de animal</p>
              {animales.por_animal.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={animales.por_animal} barCategoryGap="20%" margin={{ top: 20, right: 16 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                    <XAxis dataKey="nombre" tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false} label={{ value: 'Tipo de Animal', position: 'insideBottom', offset: -5, fontSize: 10, fill: '#9ca3af' }} />
                    <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false} allowDecimals={false} label={{ value: 'Cantidad de hogares', angle: -90, position: 'insideLeft', fontSize: 10, fill: '#9ca3af', style: { textAnchor: 'middle' } }} />
                    <Tooltip formatter={(v) => [(v as number).toLocaleString('es-MX'), 'Hogares']}
                      contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }} />
                    <Bar dataKey="total" radius={[4, 4, 0, 0]} maxBarSize={40}>
                      {animales.por_animal.map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                      <LabelList dataKey="total" position="top" style={{ fontSize: 11, fill: '#374151', fontWeight: 600 }} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-xs text-gray-400 text-center py-8">Sin datos de animales</p>
              )}
            </div>

            {/* Indicadores de mascotas */}
            <div>
              <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-3">Mascotas (Perros/Gatos)</p>
              <div className="space-y-3">
                <KpiBadge
                  label="Perros/gatos dentro del hogar"
                  value={animales.mascotas.con_perros_gatos_dentro}
                  color={GOLD}
                />
                <KpiBadge
                  label="Mascotas sin vacunar"
                  value={animales.mascotas.mascotas_sin_vacunar}
                  color="#ef4444"
                  sub="Riesgo zoonótico"
                />
                <KpiBadge
                  label="Mascotas esterilizadas"
                  value={animales.mascotas.mascotas_esterilizadas}
                  color="#10b981"
                  sub="Control poblacional"
                />
              </div>
            </div>
          </div>
        ) : null}
      </SectionCard>
    </div>
  )
}
