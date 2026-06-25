// ─── Molecule: Toast ──────────────────────────────────────────────────────────
// Notificación flotante tipo snackbar (slide-in desde la derecha).
// Variantes: success | error | warning | info

import { X, CheckCircle2, AlertCircle, AlertTriangle, Info } from 'lucide-react'
import { Button } from '../atoms/Button'

export type ToastVariant = 'success' | 'error' | 'warning' | 'info'

const VARIANT_CONFIG: Record<
  ToastVariant,
  { icon: typeof CheckCircle2; iconColor: string; iconBg: string; border: string }
> = {
  success: { icon: CheckCircle2,  iconColor: 'text-green-600', iconBg: 'bg-green-100',  border: 'border-green-200' },
  error:   { icon: AlertCircle,   iconColor: 'text-red-600',   iconBg: 'bg-red-100',    border: 'border-red-200'   },
  warning: { icon: AlertTriangle, iconColor: 'text-amber-600', iconBg: 'bg-amber-100',  border: 'border-amber-200' },
  info:    { icon: Info,          iconColor: 'text-blue-600',  iconBg: 'bg-blue-100',   border: 'border-blue-200'  },
}

export interface ToastProps {
  message: string
  variant?: ToastVariant
  onClose: () => void
}

export function Toast({ message, variant = 'success', onClose }: ToastProps) {
  const cfg = VARIANT_CONFIG[variant]
  const Icon = cfg.icon

  return (
    <div
      role="alert"
      aria-live="polite"
      className="fixed bottom-6 right-6 z-50 toast-enter max-w-sm w-full"
    >
      <div
        className={[
          'flex items-start gap-3 bg-white shadow-xl rounded-xl px-5 py-4',
          'border', cfg.border,
        ].join(' ')}
      >
        <div className={`w-9 h-9 ${cfg.iconBg} rounded-full flex items-center justify-center flex-shrink-0`}>
          <Icon size={18} className={cfg.iconColor} />
        </div>
        <p className="flex-1 text-sm font-medium text-gray-800 pt-1">{message}</p>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          aria-label="Cerrar notificación"
          className="p-1 -mt-0.5 -mr-1 text-gray-400 hover:text-gray-600"
        >
          <X size={14} />
        </Button>
      </div>
    </div>
  )
}
