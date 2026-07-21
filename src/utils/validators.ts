// ─── Utils: Validators ────────────────────────────────────────────────────────
// Validadores reutilizables (whitelisting de caracteres + reglas de formato)
// para los formularios del sistema SUMS.
//
// Remediación de seguridad: ningún formulario aplicaba whitelisting de
// caracteres en campos de texto libre. Este módulo centraliza esas reglas
// usando zod para poder reutilizarlas en onChange (sanitización en tiempo
// real) y onSubmit (validación final antes de enviar al backend).

import { z } from 'zod'

export interface ValidationResult {
  valid: boolean
  error?: string
}

function toResult(result: z.ZodSafeParseResult<string>): ValidationResult {
  if (result.success) return { valid: true }
  return { valid: false, error: result.error.issues[0]?.message ?? 'Valor inválido.' }
}

// ─── Nombre / Apellidos ───────────────────────────────────────────────────────
// Solo letras (incluye acentos y ñ), espacios y guiones. Máximo 100 caracteres.
export const NOMBRE_REGEX = /^[A-Za-zÀ-ÖØ-öø-ÿÑñ][A-Za-zÀ-ÖØ-öø-ÿÑñ' -]*$/

export const nombreSchema = z
  .string()
  .trim()
  .min(1, 'Este campo es obligatorio.')
  .max(100, 'Máximo 100 caracteres.')
  .regex(NOMBRE_REGEX, 'Solo se permiten letras, espacios y guiones.')

/** Elimina en tiempo real cualquier carácter fuera del whitelist de nombres. */
export function sanitizeNombreInput(value: string): string {
  return value.replace(/[^A-Za-zÀ-ÖØ-öø-ÿÑñ' -]/g, '').slice(0, 100)
}

export function validateNombre(value: string): ValidationResult {
  return toResult(nombreSchema.safeParse(value))
}

// ─── Usuario institucional ────────────────────────────────────────────────────
// Alfanumérico + guion bajo. 3 a 50 caracteres.
export const USUARIO_REGEX = /^[A-Za-z0-9_]+$/

export const usuarioInstitucionalSchema = z
  .string()
  .trim()
  .min(3, 'El usuario debe tener al menos 3 caracteres.')
  .max(50, 'Máximo 50 caracteres.')
  .regex(USUARIO_REGEX, 'Solo se permiten letras, números y guion bajo (_).')

/** Elimina en tiempo real cualquier carácter fuera del whitelist alfanumérico. */
export function sanitizeUsuarioInput(value: string): string {
  return value.replace(/[^A-Za-z0-9_]/g, '').slice(0, 50)
}

export function validateUsuarioInstitucional(value: string): ValidationResult {
  return toResult(usuarioInstitucionalSchema.safeParse(value))
}

// ─── CLUES (Clave Única de Establecimientos de Salud) ────────────────────────
// Formato oficial: 11 caracteres — 2 letras de entidad + 9 dígitos
// (coincide con el ejemplo real usado en .env.example: VITE_UNIT_CLUES=CS071400001).
export const CLUES_REGEX = /^[A-Z]{2}\d{9}$/

export const cluesSchema = z
  .string()
  .trim()
  .toUpperCase()
  .length(11, 'El CLUES debe tener exactamente 11 caracteres.')
  .regex(CLUES_REGEX, 'Formato de CLUES inválido (2 letras + 9 dígitos, ej. CS071400001).')

/** Whitelisting en tiempo real: solo letras/números, mayúsculas, máx. 11. */
export function sanitizeCluesInput(value: string): string {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 11)
}

export function validateClues(value: string): ValidationResult {
  return toResult(cluesSchema.safeParse(value.toUpperCase()))
}

// ─── Contraseña ────────────────────────────────────────────────────────────────
// Entre 8 y 72 caracteres (72 = límite práctico de bcrypt), con mezcla de
// mayúscula, minúscula y número.
export const CONTRASENA_MAX_LENGTH = 72

export const contrasenaSchema = z
  .string()
  .min(8, 'La contraseña debe tener al menos 8 caracteres.')
  .max(CONTRASENA_MAX_LENGTH, `Máximo ${CONTRASENA_MAX_LENGTH} caracteres.`)
  .regex(/[a-z]/, 'Debe incluir al menos una letra minúscula.')
  .regex(/[A-Z]/, 'Debe incluir al menos una letra mayúscula.')
  .regex(/[0-9]/, 'Debe incluir al menos un número.')

export function validateContrasena(value: string): ValidationResult {
  return toResult(contrasenaSchema.safeParse(value))
}

// ─── Type guards en runtime para datos deserializados ────────────────────────
// (localStorage / history.state no son de confianza: pueden haber sido
// manipulados o corresponder a una versión anterior del esquema).

const userRoleSchema = z.enum(['SuperAdmin', 'Admin', 'Analista', 'User'])

const storedAuthUserSchema = z.object({
  id: z.number(),
  nombre_usuario: z.string(),
  name: z.string(),
  role: userRoleSchema,
  rol_id: z.number(),
  unidad_salud_id: z.number().nullable(),
  avatar: z.string().optional(),
})

const storedSessionSchema = z.object({
  user: storedAuthUserSchema,
  expiresAt: z.number(),
})

export type StoredSession = z.infer<typeof storedSessionSchema>

/** Parsea y valida en runtime el objeto de sesión persistido en localStorage. */
export function parseStoredSession(raw: string): StoredSession | null {
  try {
    const parsed: unknown = JSON.parse(raw)
    const result = storedSessionSchema.safeParse(parsed)
    return result.success ? result.data : null
  } catch {
    return null
  }
}

const locationFromStateSchema = z.object({
  from: z.object({ pathname: z.string() }).optional(),
})

export type LocationFromState = z.infer<typeof locationFromStateSchema>

/** Valida en runtime el `location.state` recibido de react-router antes de confiar en él. */
export function parseLocationFromState(state: unknown): LocationFromState {
  const result = locationFromStateSchema.safeParse(state)
  return result.success ? result.data : {}
}
