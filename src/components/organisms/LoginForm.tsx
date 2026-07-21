// ─── Organism: LoginForm ──────────────────────────────────────────────────────
// Formulario de inicio de sesión real (nombre_usuario + contraseña).
// Integrado con la API SUMS vía AuthContext.
// Error de acceso denegado (rol 3/4) se muestra en alerta guinda especial.

import { useState } from 'react'
import { Eye, EyeOff, ArrowRight, AlertCircle, User, Lock, ShieldX } from 'lucide-react'
import { Button } from '../atoms/Button'
import { Logo } from '../atoms/Logo'
import { FormField } from '../molecules/FormField'
import { sanitizeUsuarioInput, CONTRASENA_MAX_LENGTH } from '../../utils/validators'

export interface LoginFormSubmitPayload {
  email: string      // mantenido por compatibilidad con LoginPage — mapea a nombre_usuario
  password: string
}

export interface LoginFormProps {
  onSubmit: (payload: LoginFormSubmitPayload) => Promise<{ error?: string; isDenied?: boolean }>
}

export function LoginForm({ onSubmit }: LoginFormProps) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd]   = useState(false)
  const [error, setError]       = useState<string | null>(null)
  const [isDenied, setIsDenied] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setIsDenied(false)

    if (!username.trim() || !password.trim()) {
      setError('Por favor complete todos los campos.')
      return
    }

    setIsLoading(true)
    const result = await onSubmit({ email: username.trim(), password })
    setIsLoading(false)

    if (result.error) {
      setError(result.error)
      setIsDenied(result.isDenied ?? false)
    }
  }

  function clearError() {
    if (error) { setError(null); setIsDenied(false) }
  }

  return (
    <section aria-label="Formulario de acceso" className="w-full max-w-sm space-y-7 animate-fade-in">
      {/* Mobile-only logo */}
      <div className="lg:hidden flex justify-center">
        <Logo size="sm" />
      </div>

      {/* Heading */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Bienvenido</h2>
        <p className="mt-1.5 text-sm text-gray-500 leading-relaxed">
          Ingrese sus credenciales institucionales para acceder al sistema operativo.
        </p>
      </div>

      {/* Error alert — Acceso denegado (guinda) */}
      {error && isDenied && (
        <div
          role="alert"
          className="flex items-start gap-3 bg-guinda-50 border border-guinda-200 rounded-xl px-4 py-3 animate-fade-in"
          style={{ backgroundColor: '#fdf2f4', borderColor: '#f3c0c9' }}
        >
          <ShieldX size={16} className="mt-0.5 flex-shrink-0" style={{ color: '#691C32' }} aria-hidden="true" />
          <p className="text-sm leading-snug font-medium" style={{ color: '#691C32' }}>{error}</p>
        </div>
      )}

      {/* Error alert — Credenciales incorrectas (rojo) */}
      {error && !isDenied && (
        <div
          role="alert"
          className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3 animate-fade-in"
        >
          <AlertCircle size={16} className="text-red-500 mt-0.5 flex-shrink-0" aria-hidden="true" />
          <p className="text-sm text-red-700 leading-snug">{error}</p>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <FormField
          label="Nombre de usuario"
          htmlFor="login-username"
          type="text"
          autoComplete="username"
          placeholder="usuario_institucional"
          value={username}
          onChange={(e) => { setUsername(sanitizeUsuarioInput(e.target.value)); clearError() }}
          maxLength={50}
          leftAddon={<User size={15} />}
          disabled={isLoading}
        />

        <FormField
          label="Contraseña"
          htmlFor="login-password"
          type={showPwd ? 'text' : 'password'}
          autoComplete="current-password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => { setPassword(e.target.value); clearError() }}
          maxLength={CONTRASENA_MAX_LENGTH}
          leftAddon={<Lock size={15} />}
          rightAddon={
            <button
              type="button"
              onClick={() => setShowPwd((v) => !v)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label={showPwd ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              tabIndex={-1}
            >
              {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          }
          rightLabel={
            <button type="button" className="text-primary hover:underline font-medium">
              Olvidé mi contraseña
            </button>
          }
          disabled={isLoading}
        />

        <Button
          id="login-submit-btn"
          type="submit"
          fullWidth
          isLoading={isLoading}
          rightIcon={!isLoading ? <ArrowRight size={16} /> : undefined}
          className="mt-2"
        >
          {isLoading ? 'Verificando...' : 'Ingresar'}
        </Button>
      </form>

      {/* Help link */}
      <p className="text-center text-xs text-gray-500">
        ¿Problemas para acceder?{' '}
        <a href="mailto:soporte@sums.gob.mx" className="text-primary font-medium hover:underline">
          Contactar a soporte IT
        </a>
      </p>
    </section>
  )
}
