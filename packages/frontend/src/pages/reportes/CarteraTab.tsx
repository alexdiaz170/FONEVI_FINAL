import { useQuery } from '@tanstack/react-query';
import { apiGetReporteCartera } from '../../lib/api';
import { formatCurrency } from '../../lib/utils';
import { exportToExcel, exportToPDF, type ExportColumn } from '../../lib/export';

export function CarteraTab() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['reporte-cartera'],
    queryFn: apiGetReporteCartera,
  });

  if (isLoading) return <div className="text-gray-400 text-center py-8">Cargando...</div>;
  if (error) return <div className="text-red-500 text-center py-8">Error al cargar cartera</div>;
  if (!data) return null;

  const columns: ExportColumn[] = [
    { header: 'Socio', key: 'socioNombre' },
    { header: 'Monto', key: 'monto', format: (v) => formatCurrency(Number(v)) },
    { header: 'Saldo Capital', key: 'saldoCapital', format: (v) => formatCurrency(Number(v)) },
    { header: 'Cuotas', key: 'cuotas' },
    { header: 'Pagadas', key: 'cuotasPagadas' },
    { header: 'Cuota Mensual', key: 'cuotaMensual', format: (v) => formatCurrency(Number(v)) },
    { header: 'Total Pagado', key: 'totalPagado', format: (v) => formatCurrency(Number(v)) },
    { header: 'Estado', key: 'estado' },
  ];

  const totalMonto = data.reduce((s, c) => s + c.monto, 0);
  const totalSaldo = data.reduce((s, c) => s + c.saldoCapital, 0);
  const totalPagado = data.reduce((s, c) => s + c.totalPagado, 0);
  const activos = data.filter((c) => c.estado === 'activo').length;
  const pagados = data.filter((c) => c.estado === 'pagado').length;

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <button
          onClick={() =>
            exportToExcel(data as unknown as Record<string, unknown>[], columns, 'cartera-creditos')
          }
          className="px-3 py-1.5 text-xs bg-green-600 text-white rounded hover:bg-green-700"
        >
          Exportar Excel
        </button>
        <button
          onClick={() =>
            exportToPDF(
              data as unknown as Record<string, unknown>[],
              columns,
              'Cartera de Créditos',
              'cartera-creditos',
            )
          }
          className="px-3 py-1.5 text-xs bg-red-600 text-white rounded hover:bg-red-700"
        >
          Exportar PDF
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Total Créditos</p>
          <p className="text-xl font-bold text-navy-700 mt-1">{formatCurrency(totalMonto)}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Saldo por Cobrar</p>
          <p className="text-xl font-bold text-orange-600 mt-1">{formatCurrency(totalSaldo)}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Total Recuperado</p>
          <p className="text-xl font-bold text-green-600 mt-1">{formatCurrency(totalPagado)}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Activos / Pagados</p>
          <p className="text-xl font-bold text-navy-700 mt-1">
            {activos} / {pagados}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="text-left px-4 py-3">Socio</th>
              <th className="text-right px-4 py-3">Monto</th>
              <th className="text-right px-4 py-3">Saldo</th>
              <th className="text-center px-4 py-3">Cuotas</th>
              <th className="text-center px-4 py-3">Pagadas</th>
              <th className="text-right px-4 py-3">Cuota Mensual</th>
              <th className="text-right px-4 py-3">Recuperado</th>
              <th className="text-center px-4 py-3">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.length === 0 && (
              <tr>
                <td colSpan={8} className="text-center text-gray-400 py-8">
                  No hay créditos registrados
                </td>
              </tr>
            )}
            {data.map((c) => (
              <tr key={c.creditoId} className="hover:bg-gray-50">
                <td className="px-4 py-3">{c.socioNombre}</td>
                <td className="px-4 py-3 text-right">{formatCurrency(c.monto)}</td>
                <td className="px-4 py-3 text-right">{formatCurrency(c.saldoCapital)}</td>
                <td className="px-4 py-3 text-center">{c.cuotas}</td>
                <td className="px-4 py-3 text-center">{c.cuotasPagadas}</td>
                <td className="px-4 py-3 text-right">{formatCurrency(c.cuotaMensual)}</td>
                <td className="px-4 py-3 text-right">{formatCurrency(c.totalPagado)}</td>
                <td className="px-4 py-3 text-center">
                  <span
                    className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                      c.estado === 'activo'
                        ? 'bg-green-100 text-green-700'
                        : c.estado === 'pagado'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {c.estado}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
