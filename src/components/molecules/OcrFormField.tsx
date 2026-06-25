// ─── Molecule: OcrFormField ───────────────────────────────────────────────────
// FormField especializado para validación OCR.
// Muestra estado de confianza: warning (baja confianza) | success (corregido).
// Incluye la lógica de sugerencia con clic-para-aceptar.

import { AlertTriangle, CheckCircle2, Info } from 'lucide-react'
import { Input } from '../atoms/Input'
import { Badge } from '../atoms/Badge'
import type { InputHTMLAttributes } from 'react'

export type OcrConfidence = 'normal' | 'low' | 'corrected'

export interface OcrFormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  htmlFor: string
  confidence?: OcrConfidence
  suggestion?: string
  onAcceptSuggestion?: () => void
}

const CONFIDENCE_BADGE: Record<OcrConfidence, { label: string; icon: typeof AlertTriangle } | null> = {
  normal:    null,
  low:       { label: 'Baja confianza', icon: AlertTriangle },
  corrected: { label: 'Corregido',      icon: CheckCircle2  },
}

export function OcrFormField({
  label,
  htmlFor,
  confidence = 'normal',
  suggestion,
  onAcceptSuggestion,
  ...inputProps
}: OcrFormFieldProps) {
  const inputState =
    confidence === 'low'       ? 'warning' :
    confidence === 'corrected' ? 'success' :
    'default'

  const badge = CONFIDENCE_BADGE[confidence]
  const BadgeIcon = badge?.icon

  return (
    <div className="space-y-1">
      {/* Label row */}
      <div className="flex items-center justify-between">
        <label
          htmlFor={htmlFor}
          className="text-xs font-semibold text-gray-600 uppercase tracking-wide"
        >
          {label}
        </label>
        {badge && BadgeIcon && (
          <Badge variant={confidence === 'low' ? 'warning' : 'success'}>
            <BadgeIcon size={10} />
            {badge.label}
          </Badge>
        )}
      </div>

      {/* Input with optional left icon */}
      <Input
        id={htmlFor}
        inputState={inputState}
        leftAddon={
          confidence === 'low' ? (
            <AlertTriangle size={14} className="text-amber-500" />
          ) : undefined
        }
        {...inputProps}
      />

      {/* Suggestion link */}
      {confidence === 'low' && suggestion && (
        <button
          type="button"
          onClick={onAcceptSuggestion}
          className="flex items-center gap-1 text-xs text-primary hover:text-primary-dark underline decoration-dashed underline-offset-2 transition-colors"
        >
          <Info size={11} className="flex-shrink-0" />
          <span>
            Sugerencia OCR: <strong>"{suggestion}"</strong> — Clic para corregir
          </span>
        </button>
      )}
    </div>
  )
}
