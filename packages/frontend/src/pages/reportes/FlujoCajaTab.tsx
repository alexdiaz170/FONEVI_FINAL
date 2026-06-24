import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiGetReporteFlujoCaja } from '../../lib/api';
import { formatCurrency, formatDate } from '../../lib/utils';
import { exportToExcel, exportToPDF, type ExportColumn } from '../../lib/export';

export function FlujoCajaTab() {
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
  const [desde, setDesde] = useState(firstDay.toISOString().slice(0, 10));
  const [hasta, setHasta] = useState(today.toISOString().slice(0, 10));

  const { data, isLoading, error } = useQuery({
    queryKey: ['reporte-flujo-caja', desde, hasta],
    queryFn: () => apiGetReporteFlujoCaja(desde, hasta),
    enabled: !!desde && !!hasta,
  });

  const columns: ExportColumn[] = [
    { header: 'Fecha', key: 'fecha', format: (v) => formatDate(v as string) },
    { header: 'Tipo', key: 'tipo' },
    { header: 'Categoría', key: 'categoria' },
    { header: 'Descripción', key: 'descripcion' },
    { header: 'Monto', key: 'monto', format: (v) => formatCurrency(Number(v)) },
  ];

  return (
    <div>
      <div className="flex items-end gap-4 mb-4">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Desde</label>
          <input
            type="date"
            value={desde}
            onChange={(e) => setDesde(e.target.value)}
            className="px-3 py-2 border rounded-md text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Hasta</label>
          <input
            type="date"
            value={hasta}
            onChange={(e) => setHasta(e.target.value)}
            className="px-3 py-2 border rounded-md text-sm"
          />
        </div>
        <div className="flex gap-2">
          {data && (
            <>
              <button
                onClick={() =>
                  exportToExcel(
                    data.movimientos as unknown as Record<string, unknown>[],
                    columns,
                    'flujo-caja',
                  )
                }
                className="px-3 py-2 text-xs bg-green-600 text-white rounded hover:bg-green-700"
              >
                Exportar Excel
              </button>
              <button
                onClick={() =>
                  exportToPDF(
                    data.movimientos as unknown as Record<string, unknown>[],
                    columns,
                    'Flujo de Caja',
                    'flujo-caja',
                  )
                }
                className="px-3 py-2 text-xs bg-red-600 text-white rounded hover:bg-red-700"
              >
                Exportar PDF
              </button>
            </>
          )}
        </div>
      </div>

      {isLoading && <div className="text-gray-400 text-center py-8">Cargando...</div>}
      {error && <div className="text-red-500 text-center py-8">Error al cargar flujo de caja</div>}

      {data && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wider">Ingresos</p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                {formatCurrency(data.ingresos)}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wider">Egresos</p>
              <p className="text-2xl font-bold text-red-600 mt-1">{formatCurrency(data.egresos)}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wider">Saldo Neto</p>
              <p
                className={`text-2xl font-bold mt-1 ${data.saldo >= 0 ? 'text-navy-700' : 'text-red-600'}`}
              >
                {formatCurrency(data.saldo)}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="text-left px-4 py-3">Fecha</th>
                  <th className="text-left px-4 py-3">Tipo</th>
                  <th className="text-left px-4 py-3">Categoría</th>
                  <th className="text-left px-4 py-3">Descripción</th>
                  <th className="text-right px-4 py-3">Monto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.movimientos.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center text-gray-400 py-8">
                      No hay movimientos en el período seleccionado
                    </td>
                  </tr>
                )}
                {data.movimientos.map((m, i) => (
                  <tr
                    key={`${m.fecha}-${m.descripcion}-${m.monto}-${i}`}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-4 py-3">{formatDate(m.fecha)}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${m.tipo === 'ingreso' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
                      >
                        {m.tipo === 'ingreso' ? 'Ingreso' : 'Egreso'}
                      </span>
                    </td>
                    <td className="px-4 py-3">{m.categoria}</td>
                    <td className="px-4 py-3">{m.descripcion}</td>
                    <td
                      className={`px-4 py-3 text-right font-medium ${m.tipo === 'ingreso' ? 'text-green-600' : 'text-red-600'}`}
                    >
                      {formatCurrency(m.monto)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
