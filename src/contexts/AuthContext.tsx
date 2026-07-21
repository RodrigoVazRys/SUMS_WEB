// ─── AuthContext ──────────────────────────────────────────────────────────────
// Contexto de autenticación real con JWT desde la API SUMS.
// RBAC:
//   rol_id 1 (SuperAdmin) → /dashboard, /captura-ocr, /gestion-usuarios, /centros-salud
//   rol_id 2 (Admin)      → /dashboard, /captura-ocr
//   rol_id 3/4 (User)     → DENEGADO en web, solo app móvil

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import type { AuthContextType, AuthUser, LoginResult, UserRole } from '../types/auth.types'
import { mapRolIdToRole } from '../types/auth.types'
import { loginApi, TOKEN_KEY, AUTH_USER_KEY } from '../services/api'
import { parseStoredSession } from '../utils/validators'

// ─── Constants ────────────────────────────────────────────────────────────────
const SESSION_TIMEOUT = Number(import.meta.env.VITE_SESSION_TIMEOUT ?? 28800) * 1000

// Roles 3/4 (Analista/Entrevistador) → DENEGADO en web, solo app móvil.
// mapRolIdToRole mapea rol_id 3 → 'Analista' y rol_id 4 (default) → 'User',
// por lo que ambos deben quedar bloqueados aquí (antes solo se bloqueaba 'User').
const WEB_DENIED_ROLES: UserRole[] = ['User', 'Analista']

// ─── Context ──────────────────────────────────────────────────────────────────
const AuthContext = createContext<AuthContextType | null>(null)

// ─── Provider ─────────────────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser]       = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // ── Restore session from localStorage on mount ────────────────────────────
  useEffect(() => {
    try {
      const stored = localStorage.getItem(AUTH_USER_KEY)
      const token  = localStorage.getItem(TOKEN_KEY)
      if (stored && token) {
        // Validación de esquema en runtime: localStorage puede haber sido
        // manipulado o corresponder a una versión anterior del esquema.
        const parsed = parseStoredSession(stored)
        if (parsed && parsed.expiresAt > Date.now()) {
          setUser(parsed.user)
        } else {
          // Token expirado: limpiar sesión
          localStorage.removeItem(AUTH_USER_KEY)
          localStorage.removeItem(TOKEN_KEY)
        }
      }
    } catch {
      localStorage.removeItem(AUTH_USER_KEY)
      localStorage.removeItem(TOKEN_KEY)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // ── login ─────────────────────────────────────────────────────────────────
  const login = useCallback(async (username: string, password: string): Promise<LoginResult> => {
    try {
      const response = await loginApi({ nombre_usuario: username, contrasena: password })
      const { token, user: apiUser } = response

      // Mapear rol_id al tipo interno
      const role = mapRolIdToRole(apiUser.rol_id)

      // RBAC: Roles 3/4 (Analista/Entrevistador) → DENEGADO en web
      if (WEB_DENIED_ROLES.includes(role)) {
        return {
          success: false,
          deniedRole: role,
          error: 'Acceso denegado: Su rol solo permite acceso mediante la aplicación móvil',
        }
      }

      // Construir AuthUser
      const authUser: AuthUser = {
        id:              apiUser.id,
        nombre_usuario:  apiUser.nombre_usuario,
        name:            apiUser.nombre_usuario,
        role,
        rol_id:          apiUser.rol_id,
        unidad_salud_id: apiUser.unidad_salud_id ?? null,
      }

      // Persistir token y sesión
      localStorage.setItem(TOKEN_KEY, token)
      localStorage.setItem(
        AUTH_USER_KEY,
        JSON.stringify({ user: authUser, expiresAt: Date.now() + SESSION_TIMEOUT }),
      )
      setUser(authUser)
      return { success: true }

    } catch (err: unknown) {
      // Error de red o credenciales inválidas (401 de la API)
      const axiosError = err as { response?: { status?: number; data?: { error?: string } } }
      if (axiosError.response?.status === 401) {
        return { success: false, error: 'Credenciales incorrectas. Verifique su usuario y contraseña.' }
      }
      return { success: false, error: 'Error de conexión. Intente nuevamente.' }
    }
  }, [])

  // ── logout ────────────────────────────────────────────────────────────────
  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(AUTH_USER_KEY)
    setUser(null)
  }, [])

  const value: AuthContextType = {
    user,
    isAuthenticated: user !== null,
    isLoading,
    login,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an <AuthProvider>')
  return ctx
}
