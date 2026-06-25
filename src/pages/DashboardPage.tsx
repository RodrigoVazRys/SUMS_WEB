// ─── Page: DashboardPage ──────────────────────────────────────────────────────
// Responsabilidad única: componer los organismos del dashboard
// y proveer metadatos de página (title, descripción).
// Sin lógica de presentación — todo está en los organismos.

import { useAuth } from '../contexts/AuthContext'
import { MetricsGrid } from '../components/organisms/MetricsGrid'
import { MonthlyTrendChart } from '../components/organisms/MonthlyTrendChart'
import { DistributionChart } from '../components/organisms/DistributionChart'
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
    <div className="space-y-6 animate-fade-in">
      {/* ── Page Header ──────────────────────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Resumen Operativo</h2>
          <p className="text-sm text-gray-500 mt-0.5">Métricas y validaciones al día de hoy.</p>
        </div>
        <div className="flex items-center gap-1.5 bg-white border border-gray-200 px-3 py-2 rounded-lg text-xs text-gray-600 shadow-sm">
          <Calendar size={14} className="text-primary" aria-hidden="true" />
          <span className="capitalize">{today}</span>
        </div>
      </div>

      {/* ── KPI Cards ────────────────────────────────────────────────── */}
      <MetricsGrid />

      {/* ── Charts ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <MonthlyTrendChart />
        </div>
        <DistributionChart />
      </div>

      {/* ── Session status strip ─────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-primary to-primary-dark rounded-xl p-4 flex items-center justify-between">
        <div>
          <p className="text-white/70 text-xs">Sesión activa como</p>
          <p className="text-white font-semibold text-sm">
            {user?.name} — {user?.role}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <TrendingUp size={18} className="text-gold" aria-hidden="true" />
          <span className="text-white/70 text-xs">Sistema operando con normalidad</span>
        </div>
      </div>
    </div>
  )
}
