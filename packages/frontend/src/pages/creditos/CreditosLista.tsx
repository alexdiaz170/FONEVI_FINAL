import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Eye,
  Check,
  X,
  Search,
  ChevronLeft,
  ChevronRight,
  Filter,
  FileSpreadsheet,
  FileText,
  CreditCard,
  Users,
  DollarSign,
} from 'lucide-react';
import {
  apiListarCreditos,
  apiAprobarCredito,
  apiRechazarCredito,
  apiResumenCreditos,
  type CreditoDTO,
} from '../../lib/api';
import { formatCurrency, formatDate } from '../../lib/utils';
import { ApiError } from '../../lib/api';
import { downloadExport } from '../../lib/api';
import { useAuthStore } from '../../stores/authStore';
import {
  AnimatedStaggerContainer,
  AnimatedStaggerItem,
  AnimatedButton,
  AnimatedTableRow,
  AnimatedFadeIn,
} from '../../components/ui';

const ESTADOS = ['activo,pendiente', 'activo', 'pendiente', 'pagado', 'cancelado', ''];

const ESTADO_LABELS: Record<string, string> = {
  'activo,pendiente': 'Activos y pendientes',
  activo: 'Activo',
  pendiente: 'Pendiente',
  pagado: 'Pagado',
  cancelado: 'Cancelado',
  '': 'Todos',
};

export default function CreditosLista() {
  const usuario = useAuthStore((s) => s.usuario);
  const esSocio = usuario?.rol === 'socio';
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('activo,pendiente');
  const [mesFilter, setMesFilter] = useState('');
  const queryClient = useQueryClient();
  const location = useLocation();
  const successMsg = (location.state as { success?: string })?.success;

  const fechaDesde = mesFilter ? `${mesFilter}-01` : '';
  const fechaHasta = mesFilter
    ? new Date(
        new Date(`${mesFilter}-01`).getFullYear(),
        new Date(`${mesFilter}-01`).getMonth() + 1,
        0,
      )
        .toISOString()
        .split('T')[0]
    : '';

  const { data, isLoading, error } = useQuery({
    queryKey: ['creditos', page, estadoFilter, mesFilter],
    queryFn: () =>
      apiListarCreditos({
        page,
        limit: 10,
        estado: estadoFilter || undefined,
        fechaDesde: fechaDesde || undefined,
        fechaHasta: fechaHasta || undefined,
      }),
    staleTime: 0,
  });

  const { data: resumen } = useQuery({
    queryKey: ['creditos-resumen'],
    queryFn: () => apiResumenCreditos(),
    staleTime: 0,
  });

  const aprobarMutation = useMutation({
    mutationFn: (id: string) => apiAprobarCredito(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['creditos'] }),
  });

  const rechazarMutation = useMutation({
    mutationFn: (id: string) => apiRechazarCredito(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['creditos'] }),
  });

  const filteredData =
    data?.data?.filter(
      (c) =>
        !search ||
        (c.nombreSocio ?? '').toLowerCase().includes(search.toLowerCase()) ||
        (c.socioId ?? '').toLowerCase().includes(search.toLowerCase()),
    ) ?? [];

  const estadoColor: Record<string, string> = {
    pendiente: 'bg-amber-50 text-amber-700 border border-amber-200',
    activo: 'bg-blue-50 text-blue-700 border border-blue-200',
    pagado: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    cancelado: 'bg-red-50 text-red-700 border border-red-200',
  };

  const estadoDot: Record<string, string> = {
    pendiente: 'bg-amber-500',
    activo: 'bg-blue-500',
    pagado: 'bg-emerald-500',
    cancelado: 'bg-red-500',
  };

  return (
    <div>
      {resumen && (
        <AnimatedStaggerContainer className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <AnimatedStaggerItem>
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-purple-600 to-purple-500 p-4 text-white shadow-lg">
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3" />
              <div className="relative">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium uppercase tracking-wider opacity-80">
                    Valor total créditos
                  </span>
                  <CreditCard size={18} className="opacity-50" />
                </div>
                <div className="text-2xl font-bold">
                  {formatCurrency(resumen.totalMontoPrestado)}
                </div>
                <div className="text-xs mt-1 opacity-70">
                  {resumen.creditosActivos} activos · {resumen.creditosPagados} pagados
                </div>
              </div>
            </div>
          </AnimatedStaggerItem>
          <AnimatedStaggerItem>
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-500 p-4 text-white shadow-lg">
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3" />
              <div className="relative">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium uppercase tracking-wider opacity-80">
                    Socios con crédito
                  </span>
                  <Users size={18} className="opacity-50" />
                </div>
                <div className="text-2xl font-bold">{resumen.totalSociosConCredito}</div>
                <div className="text-xs mt-1 opacity-70">
                  {resumen.creditosPendientes} solicitudes pendientes
                </div>
              </div>
            </div>
          </AnimatedStaggerItem>
          <AnimatedStaggerItem>
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 p-4 text-white shadow-lg">
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3" />
              <div className="relative">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium uppercase tracking-wider opacity-80">
                    Saldo por cobrar
                  </span>
                  <DollarSign size={18} className="opacity-50" />
                </div>
                <div className="text-2xl font-bold">{formatCurrency(resumen.saldoPorCobrar)}</div>
                <div className="text-xs mt-1 opacity-70">Capital pendiente de créditos activos</div>
              </div>
            </div>
          </AnimatedStaggerItem>
        </AnimatedStaggerContainer>
      )}

      <AnimatedFadeIn>
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100">
          <div className="p-4 border-b border-gray-100 space-y-3">
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  placeholder="Buscar por ID de socio..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 transition-all"
                />
              </div>
              {filteredData.length > 0 && (
                <div className="flex items-center gap-2">
                  <AnimatedButton
                    onClick={() => downloadExport('creditos', 'xlsx')}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-xl hover:bg-green-100"
                  >
                    <FileSpreadsheet size={14} /> Excel
                  </AnimatedButton>
                  <AnimatedButton
                    onClick={() => downloadExport('creditos', 'pdf')}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-xl hover:bg-red-100"
                  >
                    <FileText size={14} /> PDF
                  </AnimatedButton>
                </div>
              )}
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Filter size={16} className="text-gray-400 shrink-0" />
              <select
                value={estadoFilter}
                onChange={(e) => {
                  setEstadoFilter(e.target.value);
                  setPage(1);
                }}
                className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500"
              >
                {ESTADOS.map((e) => (
                  <option key={e} value={e}>
                    {ESTADO_LABELS[e] ?? e.charAt(0).toUpperCase() + e.slice(1)}
                  </option>
                ))}
              </select>
              <select
                value={mesFilter}
                onChange={(e) => {
                  setMesFilter(e.target.value);
                  setPage(1);
                }}
                className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500"
              >
                <option value="">Todos los meses</option>
                {Array.from({ length: 12 }, (_, i) => {
                  const d = new Date();
                  d.setMonth(d.getMonth() - i);
                  const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                  const label = d.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' });
                  return (
                    <option key={val} value={val}>
                      {label}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          {successMsg && (
            <div className="mx-4 mt-4 px-4 py-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-sm">
              {successMsg}
            </div>
          )}
          {isLoading && (
            <div className="p-12 text-center text-gray-400">
              <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              Cargando créditos...
            </div>
          )}
          {error && (
            <div className="p-8 text-center text-red-500">Error: {(error as ApiError).message}</div>
          )}

          {filteredData.length > 0 && (
            <>
              <div className="overflow-x-auto">
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
                        Cuota Mensual
                      </th>
                      <th className="text-right p-3.5 font-semibold text-xs uppercase tracking-wider">
                        Saldo
                      </th>
                      <th className="text-center p-3.5 font-semibold text-xs uppercase tracking-wider">
                        Cuotas
                      </th>
                      <th className="text-left p-3.5 font-semibold text-xs uppercase tracking-wider">
                        Estado
                      </th>
                      {!esSocio && (
                        <th className="text-center p-3.5 font-semibold text-xs uppercase tracking-wider">
                          Acción
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredData.map((credito: CreditoDTO, idx: number) => (
                      <AnimatedTableRow key={credito.id} index={idx}>
                        <td className="p-3.5 font-medium text-gray-900">
                          {credito.nombreSocio ?? '—'}
                        </td>
                        <td className="p-3.5 text-right font-mono text-sm font-semibold text-navy-700">
                          {formatCurrency(credito.monto)}
                        </td>
                        <td className="p-3.5 text-right font-mono text-sm">
                          {formatCurrency(credito.cuotaMensual)}
                        </td>
                        <td className="p-3.5 text-right font-mono text-sm text-amber-600">
                          {formatCurrency(credito.saldoCapital)}
                        </td>
                        <td className="p-3.5 text-center text-sm">
                          {credito.cuotasPagadas}/{credito.cuotas}
                        </td>
                        <td className="p-3.5">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${estadoColor[credito.estado] ?? 'bg-gray-50 text-gray-600 border border-gray-200'}`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${estadoDot[credito.estado] ?? 'bg-gray-400'}`}
                            />
                            {credito.estado}
                          </span>
                        </td>
                        {!esSocio && (
                          <td className="p-3.5 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              {credito.estado === 'pendiente' && (
                                <>
                                  <AnimatedButton
                                    onClick={() => aprobarMutation.mutate(credito.id)}
                                    disabled={aprobarMutation.isPending}
                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-medium hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                                  >
                                    <Check size={13} /> Aprobar
                                  </AnimatedButton>
                                  <AnimatedButton
                                    onClick={() => rechazarMutation.mutate(credito.id)}
                                    disabled={rechazarMutation.isPending}
                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-red-500 text-white rounded-lg text-xs font-medium hover:bg-red-600 disabled:opacity-50 transition-colors"
                                  >
                                    <X size={13} /> Rechazar
                                  </AnimatedButton>
                                </>
                              )}
                              <Link
                                to={`/creditos/${credito.id}`}
                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-lg text-xs font-medium shadow-sm hover:from-purple-700 hover:to-purple-600 transition-all"
                              >
                                <Eye size={13} /> Detalle
                              </Link>
                            </div>
                          </td>
                        )}
                      </AnimatedTableRow>
                    ))}
                  </tbody>
                </table>
              </div>

              {data && data.totalPages > 1 && (
                <div className="flex items-center justify-between p-4 border-t border-gray-100">
                  <span className="text-sm text-gray-500">
                    Página {data.page} de {data.totalPages}
                    <span className="text-gray-300 mx-1">·</span>
                    {data.total} créditos
                  </span>
                  <div className="flex gap-1">
                    <AnimatedButton
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page <= 1}
                      className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-40"
                    >
                      <ChevronLeft size={16} className="text-gray-600" />
                    </AnimatedButton>
                    <AnimatedButton
                      onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                      disabled={page >= data.totalPages}
                      className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-40"
                    >
                      <ChevronRight size={16} className="text-gray-600" />
                    </AnimatedButton>
                  </div>
                </div>
              )}
            </>
          )}
          {filteredData.length === 0 && !isLoading && !error && (
            <div className="p-12 text-center text-gray-400">No se encontraron créditos</div>
          )}
        </div>
      </AnimatedFadeIn>
    </div>
  );
}
