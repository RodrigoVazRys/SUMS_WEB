// ─── Types: API ───────────────────────────────────────────────────────────────
// Interfaces TypeScript derivadas del schema Swagger de la API SUMS.
// Fuente de verdad: https://sums-api.troy.engineer/sums/api-docs

// ── Auth ──────────────────────────────────────────────────────────────────────
export interface LoginRequest {
  nombre_usuario: string
  contrasena: string
}

export interface LoginResponseUser {
  id: number
  nombre_usuario: string
  rol_id: number
  fecha_registro: string | null
  activo: boolean
  unidad_salud_id: number | null
  datos_laborales_id: number | null
}

export interface LoginResponse {
  token: string
  user: LoginResponseUser
}

// ── Usuarios ──────────────────────────────────────────────────────────────────
export interface Usuario {
  id: number
  nombre_usuario: string
  contrasena?: string
  rol_id: number
  fecha_registro?: string
  activo?: boolean
  unidad_salud_id?: number | null
  datos_laborales_id?: number | null
}

export interface RegisterUserRequest {
  nombre_usuario: string
  contrasena: string
  rol_id: number
}

export interface UpdateUserRoleRequest {
  rol_id: number
}

// ── UnidadSalud ───────────────────────────────────────────────────────────────
export interface UnidadSalud {
  id?: number
  clues: string
  nombre: string
  distrito?: string | null
  municipio_id?: number | null
  numero_nucleos?: number | null
}

// ── Cedula ────────────────────────────────────────────────────────────────────
export type CedulaEstado = 'borrador' | 'sincronizada' | 'validada' | 'cerrada'

export interface Cedula {
  id?: number
  unidad_salud_id: number
  entrevistador_id: number
  levantamiento_id?: number | null
  nucleo_familiar_id: number
  fecha_registro: string // format: date
  estado: CedulaEstado
  observaciones?: string | null
}

// ── Catálogos ─────────────────────────────────────────────────────────────────
export interface CatalogoItem {
  id: number
  nombre: string
  descripcion?: string | null
}

export type CatalogoKey =
  | 'estado-civil'
  | 'parentesco'
  | 'lengua'
  | 'escolaridad'
  | 'ocupacion'
  | 'ingreso-salarial'
  | 'discapacidad'
  | 'material'
  | 'tipo-material-vivienda'
  | 'servicio-vivienda'
  | 'manejo-excretas'
  | 'animal'
  | 'toxicomania'
  | 'enfermedad-cronica'
  | 'alimentacion'
  | 'frecuencia-servicio-salud'
  | 'atencion-embarazo'
  | 'vacuna'
  | 'dosis'

// ── Estadísticas de Vacunación ────────────────────────────────────────────────
export interface VacunacionPorSexoDTO {
  sexo: string
  vacuna: string
  total_aplicaciones: number
}

export interface VacunacionPorRangoEdadDTO {
  rango_edad: string
  vacuna: string
  total_aplicaciones: number
}

export interface VacunaDosisAplicacionDTO {
  vacuna: string
  dosis: string
  total_aplicaciones: number
}

export interface PersonasVacunadasPorVacunaDTO {
  vacuna: string
  total_personas: number
}

export interface AplicacionesPorAnioVacunaDTO {
  anio: number
  vacuna: string
  total_aplicaciones: number
}

export interface DosisPorPersonaDTO {
  nombre_completo: string
  total_dosis_aplicadas: number
}

// ── Vacunacion (Inmunización) ──────────────────────────────────────────────────
export interface Vacunacion {
  id?: number
  esquema_vacunacion_id: number
  cedula_id?: number | null
  vacuna_id: number
  dosis_id?: number | null
  fecha_aplicacion?: string | null
}
