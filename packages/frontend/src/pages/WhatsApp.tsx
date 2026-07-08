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
  Search,
} from 'lucide-react';
import { apiWhatsAppEstado, apiWhatsAppEnviar, apiWhatsAppLogs, type WaLogEntry } from '../lib/api';
import { AnimatedFadeIn, AnimatedTableRow, AnimatedButton } from '../components/ui';

const ESTADO_COLORS: Record<string, string> = {
  enviado: 'bg-green-50 text-green-700 border border-green-200',
  error: 'bg-red-50 text-red-700 border border-red-200',
  config_error: 'bg-amber-50 text-amber-700 border border-amber-200',
  pendiente: 'bg-blue-50 text-blue-700 border border-blue-200',
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
    <div className="relative">
      <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full -translate-y-1/4 translate-x-1/4 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-green-500/10 rounded-full translate-y-1/3 -translate-x-1/4 pointer-events-none" />

      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-green-500 flex items-center justify-center shadow-lg shadow-emerald-500/25">
          <MessageSquare size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-navy-800">WhatsApp</h1>
          <p className="text-sm text-gray-500">Envío de mensajes automatizados</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <AnimatedFadeIn>
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100 p-5">
              <h2 className="text-lg font-bold text-navy-800 mb-4">Enviar mensaje</h2>
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="wa-numero"
                    className="block text-sm font-medium text-navy-700 mb-1"
                  >
                    Número
                  </label>
                  <input
                    id="wa-numero"
                    type="text"
                    value={numero}
                    onChange={(e) => setNumero(e.target.value)}
                    placeholder="Ej: 573001234567"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label
                    htmlFor="wa-template"
                    className="block text-sm font-medium text-navy-700 mb-1"
                  >
                    Template
                  </label>
                  <select
                    id="wa-template"
                    value={template}
                    onChange={(e) => setTemplate(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                  >
                    <option value="recordatorio_pago">Recordatorio de pago</option>
                    <option value="confirmacion_aporte">Confirmación de aporte</option>
                    <option value="alerta_mora">Alerta de mora</option>
                    <option value="notificacion_credito">Notificación de crédito</option>
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="wa-variables"
                    className="block text-sm font-medium text-navy-700 mb-1"
                  >
                    Variables (JSON opcional)
                  </label>
                  <textarea
                    id="wa-variables"
                    value={variables}
                    onChange={(e) => setVariables(e.target.value)}
                    placeholder='{"nombre": "Juan", "monto": "125000"}'
                    rows={3}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-mono outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 resize-none"
                  />
                </div>
                <AnimatedButton
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
                  className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-green-500 text-white rounded-xl font-medium shadow-lg shadow-emerald-500/25 hover:from-emerald-700 hover:to-green-600 disabled:opacity-50 inline-flex items-center gap-2 transition-all"
                >
                  {enviarMutation.isPending ? (
                    <RotateCw size={16} className="animate-spin" />
                  ) : (
                    <Send size={16} />
                  )}
                  {enviarMutation.isPending ? 'Enviando...' : 'Enviar'}
                </AnimatedButton>
                {!estado?.configurado && (
                  <p className="text-xs text-amber-600">
                    WhatsApp no está configurado. Define WHATSAPP_API_URL y WHATSAPP_TOKEN en el
                    .env
                  </p>
                )}
                {enviarMutation.data && (
                  <div
                    className={`p-3 rounded-xl text-sm ${enviarMutation.data.success ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'}`}
                  >
                    {enviarMutation.data.success
                      ? 'Mensaje enviado correctamente'
                      : `Error: ${enviarMutation.data.error}`}
                  </div>
                )}
              </div>
            </div>
          </AnimatedFadeIn>

          <AnimatedFadeIn>
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-lg font-bold text-navy-800">Logs de envío</h2>
                <div className="flex items-center gap-2">
                  <select
                    aria-label="Filtrar por estado"
                    value={filtroEstado}
                    onChange={(e) => {
                      setFiltroEstado(e.target.value);
                      setLogPage(1);
                    }}
                    className="bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500/30"
                  >
                    <option value="">Todos</option>
                    <option value="enviado">Enviado</option>
                    <option value="error">Error</option>
                    <option value="config_error">Config Error</option>
                    <option value="pendiente">Pendiente</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => queryClient.invalidateQueries({ queryKey: ['whatsapp-logs'] })}
                    aria-label="Actualizar logs"
                    className="p-2 text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg"
                  >
                    <RefreshCw size={16} />
                  </button>
                </div>
              </div>
              {loadingLogs ? (
                <div className="p-12 text-center text-gray-400">
                  <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  Cargando...
                </div>
              ) : !logs?.data.length ? (
                <div className="p-8 text-center text-gray-400">No hay registros de envío</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gradient-to-r from-gray-50 to-gray-100/50 text-gray-500">
                        <th className="text-left p-3.5 font-semibold text-xs uppercase tracking-wider">
                          Número
                        </th>
                        <th className="text-left p-3.5 font-semibold text-xs uppercase tracking-wider">
                          Template
                        </th>
                        <th className="text-left p-3.5 font-semibold text-xs uppercase tracking-wider">
                          Estado
                        </th>
                        <th className="text-left p-3.5 font-semibold text-xs uppercase tracking-wider">
                          Fecha
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {logs.data.map((log: WaLogEntry, idx: number) => (
                        <AnimatedTableRow key={log.id} index={idx}>
                          <td className="p-3.5 font-mono text-xs text-gray-500">{log.numero}</td>
                          <td className="p-3.5 text-gray-700">{log.template}</td>
                          <td className="p-3.5">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${ESTADO_COLORS[log.estado] ?? 'bg-gray-50 text-gray-600 border border-gray-200'}`}
                            >
                              {log.estado}
                            </span>
                          </td>
                          <td className="p-3.5 text-gray-500 text-xs">
                            {new Date(log.enviadoEn).toLocaleString('es-CO')}
                          </td>
                        </AnimatedTableRow>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {logs && logs.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 p-4 border-t border-gray-100">
                  <AnimatedButton
                    onClick={() => setLogPage(Math.max(1, logPage - 1))}
                    disabled={logPage <= 1}
                    className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50"
                  >
                    Anterior
                  </AnimatedButton>
                  {
                    Array.from({ length: logs.totalPages }, (_, i) => i + 1).reduce(
                      (acc, p) => {
                        if (p === 1 || p === logs.totalPages || Math.abs(p - logPage) <= 2) {
                          acc.elements.push(
                            <span key={p} className="flex items-center gap-1">
                              {acc.lastPage !== undefined && acc.lastPage !== p - 1 && (
                                <span className="text-gray-400 px-1">...</span>
                              )}
                              <button
                                onClick={() => setLogPage(p)}
                                type="button"
                                className={`px-3 py-1.5 text-sm border border-gray-200 rounded-lg ${p === logPage ? 'bg-gradient-to-r from-emerald-600 to-green-500 text-white' : 'hover:bg-gray-50'}`}
                              >
                                {p}
                              </button>
                            </span>,
                          );
                          acc.lastPage = p;
                        }
                        return acc;
                      },
                      {
                        elements: [] as React.ReactNode[],
                        lastPage: undefined as number | undefined,
                      },
                    ).elements
                  }
                  <AnimatedButton
                    onClick={() => setLogPage(Math.min(logs.totalPages, logPage + 1))}
                    disabled={logPage >= logs.totalPages}
                    className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50"
                  >
                    Siguiente
                  </AnimatedButton>
                </div>
              )}
            </div>
          </AnimatedFadeIn>
        </div>

        <div className="space-y-6">
          <AnimatedFadeIn>
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100 p-5">
              <h2 className="text-lg font-bold text-navy-800 mb-4">Estado de conexión</h2>
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
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-800 flex items-start gap-2">
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
          </AnimatedFadeIn>
        </div>
      </div>
    </div>
  );
}
