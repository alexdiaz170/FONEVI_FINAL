import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Filter,
  ArrowUpCircle,
  ArrowDownCircle,
  FileSpreadsheet,
  FileText,
} from 'lucide-react';
import { apiListarMovimientos, type MovimientoDTO } from '../../lib/api';
import { formatCurrency, formatDate } from '../../lib/utils';
import { ApiError } from '../../lib/api';
import { exportToExcel, exportToPDF, type ExportColumn } from '../../lib/export';

const TIPOS = ['', 'ingreso', 'egreso'];

export default function MovimientosLista() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [tipoFilter, setTipoFilter] = useState('');
  const [categoriaFilter, setCategoriaFilter] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['movimientos', page, tipoFilter],
    queryFn: () => apiListarMovimientos({ page, limit: 15, tipo: tipoFilter || undefined }),
  });

  const filteredData =
    data?.data?.filter(
      (m) =>
        (!search ||
          m.descripcion.toLowerCase().includes(search.toLowerCase()) ||
          m.categoria.toLowerCase().includes(search.toLowerCase())) &&
        (!categoriaFilter || m.categoria === categoriaFilter),
    ) ?? [];

  const exportColumns: ExportColumn[] = [
    { header: 'Fecha', key: 'fecha', format: (v) => (v ? formatDate(String(v)) : '—') },
    { header: 'Tipo', key: 'tipo' },
    { header: 'Categoría', key: 'categoria' },
    { header: 'Descripción', key: 'descripcion' },
    { header: 'Monto', key: 'monto', format: (v) => formatCurrency(Number(v)) },
  ];

  const handleExportExcel = () => {
    exportToExcel(
      filteredData as unknown as Record<string, unknown>[],
      exportColumns,
      'movimientos',
    );
  };

  const handleExportPDF = () => {
    exportToPDF(
      filteredData as unknown as Record<string, unknown>[],
      exportColumns,
      'Listado de Movimientos',
      'movimientos',
    );
  };

  const categorias = [...new Set(data?.data?.map((m) => m.categoria) ?? [])];

  return (
    <div>
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b space-y-3">
          <div className="flex items-center gap-2">
            <Search size={18} className="text-gray-400 shrink-0" />
            <input
              type="text"
              placeholder="Buscar por descripción o categoría..."
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
          <div className="flex items-center gap-3 text-sm flex-wrap">
            <Filter size={16} className="text-gray-400" />
            <select
              value={tipoFilter}
              onChange={(e) => {
                setTipoFilter(e.target.value);
                setPage(1);
              }}
              className="border rounded px-2 py-1 text-sm"
            >
              <option value="">Todos los tipos</option>
              <option value="ingreso">Ingresos</option>
              <option value="egreso">Egresos</option>
            </select>
            <select
              value={categoriaFilter}
              onChange={(e) => {
                setCategoriaFilter(e.target.value);
                setPage(1);
              }}
              className="border rounded px-2 py-1 text-sm"
            >
              <option value="">Todas las categorías</option>
              {categorias.map((c) => (
                <option key={c} value={c}>
                  {c}
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
                    <th className="text-left p-3 font-medium">Fecha</th>
                    <th className="text-left p-3 font-medium">Tipo</th>
                    <th className="text-left p-3 font-medium">Categoría</th>
                    <th className="text-left p-3 font-medium">Descripción</th>
                    <th className="text-right p-3 font-medium">Monto</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((mov: MovimientoDTO) => (
                    <tr key={mov.id} className="border-t hover:bg-gray-50">
                      <td className="p-3 text-gray-600 text-xs">{formatDate(mov.fecha)}</td>
                      <td className="p-3">
                        <span
                          className={`inline-flex items-center gap-1 text-xs font-medium ${mov.tipo === 'ingreso' ? 'text-green-600' : 'text-red-600'}`}
                        >
                          {mov.tipo === 'ingreso' ? (
                            <ArrowUpCircle size={14} />
                          ) : (
                            <ArrowDownCircle size={14} />
                          )}
                          {mov.tipo}
                        </span>
                      </td>
                      <td className="p-3 text-gray-700">{mov.categoria}</td>
                      <td className="p-3 text-gray-600 max-w-[200px] truncate">
                        {mov.descripcion}
                      </td>
                      <td
                        className={`p-3 text-right font-mono text-sm font-medium ${mov.tipo === 'ingreso' ? 'text-green-600' : 'text-red-600'}`}
                      >
                        {mov.tipo === 'ingreso' ? '+' : '-'}
                        {formatCurrency(mov.monto)}
                      </td>
                    </tr>
                  ))}
                  {filteredData.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-gray-400">
                        No se encontraron movimientos
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {data && data.totalPages > 1 && (
              <div className="flex items-center justify-between p-4 border-t">
                <span className="text-sm text-gray-500">
                  Página {data.page} de {data.totalPages} ({data.total} movimientos)
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
