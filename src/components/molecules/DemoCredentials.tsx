// ─── Molecule: DemoCredentials ────────────────────────────────────────────────
// Panel de ayuda en la vista Login que muestra credenciales de demo.
// Solo visible en entorno de desarrollo (VITE_DEMO_MODE=true).

const IS_DEMO = import.meta.env.VITE_DEMO_MODE === 'true'

interface Credential {
  email: string
  password: string
  role: string
}

const CREDENTIALS: Credential[] = [
  { email: 'superadmin@sums.gob.mx', password: 'admin123', role: 'SuperAdmin' },
  { email: 'admin@sums.gob.mx',      password: 'admin123', role: 'Admin'      },
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
          <div key={c.email} className="text-[11px] text-gray-600 font-mono flex items-center gap-2">
            <span className="text-[10px] bg-primary/10 text-primary font-sans font-semibold px-1.5 py-0.5 rounded">
              {c.role}
            </span>
            <span>{c.email} / {c.password}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
