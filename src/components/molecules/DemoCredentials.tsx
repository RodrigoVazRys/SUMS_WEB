// ─── Molecule: DemoCredentials ────────────────────────────────────────────────
// Panel de ayuda en la vista Login que muestra credenciales de demo.
// Solo visible en entorno de desarrollo (VITE_DEMO_MODE=true).
//
// Capa adicional de seguridad: además de la env var, se exige que el build
// sea de desarrollo (import.meta.env.DEV). Vite reemplaza `import.meta.env.DEV`
// por una constante literal en tiempo de build, así que en un build de
// producción este panel queda eliminado del bundle sin importar el valor
// (incluso mal configurado) de VITE_DEMO_MODE.
const IS_DEMO = import.meta.env.DEV && import.meta.env.VITE_DEMO_MODE === 'true'

interface Credential {
  username: string
  password: string
  role: string
}

// Formato consistente con el whitelist alfanumérico (+ guion bajo) del login
// real (ver USUARIO_REGEX en utils/validators.ts) — no son direcciones de
// correo, son nombres de usuario institucionales.
const CREDENTIALS: Credential[] = [
  { username: 'superadmin_demo', password: 'admin123', role: 'SuperAdmin' },
  { username: 'admin_demo',      password: 'admin123', role: 'Admin'      },
]

export function DemoCredentials() {
  if (!IS_DEMO) return null

  return (
    <div className="border border-dashed border-primary/30 rounded-xl p-3.5 bg-primary/5 space-y-2">
      <p className="text-[11px] font-bold text-primary uppercase tracking-wide">
        🧪 Credenciales de Demo
      </p>
      <div className="space-y-1.5">
        {CREDENTIALS.map((c) => (
          <div key={c.username} className="text-[11px] text-gray-600 font-mono flex items-center gap-2">
            <span className="text-[10px] bg-primary/10 text-primary font-sans font-semibold px-1.5 py-0.5 rounded">
              {c.role}
            </span>
            <span>{c.username} / {c.password}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
