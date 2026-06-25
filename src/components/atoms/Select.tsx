// ─── Atom: Select ─────────────────────────────────────────────────────────────
// Select nativo estilizado. Acepta children como <option> normales.

import type { SelectHTMLAttributes } from 'react'

export interface SelectOption {
  value: string
  label: string
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  options: SelectOption[]
}

export function Select({ options, className = '', ...props }: SelectProps) {
  return (
    <select
      className={[
        'w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-800',
        'bg-white appearance-none',
        'focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary',
        'transition-all duration-200',
        'cursor-pointer',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  )
}
