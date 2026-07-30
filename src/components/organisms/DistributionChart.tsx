// ─── Organism: DistributionChart (Distribución Etaria) ────────────────────────
// Gráfico de barras horizontales con Recharts.
// Consume: GET /vacunaciones/por-rango-edad
// Mapea rango_edad vs total_aplicaciones (sumando todas las vacunas por rango)

import { useEffect, useState } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { getVacunacionesPorRangoEdad } from '../../services/api'
import type { VacunacionPorRangoEdadDTO } from '../../types/api.types'
import { SkeletonLine } from '../atoms/SkeletonLine'

interface RangoChartPoint {
  rango: string
  total: number
}

const RANGE_COLORS: Record<string, string> = {
  'Menores de edad': '#BC955C',
  'Adultos':         '#006657',
  'Adultos mayores': '#004f42',
}

function aggregateByRango(data: VacunacionPorRangoEdadDTO[]): RangoChartPoint[] {
  const map = new Map<string, number>()
  for (const item of data) {
    map.set(item.rango_edad, (map.get(item.rango_edad) ?? 0) + item.total_aplicaciones)
  }
  return Array.from(map.entries()).map(([rango, total]) => ({ rango, total }))
}

function getColor(rango: string): string {
  return RANGE_COLORS[rango] ?? '#006657'
}

export function DistributionChart() {
  const [data, setData] = useState<RangoChartPoint[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function fetchData() {
      try {
        const response = await getVacunacionesPorRangoEdad()
        if (!cancelled) setData(aggregateByRango(response))
      } catch {
        if (!cancelled) setError(true)
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }
    fetchData()
    return () => { cancelled = true }
  }, [])

  const total = data.reduce((sum, d) => sum + d.total, 0)

  return (
    <section
      aria-label="Distribución etaria de vacunación"
      className="bg-white rounded-xl p-5 shadow-sm border border-gray-100"
    >
      {/* Header */}
      <div className="mb-5">
        <h3 className="text-sm font-semibold text-gray-900">Distribución Etaria</h3>
        <p className="text-xs text-gray-500 mt-0.5">Vacunaciones por rango de edad</p>
      </div>

      {/* Total badge */}
      {!isLoading && !error && total > 0 && (
        <div className="flex justify-center mb-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{total.toLocaleString('es-MX')}</p>
            <p className="text-[10px] text-gray-500">Total aplicaciones</p>
          </div>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => <SkeletonLine key={i} className="h-6 rounded" />)}
        </div>
      )}

      {/* Error */}
      {!isLoading && error && (
        <div className="h-32 flex items-center justify-center text-xs text-gray-400">
          No se pudieron cargar los datos.
        </div>
      )}

      {/* Empty */}
      {!isLoading && !error && data.length === 0 && (
        <div className="h-32 flex items-center justify-center text-xs text-gray-400">
          Sin registros disponibles.
        </div>
      )}

      {/* Chart */}
      {!isLoading && !error && data.length > 0 && (
        <ResponsiveContainer width="100%" height={150}>
          <BarChart data={data} layout="vertical" barCategoryGap="20%">
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
            <XAxis
              type="number"
              tick={{ fontSize: 10, fill: '#6b7280' }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
              label={{ value: 'Cantidad', position: 'insideBottom', offset: -5, fontSize: 10, fill: '#9ca3af' }}
            />
            <YAxis
              type="category"
              dataKey="rango"
              width={100}
              tick={{ fontSize: 10, fill: '#6b7280' }}
              axisLine={false}
              tickLine={false}
              label={{ value: 'Categoría', angle: -90, position: 'insideLeft', fontSize: 10, fill: '#9ca3af', style: { textAnchor: 'middle' } }}
            />
            <Tooltip
              contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
              cursor={{ fill: '#f9fafb' }}
              formatter={(value) => [(value as number).toLocaleString('es-MX'), 'Aplicaciones']}
            />
            <Bar dataKey="total" radius={[0, 4, 4, 0]} maxBarSize={22}>
              {data.map((entry) => (
                <Cell key={entry.rango} fill={getColor(entry.rango)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}

      {/* Legend */}
      {!isLoading && !error && data.length > 0 && (
        <div className="mt-3 space-y-2">
          {data.map((item) => (
            <div key={item.rango} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: getColor(item.rango) }}
                  aria-hidden="true"
                />
                <span className="text-xs text-gray-600">{item.rango}</span>
              </div>
              <span className="text-xs font-semibold text-gray-700">
                {total > 0 ? Math.round((item.total / total) * 100) : 0}%
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
