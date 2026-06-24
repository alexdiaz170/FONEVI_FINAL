import { useQuery } from '@tanstack/react-query';
import { apiGetReporteBalance } from '../../lib/api';
import { formatCurrency } from '../../lib/utils';
import { exportToExcel, exportToPDF, type ExportColumn } from '../../lib/export';

export function BalanceGeneralTab() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['reporte-balance'],
    queryFn: apiGetReporteBalance,
  });

  if (isLoading) return <div className="text-gray-400 text-center py-8">Cargando...</div>;
  if (error)
    return <div className="text-red-500 text-center py-8">Error al cargar balance general</div>;
  if (!data) return null;

  const columns: ExportColumn[] = [
    { header: 'Cuenta', key: 'cuenta' },
    { header: 'Valor', key: 'valor', format: (v) => formatCurrency(Number(v)) },
  ];

  const rows = [
    { cuenta: 'AHORROS', valor: data.activos.ahorros },
    { cuenta: 'CRÉDITOS POR COBRAR', valor: data.activos.creditosPorCobrar },
    { cuenta: 'SOLIDARIDAD', valor: data.activos.solidaridad },
    { cuenta: 'TOTAL ACTIVOS', valor: data.activos.total },
    { cuenta: '', valor: '' },
    { cuenta: 'CAPITAL SOCIAL', valor: data.pasivos.capitalSocial },
    { cuenta: 'TOTAL PASIVOS', valor: data.pasivos.total },
    { cuenta: '', valor: '' },
    { cuenta: 'RESULTADOS ACUMULADOS', valor: data.patrimonio.resultadosAcumulados },
    { cuenta: 'TOTAL PATRIMONIO', valor: data.patrimonio.total },
  ];

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => exportToExcel(rows, columns, 'balance-general')}
          className="px-3 py-1.5 text-xs bg-green-600 text-white rounded hover:bg-green-700"
        >
          Exportar Excel
        </button>
        <button
          onClick={() => exportToPDF(rows, columns, 'Balance General', 'balance-general')}
          className="px-3 py-1.5 text-xs bg-red-600 text-white rounded hover:bg-red-700"
        >
          Exportar PDF
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Total Activos</p>
          <p className="text-2xl font-bold text-green-600 mt-1">
            {formatCurrency(data.activos.total)}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Total Pasivos</p>
          <p className="text-2xl font-bold text-red-600 mt-1">
            {formatCurrency(data.pasivos.total)}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Patrimonio</p>
          <p className="text-2xl font-bold text-navy-700 mt-1">
            {formatCurrency(data.patrimonio.total)}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="text-left px-4 py-3">Cuenta</th>
              <th className="text-right px-4 py-3">Valor</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((r, i) => (
              <tr
                key={i}
                className={`${r.cuenta.startsWith('TOTAL') ? 'bg-gray-50 font-bold' : ''} ${!r.cuenta ? 'h-2' : ''}`}
              >
                <td className="px-4 py-2">{r.cuenta || ''}</td>
                <td
                  className={`px-4 py-2 text-right ${r.cuenta.startsWith('TOTAL') ? 'font-bold' : ''}`}
                >
                  {r.cuenta ? formatCurrency(r.valor) : ''}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
