import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  MessageSquare,
  Send,
  RotateCw,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import { apiWhatsAppEstado, apiWhatsAppEnviar, apiWhatsAppLogs, type WaLogEntry } from '../lib/api';

const ESTADO_COLORS: Record<string, string> = {
  enviado: 'bg-green-100 text-green-700',
  error: 'bg-red-100 text-red-700',
  config_error: 'bg-amber-100 text-amber-700',
  pendiente: 'bg-blue-100 text-blue-700',
};

export default function WhatsAppPage() {
  const queryClient = useQueryClient();
  const [numero, setNumero] = useState('');
  const [template, setTemplate] = useState('recordatorio_pago');
  const [variables, setVariables] = useState('');
  const [logPage, setLogPage] = useState(1);
  const [filtroEstado, setFiltroEstado] = useState('');

  const { data: estado, isLoading: loadingEstado } = useQuery({
    queryKey: ['whatsapp-estado'],
    queryFn: apiWhatsAppEstado,
  });

  const { data: logs, isLoading: loadingLogs } = useQuery({
    queryKey: ['whatsapp-logs', logPage, filtroEstado],
    queryFn: () => apiWhatsAppLogs({ page: logPage, limit: 10, estado: filtroEstado || undefined }),
  });

  const enviarMutation = useMutation({
    mutationFn: apiWhatsAppEnviar,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-logs'] });
      setNumero('');
      setVariables('');
    },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-navy-800 flex items-center gap-2">
          <MessageSquare size={24} className="text-navy-600" />
          WhatsApp
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <h2 className="text-lg font-semibold text-navy-800 mb-4">Enviar mensaje</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Número</label>
                <input
                  type="text"
                  value={numero}
                  onChange={(e) => setNumero(e.target.value)}
                  placeholder="Ej: 573001234567"
                  className="w-full px-3 py-2 border rounded-md text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Template</label>
                <select
                  value={template}
                  onChange={(e) => setTemplate(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md text-sm bg-white"
                >
                  <option value="recordatorio_pago">Recordatorio de pago</option>
                  <option value="confirmacion_aporte">Confirmación de aporte</option>
                  <option value="alerta_mora">Alerta de mora</option>
                  <option value="notificacion_credito">Notificación de crédito</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Variables (JSON opcional)
                </label>
                <textarea
                  value={variables}
                  onChange={(e) => setVariables(e.target.value)}
                  placeholder='{"nombre": "Juan", "monto": "125000"}'
                  rows={3}
                  className="w-full px-3 py-2 border rounded-md text-sm font-mono"
                />
              </div>
              <button
                onClick={() => {
                  let parsedVars: Record<string, string> | undefined;
                  if (variables.trim()) {
                    try {
                      parsedVars = JSON.parse(variables) as Record<string, string>;
                    } catch {
                      return;
                    }
                  }
                  enviarMutation.mutate({ numero, template, variables: parsedVars });
                }}
                disabled={
                  enviarMutation.isPending ||
                  !numero.trim() ||
                  !template.trim() ||
                  !estado?.configurado
                }
                className="px-6 py-2 bg-navy-700 text-white rounded-lg font-medium hover:bg-navy-800 disabled:opacity-50 inline-flex items-center gap-2"
              >
                {enviarMutation.isPending ? (
                  <RotateCw size={16} className="animate-spin" />
                ) : (
                  <Send size={16} />
                )}
                {enviarMutation.isPending ? 'Enviando...' : 'Enviar'}
              </button>
              {!estado?.configurado && (
                <p className="text-xs text-amber-600">
                  WhatsApp no está configurado. Define WHATSAPP_API_URL y WHATSAPP_TOKEN en el .env
                </p>
              )}
              {enviarMutation.data && (
                <div
                  className={`p-3 rounded text-sm ${
                    enviarMutation.data.success
                      ? 'bg-green-50 border border-green-200 text-green-700'
                      : 'bg-red-50 border border-red-200 text-red-700'
                  }`}
                >
                  {enviarMutation.data.success
                    ? `Mensaje enviado correctamente`
                    : `Error: ${enviarMutation.data.error}`}
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <div className="p-4 border-b flex items-center justify-between">
              <h2 className="text-lg font-semibold text-navy-800">Logs de envío</h2>
              <div className="flex items-center gap-2">
                <select
                  value={filtroEstado}
                  onChange={(e) => {
                    setFiltroEstado(e.target.value);
                    setLogPage(1);
                  }}
                  className="px-3 py-1.5 border rounded-md text-sm bg-white"
                >
                  <option value="">Todos</option>
                  <option value="enviado">Enviado</option>
                  <option value="error">Error</option>
                  <option value="config_error">Config Error</option>
                  <option value="pendiente">Pendiente</option>
                </select>
                <button
                  onClick={() => queryClient.invalidateQueries({ queryKey: ['whatsapp-logs'] })}
                  className="p-2 text-gray-500 hover:text-gray-700 border rounded-md"
                >
                  <RefreshCw size={16} />
                </button>
              </div>
            </div>
            {loadingLogs ? (
              <div className="p-8 text-center text-gray-400">
                <RotateCw size={24} className="animate-spin inline-block mb-2" />
                <p>Cargando...</p>
              </div>
            ) : !logs?.data.length ? (
              <div className="p-8 text-center text-gray-400">No hay registros de envío</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-left">
                    <tr>
                      <th className="px-4 py-3 font-medium text-gray-600">Número</th>
                      <th className="px-4 py-3 font-medium text-gray-600">Template</th>
                      <th className="px-4 py-3 font-medium text-gray-600">Estado</th>
                      <th className="px-4 py-3 font-medium text-gray-600">Fecha</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {logs.data.map((log: WaLogEntry) => (
                      <tr key={log.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-mono text-xs">{log.numero}</td>
                        <td className="px-4 py-3">{log.template}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                              ESTADO_COLORS[log.estado] ?? 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {log.estado}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-500">
                          {new Date(log.enviadoEn).toLocaleString('es-CO')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {logs && logs.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 p-4 border-t">
                <button
                  onClick={() => setLogPage(Math.max(1, logPage - 1))}
                  disabled={logPage <= 1}
                  className="px-3 py-1.5 text-sm border rounded-md disabled:opacity-40 hover:bg-gray-50"
                >
                  Anterior
                </button>
                {Array.from({ length: logs.totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === logs.totalPages || Math.abs(p - logPage) <= 2)
                  .map((p, idx, arr) => {
                    const pages: React.ReactNode[] = [];
                    if (idx > 0 && p - arr[idx - 1] > 1) {
                      pages.push(
                        <span key={`ellipsis-${p}`} className="px-2 text-gray-400">
                          ...
                        </span>,
                      );
                    }
                    pages.push(
                      <button
                        key={p}
                        onClick={() => setLogPage(p)}
                        className={`px-3 py-1.5 text-sm border rounded-md ${
                          p === logPage ? 'bg-navy-700 text-white' : 'hover:bg-gray-50'
                        }`}
                      >
                        {p}
                      </button>,
                    );
                    return pages;
                  })}
                <button
                  onClick={() => setLogPage(Math.min(logs.totalPages, logPage + 1))}
                  disabled={logPage >= logs.totalPages}
                  className="px-3 py-1.5 text-sm border rounded-md disabled:opacity-40 hover:bg-gray-50"
                >
                  Siguiente
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <h2 className="text-lg font-semibold text-navy-800 mb-4">Estado de conexión</h2>
            {loadingEstado ? (
              <div className="text-center text-gray-400 py-4">
                <RotateCw size={20} className="animate-spin inline-block" />
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  {estado?.configurado ? (
                    <CheckCircle2 size={20} className="text-green-500" />
                  ) : (
                    <XCircle size={20} className="text-red-500" />
                  )}
                  <span className="text-sm font-medium">
                    {estado?.configurado ? 'Conectado' : 'No configurado'}
                  </span>
                </div>
                {estado?.apiUrl && (
                  <div className="text-xs text-gray-500 truncate">
                    <span className="font-medium">API:</span> {estado.apiUrl}
                  </div>
                )}
                {!estado?.configurado && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800 flex items-start gap-2">
                    <AlertCircle size={16} className="mt-0.5 shrink-0" />
                    <span>
                      Define <code className="text-xs bg-amber-100 px-1">WHATSAPP_API_URL</code> y{' '}
                      <code className="text-xs bg-amber-100 px-1">WHATSAPP_TOKEN</code> en el .env
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
