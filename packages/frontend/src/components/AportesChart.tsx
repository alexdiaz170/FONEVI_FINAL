import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { apiListarAportes } from '../lib/api';
import { formatCurrency } from '../lib/utils';
import { TrendingUp } from 'lucide-react';

export default function AportesChart() {
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

  const chartData = periodos.map(([pid, valor]) => ({
    periodo: `#${pid}`,
    monto: valor,
  }));

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
        <TrendingUp size={18} className="text-emerald-500" />
        <h2 className="font-semibold text-navy-800">Historial de Aportes</h2>
      </div>
      <div className="p-5">
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="periodo" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: number) => formatCurrency(v)} />
              <Bar dataKey="monto" fill="#14b8a6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
