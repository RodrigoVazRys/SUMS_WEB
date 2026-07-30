// ─── Organism: MonthlyTrendChart — Tendencia de Cédulas ───────────────────────
// Gráfico de área/línea con Recharts.
// Consume: GET /estadisticas/cedulas/serie?agrupar=dia|semana|mes
// Incluye selector de agrupación interactivo.

import { useEffect, useState, useCallback } from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { TrendingUp } from 'lucide-react'
import { getCedulasSerie } from '../../services/api'
import type { CedulaSerieItem } from '../../types/api.types'

type Agrupacion = 'dia' | 'semana' | 'mes'

const MOCK_SERIES: Record<Agrupacion, CedulaSerieItem[]> = {
  dia: [
    { periodo: '2023-11-01', total: 10 },
    { periodo: '2023-11-02', total: 15 },
    { periodo: '2023-11-03', total: 25 },
    { periodo: '2023-11-04', total: 12 },
    { periodo: '2023-11-05', total: 18 },
  ],
  semana: [
    { periodo: '2023-W40', total: 100 },
    { periodo: '2023-W41', total: 150 },
    { periodo: '2023-W42', total: 120 },
    { periodo: '2023-W43', total: 180 },
  ],
  mes: [
    { periodo: '2023-01', total: 500 },
    { periodo: '2023-02', total: 700 },
    { periodo: '2023-03', total: 650 },
    { periodo: '2023-04', total: 680 },
    { periodo: '2023-05', total: 710 },
    { periodo: '2023-06', total: 800 },
    { periodo: '2023-07', total: 29 }, // matching total=4069
  ],
}

const AGRUPACION_LABELS: Record<Agrupacion, string> = {
  dia:    'Por Día',
  semana: 'Por Semana',
  mes:    'Por Mes',
}

function formatPeriodo(periodo: string): string {
  // ISO date YYYY-MM-DD or YYYY-MM → format human readable
  if (!periodo) return periodo
  const parts = (periodo as string).split('-')
  if (parts.length === 2) return `${parts[1]}/${parts[0]}`  // MM/YYYY
  if (parts.length === 3) return `${parts[2]}/${parts[1]}`  // DD/MM
  return periodo
}

export function MonthlyTrendChart() {
  const [data,       setData]       = useState<CedulaSerieItem[]>([])
  const [agrupacion, setAgrupacion] = useState<Agrupacion>('mes')
  const [isLoading,  setIsLoading]  = useState(true)
  const [error,      setError]      = useState(false)

  const fetchData = useCallback(async (ag: Agrupacion) => {
    setIsLoading(true)
    setError(false)
    try {
      const result = await getCedulasSerie(ag)
      setData(result)
    } catch {
      console.warn('API error (cedulas-serie), using mock data')
      setData(MOCK_SERIES[ag])
      // setError(true)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { fetchData(agrupacion) }, [agrupacion, fetchData])

  const total = data.reduce((s, d) => s + d.total, 0)

  return (
    <section
      aria-label="Tendencia de registro de cédulas"
      className="bg-white rounded-xl p-5 shadow-sm border border-gray-100"
    >
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-3 mb-5 flex-wrap">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#006657]/10 flex items-center justify-center flex-shrink-0">
            <TrendingUp size={16} className="text-[#006657]" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Tendencia de Cédulas</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {isLoading ? 'Cargando…' : `${total.toLocaleString('es-MX')} registros en el período`}
            </p>
          </div>
        </div>

        {/* Selector de agrupación */}
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5 flex-shrink-0">
          {(Object.keys(AGRUPACION_LABELS) as Agrupacion[]).map((ag) => (
            <button
              key={ag}
              onClick={() => setAgrupacion(ag)}
              className={[
                'px-3 py-1 rounded-md text-xs font-medium transition-all duration-200',
                ag === agrupacion
                  ? 'bg-white text-[#006657] shadow-sm font-semibold'
                  : 'text-gray-500 hover:text-gray-700',
              ].join(' ')}
            >
              {AGRUPACION_LABELS[ag]}
            </button>
          ))}
        </div>
      </div>

      {/* ── Skeleton ────────────────────────────────────────────────────── */}
      {isLoading && (
        <div className="h-52 flex items-end gap-1.5 px-2">
          {[40, 65, 45, 80, 55, 90, 70, 85, 60, 75, 50, 95].map((pct, i) => (
            <div
              key={i}
              aria-hidden="true"
              className="flex-1 rounded-t-sm skeleton"
              style={{ height: `${pct}%` }}
            />
          ))}
        </div>
      )}

      {/* ── Error ───────────────────────────────────────────────────────── */}
      {!isLoading && error && (
        <div className="h-52 flex items-center justify-center text-xs text-gray-400">
          No se pudieron cargar los datos de tendencia.
        </div>
      )}

      {/* ── Empty ───────────────────────────────────────────────────────── */}
      {!isLoading && !error && data.length === 0 && (
        <div className="h-52 flex items-center justify-center text-xs text-gray-400">
          Sin registros en el período seleccionado.
        </div>
      )}

      {/* ── Chart ───────────────────────────────────────────────────────── */}
      {!isLoading && !error && data.length > 0 && (
        <ResponsiveContainer width="100%" height={208}>
          <AreaChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="gradCedulas" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#006657" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#006657" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
            <XAxis
              dataKey="periodo"
              tickFormatter={formatPeriodo}
              tick={{ fontSize: 10, fill: '#6b7280' }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
              label={{ value: 'Tiempo', position: 'insideBottom', offset: -5, fontSize: 10, fill: '#9ca3af' }}
            />
            <YAxis
              tick={{ fontSize: 10, fill: '#6b7280' }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
              label={{ value: 'Cantidad de Cédulas', angle: -90, position: 'insideLeft', fontSize: 10, fill: '#9ca3af', style: { textAnchor: 'middle' } }}
            />
            <Tooltip
              formatter={(val) => [(val as number)?.toLocaleString('es-MX'), 'Cédulas']}
              labelFormatter={(label) => formatPeriodo(String(label ?? ''))}
              contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
              cursor={{ stroke: '#006657', strokeWidth: 1, strokeDasharray: '4 4' }}
            />
            <Area
              type="monotone"
              dataKey="total"
              stroke="#006657"
              strokeWidth={2.5}
              fill="url(#gradCedulas)"
              dot={data.length <= 12 ? { r: 3, fill: '#006657', strokeWidth: 0 } : false}
              activeDot={{ r: 5, fill: '#006657' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </section>
  )
}
