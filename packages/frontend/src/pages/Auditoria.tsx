import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ScrollText, Search, RotateCw } from 'lucide-react';
import { apiListarAuditoria, type AuditoriaDTO } from '../lib/api';

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

function accionBadge(accion: string) {
  const colors: Record<string, string> = {
    CREAR: 'bg-green-100 text-green-700',
    ACTUALIZAR: 'bg-blue-100 text-blue-700',
    ELIMINAR: 'bg-red-100 text-red-700',
    INICIAR_SESION: 'bg-purple-100 text-purple-700',
    CERRAR_SESION: 'bg-gray-100 text-gray-600',
    APROBAR: 'bg-emerald-100 text-emerald-700',
    RECHAZAR: 'bg-orange-100 text-orange-700',
    PAGAR: 'bg-teal-100 text-teal-700',
  };
  const color = colors[accion.toUpperCase()] ?? 'bg-gray-100 text-gray-700';
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${color}`}>
      {accion}
    </span>
  );
}

export default function AuditoriaPage() {
  const [page, setPage] = useState(1);
  const [filtroTabla, setFiltroTabla] = useState('');
  const [busqueda, setBusqueda] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['auditoria', page, filtroTabla],
    queryFn: () =>
      apiListarAuditoria({
        page,
        limit: 20,
        tabla: filtroTabla || undefined,
      }),
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
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-navy-800 flex items-center gap-2">
          <ScrollText size={24} className="text-navy-600" />
          Auditoría
        </h1>
        <span className="text-sm text-gray-500">
          {data ? `Total: ${data.total} registros` : ''}
        </span>
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-4 mb-4">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-medium text-gray-600 mb-1">Tabla</label>
            <select
              value={filtroTabla}
              onChange={(e) => {
                setFiltroTabla(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 border rounded-md text-sm bg-white"
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
                className="w-full pl-9 pr-3 py-2 border rounded-md text-sm"
              />
            </div>
          </div>
          {busqueda && (
            <button
              onClick={() => setBusqueda('')}
              className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 border rounded-md"
            >
              Limpiar
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-400">
            <RotateCw size={24} className="animate-spin inline-block mb-2" />
            <p>Cargando...</p>
          </div>
        ) : filteredData && filteredData.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b text-left">
                  <th className="px-4 py-3 font-medium text-gray-600">Fecha / Hora</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Usuario</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Acción</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Tabla</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Detalle</th>
                  <th className="px-4 py-3 font-medium text-gray-600">IP</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredData.map((item: AuditoriaDTO) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                      {formatDateTime(item.createdAt)}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-800">
                      {item.usuarioNombre ?? <span className="text-gray-400 italic">Sistema</span>}
                    </td>
                    <td className="px-4 py-3">{accionBadge(item.accion)}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {item.tabla ? (
                        <span className="text-xs font-mono bg-gray-100 px-2 py-0.5 rounded">
                          {item.tabla}
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600 max-w-xs">
                      <p className="truncate" title={item.detalle ?? ''}>
                        {item.detalle ?? <span className="text-gray-400">—</span>}
                      </p>
                      {item.registroId && (
                        <p className="text-xs text-gray-400 mt-0.5 font-mono">
                          ID: {item.registroId.slice(0, 8)}...
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs font-mono">{item.ip ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-gray-400">No hay registros de auditoría</div>
        )}
      </div>

      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page <= 1}
            className="px-3 py-1.5 text-sm border rounded-md disabled:opacity-40 hover:bg-gray-50"
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
                  className={`px-3 py-1.5 text-sm border rounded-md ${
                    p === page ? 'bg-navy-700 text-white border-navy-700' : 'hover:bg-gray-50'
                  }`}
                >
                  {p}
                </button>
              </span>
            ))}
          <button
            onClick={() => setPage(Math.min(data.totalPages, page + 1))}
            disabled={page >= data.totalPages}
            className="px-3 py-1.5 text-sm border rounded-md disabled:opacity-40 hover:bg-gray-50"
          >
            Siguiente
          </button>
        </div>
      )}
    </div>
  );
}
