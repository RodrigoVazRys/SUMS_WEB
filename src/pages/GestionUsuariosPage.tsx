// ─── Page: GestionUsuariosPage ────────────────────────────────────────────────
// Solo SuperAdmin. CRUD de usuarios del sistema.
// GET /users — lista
// POST /users/admin/register — crear
// PUT /users/{id}/role — cambiar rol

import { useState, useEffect, useCallback } from 'react'
import { Plus, RefreshCw, Pencil, ShieldCheck, User, Users, X, Loader2, Check } from 'lucide-react'
import { getUsers, registerUser, updateUserRole } from '../services/api'
import type { Usuario } from '../types/api.types'
import { Toast } from '../components/molecules/Toast'
import type { ToastVariant } from '../components/molecules/Toast'

// ─── Mapeo de rol ─────────────────────────────────────────────────────────────
const ROL_LABELS: Record<number, { label: string; color: string }> = {
  1: { label: 'SuperAdmin', color: 'bg-guinda-100 text-guinda-800' },
  2: { label: 'Admin',      color: 'bg-primary/10 text-primary'    },
  3: { label: 'Analista',   color: 'bg-blue-50 text-blue-700'      },
  4: { label: 'Entrevistador', color: 'bg-amber-50 text-amber-700' },
}

const ROL_OPTIONS = [
  { value: 1, label: 'SuperAdmin'    },
  { value: 2, label: 'Admin'         },
  { value: 3, label: 'Analista'      },
  { value: 4, label: 'Entrevistador' },
]

interface ToastState { message: string; variant: ToastVariant }
interface ModalRegisterForm { nombre_usuario: string; contrasena: string; rol_id: number }

export function GestionUsuariosPage() {
  const [users,       setUsers]       = useState<Usuario[]>([])
  const [isLoading,   setIsLoading]   = useState(true)
  const [toast,       setToast]       = useState<ToastState | null>(null)
  const [showRegModal, setShowRegModal] = useState(false)
  const [editingUser,  setEditingUser]  = useState<Usuario | null>(null)
  const [newRolId,     setNewRolId]     = useState<number>(2)
  const [isSaving,     setIsSaving]     = useState(false)
  const [regForm,      setRegForm]      = useState<ModalRegisterForm>({ nombre_usuario: '', contrasena: '', rol_id: 2 })

  function showToast(message: string, variant: ToastVariant = 'success') {
    setToast({ message, variant })
    setTimeout(() => setToast(null), 4000)
  }

  const fetchUsers = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await getUsers()
      setUsers(data)
    } catch {
      showToast('Error al cargar usuarios.', 'error')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  // ── Registrar nuevo usuario ────────────────────────────────────────────────
  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    if (!regForm.nombre_usuario.trim() || !regForm.contrasena.trim()) return
    setIsSaving(true)
    try {
      await registerUser(regForm)
      showToast(`Usuario "${regForm.nombre_usuario}" registrado exitosamente.`)
      setShowRegModal(false)
      setRegForm({ nombre_usuario: '', contrasena: '', rol_id: 2 })
      fetchUsers()
    } catch {
      showToast('Error al registrar el usuario.', 'error')
    } finally {
      setIsSaving(false)
    }
  }

  // ── Actualizar rol ────────────────────────────────────────────────────────
  async function handleUpdateRole(e: React.FormEvent) {
    e.preventDefault()
    if (!editingUser) return
    setIsSaving(true)
    try {
      await updateUserRole(editingUser.id, newRolId)
      showToast(`Rol de "${editingUser.nombre_usuario}" actualizado exitosamente.`)
      setEditingUser(null)
      fetchUsers()
    } catch {
      showToast('Error al actualizar el rol.', 'error')
    } finally {
      setIsSaving(false)
    }
  }

  const rolInfo = (id: number) => ROL_LABELS[id] ?? { label: `Rol ${id}`, color: 'bg-gray-100 text-gray-700' }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ── Page Header ──────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Gestión de Usuarios</h2>
          <p className="text-sm text-gray-500 mt-0.5">Administra los accesos al sistema SUMS.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchUsers}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-primary transition-colors px-3 py-2 rounded-lg hover:bg-gray-100"
          >
            <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
            Actualizar
          </button>
          <button
            onClick={() => setShowRegModal(true)}
            className="flex items-center gap-2 bg-primary text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors"
          >
            <Plus size={14} />
            Agregar Usuario
          </button>
        </div>
      </div>

      {/* ── Stats ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {ROL_OPTIONS.map((rol) => {
          const count = users.filter((u) => u.rol_id === rol.value).length
          return (
            <div key={rol.value} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <p className="text-2xl font-bold text-gray-900">{count}</p>
              <p className="text-xs text-gray-500 mt-0.5">{rol.label}</p>
            </div>
          )
        })}
      </div>

      {/* ── Table ─────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
          <Users size={16} className="text-primary" />
          <h3 className="text-sm font-semibold text-gray-900">
            {isLoading ? 'Cargando...' : `${users.length} usuario${users.length !== 1 ? 's' : ''} registrado${users.length !== 1 ? 's' : ''}`}
          </h3>
        </div>

        {isLoading ? (
          <div className="p-8 flex justify-center">
            <Loader2 size={24} className="animate-spin text-primary" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">ID</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Usuario</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Rol</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Estado</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Registro</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {users.map((u) => {
                  const rol = rolInfo(u.rol_id)
                  return (
                    <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3.5 text-xs text-gray-400 font-mono">#{u.id}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <User size={13} className="text-primary" />
                          </div>
                          <span className="text-sm font-medium text-gray-900">{u.nombre_usuario}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold ${rol.color}`}
                          style={u.rol_id === 1 ? { backgroundColor: '#fdf2f4', color: '#691C32' } : undefined}
                        >
                          {rol.label}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center gap-1 text-[11px] font-medium ${u.activo !== false ? 'text-green-600' : 'text-gray-400'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${u.activo !== false ? 'bg-green-500' : 'bg-gray-300'}`} />
                          {u.activo !== false ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-gray-500">
                        {u.fecha_registro ? new Date(u.fecha_registro).toLocaleDateString('es-MX') : '—'}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <button
                          onClick={() => { setEditingUser(u); setNewRolId(u.rol_id) }}
                          className="inline-flex items-center gap-1.5 text-xs text-primary hover:text-primary-dark font-medium transition-colors px-2 py-1 rounded hover:bg-primary/5"
                        >
                          <Pencil size={12} />
                          Cambiar Rol
                        </button>
                      </td>
                    </tr>
                  )
                })}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-5 py-10 text-center text-sm text-gray-400">
                      No hay usuarios registrados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Modal: Registrar usuario ──────────────────────────────── */}
      {showRegModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 animate-fade-in">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <ShieldCheck size={18} className="text-primary" />
                <h4 className="text-sm font-bold text-gray-900">Registrar Nuevo Usuario</h4>
              </div>
              <button onClick={() => setShowRegModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleRegister} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide block">
                  Nombre de usuario
                </label>
                <input
                  type="text"
                  value={regForm.nombre_usuario}
                  onChange={(e) => setRegForm((f) => ({ ...f, nombre_usuario: e.target.value }))}
                  placeholder="usuario_institucional"
                  required
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide block">
                  Contraseña inicial
                </label>
                <input
                  type="password"
                  value={regForm.contrasena}
                  onChange={(e) => setRegForm((f) => ({ ...f, contrasena: e.target.value }))}
                  placeholder="••••••••"
                  required
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide block">
                  Rol asignado
                </label>
                <select
                  value={regForm.rol_id}
                  onChange={(e) => setRegForm((f) => ({ ...f, rol_id: Number(e.target.value) }))}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                >
                  {ROL_OPTIONS.map((r) => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRegModal(false)}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center gap-2 bg-primary text-white text-sm font-semibold px-5 py-2 rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
                >
                  {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                  {isSaving ? 'Registrando...' : 'Registrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Cambiar rol ─────────────────────────────────────── */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 animate-fade-in">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h4 className="text-sm font-bold text-gray-900">Cambiar Rol de Usuario</h4>
              <button onClick={() => setEditingUser(null)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleUpdateRole} className="p-6 space-y-4">
              <p className="text-sm text-gray-600">
                Usuario: <strong className="text-gray-900">{editingUser.nombre_usuario}</strong>
              </p>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide block">
                  Nuevo rol
                </label>
                <select
                  value={newRolId}
                  onChange={(e) => setNewRolId(Number(e.target.value))}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                >
                  {ROL_OPTIONS.map((r) => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center gap-2 bg-primary text-white text-sm font-semibold px-5 py-2 rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
                >
                  {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                  {isSaving ? 'Guardando...' : 'Guardar cambio'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && <Toast message={toast.message} variant={toast.variant} onClose={() => setToast(null)} />}
    </div>
  )
}
