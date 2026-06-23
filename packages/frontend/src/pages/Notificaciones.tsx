import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Bell, CheckCheck, Mail, MailOpen, AlertCircle, ExternalLink, Trash2 } from 'lucide-react';
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
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-navy-800">
          Notificaciones{' '}
          {noLeidas > 0 && (
            <span className="text-sm font-normal text-gray-500">({noLeidas} sin leer)</span>
          )}
        </h1>
        {!esSocio && (
          <button
            onClick={() => setShowCrear(true)}
            className="px-4 py-2 bg-navy-700 text-white rounded-md text-sm font-medium hover:bg-navy-800"
          >
            Nueva Notificación
          </button>
        )}
      </div>

      <div className="flex gap-2 mb-4">
        {(['noleidas', 'todas', 'leidas'] as const).map((f) => (
          <button
            key={f}
            onClick={() => {
              setFiltro(f);
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-md text-xs font-medium ${filtro === f ? 'bg-navy-700 text-white' : 'bg-white text-gray-600 border hover:bg-gray-50'}`}
          >
            {f === 'noleidas' ? 'No leídas' : f === 'todas' ? 'Todas' : 'Leídas'}
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm mb-4">
          {error}
        </div>
      )}

      <div className="space-y-2">
        {isLoading && <div className="p-8 text-center text-gray-400">Cargando...</div>}
        {data?.data?.map((n: NotificacionDTO) => (
          <div
            key={n.id}
            className={`bg-white rounded-lg shadow-sm border p-4 flex items-start gap-3 ${!n.leida ? 'border-l-4 border-l-navy-500' : ''}`}
          >
            <div
              className={`p-2 rounded-full ${n.urgente ? 'bg-red-100' : 'bg-gray-100'} shrink-0`}
            >
              {n.urgente ? (
                <AlertCircle size={16} className="text-red-500" />
              ) : (
                <Bell size={16} className="text-gray-500" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p
                    className={`text-sm font-medium ${!n.leida ? 'text-gray-900' : 'text-gray-600'}`}
                  >
                    {n.titulo}
                  </p>
                  <span className="text-xs text-gray-400 uppercase">{n.tipo}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-gray-400">{formatDate(n.createdAt)}</span>
                  {!n.leida && (
                    <button
                      onClick={() => marcarMutation.mutate(n.id)}
                      className="p-1 text-navy-600 hover:bg-navy-50 rounded"
                      title="Marcar como leída"
                    >
                      <CheckCheck size={16} />
                    </button>
                  )}
                  <button
                    onClick={() => {
                      if (confirm('¿Eliminar esta notificación?')) eliminarMutation.mutate(n.id);
                    }}
                    className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded"
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
                      className="inline-flex items-center gap-1 text-xs text-navy-600 hover:text-navy-800 font-medium"
                    >
                      <ExternalLink size={12} /> Ver socio
                    </Link>
                  )}
                  {n.referenciaTipo === 'credito' && (
                    <Link
                      to={`/creditos/${n.referenciaId}`}
                      className="inline-flex items-center gap-1 text-xs text-navy-600 hover:text-navy-800 font-medium"
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
                <Mail size={16} className="text-navy-500" />
              )}
            </div>
          </div>
        ))}
        {data && data.data.length === 0 && (
          <div className="p-8 text-center text-gray-400">No hay notificaciones</div>
        )}
      </div>

      {showCrear && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setShowCrear(false)}
        >
          <div
            className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-gray-900 mb-4">Nueva Notificación</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                <select
                  value={form.tipo}
                  onChange={(e) => setForm((p) => ({ ...p, tipo: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-md text-sm"
                >
                  <option value="general">General</option>
                  <option value="sistema">Sistema</option>
                  <option value="cobro">Cobro</option>
                  <option value="alerta">Alerta</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
                <input
                  value={form.titulo}
                  onChange={(e) => setForm((p) => ({ ...p, titulo: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-md text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mensaje *</label>
                <textarea
                  rows={3}
                  value={form.mensaje}
                  onChange={(e) => setForm((p) => ({ ...p, mensaje: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-md text-sm"
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={form.urgente}
                  onChange={(e) => setForm((p) => ({ ...p, urgente: e.target.checked }))}
                  className="rounded"
                />
                Urgente
              </label>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => crearMutation.mutate()}
                  disabled={crearMutation.isPending}
                  className="px-6 py-2 bg-navy-700 text-white rounded-md text-sm font-medium hover:bg-navy-800 disabled:opacity-50"
                >
                  {crearMutation.isPending ? 'Creando...' : 'Crear'}
                </button>
                <button
                  onClick={() => setShowCrear(false)}
                  className="px-6 py-2 border rounded-md text-sm text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
