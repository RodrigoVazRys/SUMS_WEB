// ─── Service: API Client ──────────────────────────────────────────────────────
// Instancia de axios configurada con:
//   - baseURL apuntando a la API de producción SUMS
//   - Interceptor de solicitudes: inyecta JWT desde localStorage
//   - Interceptor de respuestas: en 401 limpia sesión y redirige a /login

import axios from 'axios'
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
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ─── Response interceptor — handle 401 ───────────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Limpiar sesión local
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(AUTH_USER_KEY)
      // Redirección forzosa al login
      window.location.href = '/login'
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

export default api
