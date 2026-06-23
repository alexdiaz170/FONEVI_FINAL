import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Check, Key, UserPlus, Copy, RefreshCw, Trash2 } from 'lucide-react';
import {
  apiListarSocios,
  apiListarUsuarios,
  apiCrearUsuario,
  apiActualizarUsuario,
  apiEliminarUsuario,
  ApiError,
  type SocioDTO,
  type UsuarioDTO,
} from '../../lib/api';

function generarPassword(length = 10) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#$%&';
  let pwd = '';
  for (let i = 0; i < length; i++) pwd += chars[Math.floor(Math.random() * chars.length)];
  return pwd;
}

export function GestionCredenciales() {
  const queryClient = useQueryClient();

  const { data: socios, isLoading: sociosLoading } = useQuery({
    queryKey: ['socios-all'],
    queryFn: () => apiListarSocios(1, 99999),
  });

  const { data: usuarios, isLoading: usuariosLoading } = useQuery({
    queryKey: ['usuarios'],
    queryFn: () => apiListarUsuarios(),
  });

  const crearMutation = useMutation({
    mutationFn: (data: { nombre: string; email: string; password: string }) =>
      apiCrearUsuario({
        nombre: data.nombre,
        email: data.email,
        password: data.password,
        rol: 'socio',
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['usuarios'] }),
  });

  const resetMutation = useMutation({
    mutationFn: ({ id, password }: { id: string; password: string }) =>
      apiActualizarUsuario(id, { password }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['usuarios'] }),
  });

  const eliminarMutation = useMutation({
    mutationFn: (id: string) => apiEliminarUsuario(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['usuarios'] }),
  });

  const [mensaje, setMensaje] = useState<{ text: string; type: 'ok' | 'error' } | null>(null);
  const [modal, setModal] = useState<{
    socio: SocioDTO;
    user?: UsuarioDTO;
    password: string;
    done: boolean;
  } | null>(null);

  function abrirCrear(s: SocioDTO) {
    setModal({ socio: s, password: generarPassword(), done: false });
  }

  function abrirReset(u: UsuarioDTO, s: SocioDTO) {
    setModal({ socio: s, user: u, password: generarPassword(), done: false });
  }

  function confirmarModal() {
    if (!modal) return;
    if (modal.user) {
      resetMutation.mutate(
        { id: modal.user.id, password: modal.password },
        {
          onSuccess: () => setModal({ ...modal, done: true }),
          onError: (err) =>
            setMensaje({
              text: err instanceof ApiError ? err.message : 'Error al resetear contraseña',
              type: 'error',
            }),
        },
      );
    } else {
      crearMutation.mutate(
        { nombre: modal.socio.nombre, email: modal.socio.email!, password: modal.password },
        {
          onSuccess: () => setModal({ ...modal, done: true }),
          onError: (err) =>
            setMensaje({
              text: err instanceof ApiError ? err.message : 'Error al crear usuario',
              type: 'error',
            }),
        },
      );
    }
  }

  if (sociosLoading || usuariosLoading)
    return <div className="text-gray-400 text-center py-8">Cargando...</div>;

  const usuarioPorEmail = new Map(usuarios?.map((u) => [u.email.toLowerCase(), u]) ?? []);

  return (
    <div>
      <p className="text-sm text-gray-500 mb-4">
        Administrar cuentas de usuario de los socios. Cada socio debe tener un email para poder
        iniciar sesión.
      </p>

      {modal && !mensaje && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
          onClick={() => setModal(null)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            {modal.done ? (
              <div>
                <div className="flex items-center gap-2 text-green-600 mb-4">
                  <Check size={20} />
                  <h3 className="font-semibold text-lg">Contraseña generada</h3>
                </div>
                <p className="text-sm text-gray-600 mb-1">
                  {modal.user ? `Contraseña actualizada para` : `Usuario creado para`}
                </p>
                <p className="font-medium mb-3">{modal.socio.nombre}</p>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4 text-center">
                  <code
                    className="text-xl font-mono font-bold text-navy-700 select-all"
                    ref={(el) => el?.focus()}
                  >
                    {modal.password}
                  </code>
                </div>
                <p className="text-xs text-amber-600 mb-4">
                  Copie esta contraseña y entréguela al socio. Por seguridad no podrá consultarla
                  después.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(modal.password);
                      setMensaje({ text: 'Contraseña copiada al portapapeles', type: 'ok' });
                      setModal(null);
                    }}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-navy-600 text-white px-4 py-2 rounded-lg hover:bg-navy-700 text-sm font-medium"
                  >
                    <Copy size={16} /> Copiar
                  </button>
                  <button
                    onClick={() => setModal(null)}
                    className="px-4 py-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg text-sm font-medium"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Key size={20} className="text-amber-500" />
                  <h3 className="font-semibold text-lg">
                    {modal.user ? 'Resetear contraseña' : 'Crear usuario'}
                  </h3>
                </div>
                <p className="text-sm text-gray-600 mb-1">
                  {modal.user ? 'Nueva contraseña para' : 'Se creará usuario para'}
                </p>
                <p className="font-medium mb-4">{modal.socio.nombre}</p>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
                <div className="flex gap-2 mb-4">
                  <div className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 font-mono text-lg font-bold tracking-wider text-navy-700 select-all">
                    {modal.password}
                  </div>
                  <button
                    onClick={() => setModal({ ...modal, password: generarPassword() })}
                    className="p-2.5 text-gray-500 hover:text-navy-600 hover:bg-gray-100 rounded-lg"
                    title="Generar nueva contraseña"
                  >
                    <RefreshCw size={18} />
                  </button>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={confirmarModal}
                    disabled={crearMutation.isPending || resetMutation.isPending}
                    className="flex-1 bg-navy-600 text-white px-4 py-2 rounded-lg hover:bg-navy-700 text-sm font-medium disabled:opacity-50"
                  >
                    {crearMutation.isPending || resetMutation.isPending
                      ? 'Guardando...'
                      : 'Confirmar'}
                  </button>
                  <button
                    onClick={() => setModal(null)}
                    className="px-4 py-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg text-sm font-medium"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {mensaje && (
        <div
          className={`mb-4 px-4 py-3 rounded text-sm ${mensaje.type === 'ok' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}
        >
          {mensaje.text}
          <button onClick={() => setMensaje(null)} className="float-right font-bold">
            &times;
          </button>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="text-left px-4 py-3">Socio</th>
              <th className="text-left px-4 py-3">Documento</th>
              <th className="text-left px-4 py-3">Teléfono</th>
              <th className="text-left px-4 py-3">Email</th>
              <th className="text-center px-4 py-3">Usuario</th>
              <th className="text-center px-4 py-3">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {(socios?.data ?? []).length === 0 && (
              <tr>
                <td colSpan={6} className="text-center text-gray-400 py-8">
                  No hay socios registrados
                </td>
              </tr>
            )}
            {(socios?.data ?? []).map((s) => {
              const user = s.email ? usuarioPorEmail.get(s.email.toLowerCase()) : undefined;
              return (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link
                      to={`/socios/${s.id}`}
                      className="text-navy-600 hover:text-navy-800 hover:underline font-medium"
                    >
                      {s.nombre}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-xs">
                    {s.tipoDocumento} {s.numeroDocumento}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{s.telefono ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-600 text-xs">{s.email ?? '—'}</td>
                  <td className="px-4 py-3 text-center">
                    {user ? (
                      <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">
                        Activo
                      </span>
                    ) : (
                      <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-500">
                        Sin cuenta
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex justify-center gap-1">
                      {user ? (
                        <>
                          <button
                            onClick={() => abrirReset(user, s)}
                            className="p-1.5 text-amber-600 hover:bg-amber-50 rounded"
                            title="Resetear contraseña"
                          >
                            <Key size={16} />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`¿Eliminar usuario ${user.nombre}?`))
                                eliminarMutation.mutate(user.id);
                            }}
                            disabled={eliminarMutation.isPending}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded"
                            title="Eliminar usuario"
                          >
                            <Trash2 size={16} />
                          </button>
                        </>
                      ) : s.email ? (
                        <button
                          onClick={() => abrirCrear(s)}
                          className="p-1.5 text-navy-600 hover:bg-navy-50 rounded"
                          title="Crear usuario"
                        >
                          <UserPlus size={16} />
                        </button>
                      ) : (
                        <span className="text-xs text-gray-400 italic">Sin email</span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
