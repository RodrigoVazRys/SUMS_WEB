// ─── Page: DashboardPage ──────────────────────────────────────────────────────
// Responsabilidad única: componer los organismos del dashboard
// y proveer metadatos de página (title, descripción).
// v2: Integra DemographicPyramid (pirámide poblacional + vacunación por sexo).

import { useAuth } from '../contexts/AuthContext'
import { MetricsGrid } from '../components/organisms/MetricsGrid'
import { MonthlyTrendChart } from '../components/organisms/MonthlyTrendChart'
import { DemographicPyramid } from '../components/organisms/DemographicPyramid'
import { TrendingUp, Calendar } from 'lucide-react'

export function DashboardPage() {
  const { user } = useAuth()

  const today = new Date().toLocaleDateString('es-MX', {
    weekday: 'long',
    year:    'numeric',
    month:   'long',
    day:     'numeric',
  })

  return (
    <div className="space-y-5 animate-fade-in">

      {/* ── Page Header ──────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Resumen Operativo</h2>
          <p className="text-sm text-gray-500 mt-0.5">Métricas y validaciones al día de hoy.</p>
        </div>
        <div className="flex items-center gap-1.5 bg-white border border-gray-200 px-3 py-2 rounded-lg text-xs text-gray-600 shadow-sm flex-shrink-0">
          <Calendar size={14} className="text-primary" aria-hidden="true" />
          <span className="capitalize">{today}</span>
        </div>
      </div>

      {/* ── KPI Cards ────────────────────────────────────────────────────── */}
      <MetricsGrid />

      {/* ── Gráfico de tendencia mensual — ancho completo ────────────────── */}
      <MonthlyTrendChart />

      {/* ── Pirámide demográfica + Vacunación por sexo ─────────────────── */}
      <DemographicPyramid />

      {/* ── Session status strip ─────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-[#006657] to-[#004f42] rounded-xl p-4 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <p className="text-white/70 text-xs">Sesión activa como</p>
          <p className="text-white font-semibold text-sm">
            {user?.name} — {user?.role}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <TrendingUp size={18} className="text-[#BC955C]" aria-hidden="true" />
          <span className="text-white/70 text-xs">Sistema operando con normalidad</span>
        </div>
      </div>
    </div>
  )
}
