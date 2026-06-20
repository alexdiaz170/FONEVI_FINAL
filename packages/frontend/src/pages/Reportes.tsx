import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  apiGetReporteBalance,
  apiGetReporteCartera,
  apiGetReporteFlujoCaja,
  apiGetReporteEstadoCuentaSocio,
  apiListarSocios,
} from '../lib/api';
import { formatCurrency, formatDate } from '../lib/utils';
import { exportToExcel, exportToPDF, type ExportColumn } from '../lib/export';

type Tab = 'balance' | 'cartera' | 'estado-cuenta' | 'flujo-caja';

const tabs: { key: Tab; label: string }[] = [
  { key: 'balance', label: 'Balance General' },
  { key: 'cartera', label: 'Cartera' },
  { key: 'estado-cuenta', label: 'Estado de Cuenta' },
  { key: 'flujo-caja', label: 'Flujo de Caja' },
];

export default function ReportesPage() {
  const [activeTab, setActiveTab] = useState<Tab>('balance');

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-4">Reportes</h1>

      <div className="flex gap-1 mb-6 border-b border-gray-200">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm font-medium transition-colors rounded-t-md ${
              activeTab === tab.key
                ? 'bg-white text-navy-700 border border-b-white border-gray-200 -mb-px'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'balance' && <BalanceGeneralTab />}
      {activeTab === 'cartera' && <CarteraTab />}
      {activeTab === 'estado-cuenta' && <EstadoCuentaTab />}
      {activeTab === 'flujo-caja' && <FlujoCajaTab />}
    </div>
  );
}

function BalanceGeneralTab() {
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
    { cuenta: 'RESERVAS', valor: data.activos.reservas },
    { cuenta: 'TOTAL ACTIVOS', valor: data.activos.total },
    { cuenta: '', valor: '' },
    { cuenta: 'CAPITAL SOCIAL', valor: data.pasivos.capitalSocial },
    { cuenta: 'TOTAL PASIVOS', valor: data.pasivos.total },
    { cuenta: '', valor: '' },
    { cuenta: 'RESULTADOS ACUMULADOS', valor: data.patrimonio.resultadosAcumulados },
    { cuenta: 'TOTAL PATRIMONIO', valor: data.patrimonio.total },
  ];

  const handleExportExcel = () => {
    exportToExcel(rows, columns, 'balance-general');
  };

  const handleExportPDF = () => {
    exportToPDF(rows, columns, 'Balance General', 'balance-general');
  };

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <button
          onClick={handleExportExcel}
          className="px-3 py-1.5 text-xs bg-green-600 text-white rounded hover:bg-green-700"
        >
          Exportar Excel
        </button>
        <button
          onClick={handleExportPDF}
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

function CarteraTab() {
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

  const handleExportExcel = () => {
    exportToExcel(data as unknown as Record<string, unknown>[], columns, 'cartera-creditos');
  };

  const handleExportPDF = () => {
    exportToPDF(
      data as unknown as Record<string, unknown>[],
      columns,
      'Cartera de Créditos',
      'cartera-creditos',
    );
  };

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <button
          onClick={handleExportExcel}
          className="px-3 py-1.5 text-xs bg-green-600 text-white rounded hover:bg-green-700"
        >
          Exportar Excel
        </button>
        <button
          onClick={handleExportPDF}
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

function EstadoCuentaTab() {
  const [socioId, setSocioId] = useState('');

  const { data: socios } = useQuery({
    queryKey: ['socios-lista'],
    queryFn: () => apiListarSocios(1, 999),
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ['reporte-estado-cuenta', socioId],
    queryFn: () => apiGetReporteEstadoCuentaSocio(socioId),
    enabled: !!socioId,
  });

  const columnsAportes: ExportColumn[] = [
    { header: 'Período', key: 'periodoId' },
    { header: 'Monto', key: 'monto', format: (v) => formatCurrency(Number(v)) },
    { header: 'Fecha Pago', key: 'fechaPago', format: (v) => formatDate(v as string) },
    { header: 'Estado', key: 'estado' },
    { header: 'Solidaridad', key: 'pagoSolidaridad', format: (v) => formatCurrency(Number(v)) },
    { header: 'Abono Crédito', key: 'pagoCredito', format: (v) => formatCurrency(Number(v)) },
  ];

  const columnsCreditos: ExportColumn[] = [
    { header: 'Monto', key: 'monto', format: (v) => formatCurrency(Number(v)) },
    { header: 'Saldo', key: 'saldoCapital', format: (v) => formatCurrency(Number(v)) },
    { header: 'Cuotas', key: 'cuotas' },
    { header: 'Pagadas', key: 'cuotasPagadas' },
    { header: 'Estado', key: 'estado' },
  ];

  const handleExportAportesExcel = () => {
    if (!data) return;
    exportToExcel(
      data.aportes as unknown as Record<string, unknown>[],
      columnsAportes,
      `aportes-${data.socio.nombre}`,
    );
  };

  const handleExportCreditosExcel = () => {
    if (!data) return;
    exportToExcel(
      data.creditos as unknown as Record<string, unknown>[],
      columnsCreditos,
      `creditos-${data.socio.nombre}`,
    );
  };

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
              {s.nombre} - {s.documento}
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
                onClick={handleExportAportesExcel}
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
                      <td className="px-4 py-3">#{a.periodoId}</td>
                      <td className="px-4 py-3 text-right">{formatCurrency(a.monto)}</td>
                      <td className="px-4 py-3">{formatDate(a.fechaPago)}</td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                            a.estado === 'pagado'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-yellow-100 text-yellow-700'
                          }`}
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
                onClick={handleExportCreditosExcel}
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
                          className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                            c.estado === 'activo'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}
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

function FlujoCajaTab() {
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

  const handleExportExcel = () => {
    if (!data) return;
    exportToExcel(data.movimientos as unknown as Record<string, unknown>[], columns, 'flujo-caja');
  };

  const handleExportPDF = () => {
    if (!data) return;
    exportToPDF(
      data.movimientos as unknown as Record<string, unknown>[],
      columns,
      'Flujo de Caja',
      'flujo-caja',
    );
  };

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
          <button
            onClick={handleExportExcel}
            className="px-3 py-2 text-xs bg-green-600 text-white rounded hover:bg-green-700"
          >
            Exportar Excel
          </button>
          <button
            onClick={handleExportPDF}
            className="px-3 py-2 text-xs bg-red-600 text-white rounded hover:bg-red-700"
          >
            Exportar PDF
          </button>
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
                {data.movimientos.map((m) => (
                  <tr key={`${m.fecha}-${m.descripcion}-${m.monto}`} className="hover:bg-gray-50">
                    <td className="px-4 py-3">{formatDate(m.fecha)}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                          m.tipo === 'ingreso'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {m.tipo === 'ingreso' ? 'Ingreso' : 'Egreso'}
                      </span>
                    </td>
                    <td className="px-4 py-3">{m.categoria}</td>
                    <td className="px-4 py-3">{m.descripcion}</td>
                    <td
                      className={`px-4 py-3 text-right font-medium ${
                        m.tipo === 'ingreso' ? 'text-green-600' : 'text-red-600'
                      }`}
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
