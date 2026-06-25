// ─── Organism: LoginHeroPanel ─────────────────────────────────────────────────
// Panel decorativo izquierdo de la vista Login.
// Responsabilidad única: identidad visual institucional.
// Compone: Logo (atom) + texto hero + tags + footer legal.

import { ShieldCheck } from 'lucide-react'
import { Logo } from '../atoms/Logo'

const FEATURE_TAGS = ['OCR Inteligente', 'RBAC Estricto', 'Datos Seguros'] as const

export function LoginHeroPanel() {
  return (
    <section
      aria-label="Presentación del sistema"
      className="hidden lg:flex lg:w-1/2 bg-primary flex-col justify-between p-10 relative overflow-hidden"
    >
      {/* Decorative background circles */}
      <div aria-hidden="true" className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/5" />
      <div aria-hidden="true" className="absolute -bottom-32 -left-16 w-80 h-80 rounded-full bg-white/5" />
      <div aria-hidden="true" className="absolute top-1/2 right-8 w-32 h-32 rounded-full bg-white/5" />

      {/* Top: Logo */}
      <div className="relative z-10">
        <Logo size="md" />
      </div>

      {/* Center: Hero text */}
      <div className="relative z-10 space-y-5">
        <div>
          <h1 className="text-4xl font-bold text-white leading-tight text-balance">
            Sistema Unidad<br />Médica Suchiapa
          </h1>
          <div aria-hidden="true" className="mt-3 w-16 h-1 bg-gold rounded-full" />
        </div>

        <p className="text-white/70 text-base leading-relaxed max-w-xs">
          Plataforma administrativa integral para el control de expedientes,
          captura de cédulas y gestión hospitalaria con altos estándares de
          seguridad institucional.
        </p>

        {/* Feature tags */}
        <div className="flex flex-wrap gap-2">
          {FEATURE_TAGS.map((tag) => (
            <span
              key={tag}
              className="bg-white/10 backdrop-blur-sm text-white/80 text-xs px-3 py-1.5 rounded-full border border-white/20"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Bottom: Legal notice */}
      <footer className="relative z-10 flex items-center gap-2 text-white/40 text-xs">
        <ShieldCheck size={13} aria-hidden="true" />
        <span>ACCESO RESTRINGIDO Y MONITOREADO — IMSS BIENESTAR © {new Date().getFullYear()}</span>
      </footer>
    </section>
  )
}
