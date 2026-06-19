import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Eye,
  Trash2,
  Search,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  FileText,
} from 'lucide-react';
import { apiListarSocios, apiEliminarSocio, type SocioDTO } from '../../lib/api';
import { formatDate, formatCurrency } from '../../lib/utils';
import { ApiError } from '../../lib/api';
import { exportToExcel, exportToPDF, type ExportColumn } from '../../lib/export';

export default function SociosLista() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['socios', page],
    queryFn: () => apiListarSocios(page, 10),
  });

  const handleDelete = async (id: string) => {
    if (!confirm('¿Está seguro de eliminar este socio?')) return;
    setDeleting(id);
    try {
      await apiEliminarSocio(id);
      refetch();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Error al eliminar');
    } finally {
      setDeleting(null);
    }
  };

  const filteredData =
    data?.data?.filter(
      (s) =>
        !search ||
        s.nombre.toLowerCase().includes(search.toLowerCase()) ||
        s.numeroDocumento.includes(search),
    ) ?? [];

  const exportColumns: ExportColumn[] = [
    { header: 'Código', key: 'codigoSocio' },
    { header: 'Nombre', key: 'nombre' },
    { header: 'Documento', key: 'numeroDocumento' },
    { header: 'Email', key: 'email' },
    { header: 'Teléfono', key: 'telefono' },
    { header: 'Estado', key: 'estado' },
    {
      header: 'Ahorro Acumulado',
      key: 'ahorroAcumulado',
      format: (v) => formatCurrency(Number(v)),
    },
    { header: 'Aporte Mensual', key: 'aporteMensual', format: (v) => formatCurrency(Number(v)) },
    { header: 'Cargo', key: 'cargo' },
    { header: 'Sede', key: 'sede' },
    {
      header: 'Fecha Ingreso',
      key: 'fechaIngreso',
      format: (v) => (v ? formatDate(String(v)) : '—'),
    },
  ];

  const handleExportExcel = () => {
    exportToExcel(filteredData as unknown as Record<string, unknown>[], exportColumns, 'socios');
  };

  const handleExportPDF = () => {
    const pdfColumns = exportColumns.filter(
      (c) => c.key !== 'ahorroAcumulado' && c.key !== 'aporteMensual',
    );
    exportToPDF(
      filteredData as unknown as Record<string, unknown>[],
      pdfColumns,
      'Listado de Socios',
      'socios',
    );
  };

  return (
    <div>
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b flex items-center gap-2">
          <Search size={18} className="text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre o documento..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 border-none outline-none text-sm"
          />
          {filteredData.length > 0 && (
            <>
              <button
                onClick={handleExportExcel}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded hover:bg-green-100"
              >
                <FileSpreadsheet size={14} />
                Excel
              </button>
              <button
                onClick={handleExportPDF}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded hover:bg-red-100"
              >
                <FileText size={14} />
                PDF
              </button>
            </>
          )}
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
                    <th className="text-left p-3 font-medium">Código</th>
                    <th className="text-left p-3 font-medium">Nombre</th>
                    <th className="text-left p-3 font-medium">Documento</th>
                    <th className="text-left p-3 font-medium">Estado</th>
                    <th className="text-right p-3 font-medium">Ahorro</th>
                    <th className="text-right p-3 font-medium">Ingreso</th>
                    <th className="text-center p-3 font-medium">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((socio: SocioDTO) => (
                    <tr key={socio.id} className="border-t hover:bg-gray-50">
                      <td className="p-3 font-mono text-xs">{socio.codigoSocio ?? socio.codigo}</td>
                      <td className="p-3 font-medium text-gray-900">{socio.nombre}</td>
                      <td className="p-3 text-gray-600">{socio.numeroDocumento}</td>
                      <td className="p-3">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                            socio.estado === 'activo'
                              ? 'bg-green-100 text-green-700'
                              : socio.estado === 'mora'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {socio.estado}
                        </span>
                      </td>
                      <td className="p-3 text-right font-mono text-sm">
                        {formatCurrency(socio.ahorroAcumulado)}
                      </td>
                      <td className="p-3 text-right text-gray-600">
                        {formatDate(socio.fechaIngreso)}
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Link
                            to={`/socios/${socio.id}`}
                            className="p-1.5 text-navy-600 hover:bg-navy-50 rounded"
                          >
                            <Eye size={16} />
                          </Link>
                          <button
                            onClick={() => handleDelete(socio.id)}
                            disabled={deleting === socio.id}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded disabled:opacity-50"
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
                        No se encontraron socios
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {data && data.totalPages > 1 && (
              <div className="flex items-center justify-between p-4 border-t">
                <span className="text-sm text-gray-500">
                  Página {data.page} de {data.totalPages} ({data.total} socios)
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
