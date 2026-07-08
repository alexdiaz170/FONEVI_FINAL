import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UserPlus, Check, X, Pencil, Key, Trash2 } from 'lucide-react';
import {
  apiListarUsuarios,
  apiCrearUsuario,
  apiActualizarUsuario,
  apiEliminarUsuario,
  ApiError,
} from '../../lib/api';
import { AnimatedFadeIn, AnimatedTableRow, AnimatedButton } from '../../components/ui';

const roles = ['superadmin', 'admin', 'contador', 'socio'];
const rolColor: Record<string, string> = {
  superadmin: 'bg-red-50 text-red-700 border border-red-200',
  admin: 'bg-slate-50 text-slate-700 border border-slate-200',
  contador: 'bg-purple-50 text-purple-700 border border-purple-200',
  socio: 'bg-green-50 text-green-700 border border-green-200',
};

export function GestionUsuarios() {
  const queryClient = useQueryClient();
  const [showCrear, setShowCrear] = useState(false);
  const [form, setForm] = useState({ nombre: '', email: '', password: '', rol: 'contador' });
  const [formError, setFormError] = useState('');
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    nombre: '',
    email: '',
    password: '',
    rol: '',
    estado: '',
  });

  const { data: usuarios, isLoading } = useQuery({
    queryKey: ['usuarios'],
    queryFn: () => apiListarUsuarios(),
  });

  const crearMutation = useMutation({
    mutationFn: () =>
      apiCrearUsuario({
        nombre: form.nombre,
        email: form.email,
        password: form.password,
        rol: form.rol,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
      setShowCrear(false);
      setForm({ nombre: '', email: '', password: '', rol: 'contador' });
    },
    onError: (err) => setFormError(err instanceof ApiError ? err.message : 'Error al crear'),
  });
  const actualizarMutation = useMutation({
    mutationFn: () =>
      apiActualizarUsuario(editandoId!, {
        nombre: editForm.nombre,
        email: editForm.email,
        password: editForm.password || undefined,
        rol: editForm.rol,
        estado: editForm.estado,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
      setEditandoId(null);
    },
  });
  const eliminarMutation = useMutation({
    mutationFn: (id: string) => apiEliminarUsuario(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['usuarios'] }),
  });
  const resetPasswordMutation = useMutation({
    mutationFn: ({ id, password }: { id: string; password: string }) =>
      apiActualizarUsuario(id, { password }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['usuarios'] }),
  });

  function iniciarEdicion(u: {
    id: string;
    nombre: string;
    email: string;
    rol: string;
    estado: string;
  }) {
    setEditandoId(u.id);
    setEditForm({ nombre: u.nombre, email: u.email, password: '', rol: u.rol, estado: u.estado });
    setShowCrear(false);
  }

  if (isLoading) return <div className="text-gray-400 text-center py-8">Cargando...</div>;

  return (
    <AnimatedFadeIn>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">Gestión de usuarios del sistema.</p>
        <AnimatedButton
          onClick={() => {
            setShowCrear(!showCrear);
            setEditandoId(null);
          }}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-slate-700 to-slate-500 text-white rounded-xl text-sm font-medium shadow-md hover:from-slate-800 hover:to-slate-600 transition-all"
        >
          <UserPlus size={16} /> {showCrear ? 'Cancelar' : 'Nuevo Usuario'}
        </AnimatedButton>
      </div>

      {showCrear && (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100 p-4 mb-4">
          <h3 className="text-sm font-semibold text-navy-800 mb-3">Crear Usuario</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="usuario-nombre"
                className="block text-xs font-medium text-navy-700 mb-1"
              >
                Nombre *
              </label>
              <input
                id="usuario-nombre"
                value={form.nombre}
                onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-500/30 focus:border-slate-500"
              />
            </div>
            <div>
              <label
                htmlFor="usuario-email"
                className="block text-xs font-medium text-navy-700 mb-1"
              >
                Email *
              </label>
              <input
                id="usuario-email"
                type="email"
                value={form.email}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-500/30 focus:border-slate-500"
              />
            </div>
            <div>
              <label
                htmlFor="usuario-password"
                className="block text-xs font-medium text-navy-700 mb-1"
              >
                Contraseña *
              </label>
              <input
                id="usuario-password"
                type="password"
                value={form.password}
                onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-500/30 focus:border-slate-500"
              />
            </div>
            <div>
              <label htmlFor="usuario-rol" className="block text-xs font-medium text-navy-700 mb-1">
                Rol *
              </label>
              <select
                id="usuario-rol"
                value={form.rol}
                onChange={(e) => setForm((p) => ({ ...p, rol: e.target.value }))}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-500/30 focus:border-slate-500"
              >
                {roles.map((r) => (
                  <option key={r} value={r}>
                    {r.charAt(0).toUpperCase() + r.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {formError && (
            <div className="mt-3 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
              {formError}
            </div>
          )}
          <div className="mt-3 flex gap-2">
            <AnimatedButton
              onClick={() => crearMutation.mutate()}
              disabled={crearMutation.isPending || !form.nombre || !form.email || !form.password}
              className="px-4 py-2 bg-gradient-to-r from-slate-700 to-slate-500 text-white rounded-xl text-sm font-medium shadow-md hover:from-slate-800 hover:to-slate-600 disabled:opacity-50 transition-all"
            >
              {crearMutation.isPending ? 'Creando...' : 'Crear Usuario'}
            </AnimatedButton>
          </div>
        </div>
      )}

      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gradient-to-r from-gray-50 to-gray-100/50 text-gray-500">
                <th className="text-left p-3.5 font-semibold text-xs uppercase tracking-wider">
                  Nombre
                </th>
                <th className="text-left p-3.5 font-semibold text-xs uppercase tracking-wider">
                  Email
                </th>
                <th className="text-center p-3.5 font-semibold text-xs uppercase tracking-wider">
                  Rol
                </th>
                <th className="text-center p-3.5 font-semibold text-xs uppercase tracking-wider">
                  Estado
                </th>
                <th className="text-center p-3.5 font-semibold text-xs uppercase tracking-wider">
                  Acción
                </th>
              </tr>
            </thead>
            <tbody>
              {(usuarios ?? []).length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center text-gray-400 py-8">
                    No hay usuarios registrados
                  </td>
                </tr>
              )}
              {(usuarios ?? []).map((u, idx) =>
                editandoId === u.id ? (
                  <tr key={u.id} className="bg-amber-50">
                    <td className="p-3.5">
                      <input
                        value={editForm.nombre}
                        onChange={(e) => setEditForm((p) => ({ ...p, nombre: e.target.value }))}
                        className="w-full bg-white border border-gray-200 rounded-lg px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-slate-500/30"
                        aria-label="Nombre"
                      />
                    </td>
                    <td className="p-3.5">
                      <input
                        value={editForm.email}
                        onChange={(e) => setEditForm((p) => ({ ...p, email: e.target.value }))}
                        className="w-full bg-white border border-gray-200 rounded-lg px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-slate-500/30"
                        aria-label="Email"
                      />
                    </td>
                    <td className="p-3.5 text-center">
                      <select
                        value={editForm.rol}
                        onChange={(e) => setEditForm((p) => ({ ...p, rol: e.target.value }))}
                        className="bg-white border border-gray-200 rounded-lg px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-slate-500/30"
                      >
                        {roles.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="p-3.5 text-center">
                      <select
                        value={editForm.estado}
                        onChange={(e) => setEditForm((p) => ({ ...p, estado: e.target.value }))}
                        className="bg-white border border-gray-200 rounded-lg px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-slate-500/30"
                      >
                        <option value="activo">activo</option>
                        <option value="inactivo">inactivo</option>
                      </select>
                    </td>
                    <td className="p-3.5 text-center">
                      <div className="flex justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => actualizarMutation.mutate()}
                          disabled={actualizarMutation.isPending}
                          className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg"
                          title="Guardar"
                        >
                          <Check size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditandoId(null)}
                          className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg"
                          title="Cancelar"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  <AnimatedTableRow key={u.id} index={idx}>
                    <td className="p-3.5 font-medium text-navy-800">{u.nombre}</td>
                    <td className="p-3.5 text-gray-600">{u.email}</td>
                    <td className="p-3.5 text-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${rolColor[u.rol] ?? 'bg-gray-50 text-gray-600 border border-gray-200'}`}
                      >
                        {u.rol}
                      </span>
                    </td>
                    <td className="p-3.5 text-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${u.estado === 'activo' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}
                      >
                        {u.estado}
                      </span>
                    </td>
                    <td className="p-3.5 text-center">
                      <div className="flex justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => iniciarEdicion(u)}
                          className="p-1.5 text-slate-600 hover:bg-slate-50 rounded-lg"
                          title="Editar"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const pwd = prompt('Nueva contraseña para ' + u.nombre + ':');
                            if (pwd && pwd.length >= 6)
                              resetPasswordMutation.mutate({ id: u.id, password: pwd });
                            else if (pwd) alert('La contraseña debe tener al menos 6 caracteres');
                          }}
                          disabled={resetPasswordMutation.isPending}
                          className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg"
                          title="Cambiar contraseña"
                        >
                          <Key size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`¿Eliminar usuario ${u.nombre}?`))
                              eliminarMutation.mutate(u.id);
                          }}
                          disabled={eliminarMutation.isPending}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"
                          title="Eliminar"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </AnimatedTableRow>
                ),
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AnimatedFadeIn>
  );
}
