import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Wallet, PiggyBank, Check, X } from 'lucide-react';
import {
  apiListarDividendos,
  apiCrearDividendo,
  apiDistribuirDividendo,
  apiListarSocios,
} from '../../lib/api';
import { formatCurrency, formatDate } from '../../lib/utils';
import {
  AnimatedFadeIn,
  AnimatedStaggerContainer,
  AnimatedStaggerItem,
  AnimatedButton,
} from '../../components/ui';

export function DividendosTab() {
  const [page, setPage] = useState(1);
  const [showCrear, setShowCrear] = useState(false);
  const [periodo, setPeriodo] = useState('');
  const [montoTotal, setMontoTotal] = useState('');
  const [distribuyendoId, setDistribuyendoId] = useState<string | null>(null);

  const { data: socios } = useQuery({
    queryKey: ['socios-lista'],
    queryFn: () => apiListarSocios(1, 999),
  });

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['dividendos', page],
    queryFn: () => apiListarDividendos(page, 10),
  });

  const mutationCrear = async () => {
    if (!periodo || !montoTotal) return;
    try {
      await apiCrearDividendo({ periodo, montoTotal: Number(montoTotal) });
      setShowCrear(false);
      setPeriodo('');
      setMontoTotal('');
      refetch();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Error al crear dividendo');
    }
  };

  const mutationDistribuir = async (id: string) => {
    if (!socios?.data.length) return;
    setDistribuyendoId(id);
    try {
      const socioIds = socios.data.map((s) => s.id);
      await apiDistribuirDividendo(id, socioIds);
      refetch();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Error al distribuir dividendo');
    } finally {
      setDistribuyendoId(null);
    }
  };

  const totalMonto = data?.data.reduce((s, d) => s + d.montoTotal, 0) ?? 0;
  const distribuidos = data?.data.filter((d) => d.distribuido).length ?? 0;

  return (
    <AnimatedFadeIn>
      <div className="flex items-center justify-between mb-4">
        <AnimatedStaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
          <AnimatedStaggerItem>
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-navy-600 to-navy-500 p-4 text-white shadow-lg">
              <div className="absolute top-0 right-0 w-16 h-16 bg-white/10 rounded-full -translate-y-1/3 translate-x-1/4" />
              <div className="relative">
                <span className="text-xs font-medium uppercase tracking-wider opacity-80">
                  Total Dividendos
                </span>
                <p className="text-xl font-bold mt-1">{data?.total ?? 0}</p>
              </div>
            </div>
          </AnimatedStaggerItem>
          <AnimatedStaggerItem>
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-500 p-4 text-white shadow-lg">
              <div className="absolute top-0 right-0 w-16 h-16 bg-white/10 rounded-full -translate-y-1/3 translate-x-1/4" />
              <div className="relative">
                <span className="text-xs font-medium uppercase tracking-wider opacity-80">
                  Monto Acumulado
                </span>
                <p className="text-xl font-bold mt-1">{formatCurrency(totalMonto)}</p>
              </div>
            </div>
          </AnimatedStaggerItem>
          <AnimatedStaggerItem>
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-amber-600 to-orange-500 p-4 text-white shadow-lg">
              <div className="absolute top-0 right-0 w-16 h-16 bg-white/10 rounded-full -translate-y-1/3 translate-x-1/4" />
              <div className="relative">
                <span className="text-xs font-medium uppercase tracking-wider opacity-80">
                  Distribuidos
                </span>
                <p className="text-xl font-bold mt-1">
                  {distribuidos} / {data?.total ?? 0}
                </p>
              </div>
            </div>
          </AnimatedStaggerItem>
        </AnimatedStaggerContainer>
        <AnimatedButton
          onClick={() => setShowCrear(!showCrear)}
          className="shrink-0 px-4 py-2 bg-gradient-to-r from-navy-600 to-navy-500 text-white rounded-xl text-sm font-medium hover:from-navy-700 hover:to-navy-600 shadow-lg shadow-navy-500/25 transition-all ml-4"
        >
          {showCrear ? 'Cancelar' : '+ Nuevo Dividendo'}
        </AnimatedButton>
      </div>

      {showCrear && (
        <AnimatedFadeIn>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100 p-4 mb-6">
            <h3 className="text-sm font-semibold text-navy-800 mb-3">Crear Dividendo</h3>
            <div className="flex items-end gap-4">
              <div>
                <label className="block text-xs font-medium text-navy-700 mb-1">Período</label>
                <input
                  type="text"
                  value={periodo}
                  onChange={(e) => setPeriodo(e.target.value)}
                  placeholder="Ej: 2026-06"
                  className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-navy-500/30 focus:border-navy-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-navy-700 mb-1">Monto Total</label>
                <input
                  type="number"
                  value={montoTotal}
                  onChange={(e) => setMontoTotal(e.target.value)}
                  placeholder="0"
                  className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-navy-500/30 focus:border-navy-500"
                />
              </div>
              <AnimatedButton
                onClick={mutationCrear}
                disabled={!periodo || !montoTotal}
                className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white rounded-xl text-sm font-medium hover:from-emerald-700 hover:to-emerald-600 disabled:opacity-50 transition-all"
              >
                Guardar
              </AnimatedButton>
            </div>
          </div>
        </AnimatedFadeIn>
      )}

      {isLoading && <div className="text-gray-400 text-center py-8">Cargando...</div>}
      {error && <div className="text-red-500 text-center py-8">Error al cargar dividendos</div>}

      {data && (
        <>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gradient-to-r from-gray-50 to-gray-100/50 text-gray-500">
                  <th className="text-left p-3.5 font-semibold text-xs uppercase tracking-wider">
                    Período
                  </th>
                  <th className="text-right p-3.5 font-semibold text-xs uppercase tracking-wider">
                    Monto Total
                  </th>
                  <th className="text-left p-3.5 font-semibold text-xs uppercase tracking-wider">
                    Fecha Cálculo
                  </th>
                  <th className="text-center p-3.5 font-semibold text-xs uppercase tracking-wider">
                    Distribuido
                  </th>
                  <th className="text-left p-3.5 font-semibold text-xs uppercase tracking-wider">
                    Fecha Pago
                  </th>
                  <th className="text-center p-3.5 font-semibold text-xs uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.data.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center text-gray-400 py-8">
                      No hay dividendos registrados
                    </td>
                  </tr>
                )}
                {data.data.map(
                  (d: {
                    id: string;
                    periodo: string;
                    montoTotal: number;
                    fechaCalculo: string;
                    distribuido: boolean;
                    fechaPago: string | null;
                  }) => (
                    <tr key={d.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="p-3.5 font-medium text-navy-800">{d.periodo}</td>
                      <td className="p-3.5 text-right font-mono">{formatCurrency(d.montoTotal)}</td>
                      <td className="p-3.5 text-gray-600 text-xs">{formatDate(d.fechaCalculo)}</td>
                      <td className="p-3.5 text-center">
                        {d.distribuido ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                            <Check size={10} /> Sí
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-50 text-yellow-700 border border-yellow-200">
                            <X size={10} /> No
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 text-gray-600 text-xs">
                        {d.fechaPago ? formatDate(d.fechaPago) : '—'}
                      </td>
                      <td className="p-3.5 text-center">
                        {!d.distribuido && (
                          <AnimatedButton
                            onClick={() => mutationDistribuir(d.id)}
                            disabled={distribuyendoId === d.id}
                            className="px-3 py-1.5 text-xs font-medium bg-navy-600 text-white rounded-xl hover:bg-navy-700 disabled:opacity-50 transition-all"
                          >
                            {distribuyendoId === d.id ? 'Distribuyendo...' : 'Distribuir'}
                          </AnimatedButton>
                        )}
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>

          {data.totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-4">
              <AnimatedButton
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-3 py-1.5 text-xs font-medium bg-white/80 border border-gray-200 rounded-xl hover:bg-white disabled:opacity-30 transition-all"
              >
                Anterior
              </AnimatedButton>
              <span className="px-3 py-1.5 text-xs text-gray-600">
                Página {data.page} de {data.totalPages}
              </span>
              <AnimatedButton
                onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                disabled={page >= data.totalPages}
                className="px-3 py-1.5 text-xs font-medium bg-white/80 border border-gray-200 rounded-xl hover:bg-white disabled:opacity-30 transition-all"
              >
                Siguiente
              </AnimatedButton>
            </div>
          )}
        </>
      )}
    </AnimatedFadeIn>
  );
}
