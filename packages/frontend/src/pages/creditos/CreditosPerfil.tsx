import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Check, DollarSign } from 'lucide-react';
import { apiObtenerCredito, apiAprobarCredito, apiPagarCuota } from '../../lib/api';
import { formatCurrency, formatDate } from '../../lib/utils';
import { ApiError } from '../../lib/api';
import { useState } from 'react';

export default function CreditosPerfil() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [error, setError] = useState('');

  const {
    data: estadoCuenta,
    isLoading,
    error: queryError,
  } = useQuery({
    queryKey: ['credito', id],
    queryFn: () => apiObtenerCredito(id!),
    enabled: !!id,
  });

  const aprobarMutation = useMutation({
    mutationFn: () => apiAprobarCredito(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['credito', id] });
      queryClient.invalidateQueries({ queryKey: ['creditos'] });
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : 'Error al aprobar crédito'),
  });

  const pagarMutation = useMutation({
    mutationFn: () => apiPagarCuota(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['credito', id] });
      queryClient.invalidateQueries({ queryKey: ['creditos'] });
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : 'Error al pagar cuota'),
  });

  if (isLoading)
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center text-gray-400">Cargando...</div>
    );
  if (queryError || !estadoCuenta)
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center text-red-500">
        Error: {(queryError as ApiError)?.message ?? 'Crédito no encontrado'}
      </div>
    );

  const { credito, pagos, tablaAmortizacion, totalPagado, totalPendiente } = estadoCuenta;

  const MESES = [
    'Enero',
    'Febrero',
    'Marzo',
    'Abril',
    'Mayo',
    'Junio',
    'Julio',
    'Agosto',
    'Septiembre',
    'Octubre',
    'Noviembre',
    'Diciembre',
  ];

  function getPeriodo(numeroCuota: number): string {
    if (!credito.fechaDesembolso) return '—';
    const fechaBase = new Date(credito.fechaDesembolso);
    if (isNaN(fechaBase.getTime())) return '—';
    fechaBase.setMonth(fechaBase.getMonth() + numeroCuota);
    return `${MESES[fechaBase.getMonth()]} ${fechaBase.getFullYear()}`;
  }

  const puedePagar =
    credito.estado === 'activo' && tablaAmortizacion.some((c) => c.saldoRestante > 0);

  return (
    <div>
      <Link
        to="/creditos"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-navy-700 mb-4"
      >
        <ArrowLeft size={16} /> Volver a lista
      </Link>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm mb-4">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Estado de Cuenta</h2>
              <p className="text-sm text-gray-500">Socio: {credito.socioId}</p>
            </div>
            <div className="flex items-center gap-3">
              <span
                className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                  credito.estado === 'pendiente'
                    ? 'bg-yellow-100 text-yellow-700'
                    : credito.estado === 'activo'
                      ? 'bg-blue-100 text-blue-700'
                      : credito.estado === 'pagado'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                }`}
              >
                {credito.estado}
              </span>
              {credito.estado === 'pendiente' && (
                <button
                  onClick={() => aprobarMutation.mutate()}
                  disabled={aprobarMutation.isPending}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 disabled:opacity-50"
                >
                  <Check size={16} />{' '}
                  {aprobarMutation.isPending ? 'Aprobando...' : 'Aprobar Crédito'}
                </button>
              )}
              {puedePagar && (
                <button
                  onClick={() => pagarMutation.mutate()}
                  disabled={pagarMutation.isPending}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 disabled:opacity-50"
                >
                  <DollarSign size={16} /> {pagarMutation.isPending ? 'Pagando...' : 'Pagar Cuota'}
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <ResumenCard label="Monto Original" value={formatCurrency(credito.monto)} />
          <ResumenCard label="Cuota Mensual" value={formatCurrency(credito.cuotaMensual)} />
          <ResumenCard label="Saldo Capital" value={formatCurrency(credito.saldoCapital)} />
          <ResumenCard label="Cuotas" value={`${credito.cuotasPagadas}/${credito.cuotas}`} />
          <ResumenCard label="Total Pagado" value={formatCurrency(totalPagado)} variant="green" />
          <ResumenCard
            label="Total Pendiente"
            value={formatCurrency(totalPendiente)}
            variant="red"
          />
          <ResumenCard label="Tasa Mensual" value={`${credito.tasaMensual}%`} />
          <ResumenCard label="Desembolso" value={formatDate(credito.fechaDesembolso)} />
        </div>

        <div className="p-6 border-t">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
            Tabla de Amortización
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-600">
                  <th className="text-left p-2 font-medium">N°</th>
                  <th className="text-left p-2 font-medium">Periodo</th>
                  <th className="text-right p-2 font-medium">Cuota</th>
                  <th className="text-right p-2 font-medium">Capital</th>
                  <th className="text-right p-2 font-medium">Interés</th>
                  <th className="text-right p-2 font-medium">Seguro</th>
                  <th className="text-right p-2 font-medium">Saldo</th>
                  <th className="text-center p-2 font-medium">Estado</th>
                </tr>
              </thead>
              <tbody>
                {tablaAmortizacion.map((cuota) => {
                  const pagada = pagos.some((p) => p.numeroCuota === cuota.numeroCuota);
                  return (
                    <tr
                      key={cuota.numeroCuota}
                      className={`border-t ${pagada ? 'bg-green-50' : ''}`}
                    >
                      <td className="p-2">{cuota.numeroCuota}</td>
                      <td className="p-2 text-gray-500 text-xs">{getPeriodo(cuota.numeroCuota)}</td>
                      <td className="p-2 text-right font-mono">{formatCurrency(cuota.monto)}</td>
                      <td className="p-2 text-right font-mono">
                        {formatCurrency(cuota.montoCapital)}
                      </td>
                      <td className="p-2 text-right font-mono">
                        {formatCurrency(cuota.montoInteres)}
                      </td>
                      <td className="p-2 text-right font-mono text-amber-600">
                        {formatCurrency(cuota.seguro)}
                      </td>
                      <td className="p-2 text-right font-mono">
                        {formatCurrency(cuota.saldoRestante)}
                      </td>
                      <td className="p-2 text-center">
                        {pagada ? (
                          <span className="text-green-600 text-xs font-medium">✓ Pagada</span>
                        ) : (
                          <span className="text-gray-400 text-xs">Pendiente</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {pagos.length > 0 && (
          <div className="p-6 border-t">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
              Pagos Realizados
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-gray-600">
                    <th className="text-left p-2 font-medium">N° Cuota</th>
                    <th className="text-right p-2 font-medium">Monto</th>
                    <th className="text-right p-2 font-medium">Capital</th>
                    <th className="text-right p-2 font-medium">Interés</th>
                    <th className="text-left p-2 font-medium">Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {pagos.map((pago) => (
                    <tr key={pago.id} className="border-t">
                      <td className="p-2">{pago.numeroCuota}</td>
                      <td className="p-2 text-right font-mono">{formatCurrency(pago.monto)}</td>
                      <td className="p-2 text-right font-mono">
                        {formatCurrency(pago.montoCapital)}
                      </td>
                      <td className="p-2 text-right font-mono">
                        {formatCurrency(pago.montoInteres)}
                      </td>
                      <td className="p-2">{formatDate(pago.fechaPago)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ResumenCard({
  label,
  value,
  variant,
}: {
  label: string;
  value: string;
  variant?: 'green' | 'red';
}) {
  return (
    <div className="bg-gray-50 rounded-lg p-3">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p
        className={`text-lg font-bold font-mono ${variant === 'green' ? 'text-green-600' : variant === 'red' ? 'text-red-600' : 'text-gray-900'}`}
      >
        {value}
      </p>
    </div>
  );
}
