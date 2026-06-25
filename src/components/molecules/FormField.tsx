// ─── Molecule: FormField ──────────────────────────────────────────────────────
// Combina: Label + Input (atom) + mensaje de error/ayuda.
// Es el bloque estándar para cualquier formulario de la app.

import type { ReactNode } from 'react'
import { Input } from '../atoms/Input'
import type { InputProps } from '../atoms/Input'

export interface FormFieldProps extends InputProps {
  label: string
  htmlFor: string
  helperText?: string
  errorText?: string
  rightLabel?: ReactNode
}

export function FormField({
  label,
  htmlFor,
  helperText,
  errorText,
  rightLabel,
  inputState,
  ...inputProps
}: FormFieldProps) {
  const state = errorText ? 'error' : (inputState ?? 'default')

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label htmlFor={htmlFor} className="block text-sm font-medium text-gray-700">
          {label}
        </label>
        {rightLabel && <span className="text-xs">{rightLabel}</span>}
      </div>

      <Input id={htmlFor} inputState={state} {...inputProps} />

      {errorText && (
        <p className="text-xs text-red-600 mt-1">{errorText}</p>
      )}
      {!errorText && helperText && (
        <p className="text-xs text-gray-500 mt-1">{helperText}</p>
      )}
    </div>
  )
}
