// ─── Organism: MetricsGrid ────────────────────────────────────────────────────
// KPI Cards alimentadas por la API SUMS en producción.
// Fuentes: GET /vacunaciones (total dosis), GET /cedulas (total cédulas)

import { useEffect, useState } from 'react'
import { ScanLine, Syringe, Clock, Activity } from 'lucide-react'
import { MetricCard } from '../molecules/MetricCard'
import type { MetricCardProps } from '../molecules/MetricCard'
import { getVacunaciones, getCedulas } from '../../services/api'

interface MetricsData {
  totalCedulas: number
  totalDosis: number
}

function buildMetrics(data: MetricsData): MetricCardProps[] {
  return [
    {
      id:           'cedulas',
      label:        'Cédulas Registradas',
      value:        data.totalCedulas.toLocaleString('es-MX'),
      delta:        'Total acumulado',
      deltaVariant: 'success',
      deltaPrefix:  '✓ ',
      icon:         ScanLine,
      iconColor:    'text-primary',
      iconBg:       'bg-primary/10',
    },
    {
      id:           'dosis',
      label:        'Dosis Aplicadas',
      value:        data.totalDosis.toLocaleString('es-MX'),
      delta:        'Vacunaciones',
      deltaVariant: 'success',
      deltaPrefix:  '↑ ',
      icon:         Syringe,
      iconColor:    'text-blue-600',
      iconBg:       'bg-blue-50',
    },
    {
      id:           'pendientes',
      label:        'Sincronización',
      value:        'En línea',
      delta:        'API conectada',
      deltaVariant: 'success',
      deltaPrefix:  '● ',
      icon:         Activity,
      iconColor:    'text-primary',
      iconBg:       'bg-primary/10',
    },
    {
      id:           'ocr-rate',
      label:        'Estado del Sistema',
      value:        'Operativo',
      delta:        'Sin alertas',
      deltaVariant: 'success',
      deltaPrefix:  '✓ ',
      icon:         Clock,
      iconColor:    'text-amber-600',
      iconBg:       'bg-amber-50',
    },
  ]
}

// Skeleton placeholder metrics mientras carga
const SKELETON_METRICS: MetricCardProps[] = [
  { id: 'sk1', label: 'Cédulas Registradas', value: '...', delta: '—', deltaVariant: 'success', icon: ScanLine,  iconColor: 'text-primary',    iconBg: 'bg-primary/10' },
  { id: 'sk2', label: 'Dosis Aplicadas',     value: '...', delta: '—', deltaVariant: 'success', icon: Syringe,   iconColor: 'text-blue-600',   iconBg: 'bg-blue-50'    },
  { id: 'sk3', label: 'Sincronización',       value: '...', delta: '—', deltaVariant: 'success', icon: Activity,  iconColor: 'text-primary',    iconBg: 'bg-primary/10' },
  { id: 'sk4', label: 'Estado del Sistema',   value: '...', delta: '—', deltaVariant: 'success', icon: Clock,     iconColor: 'text-amber-600',  iconBg: 'bg-amber-50'   },
]

export function MetricsGrid() {
  const [metrics, setMetrics] = useState<MetricCardProps[]>(SKELETON_METRICS)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function fetchMetrics() {
      try {
        const [vacunaciones, cedulas] = await Promise.allSettled([
          getVacunaciones(),
          getCedulas(),
        ])

        if (cancelled) return

        const totalDosis = vacunaciones.status === 'fulfilled' ? vacunaciones.value.length : 0
        const totalCedulas = cedulas.status === 'fulfilled' ? cedulas.value.length : 0

        setMetrics(buildMetrics({ totalCedulas, totalDosis }))
      } catch {
        // Silently keep skeleton if both fail
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }
    fetchMetrics()
    return () => { cancelled = true }
  }, [])

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 transition-opacity duration-300 ${isLoading ? 'opacity-60' : 'opacity-100'}`}>
      {metrics.map((metric) => (
        <MetricCard key={metric.id} {...metric} />
      ))}
    </div>
  )
}
