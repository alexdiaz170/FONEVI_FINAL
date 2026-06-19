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
} from 'lucide-react';
import { apiGetDashboardResumen } from '../lib/api';
import { formatCurrency } from '../lib/utils';
import { ApiError } from '../lib/api';

export default function DashboardPage() {
  const {
    data: resumen,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['dashboard-resumen'],
    queryFn: () => apiGetDashboardResumen(),
    refetchInterval: 30000,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        Cargando dashboard...
      </div>
    );
  }

  if (error) {
    return <div className="text-center text-red-500">Error: {(error as ApiError).message}</div>;
  }

  if (!resumen) return null;

  const cards = [
    {
      label: 'Socios Activos',
      value: resumen.socios.activos,
      sub: `${resumen.socios.enMora} en mora`,
      icon: Users,
      color: 'bg-blue-500',
    },
    {
      label: 'Socios Totales',
      value: resumen.socios.total,
      sub: '',
      icon: Users,
      color: 'bg-navy-600',
    },
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
      label: 'Solidaridad',
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

  return (
    <div>
      <h1 className="text-2xl font-bold text-navy-800 mb-6">Dashboard</h1>

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
