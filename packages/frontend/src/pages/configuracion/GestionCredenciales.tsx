import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Check, Key, UserPlus, Copy, RefreshCw, Trash2, X } from 'lucide-react';
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
import { AnimatedFadeIn, AnimatedTableRow, AnimatedButton } from '../../components/ui';

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
    <AnimatedFadeIn>
      <p className="text-sm text-gray-500 mb-4">
        Administrar cuentas de usuario de los socios. Cada socio debe tener un email para poder
        iniciar sesión.
      </p>

      {mensaje && (
        <div
          className={`mb-4 px-4 py-3 rounded-xl text-sm border ${mensaje.type === 'ok' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}
        >
          {mensaje.text}
          <button onClick={() => setMensaje(null)} className="float-right font-bold">
            &times;
          </button>
        </div>
      )}

      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gradient-to-r from-gray-50 to-gray-100/50 text-gray-500">
              <th className="text-left p-3.5 font-semibold text-xs uppercase tracking-wider">
                Socio
              </th>
              <th className="text-left p-3.5 font-semibold text-xs uppercase tracking-wider">
                Documento
              </th>
              <th className="text-left p-3.5 font-semibold text-xs uppercase tracking-wider">
                Teléfono
              </th>
              <th className="text-left p-3.5 font-semibold text-xs uppercase tracking-wider">
                Email
              </th>
              <th className="text-center p-3.5 font-semibold text-xs uppercase tracking-wider">
                Usuario
              </th>
              <th className="text-center p-3.5 font-semibold text-xs uppercase tracking-wider">
                Acción
              </th>
            </tr>
          </thead>
          <tbody>
            {(socios?.data ?? []).length === 0 && (
              <tr>
                <td colSpan={6} className="text-center text-gray-400 py-8">
                  No hay socios registrados
                </td>
              </tr>
            )}
            {(socios?.data ?? []).map((s, idx) => {
              const user = s.email ? usuarioPorEmail.get(s.email.toLowerCase()) : undefined;
              return (
                <AnimatedTableRow key={s.id} index={idx}>
                  <td className="p-3.5">
                    <Link
                      to={`/socios/${s.id}`}
                      className="text-slate-600 hover:text-slate-800 hover:underline font-medium"
                    >
                      {s.nombre}
                    </Link>
                  </td>
                  <td className="p-3.5 text-gray-600 text-xs">
                    {s.tipoDocumento} {s.numeroDocumento}
                  </td>
                  <td className="p-3.5 text-gray-600">{s.telefono ?? '—'}</td>
                  <td className="p-3.5 text-gray-600 text-xs">{s.email ?? '—'}</td>
                  <td className="p-3.5 text-center">
                    {user ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                        Activo
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-50 text-gray-500 border border-gray-200">
                        Sin cuenta
                      </span>
                    )}
                  </td>
                  <td className="p-3.5 text-center">
                    <div className="flex justify-center gap-1">
                      {user ? (
                        <>
                          <button
                            onClick={() => abrirReset(user, s)}
                            className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg"
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
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"
                            title="Eliminar usuario"
                          >
                            <Trash2 size={16} />
                          </button>
                        </>
                      ) : s.email ? (
                        <button
                          onClick={() => abrirCrear(s)}
                          className="p-1.5 text-slate-600 hover:bg-slate-50 rounded-lg"
                          title="Crear usuario"
                        >
                          <UserPlus size={16} />
                        </button>
                      ) : (
                        <span className="text-xs text-gray-400 italic">Sin email</span>
                      )}
                    </div>
                  </td>
                </AnimatedTableRow>
              );
            })}
          </tbody>
        </table>
      </div>

      {modal && !mensaje && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={() => setModal(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4 border border-gray-100"
            onClick={(e) => e.stopPropagation()}
          >
            {modal.done ? (
              <div>
                <div className="flex items-center gap-2 text-emerald-600 mb-4">
                  <Check size={20} />
                  <h3 className="font-semibold text-lg">Contraseña generada</h3>
                </div>
                <p className="text-sm text-gray-600 mb-1">
                  {modal.user ? 'Contraseña actualizada para' : 'Usuario creado para'}
                </p>
                <p className="font-medium mb-3 text-navy-800">{modal.socio.nombre}</p>
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 mb-4 text-center">
                  <code className="text-xl font-mono font-bold text-navy-700 select-all">
                    {modal.password}
                  </code>
                </div>
                <p className="text-xs text-amber-600 mb-4">
                  Copie esta contraseña y entréguela al socio. Por seguridad no podrá consultarla
                  después.
                </p>
                <div className="flex gap-2">
                  <AnimatedButton
                    onClick={() => {
                      navigator.clipboard.writeText(modal.password);
                      setMensaje({ text: 'Contraseña copiada al portapapeles', type: 'ok' });
                      setModal(null);
                    }}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-gradient-to-r from-slate-700 to-slate-500 text-white px-4 py-2 rounded-xl hover:from-slate-800 hover:to-slate-600 text-sm font-medium shadow-md transition-all"
                  >
                    <Copy size={16} /> Copiar
                  </AnimatedButton>
                  <button
                    onClick={() => setModal(null)}
                    className="px-4 py-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl text-sm font-medium transition-all"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-md">
                    <Key size={18} className="text-white" />
                  </div>
                  <h3 className="font-semibold text-lg text-navy-800">
                    {modal.user ? 'Resetear contraseña' : 'Crear usuario'}
                  </h3>
                </div>
                <p className="text-sm text-gray-600 mb-1">
                  {modal.user ? 'Nueva contraseña para' : 'Se creará usuario para'}
                </p>
                <p className="font-medium mb-4 text-navy-800">{modal.socio.nombre}</p>
                <label className="block text-sm font-medium text-navy-700 mb-1">Contraseña</label>
                <div className="flex gap-2 mb-4">
                  <div className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 font-mono text-lg font-bold tracking-wider text-navy-700 select-all">
                    {modal.password}
                  </div>
                  <button
                    onClick={() => setModal({ ...modal, password: generarPassword() })}
                    className="p-2.5 text-gray-500 hover:text-slate-600 hover:bg-gray-100 rounded-lg transition-all"
                    title="Generar nueva contraseña"
                  >
                    <RefreshCw size={18} />
                  </button>
                </div>
                <div className="flex gap-2">
                  <AnimatedButton
                    onClick={confirmarModal}
                    disabled={crearMutation.isPending || resetMutation.isPending}
                    className="flex-1 bg-gradient-to-r from-slate-700 to-slate-500 text-white px-4 py-2 rounded-xl hover:from-slate-800 hover:to-slate-600 text-sm font-medium shadow-md disabled:opacity-50 transition-all"
                  >
                    {crearMutation.isPending || resetMutation.isPending
                      ? 'Guardando...'
                      : 'Confirmar'}
                  </AnimatedButton>
                  <button
                    onClick={() => setModal(null)}
                    className="px-4 py-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl text-sm font-medium transition-all"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </AnimatedFadeIn>
  );
}
