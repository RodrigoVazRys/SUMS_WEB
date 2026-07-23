// ─── Service: Minería API Client ──────────────────────────────────────────────
// Instancia de axios SEPARADA de api.ts (esa apunta a la API Node de producción
// de SUMS). Esta instancia apunta al microservicio Python de minería de datos
// (FastAPI, puerto 8001 por defecto) que expone los subcomponentes:
//   B → Predicción de riesgo familiar (/riesgo/*)
//   C → Búsqueda semántica de notas (/buscar*)
//
// Header obligatorio en todos los endpoints salvo /salud: X-API-Key

import axios from 'axios'
import type {
  FamiliaFeatures,
  RiesgoPrediccion,
  VisitaPrioritaria,
  RiesgoMetricas,
  ResumenZona,
  DistribucionRiesgo,
  CatalogosRiesgo,
  RespuestaBusqueda,
  BuscarMetricas,
  MotorBusqueda,
  RespuestaBusquedaEstructurada,
  RespuestaOcrCedula,
} from '../types/mineria.types'

// ─── Axios instance ───────────────────────────────────────────────────────────
const mineriaApi = axios.create({
  baseURL: import.meta.env.VITE_MINERIA_API_URL ?? 'http://localhost:8001',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
})

// ─── Request interceptor — inject X-API-Key ──────────────────────────────────
mineriaApi.interceptors.request.use((config) => {
  config.headers['X-API-Key'] = import.meta.env.VITE_MINERIA_API_KEY ?? ''
  return config
})

// ─────────────────────────────────────────────────────────────────────────────
// ─── Catálogos ─────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────

/** GET /catalogos — valores disponibles para poblar los <select> del formulario de riesgo. */
export async function getCatalogosRiesgo(): Promise<CatalogosRiesgo> {
  const { data } = await mineriaApi.get<CatalogosRiesgo>('/catalogos')
  return data
}

// ─────────────────────────────────────────────────────────────────────────────
// ─── Subcomponente A — OCR ─────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────

/** POST /ocr/procesar-cedula — sube el PDF escaneado de una cédula y extrae sus
 * campos (checkboxes + texto manuscrito). El interceptor de la instancia fija
 * Content-Type: application/json por defecto; aquí se sobreescribe para que
 * axios arme el boundary de multipart/form-data correcto. */
export async function procesarCedulaOcr(archivo: File): Promise<RespuestaOcrCedula> {
  const formData = new FormData()
  formData.append('archivo', archivo)
  const { data } = await mineriaApi.post<RespuestaOcrCedula>('/ocr/procesar-cedula', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}

// ─────────────────────────────────────────────────────────────────────────────
// ─── Subcomponente B — Predicción de Riesgo ───────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────

/** POST /riesgo/predecir — todos los campos de FamiliaFeatures tienen default en el backend. */
export async function predecirRiesgo(payload: Partial<FamiliaFeatures>): Promise<RiesgoPrediccion> {
  const { data } = await mineriaApi.post<RiesgoPrediccion>('/riesgo/predecir', payload)
  return data
}

/** GET /riesgo/lista?top=N — lista priorizada de visitas domiciliarias. */
export async function getListaVisitas(top: number = 20): Promise<VisitaPrioritaria[]> {
  const { data } = await mineriaApi.get<VisitaPrioritaria[]>('/riesgo/lista', { params: { top } })
  return data
}

/** GET /riesgo/metricas — desempeño comparado de los modelos entrenados. */
export async function getRiesgoMetricas(): Promise<RiesgoMetricas> {
  const { data } = await mineriaApi.get<RiesgoMetricas>('/riesgo/metricas')
  return data
}

/** GET /riesgo/zonas — riesgo de cúmulo geográfico agregado por colonia, ordenado
 * de mayor a menor concentración de riesgo. */
export async function getRiesgoPorZona(): Promise<ResumenZona[]> {
  const { data } = await mineriaApi.get<ResumenZona[]>('/riesgo/zonas')
  return data
}

/** GET /riesgo/distribucion — conteo BAJO/MEDIO/ALTO sobre toda la población
 * (a diferencia de /riesgo/lista, que solo trae las familias ALTO). */
export async function getRiesgoDistribucion(): Promise<DistribucionRiesgo> {
  const { data } = await mineriaApi.get<DistribucionRiesgo>('/riesgo/distribucion')
  return data
}

// ─────────────────────────────────────────────────────────────────────────────
// ─── Subcomponente C — Búsqueda Semántica de Notas ────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────

/** GET /buscar?q=&motor=&k= — motor=semantico puede no estar disponible (503). */
export async function buscarNotas(
  q: string,
  motor: MotorBusqueda = 'bm25',
  k: number = 5,
): Promise<RespuestaBusqueda> {
  const { data } = await mineriaApi.get<RespuestaBusqueda>('/buscar', { params: { q, motor, k } })
  return data
}

/** GET /buscar/metricas — comparación de motores de búsqueda (P@5, R@5, MRR, MAP, nDCG@5). */
export async function getBuscarMetricas(): Promise<BuscarMetricas> {
  const { data } = await mineriaApi.get<BuscarMetricas>('/buscar/metricas')
  return data
}

/** GET /buscar/estructurado?q=&k= — filtro sobre datos de la cédula (vacunas,
 * embarazo, nutrición, mascotas, dirección), NO similitud de texto. Útil para
 * "sarampión sin vacunar" o "familias con mascotas", donde /buscar (notas de
 * texto libre) no puede ayudar porque esas notas casi nunca existen. */
export async function buscarEstructurado(q: string, k: number = 20): Promise<RespuestaBusquedaEstructurada> {
  const { data } = await mineriaApi.get<RespuestaBusquedaEstructurada>('/buscar/estructurado', { params: { q, k } })
  return data
}

export default mineriaApi
