import { useState } from 'react';
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
  Printer,
  Bell,
  FileSpreadsheet,
  FileText,
  ArrowRight,
  List,
  LayoutDashboard,
  AlertTriangle,
  UserPlus,
  DollarSign,
  Clock,
  BadgeCheck,
} from 'lucide-react';
import {
  apiGetDashboardResumen,
  apiMiDashboard,
  apiListarNotificaciones,
  apiListarAportes,
  apiListarSocios,
  ApiError,
} from '../lib/api';
import { formatCurrency } from '../lib/utils';
import { useAuthStore } from '../stores/authStore';
import { downloadExport } from '../lib/api';
import {
  AnimatedStaggerContainer,
  AnimatedStaggerItem,
  AnimatedFadeIn,
  CardPanel,
  AnimatedButton,
  AnimatedTableRow,
} from '../components/ui';

export default function DashboardPage() {
  const usuario = useAuthStore((s) => s.usuario);
  if (usuario?.rol === 'socio') return <SocioDashboard />;
  return <AdminDashboard />;
}

const quickActions = [
  { to: '/socios/crear', label: 'Nuevo Socio', icon: UserPlus, color: 'from-blue-600 to-blue-500' },
  {
    to: '/aportes/crear',
    label: 'Registrar Aporte',
    icon: PiggyBank,
    color: 'from-emerald-600 to-emerald-500',
  },
  {
    to: '/creditos/crear',
    label: 'Nuevo Crédito',
    icon: CreditCard,
    color: 'from-purple-600 to-purple-500',
  },
  {
    to: '/movimientos/crear',
    label: 'Nuevo Movimiento',
    icon: DollarSign,
    color: 'from-cyan-600 to-teal-500',
  },
  {
    to: '/notificaciones',
    label: 'Notificaciones',
    icon: Bell,
    color: 'from-amber-500 to-orange-500',
  },
  { to: '/mora', label: 'Gestión de Mora', icon: AlertTriangle, color: 'from-red-500 to-rose-600' },
];

function AdminDashboard() {
  const {
    data: resumen,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['dashboard-resumen'],
    queryFn: () => apiGetDashboardResumen(),
    refetchInterval: 60000,
  });

  const { data: sociosRecientes } = useQuery({
    queryKey: ['socios-recientes'],
    queryFn: () => apiListarSocios({ limit: 5 }),
  });

  const { data: notis } = useQuery({
    queryKey: ['notificaciones-no-leidas-admin'],
    queryFn: () => apiListarNotificaciones({ leida: false, limit: 4 }),
    refetchInterval: 15000,
  });

  if (isLoading)
    return (
      <div>
        <div className="h-8 bg-gray-200 rounded w-40 mb-6 animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-6">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-4 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-20 mb-2" />
              <div className="h-6 bg-gray-200 rounded w-28" />
            </div>
          ))}
        </div>
      </div>
    );
  if (error)
    return <div className="text-center text-red-500">Error: {(error as ApiError).message}</div>;
  if (!resumen) return null;

  const now = new Date();
  const greeting =
    now.getHours() < 12 ? 'Buenos días' : now.getHours() < 18 ? 'Buenas tardes' : 'Buenas noches';

  function DashboardCard({ card }: { card: (typeof cards)[0] }) {
    return (
      <AnimatedStaggerItem>
        <div
          className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${card.bg} p-4 text-white shadow-lg`}
        >
          <div className="absolute top-0 right-0 w-16 h-16 bg-white/10 rounded-full -translate-y-1/3 translate-x-1/4" />
          <div className="relative">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium uppercase tracking-wider opacity-80">
                {card.label}
              </span>
              <card.icon size={16} className="opacity-50" />
            </div>
            <p className="text-xl font-bold font-mono">{card.value}</p>
            {card.sub && <p className="text-xs mt-1 opacity-70">{card.sub}</p>}
          </div>
        </div>
      </AnimatedStaggerItem>
    );
  }

  const exportColumns: ExportColumn[] = [
    { header: 'Indicador', key: 'label' },
    { header: 'Valor', key: 'value' },
    { header: 'Detalle', key: 'detail' },
  ];
  const cards = [
    {
      label: 'Socios Activos',
      value: String(resumen.socios.activos),
      sub: `${resumen.socios.enMora} en mora`,
      bg: 'from-blue-600 to-blue-500',
      icon: Users,
      group: 'socios',
    },
    {
      label: 'Socios Totales',
      value: String(resumen.socios.total),
      sub: `${resumen.socios.activos} activos`,
      bg: 'from-navy-600 to-navy-500',
      icon: Users,
      group: 'socios',
    },
    {
      label: 'Créditos Activos',
      value: String(resumen.creditos.activos),
      sub: `${resumen.creditos.pagados} pagados`,
      bg: 'from-purple-600 to-purple-500',
      icon: CreditCard,
      group: 'creditos',
    },
    {
      label: 'Saldo por Cobrar',
      value: formatCurrency(resumen.creditos.saldoPorCobrar),
      bg: 'from-orange-500 to-orange-600',
      icon: CreditCard,
      group: 'creditos',
    },
    {
      label: 'Ahorro Acumulado',
      value: formatCurrency(resumen.ahorros.totalAcumulado),
      bg: 'from-emerald-600 to-emerald-500',
      icon: Wallet,
      group: 'aportes',
    },
    {
      label: 'Aportes del Mes',
      value: formatCurrency(resumen.aportes.delMes),
      sub: `Total: ${formatCurrency(resumen.aportes.totalRecibido)}`,
      bg: 'from-teal-500 to-teal-600',
      icon: PiggyBank,
      group: 'aportes',
    },
    {
      label: 'Ingresos',
      value: formatCurrency(resumen.movimientos.ingresos),
      bg: 'from-emerald-500 to-green-600',
      icon: TrendingUp,
      group: 'movimientos',
    },
    {
      label: 'Egresos',
      value: formatCurrency(resumen.movimientos.egresos),
      bg: 'from-red-500 to-red-600',
      icon: TrendingDown,
      group: 'movimientos',
    },
    {
      label: 'Fondo Solidaridad',
      value: formatCurrency(resumen.solidaridad.totalRecibido),
      bg: 'from-pink-500 to-rose-600',
      icon: HandHeart,
      group: 'fondos',
    },
  ];

  return (
    <div className="relative">
      <div className="absolute top-0 right-0 w-48 md:w-96 h-48 md:h-96 bg-navy-500/5 rounded-full -translate-y-1/3 translate-x-1/3 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-36 md:w-72 h-36 md:h-72 bg-blue-500/5 rounded-full translate-y-1/2 -translate-x-1/4 pointer-events-none" />

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg md:text-2xl font-bold text-navy-800">{greeting}, Admin</h1>
          <p className="text-sm text-gray-500">
            {now.toLocaleDateString('es-CO', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <AnimatedButton
            onClick={() => downloadExport('dashboard', 'xlsx')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-xl hover:bg-green-100"
          >
            <FileSpreadsheet size={14} /> Excel
          </AnimatedButton>
          <AnimatedButton
            onClick={() => downloadExport('dashboard', 'pdf')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-xl hover:bg-red-100"
          >
            <FileText size={14} /> PDF
          </AnimatedButton>
        </div>
      </div>

      <div className="space-y-6 mb-6">
        <div>
          <h3 className="text-sm font-semibold text-navy-800 mb-3 flex items-center gap-2">
            <Users size={16} /> Socios
          </h3>
          <AnimatedStaggerContainer className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {cards
              .filter((c) => c.group === 'socios')
              .map((card) => (
                <DashboardCard key={card.label} card={card} />
              ))}
          </AnimatedStaggerContainer>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-navy-800 mb-3 flex items-center gap-2">
            <CreditCard size={16} /> Créditos
          </h3>
          <AnimatedStaggerContainer className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {cards
              .filter((c) => c.group === 'creditos')
              .map((card) => (
                <DashboardCard key={card.label} card={card} />
              ))}
          </AnimatedStaggerContainer>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-navy-800 mb-3 flex items-center gap-2">
            <PiggyBank size={16} /> Aportes &amp; Ahorro
          </h3>
          <AnimatedStaggerContainer className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {cards
              .filter((c) => c.group === 'aportes')
              .map((card) => (
                <DashboardCard key={card.label} card={card} />
              ))}
          </AnimatedStaggerContainer>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-navy-800 mb-3 flex items-center gap-2">
            <TrendingUp size={16} /> Movimientos
          </h3>
          <AnimatedStaggerContainer className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {cards
              .filter((c) => c.group === 'movimientos')
              .map((card) => (
                <DashboardCard key={card.label} card={card} />
              ))}
          </AnimatedStaggerContainer>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-navy-800 mb-3 flex items-center gap-2">
            <Building2 size={16} /> Fondos
          </h3>
          <AnimatedStaggerContainer className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {cards
              .filter((c) => c.group === 'fondos')
              .map((card) => (
                <DashboardCard key={card.label} card={card} />
              ))}
          </AnimatedStaggerContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
          <AnimatedFadeIn>
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100 p-4">
              <h2 className="text-sm font-semibold text-navy-800 mb-3 flex items-center gap-2">
                <LayoutDashboard size={16} className="text-navy-500" /> Acciones Rápidas
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {quickActions.map((action) => (
                  <Link
                    key={action.to}
                    to={action.to}
                    className={`flex items-center gap-2.5 px-3.5 py-3 rounded-xl bg-gradient-to-r ${action.color} text-white text-sm font-medium shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all`}
                  >
                    <action.icon size={16} />
                    <span>{action.label}</span>
                  </Link>
                ))}
              </div>
            </div>
          </AnimatedFadeIn>
        </div>
        <div>
          <AnimatedFadeIn>
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100 p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-navy-800 flex items-center gap-2">
                  <Bell size={16} className="text-amber-500" /> Notificaciones
                </h2>
                <Link
                  to="/notificaciones"
                  className="text-xs text-navy-600 hover:text-navy-800 font-medium"
                >
                  Ver todas
                </Link>
              </div>
              {notis && notis.data.length > 0 ? (
                <div className="space-y-2 max-h-52 overflow-y-auto">
                  {notis.data.map((n) => (
                    <div
                      key={n.id}
                      className="flex items-start gap-2.5 px-3 py-2 rounded-lg bg-gray-50 border border-gray-100"
                    >
                      <div
                        className={`p-1 rounded-lg shrink-0 ${n.urgente ? 'bg-red-100' : 'bg-blue-100'}`}
                      >
                        <Bell size={12} className={n.urgente ? 'text-red-500' : 'text-blue-500'} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-navy-700 truncate">{n.titulo}</p>
                        <p className="text-[11px] text-gray-400 truncate">{n.mensaje}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-xs text-center py-6">
                  Sin notificaciones pendientes
                </p>
              )}
            </div>
          </AnimatedFadeIn>
        </div>
      </div>

      <AnimatedFadeIn>
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-navy-800 flex items-center gap-2">
              <Users size={16} className="text-blue-500" /> Socios Recientes
            </h2>
            <Link
              to="/socios"
              className="flex items-center gap-1 text-xs text-navy-600 hover:text-navy-800 font-medium"
            >
              Ver todos <ArrowRight size={12} />
            </Link>
          </div>
          {sociosRecientes && sociosRecientes.data && sociosRecientes.data.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gradient-to-r from-gray-50 to-gray-100/50 text-gray-500">
                    <th className="text-left p-3.5 font-semibold text-xs uppercase tracking-wider">
                      Nombre
                    </th>
                    <th className="text-left p-3.5 font-semibold text-xs uppercase tracking-wider">
                      Documento
                    </th>
                    <th className="text-left p-3.5 font-semibold text-xs uppercase tracking-wider">
                      Email
                    </th>
                    <th className="text-center p-3.5 font-semibold text-xs uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="text-right p-3.5 font-semibold text-xs uppercase tracking-wider">
                      Acción
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sociosRecientes.data.slice(0, 5).map((s, idx) => (
                    <AnimatedTableRow key={s.id} index={idx}>
                      <td className="p-3.5 font-medium text-navy-800">{s.nombre}</td>
                      <td className="p-3.5 text-gray-600 text-xs">
                        {s.tipoDocumento} {s.numeroDocumento}
                      </td>
                      <td className="p-3.5 text-gray-500 text-xs">{s.email ?? '—'}</td>
                      <td className="p-3.5 text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${s.estado === 'activo' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}
                        >
                          {s.estado}
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        <Link
                          to={`/socios/${s.id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-all"
                        >
                          Ver <ArrowRight size={10} />
                        </Link>
                      </td>
                    </AnimatedTableRow>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-400 text-sm text-center py-8">No hay socios registrados</p>
          )}
        </div>
      </AnimatedFadeIn>
    </div>
  );
}

function SkeletonCarnet() {
  return (
    <div className="md:col-span-2 bg-gray-200 rounded-2xl p-5 animate-pulse">
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
    <div className="bg-gray-200 rounded-2xl p-5 animate-pulse">
      <div className="h-3 bg-gray-300 rounded w-24 mb-2" />
      <div className="h-8 bg-gray-300 rounded w-32 mb-2" />
      <div className="h-3 bg-gray-300 rounded w-28" />
    </div>
  );
}

function SkeletonPanel() {
  return (
    <div className="bg-white/80 rounded-2xl animate-pulse border border-gray-100">
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

function SocioDashboard() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['mi-dashboard'],
    queryFn: () => apiMiDashboard(),
    refetchInterval: 60000,
  });

  const { data: notis } = useQuery({
    queryKey: ['notificaciones-no-leidas'],
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
    <div className="space-y-6 relative">
      <div className="absolute top-0 right-0 w-48 md:w-96 h-48 md:h-96 bg-navy-500/5 rounded-full -translate-y-1/3 translate-x-1/3 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-36 md:w-72 h-36 md:h-72 bg-blue-500/5 rounded-full translate-y-1/2 -translate-x-1/4 pointer-events-none" />

      <h1 className="text-lg md:text-2xl font-bold text-navy-800">
        Bienvenido, {data.socio.nombre}
      </h1>

      <AnimatedStaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <AnimatedStaggerItem className="md:col-span-2">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-navy-700 via-navy-600 to-blue-800 shadow-lg p-5 text-white print:bg-white print:text-black print:border-2 print:border-gray-300">
            <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4" />
            <div className="flex items-start gap-4 relative">
              <div className="bg-white/20 p-3 rounded-full shrink-0 ring-2 ring-white/30">
                <User size={28} className="text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[10px] text-navy-200 uppercase tracking-wider font-medium">
                      FONDO DE EMPLEADOS DOCENTES FONEVI
                    </p>
                    <h2 className="text-xl font-bold mt-0.5">{data.socio.nombre}</h2>
                  </div>
                  <button
                    onClick={() => window.print()}
                    className="print:hidden p-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-white/80 hover:text-white transition-all"
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
                      className={`inline-block mt-0.5 px-2 py-0.5 rounded-lg text-xs font-medium ${data.socio.estado === 'activo' ? 'bg-green-400/20 text-green-200' : 'bg-gray-400/20 text-gray-200'}`}
                    >
                      {data.socio.estado === 'activo' ? 'Activo' : data.socio.estado}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </AnimatedStaggerItem>

        <AnimatedStaggerItem>
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-navy-600 to-navy-800 shadow-lg p-5 text-white flex flex-col justify-center h-full">
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -translate-y-1/3 translate-x-1/4" />
            <div className="relative">
              <p className="text-sm text-navy-200 uppercase tracking-wider font-medium">
                Ahorro Acumulado
              </p>
              <p className="text-3xl font-bold font-mono mt-1">
                {formatCurrency(data.socio.ahorroAcumulado)}
              </p>
              <p className="text-xs text-navy-300 mt-2">
                Capacidad de crédito: hasta{' '}
                {formatCurrency(
                  Math.round(data.socio.ahorroAcumulado * data.config.multiplicadorMaximoCredito),
                )}
              </p>
              <div className="mt-3 pt-3 border-t border-white/10 flex items-center gap-3 text-xs text-navy-300">
                <div className="flex items-center gap-1">
                  <BadgeCheck size={12} className="text-green-300" /> Al día
                </div>
                <div className="flex items-center gap-1">
                  <Clock size={12} className="text-navy-300" /> {data.socio.antiguedad ?? '—'}
                </div>
              </div>
            </div>
          </div>
        </AnimatedStaggerItem>
      </AnimatedStaggerContainer>

      <AnimatedStaggerContainer className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CardPanel title="Mis Créditos" icon={CreditCard} iconColor="text-purple-500">
          {creditosActivos.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">No tienes créditos activos</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {creditosActivos.map((c) => (
                <div
                  key={c.id}
                  className="px-5 py-3.5 flex justify-between items-center hover:bg-gray-50/50 transition-colors"
                >
                  <div>
                    <p className="font-medium text-navy-800">{formatCurrency(c.monto)}</p>
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
        </CardPanel>

        <CardPanel title="Últimos Aportes" icon={PiggyBank} iconColor="text-teal-500">
          {data.ultimosAportes.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">No hay aportes registrados</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {data.ultimosAportes.map((a) => (
                <div
                  key={a.id}
                  className="px-5 py-3.5 flex justify-between items-center hover:bg-gray-50/50 transition-colors"
                >
                  <div>
                    <p className="font-medium text-navy-800">{formatCurrency(a.monto)}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(a.createdAt).toLocaleDateString('es-CO')}
                    </p>
                  </div>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${a.estado === 'pagado' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-500 border-gray-200'}`}
                  >
                    {a.estado}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardPanel>
      </AnimatedStaggerContainer>

      <AnimatedStaggerContainer className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CardPanel
          title="Notificaciones"
          icon={Bell}
          iconColor="text-amber-500"
          headerRight={
            <>
              {notisNoLeidas.length > 0 && (
                <span className="bg-amber-100 text-amber-700 text-xs font-bold px-1.5 py-0.5 rounded-full">
                  {notisNoLeidas.length}
                </span>
              )}
              <Link
                to="/notificaciones"
                className="text-xs text-navy-600 hover:text-navy-800 font-medium ml-auto"
              >
                Ver todas
              </Link>
            </>
          }
        >
          {notisNoLeidas.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">
              No tienes notificaciones pendientes
            </p>
          ) : (
            <div className="divide-y divide-gray-100 max-h-52 overflow-y-auto">
              {notisNoLeidas.map((n) => (
                <div key={n.id} className="px-5 py-3 hover:bg-gray-50/50 transition-colors">
                  <div className="flex items-start gap-2">
                    {n.urgente && (
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0" />
                    )}
                    <div className="min-w-0">
                      <p className="font-medium text-sm text-navy-800">{n.titulo}</p>
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
        </CardPanel>

        <AnimatedStaggerItem>
          <AportesChart />
        </AnimatedStaggerItem>
      </AnimatedStaggerContainer>
    </div>
  );
}

function AportesChart() {
  const { data, isLoading } = useQuery({
    queryKey: ['aportes-chart'],
    queryFn: () => apiListarAportes({ limit: 100 }),
    refetchInterval: 60000,
  });

  if (isLoading)
    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100 animate-pulse">
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
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
          <TrendingUp size={18} className="text-emerald-500" />
          <h2 className="font-semibold text-navy-800">Historial de Aportes</h2>
        </div>
        <p className="text-gray-400 text-sm text-center py-8">No hay aportes registrados</p>
      </div>
    );
  }

  const porPeriodo = new Map<number, number>();
  for (const a of data.data) {
    if (a.estado === 'pagado')
      porPeriodo.set(a.periodoId, (porPeriodo.get(a.periodoId) ?? 0) + a.monto);
  }
  const periodos = [...porPeriodo.entries()].sort(([a], [b]) => a - b).slice(-6);
  const maxValor = Math.max(...periodos.map(([, v]) => v), 1);

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
        <TrendingUp size={18} className="text-emerald-500" />
        <h2 className="font-semibold text-navy-800">Historial de Aportes</h2>
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
