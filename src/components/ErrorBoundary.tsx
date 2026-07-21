// ─── ErrorBoundary ────────────────────────────────────────────────────────────
// Remediación de seguridad: sin un Error Boundary, una excepción no controlada
// en cualquier componente de la aplicación tira todo el árbol de React y deja
// al usuario con una pantalla en blanco (además de poder filtrar stacks de
// error directamente en la consola/DOM en producción). Este componente
// intercepta errores de renderizado de sus componentes hijos y muestra una
// pantalla de fallback genérica en su lugar.

import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Solo se registra en consola local; no se envían detalles del error
    // (que podrían incluir datos sensibles) a servicios externos aquí.
    console.error('ErrorBoundary capturó un error no controlado:', error, errorInfo)
  }

  private handleReload = (): void => {
    window.location.assign('/')
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="max-w-sm w-full text-center space-y-4">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center">
              <AlertTriangle size={26} className="text-red-500" aria-hidden="true" />
            </div>
            <h1 className="text-lg font-bold text-gray-900">Ocurrió un error inesperado</h1>
            <p className="text-sm text-gray-500 leading-relaxed">
              Algo salió mal al mostrar esta pantalla. Intente recargar la página; si el
              problema persiste, contacte a soporte IT.
            </p>
            <button
              type="button"
              onClick={this.handleReload}
              className="inline-flex items-center justify-center rounded-lg bg-primary text-white text-sm font-semibold px-4 py-2.5 hover:opacity-90 transition-opacity"
            >
              Recargar aplicación
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
