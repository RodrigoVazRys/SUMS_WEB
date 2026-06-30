// ─── Page: EstadisticasSaludPage ──────────────────────────────────────────────
// Estadísticas de Salud / Epidemiología — 9 endpoints:
//  1. GET /estadisticas/salud/enfermedades-cronicas
//  2. GET /estadisticas/salud/toxicomanias
//  3. GET /estadisticas/salud/discapacidad
//  4. GET /estadisticas/salud/preventiva
//  5. GET /estadisticas/salud/seguridad-social
//  6. GET /estadisticas/salud/alimentacion
//  7. GET /estadisticas/salud/servicios-salud
//  8. GET /estadisticas/salud/higiene-bucodental
//  9. GET /estadisticas/salud/piramide-vacuna

import { useEffect, useState, useMemo } from 'react'
import {
  PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from 'recharts'
import {
  HeartPulse, Cigarette, Accessibility, ShieldCheck,
  Apple, Stethoscope, SmilePlus, Syringe, AlertCircle,
} from 'lucide-react'
import {
  getSaludEnfermedadesCronicas,
  getSaludToxicomanias,
  getSaludDiscapacidad,
  getSaludPreventiva,
  getSaludSeguridadSocial,
  getSaludAlimentacion,
  getSaludServiciosSalud,
  getSaludHigieneBucodental,
  getSaludPiramideVacuna,
} from '../services/api'
import type {
  EnfermedadCronicaItem,
  ToxicomaniaItem,
  DiscapacidadData,
  SaludPreventivaData,
  SeguridadSocialData,
  AlimentacionData,
  ServicioSaludItem,
  HigieneBucodentalData,
  PiramideVacunaItem,
} from '../types/api.types'

const GREEN = '#006657'
const GOLD  = '#BC955C'
const CHART_COLORS = ['#006657', '#BC955C', '#2563eb', '#10b981', '#f59e0b', '#ef4444', '#7c3aed', '#0891b2', '#ec4899']

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
      {[65, 90, 45, 80, 55, 75, 60, 85].map((pct, i) => (
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

function HBar({ label, value, max, color = GREEN }: { label: string; value: number; max: number; color?: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0
  return (
    <div className="flex items-center gap-3">
      <span className="text-[11px] text-gray-600 w-36 shrink-0 truncate" title={label}>{label}</span>
      <div className="flex-1 h-5 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <span className="text-[11px] font-semibold text-gray-700 w-12 text-right tabular-nums">
        {value.toLocaleString('es-MX')}
      </span>
    </div>
  )
}

function KpiCard({ label, value, icon: Icon, color, sub }: {
  label: string; value: string | number; icon: React.ElementType; color: string; sub?: string
}) {
  return (
    <div className="rounded-xl border p-4 flex items-start gap-3" style={{ borderColor: `${color}30`, backgroundColor: `${color}08` }}>
      <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${color}20` }}>
        <Icon size={16} style={{ color }} />
      </div>
      <div>
        <p className="text-xl font-bold leading-none" style={{ color }}>
          {typeof value === 'number' ? value.toLocaleString('es-MX') : value}
        </p>
        <p className="text-[11px] font-semibold text-gray-600 mt-1">{label}</p>
        {sub && <p className="text-[10px] text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

// ─── Pirámide de vacunación ────────────────────────────────────────────────────
function PiramideVacunaChart({ data }: { data: PiramideVacunaItem[] }) {
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
        {[{ label: 'Hombres', color: GOLD }, { label: 'Mujeres', color: GREEN }].map(({ label, color }) => (
          <div key={label} className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: color }} />
            <span className="text-[11px] font-medium text-gray-600">{label}</span>
          </div>
        ))}
      </div>
      {[...pyramidData].reverse().map(({ rango, m, f }) => {
        const mPct = (m / maxVal) * 100
        const fPct = (f / maxVal) * 100
        return (
          <div key={rango} className="flex items-center">
            <div className="flex-1 flex justify-end pr-1">
              <div className="h-6 rounded-l-sm transition-all duration-700"
                style={{ width: `${mPct}%`, backgroundColor: GOLD }} title={`♂ ${m}`} />
            </div>
            <div className="w-14 shrink-0 text-center text-[10px] text-gray-500 font-medium">{rango}</div>
            <div className="flex-1 flex justify-start pl-1">
              <div className="h-6 rounded-r-sm transition-all duration-700"
                style={{ width: `${fPct}%`, backgroundColor: GREEN }} title={`♀ ${f}`} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export function EstadisticasSaludPage() {
  const [enfermedades, setEnfermedades] = useState<EnfermedadCronicaItem[]>([])
  const [toxicomanias, setToxicomanias] = useState<ToxicomaniaItem[]>([])
  const [discapacidad, setDiscapacidad] = useState<DiscapacidadData | null>(null)
  const [preventiva,   setPreventiva]   = useState<SaludPreventivaData | null>(null)
  const [seguridad,    setSeguridad]    = useState<SeguridadSocialData | null>(null)
  const [alimentacion, setAlimentacion] = useState<AlimentacionData | null>(null)
  const [servicios,    setServicios]    = useState<ServicioSaludItem[]>([])
  const [higiene,      setHigiene]      = useState<HigieneBucodentalData | null>(null)
  const [piramideVac,  setPiramideVac]  = useState<PiramideVacunaItem[]>([])
  const [loading,      setLoading]      = useState(true)
  const [errors,       setErrors]       = useState<Record<string, boolean>>({})

  useEffect(() => {
    let cancelled = false
    async function fetchAll() {
      const results = await Promise.allSettled([
        getSaludEnfermedadesCronicas(),
        getSaludToxicomanias(),
        getSaludDiscapacidad(),
        getSaludPreventiva(),
        getSaludSeguridadSocial(),
        getSaludAlimentacion(),
        getSaludServiciosSalud(),
        getSaludHigieneBucodental(),
        getSaludPiramideVacuna(),
      ])
      if (cancelled) return
      const errs: Record<string, boolean> = {}
      const [enf, tox, disc, prev, seg, ali, serv, hig, pVac] = results
      if (enf.status  === 'fulfilled') { setEnfermedades(enf.value) }  else { errs.enfermedades = true }
      if (tox.status  === 'fulfilled') { setToxicomanias(tox.value) }  else { errs.toxicomanias = true }
      if (disc.status === 'fulfilled') { setDiscapacidad(disc.value) } else { errs.discapacidad = true }
      if (prev.status === 'fulfilled') { setPreventiva(prev.value) }   else { errs.preventiva = true }
      if (seg.status  === 'fulfilled') { setSeguridad(seg.value) }     else { errs.seguridad = true }
      if (ali.status  === 'fulfilled') { setAlimentacion(ali.value) }  else { errs.alimentacion = true }
      if (serv.status === 'fulfilled') { setServicios(serv.value) }    else { errs.servicios = true }
      if (hig.status  === 'fulfilled') { setHigiene(hig.value) }       else { errs.higiene = true }
      if (pVac.status === 'fulfilled') { setPiramideVac(pVac.value) }  else { errs.piramideVac = true }
      setErrors(errs)
      setLoading(false)
    }
    fetchAll()
    return () => { cancelled = true }
  }, [])

  const maxEnf  = Math.max(...enfermedades.map(e => e.personas), 1)
  const maxTox  = Math.max(...toxicomanias.map(t => t.personas), 1)
  const maxServ = Math.max(...servicios.map(s => s.total), 1)

  const alimentacionRadar = alimentacion ? [
    { nombre: 'Proteína',      valor: +Number(alimentacion.promedio_dias_proteina ?? 0).toFixed(1),        max: 7 },
    { nombre: 'Frutas/Verd.',  valor: +Number(alimentacion.promedio_dias_frutas_verduras ?? 0).toFixed(1), max: 7 },
    { nombre: 'Cereales',      valor: +Number(alimentacion.promedio_dias_cereales ?? 0).toFixed(1),        max: 7 },
  ] : []

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <HeartPulse size={22} className="text-[#006657]" />
          Estadísticas de Salud
        </h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Epidemiología, salud preventiva, nutrición, seguridad social y vacunación.
        </p>
      </div>

      {/* ROW 1: Enfermedades crónicas + Toxicomanías */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <SectionCard icon={HeartPulse} title="Enfermedades Crónicas" subtitle="Prevalencia por tipo de enfermedad">
          {loading ? <ChartSkeleton height={220} /> : errors.enfermedades ? <Err /> : (
            <div className="space-y-2.5">
              {enfermedades.map((e) => <HBar key={e.nombre} label={e.nombre} value={e.personas} max={maxEnf} color="#ef4444" />)}
              {enfermedades.length === 0 && <p className="text-xs text-gray-400 text-center py-4">Sin datos</p>}
            </div>
          )}
        </SectionCard>

        <SectionCard icon={Cigarette} title="Toxicomanías" subtitle="Tabaquismo, alcoholismo y otras">
          {loading ? <ChartSkeleton height={220} /> : errors.toxicomanias ? <Err /> : (
            <div className="space-y-2.5">
              {toxicomanias.map((t) => <HBar key={t.nombre} label={t.nombre} value={t.personas} max={maxTox} color="#f59e0b" />)}
              {toxicomanias.length === 0 && <p className="text-xs text-gray-400 text-center py-4">Sin datos</p>}
            </div>
          )}
        </SectionCard>
      </div>

      {/* ROW 2: Discapacidad + Seguridad Social */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <SectionCard icon={Accessibility} title="Discapacidad" subtitle="Población con y sin discapacidad">
          {loading ? <ChartSkeleton height={200} /> : errors.discapacidad ? <Err /> : discapacidad ? (
            <>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <KpiCard label="Con discapacidad"  value={discapacidad.resumen.con_discapacidad}  icon={Accessibility} color="#f59e0b" />
                <KpiCard label="Sin discapacidad"  value={discapacidad.resumen.sin_discapacidad}  icon={ShieldCheck}   color="#10b981" />
              </div>
              {discapacidad.por_tipo.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Por tipo</p>
                  {discapacidad.por_tipo.map((t, i) => (
                    <HBar key={t.tipo} label={t.tipo} value={t.total}
                      max={Math.max(...discapacidad.por_tipo.map(x => x.total), 1)}
                      color={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </div>
              )}
            </>
          ) : null}
        </SectionCard>

        <SectionCard icon={ShieldCheck} title="Seguridad Social" subtitle="Afiliación a servicios de salud">
          {loading ? <ChartSkeleton height={200} /> : errors.seguridad ? <Err /> : seguridad ? (
            <>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <KpiCard label="Con seguridad"  value={seguridad.con_seguridad} icon={ShieldCheck} color="#10b981" />
                <KpiCard label="Sin seguridad"  value={seguridad.sin_seguridad} icon={ShieldCheck} color="#ef4444" />
              </div>
              <ResponsiveContainer width="100%" height={120}>
                <PieChart>
                  <Pie data={[
                    { name: 'Con seguridad', value: seguridad.con_seguridad },
                    { name: 'Sin seguridad', value: seguridad.sin_seguridad },
                  ]} dataKey="value" cx="50%" cy="50%" outerRadius={50} innerRadius={28} paddingAngle={4}>
                    <Cell fill="#10b981" />
                    <Cell fill="#ef4444" />
                  </Pie>
                  <Tooltip formatter={(v) => [(v as number).toLocaleString('es-MX'), 'Personas']}
                    contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }} />
                  <Legend wrapperStyle={{ fontSize: 10 }} iconType="circle" iconSize={7} />
                </PieChart>
              </ResponsiveContainer>
            </>
          ) : null}
        </SectionCard>
      </div>

      {/* ROW 3: Salud preventiva + Alimentación */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <SectionCard icon={Stethoscope} title="Salud Preventiva" subtitle="Tamizajes y control prenatal">
          {loading ? <ChartSkeleton height={200} /> : errors.preventiva ? <Err /> : preventiva ? (
            <>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <KpiCard label="Tamizaje cérvico-uterino" value={preventiva.resumen.tamizaje_cervico_uterino} icon={Stethoscope} color="#7c3aed" />
                <KpiCard label="Tamizaje cáncer mama"     value={preventiva.resumen.tamizaje_cancer_mama}     icon={Stethoscope} color="#ec4899" />
                <KpiCard label="Con atención embarazo"    value={preventiva.resumen.con_atencion_embarazo}    icon={HeartPulse}  color="#10b981" />
                <KpiCard label="Total registros"          value={preventiva.resumen.total_registros}          icon={ShieldCheck} color="#006657" />
              </div>
              {preventiva.por_atencion_embarazo.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Atención al embarazo</p>
                  {preventiva.por_atencion_embarazo.map((a, i) => (
                    <HBar key={a.nombre} label={a.nombre} value={a.total}
                      max={Math.max(...preventiva.por_atencion_embarazo.map(x => x.total), 1)}
                      color={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </div>
              )}
            </>
          ) : null}
        </SectionCard>

        <SectionCard icon={Apple} title="Hábitos Alimenticios" subtitle="Promedio de días/semana con cada grupo alimenticio">
          {loading ? <div className="skeleton h-52 rounded-lg" /> : errors.alimentacion ? <Err /> : alimentacion ? (
            <>
              <p className="text-[11px] text-gray-500 mb-3">
                Basado en <span className="font-semibold text-gray-700">{alimentacion.total_registros.toLocaleString('es-MX')}</span> registros
              </p>
              <ResponsiveContainer width="100%" height={180}>
                <RadarChart data={alimentacionRadar}>
                  <PolarGrid stroke="#e5e7eb" />
                  <PolarAngleAxis dataKey="nombre" tick={{ fontSize: 11, fill: '#6b7280' }} />
                  <PolarRadiusAxis angle={30} domain={[0, 7]} tick={{ fontSize: 9, fill: '#9ca3af' }} />
                  <Radar name="Días/semana" dataKey="valor" stroke={GREEN} fill={GREEN} fillOpacity={0.25} />
                  <Tooltip formatter={(v) => [`${v} días/sem`, '']}
                    contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }} />
                </RadarChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-3 gap-2 mt-2">
                {[
                  { label: 'Proteína',     val: alimentacion.promedio_dias_proteina,        color: '#10b981' },
                  { label: 'Frutas/Verd.', val: alimentacion.promedio_dias_frutas_verduras, color: GOLD      },
                  { label: 'Cereales',     val: alimentacion.promedio_dias_cereales,        color: '#2563eb' },
                ].map(({ label, val, color }) => (
                  <div key={label} className="text-center rounded-lg py-2 bg-gray-50">
                    <p className="text-base font-bold" style={{ color }}>{Number(val ?? 0).toFixed(1)}</p>
                    <p className="text-[10px] text-gray-500">{label}</p>
                  </div>
                ))}
              </div>
            </>
          ) : null}
        </SectionCard>
      </div>

      {/* ROW 4: Servicios de salud + Higiene bucodental */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <SectionCard icon={Stethoscope} title="Uso de Servicios de Salud" subtitle="Frecuencia por tipo de servicio">
          {loading ? <ChartSkeleton height={200} /> : errors.servicios ? <Err /> : (
            <div className="space-y-2.5">
              {servicios.map((s) => <HBar key={s.nombre} label={s.nombre} value={s.total} max={maxServ} color="#0891b2" />)}
              {servicios.length === 0 && <p className="text-xs text-gray-400 text-center py-4">Sin datos</p>}
            </div>
          )}
        </SectionCard>

        <SectionCard icon={SmilePlus} title="Higiene Bucodental" subtitle="Frecuencia de cepillado dental">
          {loading ? <ChartSkeleton height={200} /> : errors.higiene ? <Err /> : higiene ? (
            <>
              <div className="grid grid-cols-3 gap-3 mb-4">
                <KpiCard label="Diaria"    value={higiene.diaria}    icon={SmilePlus} color="#10b981" />
                <KpiCard label="No diaria" value={higiene.no_diaria} icon={SmilePlus} color="#f59e0b" />
                <KpiCard label="Sin dato"  value={higiene.sin_dato}  icon={SmilePlus} color="#9ca3af" />
              </div>
              <ResponsiveContainer width="100%" height={120}>
                <PieChart>
                  <Pie data={[
                    { name: 'Diaria',    value: higiene.diaria    },
                    { name: 'No diaria', value: higiene.no_diaria },
                    { name: 'Sin dato',  value: higiene.sin_dato  },
                  ]} dataKey="value" cx="50%" cy="50%" outerRadius={48} innerRadius={24} paddingAngle={4}>
                    <Cell fill="#10b981" />
                    <Cell fill="#f59e0b" />
                    <Cell fill="#9ca3af" />
                  </Pie>
                  <Tooltip formatter={(v) => [(v as number).toLocaleString('es-MX'), 'Personas']}
                    contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }} />
                  <Legend wrapperStyle={{ fontSize: 10 }} iconType="circle" iconSize={7} />
                </PieChart>
              </ResponsiveContainer>
            </>
          ) : null}
        </SectionCard>
      </div>

      {/* ROW 5: Pirámide de vacunación */}
      <SectionCard icon={Syringe} title="Pirámide de Vacunación por Edad y Sexo" subtitle="Personas vacunadas distribuidas por rango de edad y sexo">
        {loading ? <ChartSkeleton height={220} /> : errors.piramideVac ? <Err /> : (
          <PiramideVacunaChart data={piramideVac} />
        )}
      </SectionCard>
    </div>
  )
}
