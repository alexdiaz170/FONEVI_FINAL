import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Eye,
  Trash2,
  Search,
  ChevronLeft,
  ChevronRight,
  Filter,
  FileSpreadsheet,
  FileText,
} from 'lucide-react';
import {
  apiListarAportes,
  apiEliminarAporte,
  apiListarPeriodos,
  type AporteDTO,
  type PeriodoDTO,
} from '../../lib/api';
import { formatCurrency, formatDate } from '../../lib/utils';
import { ApiError } from '../../lib/api';
import { exportToExcel, exportToPDF, type ExportColumn } from '../../lib/export';
import ConfirmDialog from '../../components/ConfirmDialog';

const ESTADOS = ['', 'pendiente', 'pagado', 'mora', 'vencido', 'anulado'];

export default function AportesLista() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('');
  const [periodoFilter, setPeriodoFilter] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['aportes', page, estadoFilter, periodoFilter],
    queryFn: () =>
      apiListarAportes({
        page,
        limit: 10,
        estado: estadoFilter || undefined,
        periodoId: periodoFilter ? Number(periodoFilter) : undefined,
      }),
  });

  const { data: periodos } = useQuery({
    queryKey: ['periodos'],
    queryFn: () => apiListarPeriodos(),
  });

  const handleDelete = async (id: string) => {
    try {
      await apiEliminarAporte(id);
      refetch();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Error al eliminar');
    } finally {
      setConfirmDelete(null);
    }
  };

  const periodoMap = new Map(periodos?.map((p) => [p.id, p.nombre]) ?? []);

  const filteredData =
    data?.data?.filter(
      (a) => !search || (a.socioId ?? '').toLowerCase().includes(search.toLowerCase()),
    ) ?? [];

  const exportColumns: ExportColumn[] = [
    { header: 'Socio ID', key: 'socioId' },
    { header: 'Periodo', key: 'periodoId', format: (v) => String(periodoMap.get(Number(v)) ?? v) },
    { header: 'Monto', key: 'monto', format: (v) => formatCurrency(Number(v)) },
    { header: 'Fecha Pago', key: 'fechaPago', format: (v) => (v ? formatDate(String(v)) : '—') },
    { header: 'Estado', key: 'estado' },
    { header: 'Método', key: 'metodo' },
    { header: 'Notas', key: 'notas' },
    {
      header: 'Pago Solidaridad',
      key: 'pagoSolidaridad',
      format: (v) => formatCurrency(Number(v)),
    },
    { header: 'Pago Crédito', key: 'pagoCredito', format: (v) => formatCurrency(Number(v)) },
  ];

  const handleExportExcel = () => {
    exportToExcel(filteredData as unknown as Record<string, unknown>[], exportColumns, 'aportes');
  };

  const handleExportPDF = () => {
    exportToPDF(
      filteredData as unknown as Record<string, unknown>[],
      exportColumns,
      'Listado de Aportes',
      'aportes',
    );
  };

  const estadoColor: Record<string, string> = {
    pagado: 'bg-green-100 text-green-700',
    pendiente: 'bg-yellow-100 text-yellow-700',
    mora: 'bg-red-100 text-red-700',
    vencido: 'bg-orange-100 text-orange-700',
    anulado: 'bg-gray-100 text-gray-600',
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
            <select
              value={periodoFilter}
              onChange={(e) => {
                setPeriodoFilter(e.target.value);
                setPage(1);
              }}
              className="border rounded px-2 py-1 text-sm"
            >
              <option value="">Todos los periodos</option>
              {periodos?.map((p: PeriodoDTO) => (
                <option key={p.id} value={p.id}>
                  {p.nombre}
                </option>
              ))}
            </select>
          </div>
        </div>

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
                    <th className="text-left p-3 font-medium">Periodo</th>
                    <th className="text-right p-3 font-medium">Monto</th>
                    <th className="text-left p-3 font-medium">Estado</th>
                    <th className="text-left p-3 font-medium">Fecha Pago</th>
                    <th className="text-right p-3 font-medium">Solidaridad</th>
                    <th className="text-center p-3 font-medium">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((aporte: AporteDTO) => (
                    <tr key={aporte.id} className="border-t hover:bg-gray-50">
                      <td className="p-3 text-sm">
                        {aporte.nombreSocio ?? aporte.socioId.slice(0, 8)}
                      </td>
                      <td className="p-3">
                        {periodoMap.get(aporte.periodoId) ?? aporte.periodoId}
                      </td>
                      <td className="p-3 text-right font-mono text-sm">
                        {formatCurrency(aporte.monto)}
                      </td>
                      <td className="p-3">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${estadoColor[aporte.estado] ?? 'bg-gray-100 text-gray-600'}`}
                        >
                          {aporte.estado}
                        </span>
                      </td>
                      <td className="p-3 text-gray-600">
                        {aporte.fechaPago ? formatDate(aporte.fechaPago) : '—'}
                      </td>
                      <td className="p-3 text-right font-mono text-sm">
                        {formatCurrency(aporte.pagoSolidaridad)}
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Link
                            to={`/aportes/${aporte.id}`}
                            className="p-1.5 text-navy-600 hover:bg-navy-50 rounded"
                          >
                            <Eye size={16} />
                          </Link>
                          <button
                            onClick={() => setConfirmDelete(aporte.id)}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredData.length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-gray-400">
                        No se encontraron aportes
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {data && data.totalPages > 1 && (
              <div className="flex items-center justify-between p-4 border-t">
                <span className="text-sm text-gray-500">
                  Página {data.page} de {data.totalPages} ({data.total} aportes)
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

      <ConfirmDialog
        open={!!confirmDelete}
        title="Eliminar Aporte"
        message="¿Está seguro de eliminar este aporte? Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        onConfirm={() => handleDelete(confirmDelete!)}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}
