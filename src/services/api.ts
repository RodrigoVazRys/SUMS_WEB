// ─── Service: API Client ──────────────────────────────────────────────────────
// Instancia de axios configurada con:
//   - baseURL apuntando a la API de producción SUMS
//   - Interceptor de solicitudes: inyecta JWT desde localStorage
//   - Interceptor de respuestas: en 401 limpia sesión y redirige a /login

import axios from 'axios'
import { getMockDataForUrl } from './mockApi'
import type {
  LoginRequest,
  LoginResponse,
  Usuario,
  RegisterUserRequest,
  UnidadSalud,
  Cedula,
  CatalogoItem,
  CatalogoKey,
  VacunacionPorSexoDTO,
  VacunacionPorRangoEdadDTO,
  Vacunacion,
  VacunaDosisAplicacionDTO,
  Persona,
  // ── Estadísticas Operación ──────────────────────
  ResumenGeneral,
  ProductividadEntrevistador,
  CedulaSerieItem,
  CedulaEstadoItem,
  CedulaPorUnidadItem,
  CedulaPorLocalidadItem,
  CedulaPorColoniaItem,
  NucleoTamanoItem,
  // ── Estadísticas Demografía ─────────────────────
  PiramideItem,
  GeneroItem,
  EscolaridadItem,
  AlfabetizacionData,
  LenguaIndigenaItem,
  IngresoItem,
  OcupacionItem,
  EstadoCivilItem,
  // ── Estadísticas Salud ──────────────────────────
  EnfermedadCronicaItem,
  ToxicomaniaItem,
  DiscapacidadData,
  SaludPreventivaData,
  SeguridadSocialData,
  AlimentacionData,
  ServicioSaludItem,
  HigieneBucodentalData,
  PiramideVacunaItem,
  // ── Estadísticas Vivienda ───────────────────────
  ViviendaServiciosData,
  HacinamientoData,
  MaterialesRiesgoData,
  AnimalesData,
} from '../types/api.types'

// ─── Constants ────────────────────────────────────────────────────────────────
export const TOKEN_KEY = 'sums_token'
export const AUTH_USER_KEY = 'sums_auth_user'

// ─── Axios instance ───────────────────────────────────────────────────────────
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'https://sums-api.troy.engineer/sums',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
})

// ─── Request interceptor — inject JWT ────────────────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(TOKEN_KEY)
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error),
)

// ─── Response interceptor — handle 401 ───────────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(AUTH_USER_KEY)
      window.location.href = '/login'
    }

    // FALLBACK TO MOCK DATA IF API FAILS (Para exposiciones)
    const url = error.config?.url || ''
    if (url.includes('/estadisticas') || url.includes('/vacunaciones')) {
      const mockData = getMockDataForUrl(url)
      if (mockData) {
        console.warn(`[SUMS API] Endpoint ${url} failed. Usando datos simulados para la expo.`)
        return Promise.resolve({
          data: mockData,
          status: 200,
          statusText: 'OK',
          headers: {},
          config: error.config,
        })
      }
    }

    return Promise.reject(error)
  },
)

// ─── Auth endpoints ───────────────────────────────────────────────────────────
export async function loginApi(payload: LoginRequest): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse>('/login', payload)
  return data
}

// ─── Users endpoints ──────────────────────────────────────────────────────────
export async function getUsers(): Promise<Usuario[]> {
  const { data } = await api.get<Usuario[]>('/users')
  return data
}

export async function getUserById(id: number): Promise<Usuario> {
  const { data } = await api.get<Usuario>(`/users/${id}`)
  return data
}

export async function registerUser(payload: RegisterUserRequest): Promise<Usuario> {
  const { data } = await api.post<Usuario>('/users/admin/register', payload)
  return data
}

export async function updateUserRole(id: number, rol_id: number): Promise<void> {
  await api.put(`/users/${id}/role`, { rol_id })
}

// ─── UnidadSalud endpoints ────────────────────────────────────────────────────
export async function getUnidadesSalud(): Promise<UnidadSalud[]> {
  const { data } = await api.get<UnidadSalud[]>('/unidadSalud')
  return data
}

export async function createUnidadSalud(payload: Omit<UnidadSalud, 'id'>): Promise<UnidadSalud> {
  const { data } = await api.post<UnidadSalud>('/unidadSalud', payload)
  return data
}

export async function updateUnidadSalud(id: number, payload: Partial<Omit<UnidadSalud, 'id'>>): Promise<UnidadSalud> {
  const { data } = await api.put<UnidadSalud>(`/unidadSalud/${id}`, payload)
  return data
}

export async function deleteUnidadSalud(id: number): Promise<void> {
  await api.delete(`/unidadSalud/${id}`)
}

// ─── Cedulas endpoints ────────────────────────────────────────────────────────
export async function getCedulas(): Promise<Cedula[]> {
  const { data } = await api.get<Cedula[]>('/cedulas')
  return data
}

export async function postCedula(payload: Omit<Cedula, 'id'>): Promise<Cedula> {
  const { data } = await api.post<Cedula>('/cedulas', payload)
  return data
}

// ─── Catalogos endpoints ──────────────────────────────────────────────────────
export async function getCatalogo(catalogo: CatalogoKey): Promise<CatalogoItem[]> {
  const { data } = await api.get<CatalogoItem[]>(`/catalogos/${catalogo}`)
  return data
}

// ─── Estadísticas de Vacunación ───────────────────────────────────────────────
export async function getVacunaciones(): Promise<Vacunacion[]> {
  const { data } = await api.get<Vacunacion[]>('/vacunaciones')
  return data
}

export async function getVacunacionesPorSexo(sexo: 'M' | 'F'): Promise<VacunacionPorSexoDTO[]> {
  const { data } = await api.get<VacunacionPorSexoDTO[]>(`/vacunaciones/por-sexo/${sexo}`)
  return data
}

export async function getVacunacionesPorRangoEdad(): Promise<VacunacionPorRangoEdadDTO[]> {
  const { data } = await api.get<VacunacionPorRangoEdadDTO[]>('/vacunaciones/por-rango-edad')
  return data
}

export async function getVacunacionesPorVacunaDosis(): Promise<VacunaDosisAplicacionDTO[]> {
  const { data } = await api.get<VacunaDosisAplicacionDTO[]>('/vacunaciones/por-vacuna-dosis')
  return data
}

// ─── Personas endpoints ───────────────────────────────────────────────────────
export async function getPersonas(): Promise<Persona[]> {
  const { data } = await api.get<Persona[]>('/personas')
  return data
}

// getVacunacionesPorGenero era un duplicado incorrecto que enviaba 'masculino'/'femenino'
// directamente en la URL, causando 400 Bad Request. Se elimina; usar getVacunacionesPorSexo('M'/'F').

// ─────────────────────────────────────────────────────────────────────────────
// ─── ESTADÍSTICAS — OPERACIÓN (8 endpoints web) ───────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────

/** GET /estadisticas/resumen-general — KPIs del dashboard */
export async function getResumenGeneral(): Promise<ResumenGeneral> {
  const { data } = await api.get<ResumenGeneral>('/estadisticas/resumen-general')
  return data
}

/** GET /estadisticas/productividad/entrevistadores — Ranking de productividad */
export async function getProductividadEntrevistadores(): Promise<ProductividadEntrevistador[]> {
  const { data } = await api.get<ProductividadEntrevistador[]>('/estadisticas/productividad/entrevistadores')
  return data
}

/** GET /estadisticas/cedulas/serie?agrupar=dia|semana|mes — Tendencia temporal */
export async function getCedulasSerie(agrupar: 'dia' | 'semana' | 'mes' = 'mes'): Promise<CedulaSerieItem[]> {
  const { data } = await api.get<CedulaSerieItem[]>('/estadisticas/cedulas/serie', { params: { agrupar } })
  return data
}

/** GET /estadisticas/cedulas/por-estado — Embudo de validación */
export async function getCedulasPorEstado(): Promise<CedulaEstadoItem[]> {
  const { data } = await api.get<CedulaEstadoItem[]>('/estadisticas/cedulas/por-estado')
  return data
}

/** GET /estadisticas/cedulas/por-unidad — Cédulas por unidad de salud */
export async function getCedulasPorUnidad(): Promise<CedulaPorUnidadItem[]> {
  const { data } = await api.get<CedulaPorUnidadItem[]>('/estadisticas/cedulas/por-unidad')
  return data
}

/** GET /estadisticas/cedulas/por-localidad — Cédulas por localidad */
export async function getCedulasPorLocalidad(): Promise<CedulaPorLocalidadItem[]> {
  const { data } = await api.get<CedulaPorLocalidadItem[]>('/estadisticas/cedulas/por-localidad')
  return data
}

/** GET /estadisticas/cedulas/por-colonia — Cédulas por colonia */
export async function getCedulasPorColonia(): Promise<CedulaPorColoniaItem[]> {
  const { data } = await api.get<CedulaPorColoniaItem[]>('/estadisticas/cedulas/por-colonia')
  return data
}

/** GET /estadisticas/cedulas/nucleos-tamano — Histograma tamaño de núcleo familiar */
export async function getNucleosTamano(): Promise<NucleoTamanoItem[]> {
  const { data } = await api.get<NucleoTamanoItem[]>('/estadisticas/cedulas/nucleos-tamano')
  return data
}

// ─────────────────────────────────────────────────────────────────────────────
// ─── ESTADÍSTICAS — DEMOGRAFÍA (8 endpoints) ──────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────

/** GET /estadisticas/demografia/piramide — Pirámide poblacional (edad × sexo) */
export async function getDemografiaPiramide(): Promise<PiramideItem[]> {
  const { data } = await api.get<PiramideItem[]>('/estadisticas/demografia/piramide')
  return data
}

/** GET /estadisticas/demografia/genero — Distribución por género */
export async function getDemografiaGenero(): Promise<GeneroItem[]> {
  const { data } = await api.get<GeneroItem[]>('/estadisticas/demografia/genero')
  return data
}

/** GET /estadisticas/demografia/escolaridad — Nivel de escolaridad */
export async function getDemografiaEscolaridad(): Promise<EscolaridadItem[]> {
  const { data } = await api.get<EscolaridadItem[]>('/estadisticas/demografia/escolaridad')
  return data
}

/** GET /estadisticas/demografia/alfabetizacion — Indicador de alfabetización */
export async function getDemografiaAlfabetizacion(): Promise<AlfabetizacionData> {
  const { data } = await api.get<AlfabetizacionData>('/estadisticas/demografia/alfabetizacion')
  return data
}

/** GET /estadisticas/demografia/lengua-indigena — Hablantes de lengua indígena */
export async function getDemografiaLenguaIndigena(): Promise<LenguaIndigenaItem[]> {
  const { data } = await api.get<LenguaIndigenaItem[]>('/estadisticas/demografia/lengua-indigena')
  return data
}

/** GET /estadisticas/demografia/ingreso — Distribución por ingreso salarial */
export async function getDemografiaIngreso(): Promise<IngresoItem[]> {
  const { data } = await api.get<IngresoItem[]>('/estadisticas/demografia/ingreso')
  return data
}

/** GET /estadisticas/demografia/ocupacion — Distribución por ocupación */
export async function getDemografiaOcupacion(): Promise<OcupacionItem[]> {
  const { data } = await api.get<OcupacionItem[]>('/estadisticas/demografia/ocupacion')
  return data
}

/** GET /estadisticas/demografia/estado-civil — Distribución por estado civil */
export async function getDemografiaEstadoCivil(): Promise<EstadoCivilItem[]> {
  const { data } = await api.get<EstadoCivilItem[]>('/estadisticas/demografia/estado-civil')
  return data
}

// ─────────────────────────────────────────────────────────────────────────────
// ─── ESTADÍSTICAS — SALUD (9 endpoints) ───────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────

/** GET /estadisticas/salud/enfermedades-cronicas — Prevalencia de enfermedades crónicas */
export async function getSaludEnfermedadesCronicas(): Promise<EnfermedadCronicaItem[]> {
  const { data } = await api.get<EnfermedadCronicaItem[]>('/estadisticas/salud/enfermedades-cronicas')
  return data
}

/** GET /estadisticas/salud/toxicomanias — Tabaquismo/alcoholismo/otras */
export async function getSaludToxicomanias(): Promise<ToxicomaniaItem[]> {
  const { data } = await api.get<ToxicomaniaItem[]>('/estadisticas/salud/toxicomanias')
  return data
}

/** GET /estadisticas/salud/discapacidad — % población con discapacidad y tipos */
export async function getSaludDiscapacidad(): Promise<DiscapacidadData> {
  const { data } = await api.get<DiscapacidadData>('/estadisticas/salud/discapacidad')
  return data
}

/** GET /estadisticas/salud/preventiva — Tamizajes y control prenatal */
export async function getSaludPreventiva(): Promise<SaludPreventivaData> {
  const { data } = await api.get<SaludPreventivaData>('/estadisticas/salud/preventiva')
  return data
}

/** GET /estadisticas/salud/seguridad-social — Afiliación / carencia de seguridad social */
export async function getSaludSeguridadSocial(): Promise<SeguridadSocialData> {
  const { data } = await api.get<SeguridadSocialData>('/estadisticas/salud/seguridad-social')
  return data
}

/** GET /estadisticas/salud/alimentacion — Indicador nutricional (días/semana promedio) */
export async function getSaludAlimentacion(): Promise<AlimentacionData> {
  const { data } = await api.get<AlimentacionData>('/estadisticas/salud/alimentacion')
  return data
}

/** GET /estadisticas/salud/servicios-salud — Frecuencia de uso de servicios de salud */
export async function getSaludServiciosSalud(): Promise<ServicioSaludItem[]> {
  const { data } = await api.get<ServicioSaludItem[]>('/estadisticas/salud/servicios-salud')
  return data
}

/** GET /estadisticas/salud/higiene-bucodental — Higiene bucodental */
export async function getSaludHigieneBucodental(): Promise<HigieneBucodentalData> {
  const { data } = await api.get<HigieneBucodentalData>('/estadisticas/salud/higiene-bucodental')
  return data
}

/** GET /estadisticas/salud/piramide-vacuna — Pirámide poblacional por vacuna */
export async function getSaludPiramideVacuna(): Promise<PiramideVacunaItem[]> {
  const { data } = await api.get<PiramideVacunaItem[]>('/estadisticas/salud/piramide-vacuna')
  return data
}

// ─────────────────────────────────────────────────────────────────────────────
// ─── ESTADÍSTICAS — VIVIENDA (4 endpoints) ────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────

/** GET /estadisticas/vivienda/servicios — Cobertura de servicios básicos */
export async function getViviendaServicios(): Promise<ViviendaServiciosData> {
  const { data } = await api.get<ViviendaServiciosData>('/estadisticas/vivienda/servicios')
  return data
}

/** GET /estadisticas/vivienda/hacinamiento — Hacinamiento (habitantes/cuartos > 2.5) */
export async function getViviendaHacinamiento(): Promise<HacinamientoData> {
  const { data } = await api.get<HacinamientoData>('/estadisticas/vivienda/hacinamiento')
  return data
}

/** GET /estadisticas/vivienda/materiales-riesgo — Condiciones de riesgo */
export async function getViviendaMaterialesRiesgo(): Promise<MaterialesRiesgoData> {
  const { data } = await api.get<MaterialesRiesgoData>('/estadisticas/vivienda/materiales-riesgo')
  return data
}

/** GET /estadisticas/vivienda/animales — Zoonosis (animales en casa, mascotas) */
export async function getViviendaAnimales(): Promise<AnimalesData> {
  const { data } = await api.get<AnimalesData>('/estadisticas/vivienda/animales')
  return data
}

export default api
