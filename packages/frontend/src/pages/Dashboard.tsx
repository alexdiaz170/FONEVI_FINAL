import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Users,
  Wallet,
  CreditCard,
  PiggyBank,
  TrendingUp,
  TrendingDown,
  HandHeart,
  Building2,
  User,
  BadgeCheck,
  Banknote,
  Calendar,
  Calculator,
  RefreshCw,
  Table as TableIcon,
  Printer,
  Bell,
  FileSpreadsheet,
  FileText,
} from 'lucide-react';
import {
  apiGetDashboardResumen,
  apiMiDashboard,
  apiCalcularCredito,
  apiListarNotificaciones,
  apiListarAportes,
  ApiError,
  type MiDashboardResult,
  type AmortizacionPreviewDTO,
} from '../lib/api';
import { formatCurrency } from '../lib/utils';
import { useAuthStore } from '../stores/authStore';
import { exportToExcel, exportToPDF, type ExportColumn } from '../lib/export';

export default function DashboardPage() {
  const usuario = useAuthStore((s) => s.usuario);

  if (usuario?.rol === 'socio') return <SocioDashboard />;

  return <AdminDashboard />;
}

function SkeletonCards() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
      {Array.from({ length: 10 }).map((_, i) => (
        <div
          key={i}
          className="bg-white rounded-lg shadow p-4 flex items-start gap-3 animate-pulse"
        >
          <div className="w-10 h-10 bg-gray-200 rounded-lg shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-3 bg-gray-200 rounded w-20" />
            <div className="h-5 bg-gray-200 rounded w-28" />
          </div>
        </div>
      ))}
    </div>
  );
}

function SkeletonCarnet() {
  return (
    <div className="md:col-span-2 bg-gray-200 rounded-xl p-5 animate-pulse">
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 bg-gray-300 rounded-full shrink-0" />
        <div className="flex-1 space-y-3">
          <div className="h-3 bg-gray-300 rounded w-48" />
          <div className="h-6 bg-gray-300 rounded w-36" />
          <div className="grid grid-cols-2 gap-3">
            <div className="h-4 bg-gray-300 rounded w-24" />
            <div className="h-4 bg-gray-300 rounded w-20" />
            <div className="h-4 bg-gray-300 rounded w-28" />
            <div className="h-4 bg-gray-300 rounded w-16" />
          </div>
        </div>
      </div>
    </div>
  );
}

function SkeletonSavings() {
  return (
    <div className="bg-gray-200 rounded-xl p-5 animate-pulse">
      <div className="h-3 bg-gray-300 rounded w-24 mb-2" />
      <div className="h-8 bg-gray-300 rounded w-32 mb-2" />
      <div className="h-3 bg-gray-300 rounded w-28" />
    </div>
  );
}

function SkeletonPanel() {
  return (
    <div className="bg-white rounded-lg shadow animate-pulse">
      <div className="px-5 py-4 border-b border-gray-100">
        <div className="h-4 bg-gray-200 rounded w-28" />
      </div>
      <div className="p-5 space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex justify-between">
            <div className="space-y-1">
              <div className="h-4 bg-gray-200 rounded w-24" />
              <div className="h-3 bg-gray-200 rounded w-16" />
            </div>
            <div className="h-4 bg-gray-200 rounded w-20" />
          </div>
        ))}
      </div>
    </div>
  );
}

function AdminDashboard() {
  const {
    data: resumen,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['dashboard-resumen'],
    queryFn: () => apiGetDashboardResumen(),
    refetchInterval: 30000,
  });

  if (isLoading)
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-300 bg-gray-200 rounded w-40 h-8 mb-6 animate-pulse" />
        <SkeletonCards />
      </div>
    );
  if (error)
    return <div className="text-center text-red-500">Error: {(error as ApiError).message}</div>;
  if (!resumen) return null;

  const cards = [
    {
      label: 'Socios Activos',
      value: resumen.socios.activos,
      sub: `${resumen.socios.enMora} en mora`,
      icon: Users,
      color: 'bg-blue-500',
    },
    { label: 'Socios Totales', value: resumen.socios.total, icon: Users, color: 'bg-navy-600' },
    {
      label: 'Ahorro Acumulado',
      value: formatCurrency(resumen.ahorros.totalAcumulado),
      icon: Wallet,
      color: 'bg-green-500',
    },
    {
      label: 'Créditos Activos',
      value: resumen.creditos.activos,
      sub: `${resumen.creditos.pagados} pagados`,
      icon: CreditCard,
      color: 'bg-purple-500',
    },
    {
      label: 'Saldo por Cobrar',
      value: formatCurrency(resumen.creditos.saldoPorCobrar),
      icon: CreditCard,
      color: 'bg-orange-500',
    },
    {
      label: 'Aportes del Mes',
      value: formatCurrency(resumen.aportes.delMes),
      sub: `Total: ${formatCurrency(resumen.aportes.totalRecibido)}`,
      icon: PiggyBank,
      color: 'bg-teal-500',
    },
    {
      label: 'Fondo Solidaridad',
      value: formatCurrency(resumen.solidaridad.totalRecibido),
      icon: HandHeart,
      color: 'bg-pink-500',
    },
    {
      label: 'Reservas',
      value: formatCurrency(resumen.reservas),
      icon: Building2,
      color: 'bg-yellow-500',
    },
    {
      label: 'Ingresos',
      value: formatCurrency(resumen.movimientos.ingresos),
      icon: TrendingUp,
      color: 'bg-emerald-500',
    },
    {
      label: 'Egresos',
      value: formatCurrency(resumen.movimientos.egresos),
      icon: TrendingDown,
      color: 'bg-red-500',
    },
  ];

  const exportColumns: ExportColumn[] = [
    { header: 'Indicador', key: 'label' },
    { header: 'Valor', key: 'value' },
    { header: 'Detalle', key: 'detail' },
  ];

  function handleExportExcel() {
    const data = cards.map((c) => ({ label: c.label, value: c.value, detail: c.sub ?? '' }));
    exportToExcel(data, exportColumns, 'dashboard');
  }

  async function handleExportPDF() {
    const data = cards.map((c) => ({ label: c.label, value: c.value, detail: c.sub ?? '' }));
    await exportToPDF(data, exportColumns, 'Dashboard - Resumen General', 'dashboard');
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-navy-800">Dashboard</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded hover:bg-green-100"
          >
            <FileSpreadsheet size={14} /> Excel
          </button>
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded hover:bg-red-100"
          >
            <FileText size={14} /> PDF
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {cards.map((card) => (
          <div key={card.label} className="bg-white rounded-lg shadow p-4 flex items-start gap-3">
            <div className={`${card.color} p-2 rounded-lg shrink-0`}>
              <card.icon size={20} className="text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-500 uppercase tracking-wider">{card.label}</p>
              <p className="text-lg font-bold font-mono text-gray-900 truncate">{card.value}</p>
              {card.sub && <p className="text-xs text-gray-400">{card.sub}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SocioDashboard() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['mi-dashboard'],
    queryFn: () => apiMiDashboard(),
    refetchInterval: 30000,
  });

  const { data: notis } = useQuery({
    queryKey: ['notificaciones', 'no-leidas'],
    queryFn: () => apiListarNotificaciones({ leida: false, limit: 5 }),
    refetchInterval: 15000,
  });

  if (isLoading)
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded w-60 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SkeletonCarnet />
          <SkeletonSavings />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SkeletonPanel />
          <SkeletonPanel />
        </div>
      </div>
    );
  if (error)
    return <div className="text-center text-red-500">Error: {(error as ApiError).message}</div>;
  if (!data) return null;

  const creditosActivos = data.creditos.filter(
    (c) => c.estado === 'activo' || c.estado === 'pendiente',
  );
  const notisNoLeidas = notis?.data ?? [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-navy-800">Bienvenido, {data.socio.nombre}</h1>

      {/* Carnet + Savings */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 bg-gradient-to-br from-navy-700 via-navy-600 to-blue-800 rounded-xl shadow-lg p-5 text-white relative overflow-hidden print:bg-white print:text-black print:border-2 print:border-gray-300">
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4" />
          <div className="flex items-start gap-4 relative">
            <div className="bg-white/20 p-3 rounded-full shrink-0 ring-2 ring-white/30">
              <User size={28} className="text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs text-navy-200 uppercase tracking-wider font-medium">
                    FONDO DE EMPLEADOS DOCENTES FONEVI
                  </p>
                  <h2 className="text-xl font-bold mt-0.5">{data.socio.nombre}</h2>
                </div>
                <button
                  onClick={() => window.print()}
                  className="print:hidden p-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-white/80 hover:text-white"
                  title="Imprimir carnet"
                >
                  <Printer size={16} />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-3 text-sm">
                <p className="text-navy-200">
                  <span className="text-navy-300 text-xs">Documento</span>
                  <br />
                  <span className="text-white font-medium">
                    {data.socio.tipoDocumento} {data.socio.numeroDocumento}
                  </span>
                </p>
                <p className="text-navy-200">
                  <span className="text-navy-300 text-xs">Código</span>
                  <br />
                  <span className="text-white font-medium">{data.socio.codigo}</span>
                </p>
                <p className="text-navy-200">
                  <span className="text-navy-300 text-xs">Email</span>
                  <br />
                  <span className="text-white font-medium truncate block">
                    {data.socio.email ?? '—'}
                  </span>
                </p>
                <p className="text-navy-200">
                  <span className="text-navy-300 text-xs">Estado</span>
                  <br />
                  <span
                    className={`inline-block mt-0.5 px-2 py-0.5 rounded text-xs font-medium ${data.socio.estado === 'activo' ? 'bg-green-400/30 text-green-200' : 'bg-gray-400/30 text-gray-200'}`}
                  >
                    {data.socio.estado === 'activo' ? 'Activo' : data.socio.estado}
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-navy-600 to-navy-800 rounded-xl shadow p-5 text-white flex flex-col justify-center">
          <p className="text-sm text-navy-200 uppercase tracking-wider font-medium">
            Ahorro Acumulado
          </p>
          <p className="text-3xl font-bold font-mono mt-1">
            {formatCurrency(data.socio.ahorroAcumulado)}
          </p>
          <p className="text-xs text-navy-300 mt-1">
            Capacidad de crédito: hasta{' '}
            {formatCurrency(
              Math.round(data.socio.ahorroAcumulado * data.config.multiplicadorMaximoCredito),
            )}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Creditos Activos */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
            <CreditCard size={18} className="text-purple-500" />
            <h2 className="font-semibold text-gray-800">Mis Créditos</h2>
          </div>
          {creditosActivos.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">No tienes créditos activos</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {creditosActivos.map((c) => (
                <div key={c.id} className="px-5 py-3 flex justify-between items-center">
                  <div>
                    <p className="font-medium text-gray-900">{formatCurrency(c.monto)}</p>
                    <p className="text-xs text-gray-500">
                      {c.cuotasPagadas}/{c.cuotas} cuotas · Cuota: {formatCurrency(c.cuotaMensual)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-sm font-semibold text-amber-600">
                      {formatCurrency(c.saldoCapital)}
                    </p>
                    <p className="text-xs text-gray-400">saldo pendiente</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Ultimos Aportes */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
            <PiggyBank size={18} className="text-teal-500" />
            <h2 className="font-semibold text-gray-800">Últimos Aportes</h2>
          </div>
          {data.ultimosAportes.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">No hay aportes registrados</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {data.ultimosAportes.map((a) => (
                <div key={a.id} className="px-5 py-3 flex justify-between items-center">
                  <div>
                    <p className="font-medium text-gray-900">{formatCurrency(a.monto)}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(a.createdAt).toLocaleDateString('es-CO')}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-medium ${a.estado === 'pagado' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}
                  >
                    {a.estado}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Notificaciones */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell size={18} className="text-amber-500" />
              <h2 className="font-semibold text-gray-800">Notificaciones</h2>
              {notisNoLeidas.length > 0 && (
                <span className="bg-amber-100 text-amber-700 text-xs font-bold px-1.5 py-0.5 rounded-full">
                  {notisNoLeidas.length}
                </span>
              )}
            </div>
            <Link
              to="/notificaciones"
              className="text-xs text-navy-600 hover:text-navy-800 font-medium"
            >
              Ver todas
            </Link>
          </div>
          {notisNoLeidas.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">
              No tienes notificaciones pendientes
            </p>
          ) : (
            <div className="divide-y divide-gray-100 max-h-52 overflow-y-auto">
              {notisNoLeidas.map((n) => (
                <div key={n.id} className="px-5 py-3">
                  <div className="flex items-start gap-2">
                    {n.urgente && (
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0" />
                    )}
                    <div className="min-w-0">
                      <p className="font-medium text-sm text-gray-900">{n.titulo}</p>
                      <p className="text-xs text-gray-500 truncate">{n.mensaje}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {new Date(n.createdAt).toLocaleDateString('es-CO')}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Aportes Chart */}
        <AportesChart />
      </div>

      {/* Credit Simulator */}
      <SimuladorCredito
        ahorroAcumulado={data.socio.ahorroAcumulado}
        multiplicador={data.config.multiplicadorMaximoCredito}
        tasaInteres={data.config.tasaInteresMensual}
        porcentajeSeguro={data.config.porcentajeSeguro}
        deudaActiva={creditosActivos.reduce((sum, c) => sum + c.saldoCapital, 0)}
      />
    </div>
  );
}

function AportesChart() {
  const { data, isLoading } = useQuery({
    queryKey: ['aportes-chart'],
    queryFn: () => apiListarAportes({ limit: 100 }),
    refetchInterval: 30000,
  });

  if (isLoading)
    return (
      <div className="bg-white rounded-lg shadow animate-pulse">
        <div className="px-5 py-4 border-b border-gray-100">
          <div className="h-4 bg-gray-200 rounded w-32" />
        </div>
        <div className="p-5 flex items-end gap-2" style={{ height: 140 }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
              <div className="h-3 bg-gray-200 rounded w-10" />
              <div
                className="w-full bg-gray-200 rounded-t"
                style={{ height: `${20 + i * 10}px` }}
              />
              <div className="h-3 bg-gray-200 rounded w-6" />
            </div>
          ))}
        </div>
      </div>
    );

  if (!data || data.data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
          <TrendingUp size={18} className="text-emerald-500" />
          <h2 className="font-semibold text-gray-800">Historial de Aportes</h2>
        </div>
        <p className="text-gray-400 text-sm text-center py-8">No hay aportes registrados</p>
      </div>
    );
  }

  const porPeriodo = new Map<number, number>();
  for (const a of data.data) {
    if (a.estado === 'pagado') {
      porPeriodo.set(a.periodoId, (porPeriodo.get(a.periodoId) ?? 0) + a.monto);
    }
  }

  const periodos = [...porPeriodo.entries()].sort(([a], [b]) => a - b).slice(-6);
  const maxValor = Math.max(...periodos.map(([, v]) => v), 1);

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
        <TrendingUp size={18} className="text-emerald-500" />
        <h2 className="font-semibold text-gray-800">Historial de Aportes</h2>
      </div>
      <div className="p-5">
        <div className="flex items-end gap-2" style={{ height: 120 }}>
          {periodos.map(([periodoId, valor]) => (
            <div
              key={periodoId}
              className="flex-1 flex flex-col items-center gap-1 h-full justify-end"
            >
              <span className="text-[10px] font-mono text-gray-500">{formatCurrency(valor)}</span>
              <div
                className="w-full bg-gradient-to-t from-teal-500 to-teal-300 rounded-t"
                style={{ height: `${Math.max(4, (valor / maxValor) * 80)}px` }}
              />
              <span className="text-[10px] text-gray-400">#{periodoId}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SimuladorCredito({
  ahorroAcumulado,
  multiplicador,
  tasaInteres,
  porcentajeSeguro,
  deudaActiva,
}: {
  ahorroAcumulado: number;
  multiplicador: number;
  tasaInteres: number;
  porcentajeSeguro: number;
  deudaActiva: number;
}) {
  const [monto, setMonto] = useState(500000);
  const [cuotas, setCuotas] = useState(6);
  const [resultado, setResultado] = useState<AmortizacionPreviewDTO | null>(null);
  const [calculando, setCalculando] = useState(false);

  const maxCredito = Math.round(ahorroAcumulado * multiplicador);
  const capacidadDisponible = Math.max(0, maxCredito - deudaActiva);
  const excede = monto > capacidadDisponible;

  useEffect(() => {
    if (monto > 0 && cuotas > 0 && monto <= capacidadDisponible) {
      const timer = setTimeout(async () => {
        setCalculando(true);
        try {
          const data = await apiCalcularCredito(monto, tasaInteres, cuotas);
          setResultado(data);
        } catch {
          setResultado(null);
        } finally {
          setCalculando(false);
        }
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setResultado(null);
    }
  }, [monto, cuotas, tasaInteres]);

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
        <Calculator size={18} className="text-navy-500" />
        <h2 className="font-semibold text-gray-800">Simulador de Crédito</h2>
      </div>
      <div className="p-5">
        {/* Capacidad */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4 text-sm space-y-1">
          <p className="text-gray-600">
            <span className="font-medium">Ahorro acumulado:</span> {formatCurrency(ahorroAcumulado)}
            <span className="mx-2">·</span>
            <span className="font-medium">Capacidad total:</span> {formatCurrency(maxCredito)}
            <span className="ml-1 text-gray-400">(×{multiplicador})</span>
          </p>
          {deudaActiva > 0 && (
            <p className="text-gray-600">
              <span className="font-medium">Deuda activa:</span>{' '}
              <span className="text-orange-600">{formatCurrency(deudaActiva)}</span>
            </p>
          )}
          <p className="text-gray-600">
            <span className="font-medium">Capacidad disponible:</span>{' '}
            <span className={`font-bold ${excede ? 'text-red-600' : 'text-green-700'}`}>
              {formatCurrency(capacidadDisponible)}
            </span>
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Monto solicitado</label>
            <input
              type="number"
              value={monto}
              onChange={(e) => setMonto(Math.max(0, Number(e.target.value) || 0))}
              min={0}
              max={capacidadDisponible}
              step={50000}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
            <input
              type="range"
              value={monto}
              onChange={(e) => setMonto(Number(e.target.value))}
              min={0}
              max={capacidadDisponible}
              step={50000}
              className="w-full mt-1"
            />
            {excede && (
              <p className="text-xs text-red-500 mt-1">El monto excede su capacidad disponible</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Plazo (meses)</label>
            <select
              value={cuotas}
              onChange={(e) => setCuotas(Number(e.target.value))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              {[3, 6, 9, 12, 18, 24, 36].map((n) => (
                <option key={n} value={n}>
                  {n} meses
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tasa mensual</label>
            <div className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-600">
              {tasaInteres}%
            </div>
          </div>
        </div>

        {calculando && <div className="text-center text-gray-400 text-sm py-4">Calculando...</div>}

        {resultado && !calculando && (
          <div className="border border-navy-200 rounded-lg bg-navy-50/50 p-4 space-y-4">
            <h3 className="font-semibold text-navy-800 text-sm">Resumen del crédito</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider">Cuota mensual</p>
                <p className="text-xl font-bold font-mono text-navy-700">
                  {formatCurrency(resultado.cuotaFija)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider">Total intereses</p>
                <p className="text-lg font-semibold font-mono text-amber-600">
                  {formatCurrency(resultado.totalIntereses)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider">Total seguro</p>
                <p className="text-lg font-semibold font-mono text-orange-600">
                  {formatCurrency(resultado.totalSeguro)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider">Total a pagar</p>
                <p className="text-lg font-semibold font-mono text-gray-900">
                  {formatCurrency(resultado.totalPagar)}
                </p>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-navy-700 text-sm mb-2">Tabla de amortización</h4>
              <div className="overflow-x-auto max-h-60 overflow-y-auto border border-navy-200 rounded">
                <table className="w-full text-xs">
                  <thead className="bg-navy-100 text-navy-700 sticky top-0">
                    <tr>
                      <th className="px-2 py-1.5 text-left">#</th>
                      <th className="px-2 py-1.5 text-right">Cuota</th>
                      <th className="px-2 py-1.5 text-right">Capital</th>
                      <th className="px-2 py-1.5 text-right">Interés</th>
                      <th className="px-2 py-1.5 text-right">Seguro</th>
                      <th className="px-2 py-1.5 text-right">Saldo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resultado.tabla.map((row) => (
                      <tr
                        key={row.numero}
                        className="border-b border-navy-100/50 hover:bg-navy-50/50"
                      >
                        <td className="px-2 py-1.5 text-gray-600">{row.numero}</td>
                        <td className="px-2 py-1.5 text-right font-mono">
                          {formatCurrency(row.cuota)}
                        </td>
                        <td className="px-2 py-1.5 text-right font-mono">
                          {formatCurrency(row.capital)}
                        </td>
                        <td className="px-2 py-1.5 text-right font-mono">
                          {formatCurrency(row.interes)}
                        </td>
                        <td className="px-2 py-1.5 text-right font-mono">
                          {formatCurrency(row.seguro)}
                        </td>
                        <td className="px-2 py-1.5 text-right font-mono">
                          {formatCurrency(row.saldo)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
