// ─── Types: Auth ──────────────────────────────────────────────────────────────
// Roles mapeados desde la API: 1=SuperAdmin, 2=Admin, 3=Analista, 4=Entrevistador
// Solo SuperAdmin (1) y Admin (2) tienen acceso a la web app.

export type UserRole = 'SuperAdmin' | 'Admin' | 'Analista' | 'User'

/** Mapeo de rol_id de la API a UserRole interno */
export function mapRolIdToRole(rol_id: number): UserRole {
  switch (rol_id) {
    case 1: return 'SuperAdmin'
    case 2: return 'Admin'
    case 3: return 'Analista'
    default: return 'User' // 4=Entrevistador → solo app móvil
  }
}

export interface AuthUser {
  id: number
  nombre_usuario: string
  name: string        // alias de nombre_usuario para compatibilidad con UI
  role: UserRole
  rol_id: number
  unidad_salud_id: number | null
  avatar?: string
}

export interface AuthContextType {
  user: AuthUser | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (username: string, password: string) => Promise<LoginResult>
  logout: () => void
}

export interface LoginResult {
  success: boolean
  error?: string
  /** Rol detectado — útil para mostrar un mensaje de error específico */
  deniedRole?: UserRole
}
