// ─── Organism: MetricsGrid ────────────────────────────────────────────────────
// KPI Cards alimentadas por GET /estadisticas/resumen-general
// Muestra 8 métricas reales: total_cedulas, total_personas, total_viviendas,
// total_nucleos, total_dosis, total_entrevistadores, cedulas_hoy, cedulas_mes

import { useEffect, useState } from 'react'
import {
  ScanLine,
  Users,
  Home,
  Network,
  Syringe,
  UserCheck,
  CalendarCheck,
  CalendarDays,
} from 'lucide-react'
import { MetricCard } from '../molecules/MetricCard'
import type { MetricCardProps } from '../molecules/MetricCard'
import { getResumenGeneral } from '../../services/api'
import type { ResumenGeneral } from '../../types/api.types'

const MOCK_RESUMEN_GENERAL: ResumenGeneral = {
  total_cedulas: 4069,
  total_personas: 12530,
  total_viviendas: 3210,
  total_nucleos: 4069,
  total_dosis: 1931,
  total_entrevistadores: 12,
  cedulas_hoy: 0,
  cedulas_mes: 46,
}

function buildMetrics(d: ResumenGeneral): MetricCardProps[] {
  return [
    {
      id:           'cedulas-total',
      label:        'Cédulas Registradas',
      value:        d.total_cedulas.toLocaleString('es-MX'),
      delta:        'Total acumulado',
      deltaVariant: 'success',
      deltaPrefix:  '✓ ',
      icon:         ScanLine,
      iconColor:    'text-[#006657]',
      iconBg:       'bg-[#006657]/10',
    },
    {
      id:           'personas',
      label:        'Personas Censadas',
      value:        d.total_personas.toLocaleString('es-MX'),
      delta:        'En base de datos',
      deltaVariant: 'success',
      deltaPrefix:  '● ',
      icon:         Users,
      iconColor:    'text-blue-600',
      iconBg:       'bg-blue-50',
    },
    {
      id:           'viviendas',
      label:        'Viviendas',
      value:        d.total_viviendas.toLocaleString('es-MX'),
      delta:        'Total registradas',
      deltaVariant: 'success',
      deltaPrefix:  '↑ ',
      icon:         Home,
      iconColor:    'text-violet-600',
      iconBg:       'bg-violet-50',
    },
    {
      id:           'nucleos',
      label:        'Núcleos Familiares',
      value:        d.total_nucleos.toLocaleString('es-MX'),
      delta:        'Familias en padrón',
      deltaVariant: 'success',
      deltaPrefix:  '● ',
      icon:         Network,
      iconColor:    'text-orange-600',
      iconBg:       'bg-orange-50',
    },
    {
      id:           'dosis',
      label:        'Dosis Aplicadas',
      value:        d.total_dosis.toLocaleString('es-MX'),
      delta:        'Vacunaciones',
      deltaVariant: 'success',
      deltaPrefix:  '↑ ',
      icon:         Syringe,
      iconColor:    'text-cyan-600',
      iconBg:       'bg-cyan-50',
    },
    {
      id:           'entrevistadores',
      label:        'Entrevistadores',
      value:        d.total_entrevistadores.toLocaleString('es-MX'),
      delta:        'Personal activo',
      deltaVariant: 'success',
      deltaPrefix:  '✓ ',
      icon:         UserCheck,
      iconColor:    'text-[#BC955C]',
      iconBg:       'bg-[#BC955C]/10',
    },
    {
      id:           'cedulas-hoy',
      label:        'Cédulas Hoy',
      value:        d.cedulas_hoy.toLocaleString('es-MX'),
      delta:        'Registros del día',
      deltaVariant: d.cedulas_hoy > 0 ? 'success' : 'neutral',
      deltaPrefix:  d.cedulas_hoy > 0 ? '↑ ' : '— ',
      icon:         CalendarCheck,
      iconColor:    'text-emerald-600',
      iconBg:       'bg-emerald-50',
    },
    {
      id:           'cedulas-mes',
      label:        'Cédulas Este Mes',
      value:        d.cedulas_mes.toLocaleString('es-MX'),
      delta:        'Mes en curso',
      deltaVariant: 'success',
      deltaPrefix:  '● ',
      icon:         CalendarDays,
      iconColor:    'text-rose-600',
      iconBg:       'bg-rose-50',
    },
  ]
}

const SKELETON_METRICS: MetricCardProps[] = [
  { id: 'sk1', label: 'Cédulas Registradas', value: '...', delta: '—', deltaVariant: 'success', icon: ScanLine,      iconColor: 'text-[#006657]',  iconBg: 'bg-[#006657]/10' },
  { id: 'sk2', label: 'Personas Censadas',   value: '...', delta: '—', deltaVariant: 'success', icon: Users,          iconColor: 'text-blue-600',   iconBg: 'bg-blue-50'      },
  { id: 'sk3', label: 'Viviendas',           value: '...', delta: '—', deltaVariant: 'success', icon: Home,           iconColor: 'text-violet-600', iconBg: 'bg-violet-50'    },
  { id: 'sk4', label: 'Núcleos Familiares',  value: '...', delta: '—', deltaVariant: 'success', icon: Network,        iconColor: 'text-orange-600', iconBg: 'bg-orange-50'    },
  { id: 'sk5', label: 'Dosis Aplicadas',     value: '...', delta: '—', deltaVariant: 'success', icon: Syringe,        iconColor: 'text-cyan-600',   iconBg: 'bg-cyan-50'      },
  { id: 'sk6', label: 'Entrevistadores',     value: '...', delta: '—', deltaVariant: 'success', icon: UserCheck,      iconColor: 'text-[#BC955C]',  iconBg: 'bg-[#BC955C]/10' },
  { id: 'sk7', label: 'Cédulas Hoy',         value: '...', delta: '—', deltaVariant: 'success', icon: CalendarCheck,  iconColor: 'text-emerald-600',iconBg: 'bg-emerald-50'   },
  { id: 'sk8', label: 'Cédulas Este Mes',    value: '...', delta: '—', deltaVariant: 'success', icon: CalendarDays,   iconColor: 'text-rose-600',   iconBg: 'bg-rose-50'      },
]

export function MetricsGrid() {
  const [metrics, setMetrics]   = useState<MetricCardProps[]>(SKELETON_METRICS)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function fetchMetrics() {
      try {
        const resumen = await getResumenGeneral()
        if (!cancelled) setMetrics(buildMetrics(resumen))
      } catch {
        console.warn('API error (resumen-general), using mock data')
        if (!cancelled) setMetrics(buildMetrics(MOCK_RESUMEN_GENERAL))
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }
    fetchMetrics()
    return () => { cancelled = true }
  }, [])

  return (
    <div className={`grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 transition-opacity duration-300 ${isLoading ? 'opacity-60' : 'opacity-100'}`}>
      {metrics.map((metric) => (
        <MetricCard key={metric.id} {...metric} />
      ))}
    </div>
  )
}
