// ─── Atom: Input ──────────────────────────────────────────────────────────────
// Input de texto base. Sin label, sin mensajes de error (eso va en FormField).
// Expone variantes de estado: default | warning | success | error

import type { InputHTMLAttributes, ReactNode } from 'react'

export type InputState = 'default' | 'warning' | 'success' | 'error'

const STATE_CLASSES: Record<InputState, string> = {
  default: 'border-gray-300 focus:border-primary focus:ring-primary/30',
  warning: 'border-amber-500 bg-amber-50/30 focus:border-amber-500 focus:ring-amber-400/30 animate-pulse-border',
  success: 'border-green-500 bg-green-50/30 focus:border-green-500 focus:ring-green-400/30',
  error:   'border-red-400 bg-red-50/20 focus:border-red-500 focus:ring-red-300/30',
}

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  inputState?: InputState
  leftAddon?: ReactNode
  rightAddon?: ReactNode
}

export function Input({
  inputState = 'default',
  leftAddon,
  rightAddon,
  className = '',
  ...props
}: InputProps) {
  return (
    <div className="relative flex items-center">
      {leftAddon && (
        <span className="absolute left-3 text-gray-400 flex items-center pointer-events-none">
          {leftAddon}
        </span>
      )}
      <input
        className={[
          'w-full px-3 py-2.5 border rounded-lg text-sm text-gray-800',
          'bg-white placeholder-gray-400',
          'focus:outline-none focus:ring-2 transition-all duration-200',
          STATE_CLASSES[inputState],
          leftAddon  ? 'pl-9'  : '',
          rightAddon ? 'pr-10' : '',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        {...props}
      />
      {rightAddon && (
        <span className="absolute right-3 flex items-center">
          {rightAddon}
        </span>
      )}
    </div>
  )
}
