import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Bell,
  CheckCheck,
  Mail,
  MailOpen,
  AlertCircle,
  ExternalLink,
  Trash2,
  Plus,
  X,
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import {
  apiListarNotificaciones,
  apiCrearNotificacion,
  apiMarcarNotificacionLeida,
  apiEliminarNotificacion,
  ApiError,
  type NotificacionDTO,
} from '../lib/api';
import { formatDate } from '../lib/utils';
import { AnimatedFadeIn, AnimatedButton } from '../components/ui';

export default function NotificacionesPage() {
  const usuario = useAuthStore((s) => s.usuario);
  const esSocio = usuario?.rol === 'socio';
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [filtro, setFiltro] = useState<'todas' | 'noleidas' | 'leidas'>('noleidas');
  const [showCrear, setShowCrear] = useState(false);
  const [form, setForm] = useState({ tipo: 'general', titulo: '', mensaje: '', urgente: false });
  const [error, setError] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['notificaciones', page, filtro],
    queryFn: () =>
      apiListarNotificaciones({
        page,
        limit: 15,
        leida: filtro === 'leidas' ? true : filtro === 'noleidas' ? false : undefined,
      }),
    refetchInterval: 10000,
  });

  const marcarMutation = useMutation({
    mutationFn: (id: string) => apiMarcarNotificacionLeida(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notificaciones'] }),
  });

  const eliminarMutation = useMutation({
    mutationFn: (id: string) => apiEliminarNotificacion(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notificaciones'] }),
  });

  const crearMutation = useMutation({
    mutationFn: () =>
      apiCrearNotificacion({
        tipo: form.tipo,
        titulo: form.titulo,
        mensaje: form.mensaje,
        urgente: form.urgente,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificaciones'] });
      setShowCrear(false);
      setForm({ tipo: 'general', titulo: '', mensaje: '', urgente: false });
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : 'Error'),
  });

  const noLeidas = data?.data?.filter((n) => !n.leida).length ?? 0;

  return (
    <div className="relative">
      <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full -translate-y-1/4 translate-x-1/4 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-500/10 rounded-full translate-y-1/3 -translate-x-1/4 pointer-events-none" />

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/25">
            <Bell size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-navy-800">
              Notificaciones{' '}
              {noLeidas > 0 && (
                <span className="text-sm font-normal text-gray-500">({noLeidas} sin leer)</span>
              )}
            </h1>
          </div>
        </div>
        {!esSocio && (
          <AnimatedButton
            onClick={() => setShowCrear(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-500 text-white rounded-xl text-sm font-medium shadow-lg shadow-blue-500/25 hover:from-blue-700 hover:to-indigo-600 transition-all"
          >
            <Plus size={16} /> Nueva Notificación
          </AnimatedButton>
        )}
      </div>

      <div className="flex gap-2 mb-4">
        {(['noleidas', 'todas', 'leidas'] as const).map((f) => (
          <button
            type="button"
            key={f}
            onClick={() => {
              setFiltro(f);
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              filtro === f
                ? 'bg-gradient-to-r from-blue-600 to-indigo-500 text-white shadow-sm'
                : 'bg-white/80 backdrop-blur-sm text-gray-600 border border-gray-200 hover:bg-white hover:text-blue-600'
            }`}
          >
            {f === 'noleidas' ? 'No leídas' : f === 'todas' ? 'Todas' : 'Leídas'}
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm mb-4">
          {error}
        </div>
      )}

      <div className="space-y-2">
        {isLoading && (
          <div className="p-12 text-center text-gray-400">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            Cargando...
          </div>
        )}
        {data?.data?.map((n: NotificacionDTO) => (
          <div
            key={n.id}
            className={`bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border p-4 flex items-start gap-3 transition-all ${
              !n.leida ? 'border-l-4 border-l-blue-500' : 'border-gray-100'
            }`}
          >
            <div className={`p-2 rounded-xl ${n.urgente ? 'bg-red-100' : 'bg-blue-100'} shrink-0`}>
              {n.urgente ? (
                <AlertCircle size={16} className="text-red-500" />
              ) : (
                <Bell size={16} className="text-blue-500" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p
                    className={`text-sm font-medium ${!n.leida ? 'text-navy-800' : 'text-gray-600'}`}
                  >
                    {n.titulo}
                  </p>
                  <span className="text-xs text-gray-400 uppercase">{n.tipo}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-gray-400">{formatDate(n.createdAt)}</span>
                  {!n.leida && (
                    <button
                      type="button"
                      onClick={() => marcarMutation.mutate(n.id)}
                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                      title="Marcar como leída"
                    >
                      <CheckCheck size={16} />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm('¿Eliminar esta notificación?')) eliminarMutation.mutate(n.id);
                    }}
                    className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                    title="Eliminar"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <p className="text-sm text-gray-600 mt-1">{n.mensaje}</p>
              {n.referenciaId && n.referenciaTipo && (
                <div className="mt-2">
                  {n.referenciaTipo === 'socio' && (
                    <Link
                      to={`/socios/${n.referenciaId}`}
                      className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium"
                    >
                      <ExternalLink size={12} /> Ver socio
                    </Link>
                  )}
                  {n.referenciaTipo === 'credito' && (
                    <Link
                      to={`/creditos/${n.referenciaId}`}
                      className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium"
                    >
                      <ExternalLink size={12} /> Ver crédito
                    </Link>
                  )}
                </div>
              )}
            </div>
            <div className="shrink-0">
              {n.leida ? (
                <MailOpen size={16} className="text-gray-300" />
              ) : (
                <Mail size={16} className="text-blue-500" />
              )}
            </div>
          </div>
        ))}
        {data && data.data.length === 0 && (
          <div className="p-12 text-center text-gray-400">No hay notificaciones</div>
        )}
      </div>

      {showCrear && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={() => setShowCrear(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full mx-4 border border-gray-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-500 flex items-center justify-center shadow-md">
                  <Bell size={18} className="text-white" />
                </div>
                <h3 className="text-lg font-bold text-navy-800">Nueva Notificación</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCrear(false)}
                className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition-all"
              >
                <X size={16} />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label
                  htmlFor="notif-tipo"
                  className="block text-sm font-medium text-navy-700 mb-1"
                >
                  Tipo
                </label>
                <select
                  id="notif-tipo"
                  value={form.tipo}
                  onChange={(e) => setForm((p) => ({ ...p, tipo: e.target.value }))}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                >
                  <option value="general">General</option>
                  <option value="sistema">Sistema</option>
                  <option value="cobro">Cobro</option>
                  <option value="alerta">Alerta</option>
                </select>
              </div>
              <div>
                <label
                  htmlFor="notif-titulo"
                  className="block text-sm font-medium text-navy-700 mb-1"
                >
                  Título *
                </label>
                <input
                  id="notif-titulo"
                  value={form.titulo}
                  onChange={(e) => setForm((p) => ({ ...p, titulo: e.target.value }))}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                />
              </div>
              <div>
                <label
                  htmlFor="notif-mensaje"
                  className="block text-sm font-medium text-navy-700 mb-1"
                >
                  Mensaje *
                </label>
                <textarea
                  id="notif-mensaje"
                  rows={3}
                  value={form.mensaje}
                  onChange={(e) => setForm((p) => ({ ...p, mensaje: e.target.value }))}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 resize-none"
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-navy-700">
                <input
                  type="checkbox"
                  checked={form.urgente}
                  onChange={(e) => setForm((p) => ({ ...p, urgente: e.target.checked }))}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                Urgente
              </label>
              <div className="flex gap-3 pt-2">
                <AnimatedButton
                  onClick={() => crearMutation.mutate()}
                  disabled={crearMutation.isPending}
                  className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-500 text-white rounded-xl text-sm font-medium shadow-lg shadow-blue-500/25 hover:from-blue-700 hover:to-indigo-600 disabled:opacity-50 transition-all"
                >
                  {crearMutation.isPending ? 'Creando...' : 'Crear'}
                </AnimatedButton>
                <AnimatedButton
                  onClick={() => setShowCrear(false)}
                  className="px-6 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-700 hover:bg-gray-50 transition-all"
                >
                  Cancelar
                </AnimatedButton>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
