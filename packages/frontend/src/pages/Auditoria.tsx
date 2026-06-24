import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ScrollText, Search, RotateCw } from 'lucide-react';
import { apiListarAuditoria, type AuditoriaDTO } from '../lib/api';
import { AnimatedFadeIn, AnimatedTableRow } from '../components/ui';

const TABLAS = [
  { value: '', label: 'Todas las tablas' },
  { value: 'socios', label: 'Socios' },
  { value: 'aportes', label: 'Aportes' },
  { value: 'creditos', label: 'Créditos' },
  { value: 'notificaciones', label: 'Notificaciones' },
  { value: 'movimientos', label: 'Movimientos' },
  { value: 'solidaridad', label: 'Solidaridad' },
  { value: 'configuracion', label: 'Configuración' },
  { value: 'periodos', label: 'Períodos' },
  { value: 'usuarios', label: 'Usuarios' },
  { value: 'dividendos', label: 'Dividendos' },
  { value: 'acuerdos_pago', label: 'Acuerdos de Pago' },
];

function formatDateTime(date: string | null | undefined): string {
  try {
    if (!date) return '—';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '—';
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${mins}`;
  } catch {
    return '—';
  }
}

const accionColor: Record<string, string> = {
  CREAR: 'bg-green-50 text-green-700 border border-green-200',
  ACTUALIZAR: 'bg-blue-50 text-blue-700 border border-blue-200',
  ELIMINAR: 'bg-red-50 text-red-700 border border-red-200',
  INICIAR_SESION: 'bg-purple-50 text-purple-700 border border-purple-200',
  CERRAR_SESION: 'bg-gray-50 text-gray-600 border border-gray-200',
  APROBAR: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  RECHAZAR: 'bg-orange-50 text-orange-700 border border-orange-200',
  PAGAR: 'bg-teal-50 text-teal-700 border border-teal-200',
};

export default function AuditoriaPage() {
  const [page, setPage] = useState(1);
  const [filtroTabla, setFiltroTabla] = useState('');
  const [busqueda, setBusqueda] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['auditoria', page, filtroTabla],
    queryFn: () => apiListarAuditoria({ page, limit: 20, tabla: filtroTabla || undefined }),
  });

  const filteredData = data?.data?.filter((item) => {
    if (!busqueda) return true;
    const q = busqueda.toLowerCase();
    return (
      (item.usuarioNombre ?? '').toLowerCase().includes(q) ||
      item.accion.toLowerCase().includes(q) ||
      (item.detalle ?? '').toLowerCase().includes(q) ||
      (item.tabla ?? '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="relative">
      <div className="absolute top-0 right-0 w-64 h-64 bg-slate-500/10 rounded-full -translate-y-1/4 translate-x-1/4 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-slate-500/10 rounded-full translate-y-1/3 -translate-x-1/4 pointer-events-none" />

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-600 to-slate-500 flex items-center justify-center shadow-lg shadow-slate-500/25">
            <ScrollText size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-navy-800">Auditoría</h1>
            <p className="text-sm text-gray-500">Registro de actividades del sistema</p>
          </div>
        </div>
        <span className="text-sm text-gray-500">
          {data ? `Total: ${data.total} registros` : ''}
        </span>
      </div>

      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100 p-4 mb-4">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-medium text-gray-600 mb-1">Tabla</label>
            <select
              value={filtroTabla}
              onChange={(e) => {
                setFiltroTabla(e.target.value);
                setPage(1);
              }}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-500/30 focus:border-slate-500"
            >
              {TABLAS.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-medium text-gray-600 mb-1">Buscar</label>
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Usuario, acción, detalle..."
                className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-slate-500/30 focus:border-slate-500"
              />
            </div>
          </div>
          {busqueda && (
            <button
              onClick={() => setBusqueda('')}
              className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-xl"
            >
              Limpiar
            </button>
          )}
        </div>
      </div>

      <AnimatedFadeIn>
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {isLoading ? (
            <div className="p-12 text-center text-gray-400">
              <div className="w-8 h-8 border-2 border-slate-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              Cargando...
            </div>
          ) : filteredData && filteredData.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gradient-to-r from-gray-50 to-gray-100/50 text-gray-500">
                    <th className="text-left p-3.5 font-semibold text-xs uppercase tracking-wider">
                      Fecha / Hora
                    </th>
                    <th className="text-left p-3.5 font-semibold text-xs uppercase tracking-wider">
                      Usuario
                    </th>
                    <th className="text-left p-3.5 font-semibold text-xs uppercase tracking-wider">
                      Acción
                    </th>
                    <th className="text-left p-3.5 font-semibold text-xs uppercase tracking-wider">
                      Tabla
                    </th>
                    <th className="text-left p-3.5 font-semibold text-xs uppercase tracking-wider">
                      Detalle
                    </th>
                    <th className="text-left p-3.5 font-semibold text-xs uppercase tracking-wider">
                      IP
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((item: AuditoriaDTO, idx: number) => (
                    <AnimatedTableRow key={item.id} index={idx}>
                      <td className="p-3.5 text-gray-500 whitespace-nowrap text-xs">
                        {formatDateTime(item.createdAt)}
                      </td>
                      <td className="p-3.5 font-medium text-navy-800">
                        {item.usuarioNombre ?? (
                          <span className="text-gray-400 italic">Sistema</span>
                        )}
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${accionColor[item.accion.toUpperCase()] ?? 'bg-gray-50 text-gray-600 border border-gray-200'}`}
                        >
                          {item.accion}
                        </span>
                      </td>
                      <td className="p-3.5">
                        {item.tabla ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-mono bg-gray-100 text-gray-700">
                            {item.tabla}
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="p-3.5 text-gray-600 max-w-xs">
                        <p className="truncate" title={item.detalle ?? ''}>
                          {item.detalle ?? <span className="text-gray-400">—</span>}
                        </p>
                        {item.registroId && (
                          <p className="text-xs text-gray-400 mt-0.5 font-mono">
                            ID: {item.registroId.slice(0, 8)}...
                          </p>
                        )}
                      </td>
                      <td className="p-3.5 text-gray-400 text-xs font-mono">{item.ip ?? '—'}</td>
                    </AnimatedTableRow>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center text-gray-400">No hay registros de auditoría</div>
          )}
        </div>
      </AnimatedFadeIn>

      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page <= 1}
            className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50"
          >
            Anterior
          </button>
          {Array.from({ length: data.totalPages }, (_, i) => i + 1)
            .filter((p) => p === 1 || p === data.totalPages || Math.abs(p - page) <= 2)
            .map((p, idx, arr) => (
              <span key={p} className="flex items-center gap-1">
                {idx > 0 && arr[idx - 1] !== p - 1 && (
                  <span className="text-gray-400 px-1">...</span>
                )}
                <button
                  onClick={() => setPage(p)}
                  className={`px-3 py-1.5 text-sm border border-gray-200 rounded-lg ${p === page ? 'bg-gradient-to-r from-slate-600 to-slate-500 text-white' : 'hover:bg-gray-50'}`}
                >
                  {p}
                </button>
              </span>
            ))}
          <button
            onClick={() => setPage(Math.min(data.totalPages, page + 1))}
            disabled={page >= data.totalPages}
            className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50"
          >
            Siguiente
          </button>
        </div>
      )}
    </div>
  );
}
