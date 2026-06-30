// ─── Page: CentrosSaludPage ───────────────────────────────────────────────────
// Solo SuperAdmin. CRUD completo de Unidades de Salud.
// GET /unidadSalud — lista
// POST /unidadSalud — crear
// PUT /unidadSalud/{id} — editar
// DELETE /unidadSalud/{id} — eliminar

import { useState, useEffect, useCallback } from 'react'
import { Plus, RefreshCw, Pencil, Trash2, Building2, X, Loader2, Check, AlertTriangle } from 'lucide-react'
import { getUnidadesSalud, createUnidadSalud, updateUnidadSalud, deleteUnidadSalud } from '../services/api'
import type { UnidadSalud } from '../types/api.types'
import { Toast } from '../components/molecules/Toast'
import type { ToastVariant } from '../components/molecules/Toast'

interface ToastState { message: string; variant: ToastVariant }

type ModalMode = 'create' | 'edit'
interface UnidadForm { clues: string; nombre: string; distrito: string; numero_nucleos: string }

const EMPTY_FORM: UnidadForm = { clues: '', nombre: '', distrito: '', numero_nucleos: '' }

export function CentrosSaludPage() {
  const [unidades,    setUnidades]    = useState<UnidadSalud[]>([])
  const [isLoading,   setIsLoading]   = useState(true)
  const [toast,       setToast]       = useState<ToastState | null>(null)
  const [modalMode,   setModalMode]   = useState<ModalMode>('create')
  const [showModal,   setShowModal]   = useState(false)
  const [editTarget,  setEditTarget]  = useState<UnidadSalud | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<UnidadSalud | null>(null)
  const [form,        setForm]        = useState<UnidadForm>(EMPTY_FORM)
  const [isSaving,    setIsSaving]    = useState(false)
  const [isDeleting,  setIsDeleting]  = useState(false)

  function showToast(message: string, variant: ToastVariant = 'success') {
    setToast({ message, variant })
    setTimeout(() => setToast(null), 4000)
  }

  const fetchUnidades = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await getUnidadesSalud()
      setUnidades(data)
    } catch {
      showToast('Error al cargar unidades de salud.', 'error')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { fetchUnidades() }, [fetchUnidades])

  // ── Abrir modal crear ────────────────────────────────────────────────────
  function openCreate() {
    setModalMode('create')
    setForm(EMPTY_FORM)
    setEditTarget(null)
    setShowModal(true)
  }

  // ── Abrir modal editar ────────────────────────────────────────────────────
  function openEdit(u: UnidadSalud) {
    setModalMode('edit')
    setEditTarget(u)
    setForm({
      clues:          u.clues,
      nombre:         u.nombre,
      distrito:       u.distrito ?? '',
      numero_nucleos: u.numero_nucleos != null ? String(u.numero_nucleos) : '',
    })
    setShowModal(true)
  }

  // ── Submit crear/editar ────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsSaving(true)
    const payload = {
      clues:          form.clues.trim(),
      nombre:         form.nombre.trim(),
      distrito:       form.distrito.trim() || undefined,
      numero_nucleos: form.numero_nucleos ? Number(form.numero_nucleos) : undefined,
    }
    try {
      if (modalMode === 'create') {
        await createUnidadSalud(payload)
        showToast(`Centro "${payload.nombre}" creado exitosamente.`)
      } else if (editTarget?.id !== undefined) {
        await updateUnidadSalud(editTarget.id, payload)
        showToast(`Centro "${payload.nombre}" actualizado exitosamente.`)
      }
      setShowModal(false)
      fetchUnidades()
    } catch {
      showToast(`Error al ${modalMode === 'create' ? 'crear' : 'actualizar'} el centro.`, 'error')
    } finally {
      setIsSaving(false)
    }
  }

  // ── Confirmar eliminación ─────────────────────────────────────────────────
  async function handleDelete() {
    if (!deleteTarget?.id) return
    setIsDeleting(true)
    try {
      await deleteUnidadSalud(deleteTarget.id)
      showToast(`Centro "${deleteTarget.nombre}" eliminado.`)
      setDeleteTarget(null)
      fetchUnidades()
    } catch {
      showToast('Error al eliminar el centro.', 'error')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ── Page Header ──────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Centros de Salud</h2>
          <p className="text-sm text-gray-500 mt-0.5">Gestiona las unidades de salud registradas en el sistema.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchUnidades}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-primary transition-colors px-3 py-2 rounded-lg hover:bg-gray-100"
          >
            <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
            Actualizar
          </button>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 bg-primary text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors"
          >
            <Plus size={14} />
            Agregar Centro
          </button>
        </div>
      </div>

      {/* ── Summary card ──────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-primary to-primary-dark rounded-xl p-5 flex items-center justify-between">
        <div>
          <p className="text-white/70 text-xs">Total de unidades registradas</p>
          <p className="text-white text-3xl font-bold mt-0.5">{unidades.length}</p>
        </div>
        <Building2 size={40} className="text-white/20" />
      </div>

      {/* ── Table (md+) + Mobile Cards (< md) ─────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
          <Building2 size={16} className="text-primary" />
          <h3 className="text-sm font-semibold text-gray-900">
            {isLoading ? 'Cargando...' : `${unidades.length} unidad${unidades.length !== 1 ? 'es' : ''} de salud`}
          </h3>
        </div>

        {isLoading ? (
          <div className="p-8 flex justify-center">
            <Loader2 size={24} className="animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* ── Tabla — visible en md+ ──────────────────────────────── */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">ID</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">CLUES</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Nombre</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Distrito</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Núcleos</th>
                    <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {unidades.map((u) => (
                    <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3.5 text-xs text-gray-400 font-mono">#{u.id}</td>
                      <td className="px-5 py-3.5">
                        <span className="text-xs font-mono bg-primary/5 text-primary px-2 py-0.5 rounded">
                          {u.clues}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 font-medium text-gray-900">{u.nombre}</td>
                      <td className="px-5 py-3.5 text-gray-500">{u.distrito ?? '—'}</td>
                      <td className="px-5 py-3.5 text-gray-500">{u.numero_nucleos ?? '—'}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openEdit(u)}
                            className="flex items-center gap-1 text-xs text-primary hover:text-primary-dark font-medium px-2 py-1 rounded hover:bg-primary/5 transition-colors"
                          >
                            <Pencil size={12} />
                            Editar
                          </button>
                          <button
                            onClick={() => setDeleteTarget(u)}
                            className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 font-medium px-2 py-1 rounded hover:bg-red-50 transition-colors"
                          >
                            <Trash2 size={12} />
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {unidades.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-5 py-10 text-center text-sm text-gray-400">
                        No hay centros de salud registrados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* ── Tarjetas móviles — visible en < md ─────────────────── */}
            <div className="block md:hidden divide-y divide-gray-100">
              {unidades.length === 0 && (
                <p className="px-5 py-10 text-center text-sm text-gray-400">
                  No hay centros de salud registrados.
                </p>
              )}
              {unidades.map((u) => (
                <div key={u.id} className="p-4 space-y-3">
                  {/* Encabezado: CLUES + nombre */}
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Building2 size={16} className="text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-sm leading-tight">{u.nombre}</p>
                      <span className="inline-block mt-0.5 text-[11px] font-mono bg-primary/5 text-primary px-2 py-0.5 rounded">
                        {u.clues}
                      </span>
                    </div>
                    <span className="text-xs text-gray-400 font-mono flex-shrink-0">#{u.id}</span>
                  </div>
                  {/* Metadatos: distrito + núcleos */}
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>
                      <span className="font-medium text-gray-600">Distrito: </span>
                      {u.distrito ?? '—'}
                    </span>
                    <span>
                      <span className="font-medium text-gray-600">Núcleos: </span>
                      {u.numero_nucleos ?? '—'}
                    </span>
                  </div>
                  {/* Acciones táctiles — ancho completo */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      onClick={() => openEdit(u)}
                      className="flex items-center justify-center gap-2 text-sm text-primary border border-primary/25 rounded-lg py-2.5 hover:bg-primary/5 active:bg-primary/10 transition-colors font-medium"
                    >
                      <Pencil size={14} />
                      Editar
                    </button>
                    <button
                      onClick={() => setDeleteTarget(u)}
                      className="flex items-center justify-center gap-2 text-sm text-red-500 border border-red-200 rounded-lg py-2.5 hover:bg-red-50 active:bg-red-100 transition-colors font-medium"
                    >
                      <Trash2 size={14} />
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* ── Modal: Crear / Editar ──────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 animate-fade-in">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Building2 size={18} className="text-primary" />
                <h4 className="text-sm font-bold text-gray-900">
                  {modalMode === 'create' ? 'Agregar Centro de Salud' : 'Editar Centro de Salud'}
                </h4>
              </div>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {[
                { key: 'clues',    label: 'CLUES (11 chars)',  placeholder: 'CSSSS000000', required: true  },
                { key: 'nombre',   label: 'Nombre del centro', placeholder: 'Unidad de Salud…',   required: true  },
                { key: 'distrito', label: 'Distrito',          placeholder: 'Ej: Centro',          required: false },
              ].map(({ key, label, placeholder, required }) => (
                <div key={key} className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide block">{label}</label>
                  <input
                    type="text"
                    value={form[key as keyof UnidadForm]}
                    onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                    placeholder={placeholder}
                    required={required}
                    maxLength={key === 'clues' ? 11 : undefined}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  />
                </div>
              ))}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide block">Número de Núcleos</label>
                <input
                  type="number"
                  min="0"
                  value={form.numero_nucleos}
                  onChange={(e) => setForm((f) => ({ ...f, numero_nucleos: e.target.value }))}
                  placeholder="0"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 font-medium">
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center gap-2 bg-primary text-white text-sm font-semibold px-5 py-2 rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
                >
                  {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                  {isSaving ? 'Guardando...' : modalMode === 'create' ? 'Crear' : 'Guardar cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Confirmar eliminación ───────────────────────────── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 animate-fade-in p-6 space-y-4">
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
                <AlertTriangle size={22} className="text-red-500" />
              </div>
              <h4 className="text-base font-bold text-gray-900">¿Eliminar centro?</h4>
              <p className="text-sm text-gray-500">
                Esta acción eliminará permanentemente <strong>"{deleteTarget.nombre}"</strong> (CLUES: {deleteTarget.clues}).
              </p>
            </div>
            <div className="flex justify-center gap-3">
              <button onClick={() => setDeleteTarget(null)} className="px-5 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 border border-gray-200 rounded-lg">
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex items-center gap-2 bg-red-500 text-white text-sm font-semibold px-5 py-2 rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {isDeleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                {isDeleting ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && <Toast message={toast.message} variant={toast.variant} onClose={() => setToast(null)} />}
    </div>
  )
}
