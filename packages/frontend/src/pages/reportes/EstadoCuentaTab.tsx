import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  apiGetReporteEstadoCuentaSocio,
  apiListarPeriodos,
  apiListarSocios,
  downloadExport,
} from '../../lib/api';
import { formatCurrency, formatDate } from '../../lib/utils';

export function EstadoCuentaTab() {
  const [socioId, setSocioId] = useState('');

  const { data: socios } = useQuery({
    queryKey: ['socios-lista'],
    queryFn: () => apiListarSocios(1, 999),
  });

  const { data: periodos } = useQuery({
    queryKey: ['periodos'],
    queryFn: () => apiListarPeriodos(),
  });

  const periodoMap = new Map(periodos?.map((p) => [p.id, p.nombre]) ?? []);

  const { data, isLoading, error } = useQuery({
    queryKey: ['reporte-estado-cuenta', socioId],
    queryFn: () => apiGetReporteEstadoCuentaSocio(socioId),
    enabled: !!socioId,
  });

  return (
    <div>
      <div className="mb-4">
        <label className="block text-xs font-medium text-gray-700 mb-1">Seleccionar Socio</label>
        <select
          value={socioId}
          onChange={(e) => setSocioId(e.target.value)}
          className="w-full max-w-md px-3 py-2 border rounded-md text-sm"
        >
          <option value="">Seleccione un socio...</option>
          {socios?.data.map((s) => (
            <option key={s.id} value={s.id}>
              {s.nombre} - {s.numeroDocumento}
            </option>
          ))}
        </select>
      </div>

      {!socioId && (
        <div className="text-gray-400 text-center py-8">
          Seleccione un socio para ver su estado de cuenta
        </div>
      )}

      {isLoading && <div className="text-gray-400 text-center py-8">Cargando...</div>}
      {error && (
        <div className="text-red-500 text-center py-8">Error al cargar estado de cuenta</div>
      )}

      {data && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Datos del Socio</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Nombre:</span>
                <p className="font-medium">{data.socio.nombre}</p>
              </div>
              <div>
                <span className="text-gray-500">Documento:</span>
                <p className="font-medium">{data.socio.documento}</p>
              </div>
              <div>
                <span className="text-gray-500">Email:</span>
                <p className="font-medium">{data.socio.email ?? '—'}</p>
              </div>
              <div>
                <span className="text-gray-500">Estado:</span>
                <p className="font-medium capitalize">{data.socio.estado}</p>
              </div>
              <div>
                <span className="text-gray-500">Ahorro Acumulado:</span>
                <p className="font-medium text-green-600">
                  {formatCurrency(data.socio.ahorroAcumulado)}
                </p>
              </div>
              <div>
                <span className="text-gray-500">Total Aportado:</span>
                <p className="font-medium">{formatCurrency(data.totalAportado)}</p>
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-700">Aportes</h3>
              <button
                onClick={() =>
                  downloadExport('estado-cuenta', 'xlsx', { socioId: String(socioId) })
                }
                className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
              >
                Exportar Excel
              </button>
            </div>
            <div className="bg-white rounded-lg shadow overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="text-left px-4 py-3">Período</th>
                    <th className="text-right px-4 py-3">Monto</th>
                    <th className="text-left px-4 py-3">Fecha</th>
                    <th className="text-center px-4 py-3">Estado</th>
                    <th className="text-right px-4 py-3">Solidaridad</th>
                    <th className="text-right px-4 py-3">Abono Crédito</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.aportes.map((a) => (
                    <tr key={a.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        {periodoMap.get(a.periodoId) ?? `#${a.periodoId}`}
                      </td>
                      <td className="px-4 py-3 text-right">{formatCurrency(a.monto)}</td>
                      <td className="px-4 py-3">{formatDate(a.fechaPago)}</td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${a.estado === 'pagado' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}
                        >
                          {a.estado}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">{formatCurrency(a.pagoSolidaridad)}</td>
                      <td className="px-4 py-3 text-right">{formatCurrency(a.pagoCredito)}</td>
                    </tr>
                  ))}
                  {data.aportes.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center text-gray-400 py-8">
                        Sin aportes registrados
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-700">Créditos</h3>
              <button
                onClick={() =>
                  downloadExport('estado-cuenta', 'xlsx', { socioId: String(socioId) })
                }
                className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
              >
                Exportar Excel
              </button>
            </div>
            <div className="bg-white rounded-lg shadow overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="text-right px-4 py-3">Monto</th>
                    <th className="text-right px-4 py-3">Saldo</th>
                    <th className="text-center px-4 py-3">Cuotas</th>
                    <th className="text-center px-4 py-3">Pagadas</th>
                    <th className="text-right px-4 py-3">Cuota Mensual</th>
                    <th className="text-center px-4 py-3">Estado</th>
                    <th className="text-left px-4 py-3">Propósito</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.creditos.map((c) => (
                    <tr key={c.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-right">{formatCurrency(c.monto)}</td>
                      <td className="px-4 py-3 text-right">{formatCurrency(c.saldoCapital)}</td>
                      <td className="px-4 py-3 text-center">{c.cuotas}</td>
                      <td className="px-4 py-3 text-center">{c.cuotasPagadas}</td>
                      <td className="px-4 py-3 text-right">{formatCurrency(c.cuotaMensual)}</td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${c.estado === 'activo' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}
                        >
                          {c.estado}
                        </span>
                      </td>
                      <td className="px-4 py-3">{c.proposito ?? '—'}</td>
                    </tr>
                  ))}
                  {data.creditos.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center text-gray-400 py-8">
                        Sin créditos registrados
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
