import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { AnimatedFadeIn } from './ui';
import { ResumenDashboard } from '../lib/api';
import { CreditCard, Users } from 'lucide-react';

interface AdminChartPanelsProps {
  resumen: ResumenDashboard;
}

export default function AdminChartPanels({ resumen }: AdminChartPanelsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
      <AnimatedFadeIn>
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100 p-4">
          <h2 className="text-sm font-semibold text-navy-800 mb-3 flex items-center gap-2">
            <CreditCard size={16} className="text-purple-500" /> Cartera
          </h2>
          {resumen.creditos.total > 0 ? (
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Activos', value: resumen.creditos.activos },
                      { name: 'Pagados', value: resumen.creditos.pagados },
                      { name: 'Cancelados', value: (resumen.creditos as any).cancelados ?? 0 },
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    dataKey="value"
                  >
                    <Cell fill="#7c3aed" />
                    <Cell fill="#10b981" />
                    <Cell fill="#6b7280" />
                  </Pie>
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-gray-400 text-sm text-center py-8">Sin datos</p>
          )}
        </div>
      </AnimatedFadeIn>
      <AnimatedFadeIn>
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100 p-4">
          <h2 className="text-sm font-semibold text-navy-800 mb-3 flex items-center gap-2">
            <Users size={16} className="text-blue-500" /> Socios
          </h2>
          {resumen.socios.total > 0 ? (
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Activos', value: resumen.socios.activos },
                      { name: 'En Mora', value: resumen.socios.enMora },
                      {
                        name: 'Retirados',
                        value:
                          resumen.socios.total - resumen.socios.activos - resumen.socios.enMora,
                      },
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    dataKey="value"
                  >
                    <Cell fill="#3b82f6" />
                    <Cell fill="#ef4444" />
                    <Cell fill="#9ca3af" />
                  </Pie>
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-gray-400 text-sm text-center py-8">Sin datos</p>
          )}
        </div>
      </AnimatedFadeIn>
    </div>
  );
}
