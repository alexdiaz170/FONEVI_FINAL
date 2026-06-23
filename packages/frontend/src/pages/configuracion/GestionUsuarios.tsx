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

const roles = ['superadmin', 'admin', 'contador', 'socio'];

const rolColor: Record<string, string> = {
  superadmin: 'bg-red-100 text-red-700',
  admin: 'bg-navy-100 text-navy-700',
  contador: 'bg-purple-100 text-purple-700',
  socio: 'bg-green-100 text-green-700',
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
    },
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
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">Gestión de usuarios del sistema.</p>
        <button
          onClick={() => {
            setShowCrear(!showCrear);
            setEditandoId(null);
          }}
          className="inline-flex items-center gap-1 px-4 py-2 bg-navy-700 text-white rounded-md text-sm font-medium hover:bg-navy-800"
        >
          <UserPlus size={16} /> {showCrear ? 'Cancelar' : 'Nuevo Usuario'}
        </button>
      </div>

      {showCrear && (
        <div className="bg-white rounded-lg shadow p-4 mb-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Crear Usuario</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Nombre *</label>
              <input
                value={form.nombre}
                onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))}
                className="w-full px-3 py-2 border rounded-md text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Email *</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                className="w-full px-3 py-2 border rounded-md text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Contraseña *</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                className="w-full px-3 py-2 border rounded-md text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Rol *</label>
              <select
                value={form.rol}
                onChange={(e) => setForm((p) => ({ ...p, rol: e.target.value }))}
                className="w-full px-3 py-2 border rounded-md text-sm"
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
            <div className="mt-3 text-sm text-red-600 bg-red-50 px-3 py-2 rounded">{formError}</div>
          )}

          <div className="mt-3 flex gap-2">
            <button
              onClick={() => crearMutation.mutate()}
              disabled={crearMutation.isPending || !form.nombre || !form.email || !form.password}
              className="px-4 py-2 bg-navy-700 text-white rounded-md text-sm font-medium hover:bg-navy-800 disabled:opacity-50"
            >
              {crearMutation.isPending ? 'Creando...' : 'Crear Usuario'}
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="text-left px-4 py-3">Nombre</th>
              <th className="text-left px-4 py-3">Email</th>
              <th className="text-center px-4 py-3">Contraseña</th>
              <th className="text-center px-4 py-3">Rol</th>
              <th className="text-center px-4 py-3">Estado</th>
              <th className="text-center px-4 py-3">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {(usuarios ?? []).length === 0 && (
              <tr>
                <td colSpan={6} className="text-center text-gray-400 py-8">
                  No hay usuarios registrados
                </td>
              </tr>
            )}
            {(usuarios ?? []).map((u) =>
              editandoId === u.id ? (
                <tr key={u.id} className="bg-yellow-50">
                  <td className="px-4 py-3">
                    <input
                      value={editForm.nombre}
                      onChange={(e) => setEditForm((p) => ({ ...p, nombre: e.target.value }))}
                      className="w-full px-2 py-1 border rounded text-sm"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      value={editForm.email}
                      onChange={(e) => setEditForm((p) => ({ ...p, email: e.target.value }))}
                      className="w-full px-2 py-1 border rounded text-sm"
                    />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <input
                      type="password"
                      value={editForm.password}
                      onChange={(e) => setEditForm((p) => ({ ...p, password: e.target.value }))}
                      className="w-28 px-2 py-1 border rounded text-sm"
                      placeholder="Nueva"
                    />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <select
                      value={editForm.rol}
                      onChange={(e) => setEditForm((p) => ({ ...p, rol: e.target.value }))}
                      className="px-2 py-1 border rounded text-sm"
                    >
                      {roles.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <select
                      value={editForm.estado}
                      onChange={(e) => setEditForm((p) => ({ ...p, estado: e.target.value }))}
                      className="px-2 py-1 border rounded text-sm"
                    >
                      <option value="activo">activo</option>
                      <option value="inactivo">inactivo</option>
                    </select>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex justify-center gap-1">
                      <button
                        onClick={() => actualizarMutation.mutate()}
                        disabled={actualizarMutation.isPending}
                        className="p-1.5 text-green-600 hover:bg-green-50 rounded"
                        title="Guardar"
                      >
                        <Check size={16} />
                      </button>
                      <button
                        onClick={() => setEditandoId(null)}
                        className="p-1.5 text-gray-400 hover:bg-gray-100 rounded"
                        title="Cancelar"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{u.nombre}</td>
                  <td className="px-4 py-3 text-gray-600">{u.email}</td>
                  <td className="px-4 py-3 text-center text-gray-400 font-mono">••••••••</td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${rolColor[u.rol] ?? 'bg-gray-100 text-gray-600'}`}
                    >
                      {u.rol}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${u.estado === 'activo' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
                    >
                      {u.estado}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex justify-center gap-1">
                      <button
                        onClick={() => iniciarEdicion(u)}
                        className="p-1.5 text-navy-600 hover:bg-navy-50 rounded"
                        title="Editar"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => {
                          const pwd = prompt('Nueva contraseña para ' + u.nombre + ':');
                          if (pwd && pwd.length >= 6)
                            resetPasswordMutation.mutate({ id: u.id, password: pwd });
                          else if (pwd) alert('La contraseña debe tener al menos 6 caracteres');
                        }}
                        disabled={resetPasswordMutation.isPending}
                        className="p-1.5 text-amber-600 hover:bg-amber-50 rounded"
                        title="Cambiar contraseña"
                      >
                        <Key size={16} />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`¿Eliminar usuario ${u.nombre}?`))
                            eliminarMutation.mutate(u.id);
                        }}
                        disabled={eliminarMutation.isPending}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded"
                        title="Eliminar"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ),
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
