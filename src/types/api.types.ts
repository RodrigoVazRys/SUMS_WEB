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

// ── Estadísticas — Operación ──────────────────────────────────────────────────
export interface ResumenGeneral {
  total_cedulas:         number
  total_personas:        number
  total_viviendas:       number
  total_nucleos:         number
  total_dosis:           number
  total_entrevistadores: number
  cedulas_hoy:           number
  cedulas_mes:           number
}

export interface ProductividadEntrevistador {
  id_entrevistador: number
  nombre:           string
  alta:             string
  total:            number
  hoy:              number
  semana:           number
  mes:              number
  ultima_actividad: string | null
}

export interface CedulaSerieItem {
  periodo: string
  total:   number
}

export interface CedulaEstadoItem {
  estado: string
  total:  number
}

export interface CedulaPorUnidadItem {
  id_unidad_salud: number
  nombre:          string
  total:           number
}

export interface CedulaPorLocalidadItem {
  localidad: string
  total:     number
}

export interface CedulaPorColoniaItem {
  colonia: string
  total:   number
}

export interface NucleoTamanoItem {
  tamano: number
  total:  number
}

// ── Estadísticas — Demografía ─────────────────────────────────────────────────
export interface PiramideItem {
  rango_edad: string
  sexo:       string
  total:      number
}

export interface GeneroItem {
  sexo:  string
  total: number
}

export interface EscolaridadItem {
  nombre: string
  total:  number
}

export interface AlfabetizacionData {
  alfabetizados:    number
  no_alfabetizados: number
  sin_dato:         number
}

export interface LenguaIndigenaItem {
  lengua: string
  total:  number
}

export interface IngresoItem {
  rango: string
  total: number
}

export interface OcupacionItem {
  nombre: string
  total:  number
}

export interface EstadoCivilItem {
  nombre: string
  total:  number
}

// ── Estadísticas — Salud ──────────────────────────────────────────────────────
export interface EnfermedadCronicaItem {
  nombre:   string
  personas: number
}

export interface ToxicomaniaItem {
  nombre:   string
  personas: number
}

export interface DiscapacidadData {
  resumen: {
    con_discapacidad:  number
    sin_discapacidad:  number
  }
  por_tipo: Array<{ tipo: string; total: number }>
}

export interface SaludPreventivaData {
  resumen: {
    tamizaje_cervico_uterino: number
    tamizaje_cancer_mama:     number
    con_atencion_embarazo:    number
    total_registros:          number
  }
  por_atencion_embarazo: Array<{ nombre: string; total: number }>
}

export interface SeguridadSocialData {
  con_seguridad: number
  sin_seguridad: number
}

export interface AlimentacionData {
  promedio_dias_proteina:         number
  promedio_dias_frutas_verduras:  number
  promedio_dias_cereales:         number
  total_registros:                number
}

export interface ServicioSaludItem {
  nombre: string
  total:  number
}

export interface HigieneBucodentalData {
  diaria:    number
  no_diaria: number
  sin_dato:  number
  total:     number
}

export interface PiramideVacunaItem {
  rango_edad: string
  sexo:       string
  total:      number
}

// ── Estadísticas — Vivienda ───────────────────────────────────────────────────
export interface ViviendaServiciosData {
  total_viviendas:      number
  con_agua:             number
  sin_agua:             number
  con_luz:              number
  sin_luz:              number
  con_alcantarillado:   number
  sin_alcantarillado:   number
  con_fosa_septica:     number
}

export interface HacinamientoData {
  viviendas_hacinadas:        number
  viviendas_no_hacinadas:     number
  sin_dato:                   number
  promedio_personas_por_cuarto: number
}

export interface MaterialesRiesgoData {
  piso_tierra:          number
  cocina_con_lena:      number
  cocina_en_dormitorio: number
  total_viviendas:      number
}

export interface AnimalesData {
  por_animal: Array<{ nombre: string; total: number }>
  mascotas: {
    con_perros_gatos_dentro: number
    mascotas_sin_vacunar:    number
    mascotas_esterilizadas:  number
  }
}

// ── Personas ──────────────────────────────────────────────────────────────────
export interface Persona {
  id: number
  primer_nombre: string
  segundo_nombre?: string | null
  apellido_paterno: string
  apellido_materno?: string | null
  fecha_nacimiento: string
  edad: number
  sexo: string                        // 'masculino' | 'femenino'
  alfabetizacion?: boolean | null
  estado_civil_id?: number | null
  lengua_id?: number | null
  escolaridad_id?: number | null
  ocupacion_id?: number | null
  ocupacion_texto?: string | null
  ingreso_salarial_id?: number | null
  cuenta_seguridad_social?: boolean | null
  presenta_discapacidad?: boolean | null
  tipo_discapacidad?: string | null
  fecha_registro?: string | null
}
