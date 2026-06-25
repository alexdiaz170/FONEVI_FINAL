import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Check,
  X,
  Download,
  FileText,
  FileSpreadsheet,
  Calendar,
  DollarSign,
  Percent,
  Clock,
  BadgeCheck,
  CreditCard,
  PiggyBank,
  Users,
} from 'lucide-react';
import {
  apiGetCredito,
  apiGetAmortizacion,
  apiGetPagosCredito,
  apiAprobarCredito,
  apiRechazarCredito,
  type AmortizacionDTO,
  type PagoCreditoDTO,
} from '../../lib/api';
import { formatCurrency, formatDate } from '../../lib/utils';
import { ApiError } from '../../lib/api';
import { downloadExport } from '../../lib/api';
import { exportToExcel, exportToPDF, type ExportColumn } from '../../lib/export';
import { useAuthStore } from '../../stores/authStore';
import {
  AnimatedFadeIn,
  AnimatedStaggerContainer,
  AnimatedStaggerItem,
  AnimatedTableRow,
  AnimatedButton,
} from '../../components/ui';

export default function CreditosPerfil() {
  const { id } = useParams<{ id: string }>();
  const usuario = useAuthStore((s) => s.usuario);
  const esSocio = usuario?.rol === 'socio';
  const queryClient = useQueryClient();
  const [showAllAmort, setShowAllAmort] = useState(false);

  const {
    data: credito,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['credito', id],
    queryFn: () => apiGetCredito(id!),
    enabled: !!id,
    staleTime: 0,
  });

  const { data: amortizacion } = useQuery({
    queryKey: ['amortizacion', id],
    queryFn: () => apiGetAmortizacion(id!),
    enabled: !!id,
    staleTime: 0,
  });

  const { data: pagos } = useQuery({
    queryKey: ['pagos-credito', id],
    queryFn: () => apiGetPagosCredito(id!),
    enabled: !!id,
    staleTime: 0,
  });

  const aprobarMutation = useMutation({
    mutationFn: () => apiAprobarCredito(id!),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['credito', id] }),
  });

  const rechazarMutation = useMutation({
    mutationFn: () => apiRechazarCredito(id!),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['credito', id] }),
  });

  const amortVisible = amortizacion?.data ?? [];
  const amortDisplay = showAllAmort ? amortVisible : amortVisible.slice(0, 10);

  const estadoBadge: Record<string, string> = {
    pendiente: 'bg-amber-50 text-amber-700 border border-amber-200',
    activo: 'bg-blue-50 text-blue-700 border border-blue-200',
    pagado: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    cancelado: 'bg-red-50 text-red-700 border border-red-200',
  };

  const estadoPagado: Record<string, string> = {
    pagado: 'text-emerald-600 bg-emerald-50',
    pendiente: 'text-amber-600 bg-amber-50 border border-amber-200',
    vencido: 'text-red-600 bg-red-50 border border-red-200',
  };

  const exportColumnsAmort: ExportColumn[] = [
    { header: 'N° Cuota', key: 'numeroCuota' },
    { header: 'Fecha Vencimiento', key: 'fechaVencimiento' },
    { header: 'Saldo Inicial', key: 'saldoInicial' },
    { header: 'Interés', key: 'interes' },
    { header: 'Cuota', key: 'cuota' },
    { header: 'Amortización', key: 'amortizacion' },
    { header: 'Saldo Final', key: 'saldoFinal' },
    { header: 'Estado', key: 'estado' },
    { header: 'Fecha Pago', key: 'fechaPago' },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (error)
    return <div className="p-8 text-center text-red-500">Error: {(error as ApiError).message}</div>;
  if (!credito) return <div className="p-8 text-center text-gray-400">Crédito no encontrado</div>;

  return (
    <div>
      <AnimatedFadeIn>
        <div className="flex items-center gap-3 mb-6">
          <Link
            to="/creditos"
            className="w-9 h-9 rounded-xl bg-white/80 backdrop-blur-sm border border-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-white transition-all"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h2 className="text-lg font-bold text-navy-800">Detalle del Crédito</h2>
            <p className="text-xs text-gray-500">ID: {credito.id}</p>
          </div>
          <span
            className={`ml-auto px-3 py-1 rounded-full text-xs font-medium ${estadoBadge[credito.estado] ?? 'bg-gray-50 text-gray-600 border border-gray-200'}`}
          >
            {credito.estado}
          </span>
        </div>
      </AnimatedFadeIn>

      <AnimatedStaggerContainer className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <AnimatedStaggerItem>
          <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-100 p-3.5 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg bg-purple-100 flex items-center justify-center">
                <DollarSign size={14} className="text-purple-600" />
              </div>
              <span className="text-xs text-gray-500">Monto solicitado</span>
            </div>
            <p className="text-lg font-bold text-navy-800 font-mono">
              {formatCurrency(credito.monto)}
            </p>
          </div>
        </AnimatedStaggerItem>
        <AnimatedStaggerItem>
          <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-100 p-3.5 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center">
                <BadgeCheck size={14} className="text-emerald-600" />
              </div>
              <span className="text-xs text-gray-500">Cuota mensual</span>
            </div>
            <p className="text-lg font-bold text-emerald-700 font-mono">
              {formatCurrency(credito.cuotaMensual)}
            </p>
          </div>
        </AnimatedStaggerItem>
        <AnimatedStaggerItem>
          <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-100 p-3.5 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center">
                <Percent size={14} className="text-blue-600" />
              </div>
              <span className="text-xs text-gray-500">Tasa mensual</span>
            </div>
            <p className="text-lg font-bold text-blue-700">
              {credito.tasaMensual ?? credito.tasaInteresMensual}%
            </p>
          </div>
        </AnimatedStaggerItem>
        <AnimatedStaggerItem>
          <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-100 p-3.5 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center">
                <Clock size={14} className="text-amber-600" />
              </div>
              <span className="text-xs text-gray-500">Progreso</span>
            </div>
            <p className="text-lg font-bold text-amber-700">
              {credito.cuotasPagadas}/{credito.cuotas} cuotas
            </p>
          </div>
        </AnimatedStaggerItem>
      </AnimatedStaggerContainer>

      {credito.estado === 'pendiente' && !esSocio && (
        <AnimatedFadeIn>
          <div className="bg-gradient-to-r from-purple-50 to-violet-50 border border-purple-100 rounded-xl p-4 mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-purple-600/10 flex items-center justify-center">
                <CreditCard size={18} className="text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-navy-800">
                  Crédito pendiente de aprobación
                </p>
                <p className="text-xs text-gray-500">
                  Revise los detalles antes de tomar una decisión
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <AnimatedButton
                onClick={() => rechazarMutation.mutate()}
                disabled={rechazarMutation.isPending}
                className="flex items-center gap-1.5 px-3 py-2 bg-red-500 text-white rounded-lg text-xs font-medium hover:bg-red-600 disabled:opacity-50 transition-colors"
              >
                <X size={14} /> Rechazar
              </AnimatedButton>
              <AnimatedButton
                onClick={() => aprobarMutation.mutate()}
                disabled={aprobarMutation.isPending}
                className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 text-white rounded-lg text-xs font-medium hover:bg-emerald-700 disabled:opacity-50 transition-colors"
              >
                <Check size={14} /> Aprobar
              </AnimatedButton>
            </div>
          </div>
        </AnimatedFadeIn>
      )}

      <AnimatedFadeIn>
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-purple-600" />
              <h3 className="text-sm font-semibold text-navy-800">Plan de amortización</h3>
              <span className="text-xs text-gray-400">({amortVisible.length} cuotas)</span>
            </div>
            {amortVisible.length > 0 && (
              <div className="flex gap-2">
                <AnimatedButton
                  onClick={() =>
                    exportToExcel(amortVisible, exportColumnsAmort, `amortizacion-${id}`)
                  }
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100"
                >
                  <FileSpreadsheet size={13} /> Excel
                </AnimatedButton>
                <AnimatedButton
                  onClick={() =>
                    exportToPDF(amortVisible, exportColumnsAmort, `amortizacion-${id}`)
                  }
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100"
                >
                  <FileText size={13} /> PDF
                </AnimatedButton>
              </div>
            )}
          </div>
          {amortDisplay.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gradient-to-r from-gray-50 to-gray-100/50 text-gray-500">
                      <th className="text-center p-3 font-semibold text-xs uppercase tracking-wider">
                        N°
                      </th>
                      <th className="text-left p-3 font-semibold text-xs uppercase tracking-wider">
                        Vencimiento
                      </th>
                      <th className="text-right p-3 font-semibold text-xs uppercase tracking-wider">
                        Saldo inicial
                      </th>
                      <th className="text-right p-3 font-semibold text-xs uppercase tracking-wider">
                        Interés
                      </th>
                      <th className="text-right p-3 font-semibold text-xs uppercase tracking-wider">
                        Cuota
                      </th>
                      <th className="text-right p-3 font-semibold text-xs uppercase tracking-wider text-emerald-600">
                        Amort.
                      </th>
                      <th className="text-right p-3 font-semibold text-xs uppercase tracking-wider">
                        Saldo final
                      </th>
                      <th className="text-center p-3 font-semibold text-xs uppercase tracking-wider">
                        Estado
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {amortDisplay.map((row: AmortizacionDTO, idx: number) => (
                      <AnimatedTableRow key={row.id} index={idx}>
                        <td className="text-center p-3 font-mono text-xs text-gray-600">
                          {row.numeroCuota}
                        </td>
                        <td className="p-3 text-sm">{formatDate(row.fechaVencimiento)}</td>
                        <td className="p-3 text-right font-mono text-sm">
                          {formatCurrency(row.saldoInicial)}
                        </td>
                        <td className="p-3 text-right font-mono text-sm text-amber-600">
                          {formatCurrency(row.interes)}
                        </td>
                        <td className="p-3 text-right font-mono text-sm font-semibold text-gray-800">
                          {formatCurrency(row.cuota)}
                        </td>
                        <td className="p-3 text-right font-mono text-sm text-emerald-600">
                          {formatCurrency(row.amortizacion)}
                        </td>
                        <td className="p-3 text-right font-mono text-sm">
                          {formatCurrency(row.saldoFinal)}
                        </td>
                        <td className="p-3 text-center">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-medium ${estadoPagado[row.estado] ?? 'text-gray-500 bg-gray-50'}`}
                          >
                            {row.estado === 'pagado' && <Check size={11} />}
                            {row.estado}
                          </span>
                        </td>
                      </AnimatedTableRow>
                    ))}
                  </tbody>
                </table>
              </div>
              {amortVisible.length > 10 && (
                <div className="p-3 text-center border-t border-gray-100">
                  <AnimatedButton
                    onClick={() => setShowAllAmort(!showAllAmort)}
                    className="text-xs font-medium text-purple-600 hover:text-purple-700"
                  >
                    {showAllAmort ? 'Mostrar menos' : `Ver todas (${amortVisible.length} cuotas)`}
                  </AnimatedButton>
                </div>
              )}
            </>
          ) : (
            <div className="p-8 text-center text-gray-400 text-sm">
              No hay plan de amortización disponible
            </div>
          )}
        </div>
      </AnimatedFadeIn>

      {pagos && pagos.length > 0 && (
        <AnimatedFadeIn>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign size={16} className="text-emerald-600" />
                <h3 className="text-sm font-semibold text-navy-800">Pagos realizados</h3>
                <span className="text-xs text-gray-400">({pagos.length} pagos)</span>
              </div>
              <div className="flex gap-2">
                <AnimatedButton
                  onClick={() => downloadExport('pagos-credito', 'xlsx', { creditoId: id! })}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100"
                >
                  <FileSpreadsheet size={13} /> Excel
                </AnimatedButton>
                <AnimatedButton
                  onClick={() => downloadExport('pagos-credito', 'pdf', { creditoId: id! })}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100"
                >
                  <FileText size={13} /> PDF
                </AnimatedButton>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gradient-to-r from-gray-50 to-gray-100/50 text-gray-500">
                    <th className="text-left p-3 font-semibold text-xs uppercase tracking-wider">
                      Fecha
                    </th>
                    <th className="text-right p-3 font-semibold text-xs uppercase tracking-wider">
                      Monto
                    </th>
                    <th className="text-left p-3 font-semibold text-xs uppercase tracking-wider">
                      Método
                    </th>
                    <th className="text-left p-3 font-semibold text-xs uppercase tracking-wider">
                      Referencia
                    </th>
                    <th className="text-left p-3 font-semibold text-xs uppercase tracking-wider">
                      Notas
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {pagos.map((pago: PagoCreditoDTO, idx: number) => (
                    <AnimatedTableRow key={pago.id} index={idx}>
                      <td className="p-3 text-sm">{formatDate(pago.fecha)}</td>
                      <td className="p-3 text-right font-mono text-sm font-semibold text-emerald-600">
                        {formatCurrency(pago.monto)}
                      </td>
                      <td className="p-3 text-sm">{pago.metodoPago ?? '—'}</td>
                      <td className="p-3 text-sm text-gray-500">{pago.referencia ?? '—'}</td>
                      <td className="p-3 text-sm text-gray-500">{pago.notas ?? '—'}</td>
                    </AnimatedTableRow>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </AnimatedFadeIn>
      )}
    </div>
  );
}
