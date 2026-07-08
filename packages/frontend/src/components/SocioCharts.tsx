import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { MiDashboardCredito } from '../lib/api';

interface SocioChartsProps {
  creditosActivos: MiDashboardCredito[];
}

export default function SocioCharts({ creditosActivos }: SocioChartsProps) {
  return (
    <div className="px-5 py-4 border-t border-gray-100">
      <p className="text-xs text-gray-500 mb-2">Progreso de pagos</p>
      <div className="h-28">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={[
                {
                  name: 'Pagadas',
                  value: creditosActivos.reduce((s, c) => s + (c.cuotasPagadas ?? 0), 0),
                },
                {
                  name: 'Pendientes',
                  value: creditosActivos.reduce((s, c) => s + c.cuotas - (c.cuotasPagadas ?? 0), 0),
                },
              ]}
              cx="50%"
              cy="50%"
              innerRadius={30}
              outerRadius={50}
              dataKey="value"
            >
              <Cell fill="#10b981" />
              <Cell fill="#f59e0b" />
            </Pie>
            <Tooltip />
            <Legend wrapperStyle={{ fontSize: 11 }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
