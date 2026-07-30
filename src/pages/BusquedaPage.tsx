// ─── Page: BusquedaPage ───────────────────────────────────────────────────────
// Subcomponente C — Búsqueda Semántica de Notas (microservicio de minería).
// Input de búsqueda + selección de motor (bm25 | tfidf | semántico) + k resultados.
// El motor "semántico" es opcional en el servidor: un 503 se muestra como aviso
// informativo, no como error grave.

import { useState } from 'react'
import type { FormEvent } from 'react'
import { Search, Loader2, FileSearch, AlertCircle, Database, StickyNote, MapPin } from 'lucide-react'

import { Button } from '../components/atoms/Button'
import { Toast } from '../components/molecules/Toast'
import type { ToastVariant } from '../components/molecules/Toast'

import { buscarNotas, buscarEstructurado } from '../services/mineriaApi'
import type { MotorBusqueda, ResultadoBusqueda, ResultadoBusquedaEstructurada } from '../types/mineria.types'

interface ToastState {
  message: string
  variant: ToastVariant
}

// Motor y k están hardcodeados; no se exponen en la UI (simplificación solicitada)
const DEFAULT_MOTOR: MotorBusqueda = 'bm25'
const DEFAULT_K = 5

const MAX_QUERY_LENGTH = 500

function scoreColor(score: number): string {
  if (score >= 0.66) return '#10b981'
  if (score >= 0.33) return '#f59e0b'
  return '#6b7280'
}

type ModoBusqueda = 'notas' | 'estructurado'

export function BusquedaPage() {
  const [modo, setModo] = useState<ModoBusqueda>('notas')

  const [q, setQ] = useState('')
  // motor y k son internos, no expuestos en la UI
  const motor = DEFAULT_MOTOR
  const k     = DEFAULT_K

  const [isSearching,   setIsSearching]   = useState(false)
  const [resultados,    setResultados]    = useState<ResultadoBusqueda[]>([])
  const [ultimaConsulta, setUltimaConsulta] = useState<string | null>(null)
  const [ultimoMotor,    setUltimoMotor]    = useState<string | null>(null)
  const [hasSearched,   setHasSearched]   = useState(false)

  // ── Búsqueda estructurada (sobre datos de la cédula, no notas) ────────────
  const [resultadosEstructurados, setResultadosEstructurados] = useState<ResultadoBusquedaEstructurada[]>([])
  const [totalEstructurado, setTotalEstructurado] = useState(0)
  const [categoriaEncontrada, setCategoriaEncontrada] = useState<string | null>(null)
  const [mensajeSinCategoria, setMensajeSinCategoria] = useState<string | null>(null)

  const [toast, setToast] = useState<ToastState | null>(null)

  function notify(message: string, variant: ToastVariant, autoCloseMs = 5000) {
    setToast({ message, variant })
    if (autoCloseMs > 0) setTimeout(() => setToast(null), autoCloseMs)
  }

  function cambiarModo(nuevoModo: ModoBusqueda) {
    setModo(nuevoModo)
    setHasSearched(false)
    setMensajeSinCategoria(null)
  }

  async function handleBuscarNotas() {
    const data = await buscarNotas(q.trim(), motor, k)
    setResultados(data.resultados)
    setUltimaConsulta(data.consulta)
    setUltimoMotor(data.motor)
  }

  async function handleBuscarEstructurado() {
    const data = await buscarEstructurado(q.trim(), k)
    setUltimaConsulta(q.trim())
    setCategoriaEncontrada(data.categoria)
    if (!data.disponible) {
      setResultadosEstructurados([])
      setTotalEstructurado(0)
      setMensajeSinCategoria(data.mensaje ?? null)
    } else {
      setResultadosEstructurados(data.resultados)
      setTotalEstructurado(data.total_coincidencias ?? data.resultados.length)
      setMensajeSinCategoria(null)
    }
  }

  async function handleBuscar(e: FormEvent) {
    e.preventDefault()
    const trimmed = q.trim()

    if (!trimmed) {
      notify('Escriba una consulta antes de buscar.', 'warning')
      return
    }
    if (trimmed.length > MAX_QUERY_LENGTH) {
      notify(`La consulta no puede superar los ${MAX_QUERY_LENGTH} caracteres.`, 'warning')
      return
    }

    setIsSearching(true)
    try {
      if (modo === 'notas') {
        await handleBuscarNotas()
      } else {
        await handleBuscarEstructurado()
      }
      setHasSearched(true)
    } catch (err: unknown) {
      const axiosErr = err as { response?: { status?: number; data?: { detail?: string } } }
      const status = axiosErr.response?.status

      if (status === 503 && motor === 'semantico') {
        notify('El motor semántico no está disponible en este servidor. Intente con BM25 o TF-IDF.', 'info')
      } else if (status === 400) {
        notify(axiosErr.response?.data?.detail || 'Consulta inválida. Revise el texto e intente de nuevo.', 'warning')
      } else if (status !== undefined && status >= 500) {
        notify('Error interno del servidor de búsqueda. Intente más tarde.', 'error')
      } else {
        notify('No se pudo realizar la búsqueda. Verifique la conexión con el microservicio.', 'error')
      }
    } finally {
      setIsSearching(false)
    }
  }

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Search size={22} className="text-[#006657]" />
          Búsqueda
        </h2>
        <p className="text-sm text-gray-500 mt-0.5">
          {modo === 'notas'
            ? 'Busque en las notas de visita usando distintos motores de recuperación de texto.'
            : 'Filtre cédulas por vacunas, embarazo, nutrición, mascotas o colonia/calle — datos estructurados, no similitud de texto.'}
        </p>
      </div>

      {/* Selector de modo */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          type="button"
          onClick={() => cambiarModo('notas')}
          className={`flex items-center gap-1.5 px-3 py-2 text-sm font-semibold border-b-2 transition-colors ${
            modo === 'notas' ? 'border-[#006657] text-[#006657]' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <StickyNote size={15} /> Notas de visita
        </button>
        <button
          type="button"
          onClick={() => cambiarModo('estructurado')}
          className={`flex items-center gap-1.5 px-3 py-2 text-sm font-semibold border-b-2 transition-colors ${
            modo === 'estructurado' ? 'border-[#006657] text-[#006657]' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Database size={15} /> Datos estructurados
        </button>
      </div>

      {/* Formulario de búsqueda */}
      <form
        onSubmit={handleBuscar}
        className="bg-white rounded-xl border border-gray-200 shadow-sm p-5"
      >
        <div className="grid grid-cols-1 gap-3 items-end md:grid-cols-[1fr_auto]">
          <div className="space-y-1">
            <label htmlFor="busqueda-q" className="text-xs font-semibold text-gray-600 uppercase tracking-wide block">
              Consulta
            </label>
            <input
              id="busqueda-q"
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              maxLength={MAX_QUERY_LENGTH}
              placeholder={modo === 'notas' ? 'Ej. paciente con hipertensión y diabetes...' : 'Ej. sarampión, sin vacunar, mascotas, embarazo, Centro...'}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all duration-200"
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            disabled={isSearching}
            leftIcon={isSearching ? <Loader2 size={15} className="animate-spin" /> : <Search size={15} />}
          >
            {isSearching ? 'Buscando...' : 'Buscar'}
          </Button>
        </div>
      </form>

      {/* Resultados */}
      <section className="space-y-3">
        {isSearching && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-100 p-5 skeleton h-24" />
            ))}
          </div>
        )}

        {!isSearching && !hasSearched && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col items-center justify-center gap-2 py-14 text-gray-400">
            <FileSearch size={28} strokeWidth={1.5} />
            <p className="text-sm">Escriba una consulta y presione Buscar para ver resultados.</p>
          </div>
        )}

        {/* ── Modo: notas de texto libre ─────────────────────────────────── */}
        {modo === 'notas' && !isSearching && hasSearched && (
          <>
            <p className="text-xs text-gray-500">
              {resultados.length > 0 ? (
                <>
                  <span className="font-semibold text-gray-700">{resultados.length}</span> resultado(s) para{' '}
                  <span className="font-semibold text-gray-700">"{ultimaConsulta}"</span> — motor{' '}
                  <span className="font-semibold text-gray-700">{ultimoMotor}</span>
                </>
              ) : (
                `Sin resultados para "${ultimaConsulta}".`
              )}
            </p>
            {resultados.length === 0 && (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex items-center justify-center gap-2 py-10 text-sm text-gray-400">
                <AlertCircle size={16} /><span>No se encontraron notas para esta consulta.</span>
              </div>
            )}
            {resultados.map((r) => (
              <div key={`${r.id}-${r.posicion}`} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="flex-shrink-0 w-7 h-7 rounded-full bg-[#006657]/10 text-[#006657] text-xs font-bold flex items-center justify-center">
                      {r.posicion}
                    </span>
                    <h4 className="text-sm font-bold text-gray-900 truncate">{r.titulo}</h4>
                  </div>
                  <span
                    className="flex-shrink-0 text-xs font-bold px-2.5 py-1 rounded-full"
                    style={{ color: scoreColor(r.score), backgroundColor: `${scoreColor(r.score)}15` }}
                  >
                    score {r.score.toFixed(3)}
                  </span>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed line-clamp-3">{r.texto}</p>
              </div>
            ))}
          </>
        )}

        {/* ── Modo: datos estructurados (vacunas/embarazo/mascotas/dirección) ── */}
        {modo === 'estructurado' && !isSearching && hasSearched && (
          <>
            {mensajeSinCategoria ? (
              <div className="bg-amber-50 border border-amber-200 rounded-xl shadow-sm p-5 flex items-start gap-2.5">
                <AlertCircle size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800 leading-relaxed">{mensajeSinCategoria}</p>
              </div>
            ) : (
              <>
                <p className="text-xs text-gray-500">
                  <span className="font-semibold text-gray-700">{totalEstructurado}</span> cédula(s) coinciden con{' '}
                  <span className="font-semibold text-gray-700">"{ultimaConsulta}"</span>
                  {categoriaEncontrada && (
                    <> — categoría <span className="font-semibold text-gray-700">{categoriaEncontrada}</span></>
                  )}
                  {categoriaEncontrada === 'direccion' && (
                    <span className="italic"> (aproximado por misma colonia/calle, no distancia real)</span>
                  )}
                </p>
                {resultadosEstructurados.length === 0 && (
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex items-center justify-center gap-2 py-10 text-sm text-gray-400">
                    <AlertCircle size={16} /><span>Ninguna cédula coincide con este filtro.</span>
                  </div>
                )}
                {resultadosEstructurados.map((r) => (
                  <div key={r.familia_id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                    <div className="flex items-start justify-between gap-3 mb-1.5">
                      <h4 className="text-sm font-bold text-gray-900">{r.nombre_informante ?? `Familia #${r.familia_id}`}</h4>
                      <span className="flex-shrink-0 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-[#006657]/10 text-[#006657]">
                        {r.coincidencia}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 flex items-center gap-1.5">
                      <MapPin size={12} className="flex-shrink-0" />
                      {r.domicilio}{r.localidad ? `, ${r.localidad}` : ''}
                    </p>
                  </div>
                ))}
              </>
            )}
          </>
        )}
      </section>

      {/* Toast notification */}
      {toast && (
        <Toast message={toast.message} variant={toast.variant} onClose={() => setToast(null)} />
      )}
    </div>
  )
}
