// ─── Molecule: MetricCard ─────────────────────────────────────────────────────
// Tarjeta de métrica KPI individual para el Dashboard.
// Combina: icono, label, valor, badge de delta.

import type { ElementType } from 'react'
import { Badge } from '../atoms/Badge'
import type { BadgeVariant } from '../atoms/Badge'

export interface MetricCardProps {
  id: string
  label: string
  value: string
  delta: string
  deltaVariant: BadgeVariant
  deltaPrefix?: string
  icon: ElementType
  iconColor: string
  iconBg: string
  alert?: boolean
}

export function MetricCard({
  id,
  label,
  value,
  delta,
  deltaVariant,
  deltaPrefix = '',
  icon: Icon,
  iconColor,
  iconBg,
  alert = false,
}: MetricCardProps) {
  return (
    <article
      id={`metric-card-${id}`}
      className={[
        'bg-white rounded-xl p-5 shadow-sm border transition-shadow duration-200 hover:shadow-md',
        alert ? 'border-amber-200 bg-amber-50/30' : 'border-gray-100',
      ].join(' ')}
    >
      {/* Top row: icon + badge */}
      <div className="flex items-start justify-between mb-3">
        <div className={`${iconBg} p-2 rounded-lg`}>
          <Icon size={18} className={iconColor} strokeWidth={1.8} />
        </div>
        <Badge variant={deltaVariant}>
          {deltaPrefix}{delta}
        </Badge>
      </div>

      {/* Label */}
      <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider leading-tight">
        {label}
      </p>

      {/* Value */}
      <p className={`text-2xl font-bold mt-1 ${alert ? 'text-amber-600' : 'text-gray-900'}`}>
        {value}
      </p>
    </article>
  )
}
