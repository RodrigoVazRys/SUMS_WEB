// ─── Organism: MonthlyTrendChart (Histograma Doble — Hombres vs Mujeres) ──────
// Gráfico de barras agrupadas con Recharts.
// Consume: GET /vacunaciones/por-sexo/M y GET /vacunaciones/por-sexo/F
// Cruza los datos por campo "vacuna" para el eje X.

import { useEffect, useState } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { getVacunacionesPorSexo } from '../../services/api'
import type { VacunacionPorSexoDTO } from '../../types/api.types'

interface ChartDataPoint {
  vacuna: string
  Hombres: number
  Mujeres: number
}

function mergeByVacuna(
  masculino: VacunacionPorSexoDTO[],
  femenino: VacunacionPorSexoDTO[],
): ChartDataPoint[] {
  const map = new Map<string, ChartDataPoint>()

  for (const item of masculino) {
    map.set(item.vacuna, { vacuna: item.vacuna, Hombres: item.total_aplicaciones, Mujeres: 0 })
  }
  for (const item of femenino) {
    const existing = map.get(item.vacuna)
    if (existing) {
      existing.Mujeres = item.total_aplicaciones
    } else {
      map.set(item.vacuna, { vacuna: item.vacuna, Hombres: 0, Mujeres: item.total_aplicaciones })
    }
  }

  return Array.from(map.values())
}

// Abreviar etiquetas largas para el eje X
function abbreviate(label: string, maxLen = 10): string {
  return label.length > maxLen ? label.slice(0, maxLen) + '…' : label
}

export function MonthlyTrendChart() {
  const [data, setData] = useState<ChartDataPoint[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function fetchData() {
      try {
        const [masc, fem] = await Promise.all([
          getVacunacionesPorSexo('M'),
          getVacunacionesPorSexo('F'),
        ])
        if (!cancelled) {
          setData(mergeByVacuna(masc, fem))
        }
      } catch {
        if (!cancelled) setError(true)
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }
    fetchData()
    return () => { cancelled = true }
  }, [])

  return (
    <section
      aria-label="Histograma de vacunación por sexo"
      className="bg-white rounded-xl p-5 shadow-sm border border-gray-100"
    >
      {/* Header */}
      <div className="mb-5">
        <h3 className="text-sm font-semibold text-gray-900">Vacunación por Sexo</h3>
        <p className="text-xs text-gray-500 mt-0.5">Comparativo Hombres vs Mujeres por tipo de vacuna</p>
      </div>

      {/* Loading skeleton */}
      {isLoading && (
        <div className="flex items-end gap-2 h-48">
          {[60, 80, 50, 90, 70, 65].map((pct, i) => (
            <div
              key={i}
              aria-hidden="true"
              className="flex-1 rounded-t-md skeleton"
              style={{ height: `${pct}%` }}
            />
          ))}
        </div>
      )}

      {/* Error state */}
      {!isLoading && error && (
        <div className="h-48 flex items-center justify-center text-xs text-gray-400">
          No se pudieron cargar los datos de vacunación.
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !error && data.length === 0 && (
        <div className="h-48 flex items-center justify-center text-xs text-gray-400">
          Sin registros de vacunación disponibles.
        </div>
      )}

      {/* Chart */}
      {!isLoading && !error && data.length > 0 && (
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data} barCategoryGap="25%" barGap={3}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
            <XAxis
              dataKey="vacuna"
              tickFormatter={abbreviate}
              tick={{ fontSize: 10, fill: '#6b7280' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: '#6b7280' }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
              cursor={{ fill: '#f9fafb' }}
            />
            <Legend
              wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
              iconType="circle"
              iconSize={8}
            />
            <Bar dataKey="Hombres" fill="#006657" radius={[4, 4, 0, 0]} maxBarSize={28} />
            <Bar dataKey="Mujeres" fill="#BC955C" radius={[4, 4, 0, 0]} maxBarSize={28} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </section>
  )
}
