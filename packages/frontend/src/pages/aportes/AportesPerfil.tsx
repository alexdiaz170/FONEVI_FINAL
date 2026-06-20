import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { apiObtenerAporte, apiListarPeriodos } from '../../lib/api';
import { formatDate, formatCurrency } from '../../lib/utils';
import { ApiError } from '../../lib/api';

export default function AportesPerfil() {
  const { id } = useParams<{ id: string }>();

  const {
    data: aporte,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['aporte', id],
    queryFn: () => apiObtenerAporte(id!),
    enabled: !!id,
  });

  const { data: periodos } = useQuery({
    queryKey: ['periodos'],
    queryFn: () => apiListarPeriodos(),
  });

  const periodoNombre = periodos?.find((p) => p.id === aporte?.periodoId)?.nombre;

  if (isLoading)
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center text-gray-400">Cargando...</div>
    );
  if (error || !aporte)
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center text-red-500">
        Error: {(error as ApiError)?.message ?? 'Aporte no encontrado'}
      </div>
    );

  return (
    <div>
      <Link
        to="/aportes"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-navy-700 mb-4"
      >
        <ArrowLeft size={16} /> Volver a lista
      </Link>

      <div className="bg-white rounded-lg shadow max-w-2xl">
        <div className="p-6 border-b">
          <h2 className="text-lg font-bold text-gray-900">Detalle del Aporte</h2>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <span className="text-sm text-gray-500">Socio</span>
              <p className="text-sm font-medium text-gray-900">
                {aporte.nombreSocio ?? aporte.socioId}
              </p>
            </div>
            <div>
              <span className="text-sm text-gray-500">Periodo</span>
              <p className="text-sm font-medium text-gray-900">
                {periodoNombre ?? aporte.periodoId}
              </p>
            </div>
            <div>
              <span className="text-sm text-gray-500">Monto</span>
              <p className="text-sm font-medium text-gray-900">{formatCurrency(aporte.monto)}</p>
            </div>
            <div>
              <span className="text-sm text-gray-500">Estado</span>
              <span
                className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                  aporte.estado === 'pagado'
                    ? 'bg-green-100 text-green-700'
                    : aporte.estado === 'mora'
                      ? 'bg-red-100 text-red-700'
                      : aporte.estado === 'vencido'
                        ? 'bg-orange-100 text-orange-700'
                        : aporte.estado === 'pendiente'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-gray-100 text-gray-600'
                }`}
              >
                {aporte.estado}
              </span>
            </div>
            <div>
              <span className="text-sm text-gray-500">Fecha de Pago</span>
              <p className="text-sm font-medium text-gray-900">{formatDate(aporte.fechaPago)}</p>
            </div>
            <div>
              <span className="text-sm text-gray-500">Método</span>
              <p className="text-sm font-medium text-gray-900">{aporte.metodo ?? '—'}</p>
            </div>
          </div>

          <hr className="my-4" />

          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
            Distribución
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <span className="text-sm text-gray-500">Solidaridad</span>
              <p className="text-sm font-medium text-green-700">
                {formatCurrency(aporte.pagoSolidaridad)}
              </p>
            </div>
            <div>
              <span className="text-sm text-gray-500">Pago Crédito</span>
              <p className="text-sm font-medium text-blue-700">
                {formatCurrency(aporte.pagoCredito)}
              </p>
            </div>
            <div>
              <span className="text-sm text-gray-500">Ahorro</span>
              <p className="text-sm font-medium text-purple-700">
                {formatCurrency(aporte.monto - aporte.pagoSolidaridad - aporte.pagoCredito)}
              </p>
            </div>
          </div>

          {aporte.notas && (
            <>
              <hr className="my-4" />
              <div>
                <span className="text-sm text-gray-500">Notas</span>
                <p className="text-sm text-gray-700 mt-1">{aporte.notas}</p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
