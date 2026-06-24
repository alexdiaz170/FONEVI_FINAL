import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileText, BarChart3, Download } from 'lucide-react';
import {
  apiGetReporteBalance,
  apiGetReporteCartera,
  apiGetReporteFlujoCaja,
  apiGetReporteEstadoCuentaSocio,
  apiListarPeriodos,
  apiListarSocios,
} from '../lib/api';
import { formatCurrency, formatDate } from '../lib/utils';
import { exportToExcel, exportToPDF, type ExportColumn } from '../lib/export';
import { DividendosTab } from './reportes/DividendosTab';
import {
  AnimatedFadeIn,
  AnimatedStaggerContainer,
  AnimatedStaggerItem,
  AnimatedTableRow,
  AnimatedButton,
} from '../components/ui';

type Tab = 'balance' | 'cartera' | 'estado-cuenta' | 'flujo-caja' | 'dividendos';
const tabs: { key: Tab; label: string }[] = [
  { key: 'balance', label: 'Balance General' },
  { key: 'cartera', label: 'Cartera' },
  { key: 'estado-cuenta', label: 'Estado de Cuenta' },
  { key: 'flujo-caja', label: 'Flujo de Caja' },
  { key: 'dividendos', label: 'Dividendos' },
];

export default function ReportesPage() {
  const [activeTab, setActiveTab] = useState<Tab>('balance');

  return (
    <div className="relative">
      <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full -translate-y-1/4 translate-x-1/4 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-orange-500/10 rounded-full translate-y-1/3 -translate-x-1/4 pointer-events-none" />

      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-600 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/25">
          <BarChart3 size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-navy-800">Reportes</h1>
          <p className="text-sm text-gray-500">Informes financieros del fondo</p>
        </div>
      </div>

      <div className="flex gap-1 mb-6 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2.5 text-sm font-medium transition-all rounded-xl whitespace-nowrap ${
              activeTab === tab.key
                ? 'bg-gradient-to-r from-amber-600 to-orange-500 text-white shadow-md'
                : 'bg-white/80 backdrop-blur-sm text-gray-600 border border-gray-200 hover:bg-white hover:text-amber-600'
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
      {activeTab === 'dividendos' && <DividendosTab />}
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
    { cuenta: 'TOTAL ACTIVOS', valor: data.activos.total, total: true },
    { cuenta: '', valor: '' },
    { cuenta: 'CAPITAL SOCIAL', valor: data.pasivos.capitalSocial },
    { cuenta: 'TOTAL PASIVOS', valor: data.pasivos.total, total: true },
    { cuenta: '', valor: '' },
    { cuenta: 'RESULTADOS ACUMULADOS', valor: data.patrimonio.resultadosAcumulados },
    { cuenta: 'TOTAL PATRIMONIO', valor: data.patrimonio.total, total: true },
  ];

  return (
    <AnimatedFadeIn>
      <div className="flex gap-2 mb-4">
        <AnimatedButton
          onClick={() => exportToExcel(rows, columns, 'balance-general')}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100"
        >
          <Download size={14} /> Exportar Excel
        </AnimatedButton>
        <AnimatedButton
          onClick={() => exportToPDF(rows, columns, 'Balance General', 'balance-general')}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100"
        >
          <Download size={14} /> Exportar PDF
        </AnimatedButton>
      </div>
      <AnimatedStaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <AnimatedStaggerItem>
          <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 p-4 text-white shadow-lg">
            <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3" />
            <div className="relative">
              <span className="text-xs font-medium uppercase tracking-wider opacity-80">
                Total Activos
              </span>
              <div className="text-2xl font-bold mt-1">{formatCurrency(data.activos.total)}</div>
            </div>
          </div>
        </AnimatedStaggerItem>
        <AnimatedStaggerItem>
          <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-red-500 to-rose-600 p-4 text-white shadow-lg">
            <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3" />
            <div className="relative">
              <span className="text-xs font-medium uppercase tracking-wider opacity-80">
                Total Pasivos
              </span>
              <div className="text-2xl font-bold mt-1">{formatCurrency(data.pasivos.total)}</div>
            </div>
          </div>
        </AnimatedStaggerItem>
        <AnimatedStaggerItem>
          <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-amber-600 to-orange-500 p-4 text-white shadow-lg">
            <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3" />
            <div className="relative">
              <span className="text-xs font-medium uppercase tracking-wider opacity-80">
                Patrimonio
              </span>
              <div className="text-2xl font-bold mt-1">{formatCurrency(data.patrimonio.total)}</div>
            </div>
          </div>
        </AnimatedStaggerItem>
      </AnimatedStaggerContainer>
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gradient-to-r from-gray-50 to-gray-100/50 text-gray-500">
              <th className="text-left p-3.5 font-semibold text-xs uppercase tracking-wider">
                Cuenta
              </th>
              <th className="text-right p-3.5 font-semibold text-xs uppercase tracking-wider">
                Valor
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((r, i) => (
              <tr
                key={i}
                className={`${r.cuenta.startsWith('TOTAL') ? 'bg-gray-50 font-bold' : ''} ${!r.cuenta ? 'h-2' : ''} hover:bg-gray-50/50 transition-colors`}
              >
                <td className="px-4 py-2.5">{r.cuenta || ''}</td>
                <td
                  className={`px-4 py-2.5 text-right ${r.cuenta.startsWith('TOTAL') ? 'font-bold text-navy-800' : ''}`}
                >
                  {r.cuenta ? formatCurrency(r.valor) : ''}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AnimatedFadeIn>
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

  const estadoColor: Record<string, string> = {
    activo: 'bg-blue-50 text-blue-700 border border-blue-200',
    pagado: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    cancelado: 'bg-red-50 text-red-700 border border-red-200',
  };

  return (
    <AnimatedFadeIn>
      <div className="flex gap-2 mb-4">
        <AnimatedButton
          onClick={() =>
            exportToExcel(data as unknown as Record<string, unknown>[], columns, 'cartera-creditos')
          }
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100"
        >
          <Download size={14} /> Exportar Excel
        </AnimatedButton>
        <AnimatedButton
          onClick={() =>
            exportToPDF(
              data as unknown as Record<string, unknown>[],
              columns,
              'Cartera de Créditos',
              'cartera-creditos',
            )
          }
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100"
        >
          <Download size={14} /> Exportar PDF
        </AnimatedButton>
      </div>
      <AnimatedStaggerContainer className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <AnimatedStaggerItem>
          <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-navy-600 to-navy-500 p-4 text-white shadow-lg">
            <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3" />
            <div className="relative">
              <span className="text-xs font-medium uppercase tracking-wider opacity-80">
                Total Créditos
              </span>
              <div className="text-xl font-bold mt-1">{formatCurrency(totalMonto)}</div>
            </div>
          </div>
        </AnimatedStaggerItem>
        <AnimatedStaggerItem>
          <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 p-4 text-white shadow-lg">
            <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3" />
            <div className="relative">
              <span className="text-xs font-medium uppercase tracking-wider opacity-80">
                Saldo por Cobrar
              </span>
              <div className="text-xl font-bold mt-1">{formatCurrency(totalSaldo)}</div>
            </div>
          </div>
        </AnimatedStaggerItem>
        <AnimatedStaggerItem>
          <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 p-4 text-white shadow-lg">
            <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3" />
            <div className="relative">
              <span className="text-xs font-medium uppercase tracking-wider opacity-80">
                Total Recuperado
              </span>
              <div className="text-xl font-bold mt-1">{formatCurrency(totalPagado)}</div>
            </div>
          </div>
        </AnimatedStaggerItem>
        <AnimatedStaggerItem>
          <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-amber-600 to-amber-500 p-4 text-white shadow-lg">
            <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3" />
            <div className="relative">
              <span className="text-xs font-medium uppercase tracking-wider opacity-80">
                Activos / Pagados
              </span>
              <div className="text-xl font-bold mt-1">
                {activos} / {pagados}
              </div>
            </div>
          </div>
        </AnimatedStaggerItem>
      </AnimatedStaggerContainer>
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gradient-to-r from-gray-50 to-gray-100/50 text-gray-500">
              <th className="text-left p-3.5 font-semibold text-xs uppercase tracking-wider">
                Socio
              </th>
              <th className="text-right p-3.5 font-semibold text-xs uppercase tracking-wider">
                Monto
              </th>
              <th className="text-right p-3.5 font-semibold text-xs uppercase tracking-wider">
                Saldo
              </th>
              <th className="text-center p-3.5 font-semibold text-xs uppercase tracking-wider">
                Cuotas
              </th>
              <th className="text-center p-3.5 font-semibold text-xs uppercase tracking-wider">
                Pagadas
              </th>
              <th className="text-right p-3.5 font-semibold text-xs uppercase tracking-wider">
                Cuota Mensual
              </th>
              <th className="text-right p-3.5 font-semibold text-xs uppercase tracking-wider">
                Recuperado
              </th>
              <th className="text-center p-3.5 font-semibold text-xs uppercase tracking-wider">
                Estado
              </th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 && (
              <tr>
                <td colSpan={8} className="text-center text-gray-400 py-8">
                  No hay créditos registrados
                </td>
              </tr>
            )}
            {data.map((c, idx) => (
              <AnimatedTableRow key={c.creditoId} index={idx}>
                <td className="p-3.5 font-medium text-navy-800">{c.socioNombre}</td>
                <td className="p-3.5 text-right font-mono text-sm">{formatCurrency(c.monto)}</td>
                <td className="p-3.5 text-right font-mono text-sm text-orange-600">
                  {formatCurrency(c.saldoCapital)}
                </td>
                <td className="p-3.5 text-center">{c.cuotas}</td>
                <td className="p-3.5 text-center">{c.cuotasPagadas}</td>
                <td className="p-3.5 text-right font-mono text-sm">
                  {formatCurrency(c.cuotaMensual)}
                </td>
                <td className="p-3.5 text-right font-mono text-sm text-emerald-600">
                  {formatCurrency(c.totalPagado)}
                </td>
                <td className="p-3.5 text-center">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${estadoColor[c.estado] ?? 'bg-gray-50 text-gray-600 border border-gray-200'}`}
                  >
                    {c.estado}
                  </span>
                </td>
              </AnimatedTableRow>
            ))}
          </tbody>
        </table>
      </div>
    </AnimatedFadeIn>
  );
}

function EstadoCuentaTab() {
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

  const columnsAportes: ExportColumn[] = [
    { header: 'Período', key: 'periodoId', format: (v) => periodoMap.get(Number(v)) ?? String(v) },
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

  const estadoColor: Record<string, string> = {
    pagado: 'bg-green-50 text-green-700 border border-green-200',
    pendiente: 'bg-yellow-50 text-yellow-700 border border-yellow-200',
    activo: 'bg-green-50 text-green-700 border border-green-200',
  };

  return (
    <AnimatedFadeIn>
      <div className="mb-4">
        <label className="block text-xs font-medium text-gray-600 mb-1">Seleccionar Socio</label>
        <select
          value={socioId}
          onChange={(e) => setSocioId(e.target.value)}
          className="w-full max-w-md bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
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
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100 p-4">
            <h3 className="text-sm font-semibold text-navy-800 mb-3">Datos del Socio</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Nombre:</span>
                <p className="font-medium text-navy-800">{data.socio.nombre}</p>
              </div>
              <div>
                <span className="text-gray-500">Documento:</span>
                <p className="font-medium text-navy-800">{data.socio.documento}</p>
              </div>
              <div>
                <span className="text-gray-500">Email:</span>
                <p className="font-medium text-navy-800">{data.socio.email ?? '—'}</p>
              </div>
              <div>
                <span className="text-gray-500">Estado:</span>
                <p className="font-medium capitalize text-navy-800">{data.socio.estado}</p>
              </div>
              <div>
                <span className="text-gray-500">Ahorro Acumulado:</span>
                <p className="font-medium text-green-600">
                  {formatCurrency(data.socio.ahorroAcumulado)}
                </p>
              </div>
              <div>
                <span className="text-gray-500">Total Aportado:</span>
                <p className="font-medium text-navy-800">{formatCurrency(data.totalAportado)}</p>
              </div>
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-navy-800">Aportes</h3>
              <AnimatedButton
                onClick={() =>
                  exportToExcel(
                    data.aportes as unknown as Record<string, unknown>[],
                    columnsAportes,
                    `aportes-${data.socio.nombre}`,
                  )
                }
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100"
              >
                <Download size={14} /> Exportar Excel
              </AnimatedButton>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gradient-to-r from-gray-50 to-gray-100/50 text-gray-500">
                    <th className="text-left p-3.5 font-semibold text-xs uppercase tracking-wider">
                      Período
                    </th>
                    <th className="text-right p-3.5 font-semibold text-xs uppercase tracking-wider">
                      Monto
                    </th>
                    <th className="text-left p-3.5 font-semibold text-xs uppercase tracking-wider">
                      Fecha
                    </th>
                    <th className="text-center p-3.5 font-semibold text-xs uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="text-right p-3.5 font-semibold text-xs uppercase tracking-wider">
                      Solidaridad
                    </th>
                    <th className="text-right p-3.5 font-semibold text-xs uppercase tracking-wider">
                      Abono Crédito
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.aportes.map((a, idx) => (
                    <AnimatedTableRow key={a.id} index={idx}>
                      <td className="p-3.5">{periodoMap.get(a.periodoId) ?? `#${a.periodoId}`}</td>
                      <td className="p-3.5 text-right font-mono">{formatCurrency(a.monto)}</td>
                      <td className="p-3.5 text-gray-600 text-xs">{formatDate(a.fechaPago)}</td>
                      <td className="p-3.5 text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${estadoColor[a.estado] ?? 'bg-gray-50 text-gray-600 border border-gray-200'}`}
                        >
                          {a.estado}
                        </span>
                      </td>
                      <td className="p-3.5 text-right font-mono">
                        {formatCurrency(a.pagoSolidaridad)}
                      </td>
                      <td className="p-3.5 text-right font-mono">
                        {formatCurrency(a.pagoCredito)}
                      </td>
                    </AnimatedTableRow>
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
              <h3 className="text-sm font-semibold text-navy-800">Créditos</h3>
              <AnimatedButton
                onClick={() =>
                  exportToExcel(
                    data.creditos as unknown as Record<string, unknown>[],
                    columnsCreditos,
                    `creditos-${data.socio.nombre}`,
                  )
                }
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100"
              >
                <Download size={14} /> Exportar Excel
              </AnimatedButton>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gradient-to-r from-gray-50 to-gray-100/50 text-gray-500">
                    <th className="text-right p-3.5 font-semibold text-xs uppercase tracking-wider">
                      Monto
                    </th>
                    <th className="text-right p-3.5 font-semibold text-xs uppercase tracking-wider">
                      Saldo
                    </th>
                    <th className="text-center p-3.5 font-semibold text-xs uppercase tracking-wider">
                      Cuotas
                    </th>
                    <th className="text-center p-3.5 font-semibold text-xs uppercase tracking-wider">
                      Pagadas
                    </th>
                    <th className="text-right p-3.5 font-semibold text-xs uppercase tracking-wider">
                      Cuota Mensual
                    </th>
                    <th className="text-center p-3.5 font-semibold text-xs uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="text-left p-3.5 font-semibold text-xs uppercase tracking-wider">
                      Propósito
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.creditos.map((c, idx) => (
                    <AnimatedTableRow key={c.id} index={idx}>
                      <td className="p-3.5 text-right font-mono">{formatCurrency(c.monto)}</td>
                      <td className="p-3.5 text-right font-mono text-orange-600">
                        {formatCurrency(c.saldoCapital)}
                      </td>
                      <td className="p-3.5 text-center">{c.cuotas}</td>
                      <td className="p-3.5 text-center">{c.cuotasPagadas}</td>
                      <td className="p-3.5 text-right font-mono">
                        {formatCurrency(c.cuotaMensual)}
                      </td>
                      <td className="p-3.5 text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${estadoColor[c.estado] ?? 'bg-gray-50 text-gray-600 border border-gray-200'}`}
                        >
                          {c.estado}
                        </span>
                      </td>
                      <td className="p-3.5">{c.proposito ?? '—'}</td>
                    </AnimatedTableRow>
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
    </AnimatedFadeIn>
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

  return (
    <AnimatedFadeIn>
      <div className="flex flex-wrap items-end gap-4 mb-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Desde</label>
          <input
            type="date"
            value={desde}
            onChange={(e) => setDesde(e.target.value)}
            className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Hasta</label>
          <input
            type="date"
            value={hasta}
            onChange={(e) => setHasta(e.target.value)}
            className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
          />
        </div>
        <div className="flex gap-2">
          {data && (
            <>
              <AnimatedButton
                onClick={() =>
                  exportToExcel(
                    data.movimientos as unknown as Record<string, unknown>[],
                    columns,
                    'flujo-caja',
                  )
                }
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100"
              >
                <Download size={14} /> Excel
              </AnimatedButton>
              <AnimatedButton
                onClick={() =>
                  exportToPDF(
                    data.movimientos as unknown as Record<string, unknown>[],
                    columns,
                    'Flujo de Caja',
                    'flujo-caja',
                  )
                }
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100"
              >
                <Download size={14} /> PDF
              </AnimatedButton>
            </>
          )}
        </div>
      </div>
      {isLoading && <div className="text-gray-400 text-center py-8">Cargando...</div>}
      {error && <div className="text-red-500 text-center py-8">Error al cargar flujo de caja</div>}
      {data && (
        <>
          <AnimatedStaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <AnimatedStaggerItem>
              <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 p-4 text-white shadow-lg">
                <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3" />
                <div className="relative">
                  <span className="text-xs font-medium uppercase tracking-wider opacity-80">
                    Ingresos
                  </span>
                  <div className="text-2xl font-bold mt-1">{formatCurrency(data.ingresos)}</div>
                </div>
              </div>
            </AnimatedStaggerItem>
            <AnimatedStaggerItem>
              <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-red-500 to-rose-600 p-4 text-white shadow-lg">
                <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3" />
                <div className="relative">
                  <span className="text-xs font-medium uppercase tracking-wider opacity-80">
                    Egresos
                  </span>
                  <div className="text-2xl font-bold mt-1">{formatCurrency(data.egresos)}</div>
                </div>
              </div>
            </AnimatedStaggerItem>
            <AnimatedStaggerItem>
              <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-amber-600 to-orange-500 p-4 text-white shadow-lg">
                <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3" />
                <div className="relative">
                  <span className="text-xs font-medium uppercase tracking-wider opacity-80">
                    Saldo Neto
                  </span>
                  <div
                    className={`text-2xl font-bold mt-1 ${data.saldo >= 0 ? 'text-white' : 'text-white'}`}
                  >
                    {formatCurrency(data.saldo)}
                  </div>
                </div>
              </div>
            </AnimatedStaggerItem>
          </AnimatedStaggerContainer>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gradient-to-r from-gray-50 to-gray-100/50 text-gray-500">
                  <th className="text-left p-3.5 font-semibold text-xs uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="text-left p-3.5 font-semibold text-xs uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="text-left p-3.5 font-semibold text-xs uppercase tracking-wider">
                    Categoría
                  </th>
                  <th className="text-left p-3.5 font-semibold text-xs uppercase tracking-wider">
                    Descripción
                  </th>
                  <th className="text-right p-3.5 font-semibold text-xs uppercase tracking-wider">
                    Monto
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.movimientos.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center text-gray-400 py-8">
                      No hay movimientos en el período seleccionado
                    </td>
                  </tr>
                )}
                {data.movimientos.map((m, idx) => (
                  <AnimatedTableRow key={`${m.fecha}-${m.descripcion}-${m.monto}`} index={idx}>
                    <td className="p-3.5 text-gray-600 text-xs">{formatDate(m.fecha)}</td>
                    <td className="p-3.5">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${m.tipo === 'ingreso' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}
                      >
                        {m.tipo === 'ingreso' ? 'Ingreso' : 'Egreso'}
                      </span>
                    </td>
                    <td className="p-3.5 text-gray-700">{m.categoria}</td>
                    <td className="p-3.5 text-gray-600 max-w-[250px]">{m.descripcion}</td>
                    <td
                      className={`p-3.5 text-right font-medium font-mono ${m.tipo === 'ingreso' ? 'text-green-600' : 'text-red-600'}`}
                    >
                      {formatCurrency(m.monto)}
                    </td>
                  </AnimatedTableRow>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </AnimatedFadeIn>
  );
}
