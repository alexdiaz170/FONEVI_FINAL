import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Eye,
  Check,
  Search,
  ChevronLeft,
  ChevronRight,
  Filter,
  FileSpreadsheet,
  FileText,
} from 'lucide-react';
import { apiListarCreditos, apiAprobarCredito, type CreditoDTO } from '../../lib/api';
import { formatCurrency, formatDate } from '../../lib/utils';
import { ApiError } from '../../lib/api';
import { exportToExcel, exportToPDF, type ExportColumn } from '../../lib/export';

const ESTADOS = ['', 'pendiente', 'activo', 'pagado', 'cancelado'];

export default function CreditosLista() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('');
  const queryClient = useQueryClient();
  const location = useLocation();
  const successMsg = (location.state as { success?: string })?.success;
  location.state = {};

  const { data, isLoading, error } = useQuery({
    queryKey: ['creditos', page, estadoFilter],
    queryFn: () => apiListarCreditos({ page, limit: 10, estado: estadoFilter || undefined }),
  });

  const aprobarMutation = useMutation({
    mutationFn: (id: string) => apiAprobarCredito(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['creditos'] }),
  });

  const filteredData =
    data?.data?.filter(
      (c) => !search || (c.socioId ?? '').toLowerCase().includes(search.toLowerCase()),
    ) ?? [];

  const exportColumns: ExportColumn[] = [
    { header: 'Socio', key: 'nombreSocio' },
    { header: 'Monto', key: 'monto', format: (v) => formatCurrency(Number(v)) },
    { header: 'Tasa Mensual', key: 'tasaMensual', format: (v) => `${Number(v)}%` },
    { header: 'Cuotas', key: 'cuotas', format: (v) => String(v) },
    { header: 'Cuotas Pagadas', key: 'cuotasPagadas', format: (v) => String(v) },
    { header: 'Saldo Capital', key: 'saldoCapital', format: (v) => formatCurrency(Number(v)) },
    { header: 'Estado', key: 'estado' },
    {
      header: 'Fecha Desembolso',
      key: 'fechaDesembolso',
      format: (v) => (v ? formatDate(String(v)) : '—'),
    },
    { header: 'Propósito', key: 'proposito' },
  ];

  const handleExportExcel = () => {
    exportToExcel(filteredData as unknown as Record<string, unknown>[], exportColumns, 'creditos');
  };

  const handleExportPDF = () => {
    exportToPDF(
      filteredData as unknown as Record<string, unknown>[],
      exportColumns,
      'Listado de Créditos',
      'creditos',
    );
  };

  const estadoColor: Record<string, string> = {
    pendiente: 'bg-yellow-100 text-yellow-700',
    activo: 'bg-blue-100 text-blue-700',
    pagado: 'bg-green-100 text-green-700',
    cancelado: 'bg-red-100 text-red-700',
  };

  return (
    <div>
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b space-y-3">
          <div className="flex items-center gap-2">
            <Search size={18} className="text-gray-400 shrink-0" />
            <input
              type="text"
              placeholder="Buscar por ID de socio..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 border-none outline-none text-sm"
            />
            {filteredData.length > 0 && (
              <>
                <button
                  onClick={handleExportExcel}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded hover:bg-green-100 shrink-0"
                >
                  <FileSpreadsheet size={14} />
                  Excel
                </button>
                <button
                  onClick={handleExportPDF}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded hover:bg-red-100 shrink-0"
                >
                  <FileText size={14} />
                  PDF
                </button>
              </>
            )}
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Filter size={16} className="text-gray-400" />
            <select
              value={estadoFilter}
              onChange={(e) => {
                setEstadoFilter(e.target.value);
                setPage(1);
              }}
              className="border rounded px-2 py-1 text-sm"
            >
              <option value="">Todos los estados</option>
              {ESTADOS.filter(Boolean).map((e) => (
                <option key={e} value={e}>
                  {e.charAt(0).toUpperCase() + e.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {successMsg && (
          <div className="mx-4 mt-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded text-sm">
            {successMsg}
          </div>
        )}
        {isLoading && <div className="p-8 text-center text-gray-400">Cargando...</div>}
        {error && (
          <div className="p-8 text-center text-red-500">Error: {(error as ApiError).message}</div>
        )}

        {filteredData && (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-gray-600">
                    <th className="text-left p-3 font-medium">Socio</th>
                    <th className="text-right p-3 font-medium">Monto</th>
                    <th className="text-right p-3 font-medium">Cuota Mensual</th>
                    <th className="text-right p-3 font-medium">Saldo</th>
                    <th className="text-center p-3 font-medium">Cuotas</th>
                    <th className="text-left p-3 font-medium">Estado</th>
                    <th className="text-left p-3 font-medium">Desembolso</th>
                    <th className="text-center p-3 font-medium">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((credito: CreditoDTO) => (
                    <tr key={credito.id} className="border-t hover:bg-gray-50">
                      <td className="p-3 text-sm">
                        {credito.nombreSocio ?? credito.socioId.slice(0, 8)}
                      </td>
                      <td className="p-3 text-right font-mono text-sm">
                        {formatCurrency(credito.monto)}
                      </td>
                      <td className="p-3 text-right font-mono text-sm">
                        {formatCurrency(credito.cuotaMensual)}
                      </td>
                      <td className="p-3 text-right font-mono text-sm">
                        {formatCurrency(credito.saldoCapital)}
                      </td>
                      <td className="p-3 text-center">
                        {credito.cuotasPagadas}/{credito.cuotas}
                      </td>
                      <td className="p-3">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${estadoColor[credito.estado] ?? 'bg-gray-100 text-gray-600'}`}
                        >
                          {credito.estado}
                        </span>
                      </td>
                      <td className="p-3 text-gray-600">{formatDate(credito.fechaDesembolso)}</td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {credito.estado === 'pendiente' && (
                            <button
                              onClick={() => aprobarMutation.mutate(credito.id)}
                              disabled={aprobarMutation.isPending}
                              className="inline-flex items-center gap-1 px-2 py-1.5 bg-green-600 text-white rounded text-xs hover:bg-green-700 disabled:opacity-50"
                            >
                              <Check size={14} /> Aprobar
                            </button>
                          )}
                          <Link
                            to={`/creditos/${credito.id}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-navy-600 text-white rounded text-xs hover:bg-navy-700"
                          >
                            <Eye size={14} /> Detalle
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredData.length === 0 && (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-gray-400">
                        No se encontraron créditos
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {data && data.totalPages > 1 && (
              <div className="flex items-center justify-between p-4 border-t">
                <span className="text-sm text-gray-500">
                  Página {data.page} de {data.totalPages} ({data.total} créditos)
                </span>
                <div className="flex gap-1">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="p-1.5 border rounded hover:bg-gray-50 disabled:opacity-50"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                    disabled={page >= data.totalPages}
                    className="p-1.5 border rounded hover:bg-gray-50 disabled:opacity-50"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
